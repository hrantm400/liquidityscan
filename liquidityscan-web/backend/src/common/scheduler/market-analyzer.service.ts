import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SignalsService } from '../../signals/signals.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BinanceService } from '../../exchanges/binance.service';
import { MexcService } from '../../exchanges/mexc.service';
import { UNIQUE_POPULAR_SYMBOLS, BINANCE_SYMBOLS, MEXC_SYMBOLS } from '../../config/symbols.config';

@Injectable()
export class MarketAnalyzerService implements OnModuleInit {
  private readonly logger = new Logger(MarketAnalyzerService.name);
  // Strategy-specific timeframes (matches Java bot exactly)
  private readonly strategyTimeframes = {
    SUPER_ENGULFING: ['1h', '4h', '1d', '1w'], // Added 1h (with time check and RSI filter)
    RSI_DIVERGENCE: ['1h', '4h', '1d'], // 1h and 4h with time check
    ICT_BIAS: ['1d'], // Only 1d (removed 4h and 1w to match Java bot)
    HAMMER: ['5m', '15m', '1h', '4h', '1d', '1w'], // All timeframes
    RSI_ALERTS: ['5m', '15m', '1h'], // Short timeframes
  };
  // All unique timeframes for WebSocket subscriptions
  private readonly allTimeframes = ['5m', '15m', '1h', '4h', '1d', '1w'];
  private subscribedSymbols = new Set<string>();

  constructor(
    private signalsService: SignalsService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private binanceService: BinanceService,
    private mexcService: MexcService,
  ) {}

  async onModuleInit() {
    // Subscribe to WebSocket streams asynchronously to not block startup
    this.subscribeToSymbols().catch((error) => {
      this.logger.error('Error during WebSocket subscription:', error);
    });
    
    // Load historical data for symbols (needed for WebSocket data)
    setTimeout(async () => {
      await this.loadHistoricalData();
    }, 5000); // Wait 5 seconds for WebSocket connections to establish
    
    // NOTE: Initial analysis is DISABLED - signals will only be generated
    // by cron jobs at scheduled times (30 seconds after candle close).
    // This ensures signals are generated at the correct times, not randomly on startup.
    // If you need to generate signals immediately, use the cron schedule or manual API call.
  }

  private async loadHistoricalData() {
    this.logger.log('Loading historical candle data...');
    
    // Get symbols to load data for
    const symbolsConfig = this.configService.get<string>('ANALYZE_SYMBOLS');
    let symbols: string[] = [];
    
    if (symbolsConfig) {
      symbols = symbolsConfig.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
    } else {
      // Get symbols from database or use defaults
      try {
        if (this.prisma && typeof (this.prisma as any).isDatabaseAvailable === 'function' && (this.prisma as any).isDatabaseAvailable()) {
          const candles = await this.prisma.candle.findMany({
            select: { symbol: true },
            distinct: ['symbol'],
            take: 50,
          });
          symbols = candles.map(c => c.symbol);
        }
      } catch (error) {
        // Ignore
      }
      
      if (symbols.length === 0) {
        symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT'];
      }
    }
    
    this.logger.log(`Loading historical data for ${symbols.length} symbols...`);
    
    let loaded = 0;
    for (const symbol of symbols) {
      // Load data for all timeframes we might need (including 5m and 15m for RSI Alerts and Hammer)
      const allTimeframesToLoad = ['5m', '15m', ...this.allTimeframes];
      for (const timeframe of allTimeframesToLoad) {
        try {
          // Check if we have enough candles
          const existing = await this.prisma.candle.count({
            where: { symbol, timeframe },
          });
          
          if (existing < 50) {
            // Load historical data - this will fetch from API if needed
            await this.binanceService.getHistoricalKlines(symbol, timeframe, 200);
            loaded++;
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          this.logger.debug(`Error loading historical data for ${symbol} ${timeframe}: ${error.message}`);
        }
      }
    }
    
    if (loaded > 0) {
      this.logger.log(`Loaded historical data for ${loaded} symbol/timeframe combinations`);
    } else {
      this.logger.log('Historical data already available in database');
    }
  }

  private async subscribeToSymbols() {
    this.logger.log('Subscribing to WebSocket streams for symbols...');

    // Get symbols to subscribe to (like Java bot - prioritize DB, then config)
    const symbolsConfig = this.configService.get<string>('ANALYZE_SYMBOLS');
    let allSymbols: string[] = [];
    let binanceSymbols: string[] = [];
    let mexcSymbols: string[] = [];

    if (symbolsConfig) {
      // Use symbols from env
      allSymbols = symbolsConfig.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
      // Split symbols between exchanges
      const midPoint = Math.ceil(allSymbols.length / 2);
      binanceSymbols = allSymbols.slice(0, midPoint);
      mexcSymbols = allSymbols.slice(midPoint);
      this.logger.log(`Using ${allSymbols.length} symbols from ANALYZE_SYMBOLS config`);
    } else {
      // Try to get symbols from database (like Java bot loads from Symbols.json/DB)
      // Check if database is available first
      if (this.prisma && typeof (this.prisma as any).isDatabaseAvailable === 'function' && (this.prisma as any).isDatabaseAvailable()) {
        try {
          const candles = await this.prisma.candle.findMany({
            select: { symbol: true },
            distinct: ['symbol'],
            orderBy: { symbol: 'asc' },
            take: 50, // Reasonable limit - subscribe only to symbols we'll analyze
          });
          allSymbols = candles.map(c => c.symbol);
          
          if (allSymbols.length > 0) {
            // Split between exchanges
            const midPoint = Math.ceil(allSymbols.length / 2);
            binanceSymbols = allSymbols.slice(0, midPoint);
            mexcSymbols = allSymbols.slice(midPoint);
            this.logger.log(`Found ${allSymbols.length} symbols in database to subscribe`);
          } else {
            // Fallback: use a small set of popular symbols (like Java bot default)
            allSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];
            binanceSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
            mexcSymbols = ['SOLUSDT', 'XRPUSDT'];
            this.logger.warn('No candles in database, using default symbols');
          }
        } catch (error) {
          // Database query error - use default symbols
          this.logger.warn('Database query failed, using default symbols:', error.message);
          allSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];
          binanceSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
          mexcSymbols = ['SOLUSDT', 'XRPUSDT'];
        }
      } else {
        // Database not available - use default symbols
        this.logger.warn('Database not available, using default symbols');
        allSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];
        binanceSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
        mexcSymbols = ['SOLUSDT', 'XRPUSDT'];
      }
      
      // Optionally limit symbols for testing
      const maxSymbols = this.configService.get<number>('MAX_SYMBOLS');
      if (maxSymbols && maxSymbols > 0 && allSymbols.length > maxSymbols) {
        allSymbols = allSymbols.slice(0, maxSymbols);
        const midPoint = Math.ceil(allSymbols.length / 2);
        binanceSymbols = allSymbols.slice(0, midPoint);
        mexcSymbols = allSymbols.slice(midPoint);
        this.logger.log(`Limited to ${maxSymbols} symbols for testing`);
      }
    }

    const totalSubscriptions = (binanceSymbols.length + mexcSymbols.length) * this.allTimeframes.length;
    this.logger.log(`Subscribing to ${binanceSymbols.length} symbols on Binance and ${mexcSymbols.length} symbols on MEXC (${totalSubscriptions} total subscriptions)`);

    let binanceCount = 0;
    let mexcCount = 0;
    let binanceErrors = 0;
    let mexcErrors = 0;

    // Prepare all Binance subscriptions first
    // For 5m and 15m, we'll use cron jobs instead of WebSocket to reduce load
    // WebSocket subscriptions for 1h, 4h, 1d, 1w (main timeframes)
    const wsTimeframes = ['1h', '4h', '1d', '1w'];
    const binanceSubs: Array<{ symbol: string; timeframe: string }> = [];
    for (const symbol of binanceSymbols) {
      for (const timeframe of wsTimeframes) {
        binanceSubs.push({ symbol, timeframe });
      }
    }

    // Use batch subscription for better performance
    this.logger.log(`Preparing ${binanceSubs.length} Binance subscriptions...`);
    try {
      // Subscribe in batches of 200 (Binance limit per request)
      const batchSize = 200;
      for (let i = 0; i < binanceSubs.length; i += batchSize) {
        const batch = binanceSubs.slice(i, i + batchSize);
        await this.binanceService.batchSubscribeToKlines(batch);
        binanceCount += batch.length;
        
        // Log progress
        if (binanceCount % 200 === 0 || i + batchSize >= binanceSubs.length) {
          this.logger.log(`Binance subscription progress: ${binanceCount}/${binanceSubs.length}`);
        }
        
        // Delay between batches
        if (i + batchSize < binanceSubs.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Mark all as subscribed
      binanceSubs.forEach(({ symbol, timeframe }) => {
        this.subscribedSymbols.add(`BINANCE_${symbol}_${timeframe}`);
      });
    } catch (error) {
      binanceErrors++;
      this.logger.error(`Error in batch subscription: ${error.message}`);
    }

    this.logger.log(`Binance subscriptions completed: ${binanceCount} successful, ${binanceErrors} errors`);

    // Small delay before starting MEXC subscriptions
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Subscribe to MEXC WebSocket streams with progress logging
    // For 5m and 15m, we'll use cron jobs instead of WebSocket to reduce load
    for (let i = 0; i < mexcSymbols.length; i++) {
      const symbol = mexcSymbols[i];
      for (const timeframe of wsTimeframes) {
        try {
          await this.mexcService.subscribeToKlines(symbol, timeframe);
          this.subscribedSymbols.add(`MEXC_${symbol}_${timeframe}`);
          mexcCount++;
          
          // Log progress every 50 subscriptions
          if (mexcCount % 50 === 0) {
            this.logger.log(`MEXC subscription progress: ${mexcCount}/${mexcSymbols.length * this.allTimeframes.length}`);
          }
          
          // Increased delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          mexcErrors++;
          this.logger.error(`Error subscribing to MEXC ${symbol} ${timeframe}: ${error.message}`);
          // Continue with next subscription even if one fails
        }
      }
    }

    this.logger.log(`MEXC subscriptions completed: ${mexcCount} successful, ${mexcErrors} errors`);
    this.logger.log(`Total subscriptions: ${this.subscribedSymbols.size} (${binanceCount + mexcCount} successful, ${binanceErrors + mexcErrors} errors)`);
  }

  /**
   * Helper method to get symbols for analysis
   */
  private async getSymbolsForAnalysis(): Promise<string[]> {
    const symbolsConfig = this.configService.get<string>('ANALYZE_SYMBOLS');
    let symbols: string[] = [];

    if (symbolsConfig) {
      symbols = symbolsConfig.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
      this.logger.log(`Using ${symbols.length} symbols from ANALYZE_SYMBOLS config`);
    } else {
      if (this.prisma && typeof (this.prisma as any).isDatabaseAvailable === 'function' && (this.prisma as any).isDatabaseAvailable()) {
        try {
          const candles = await this.prisma.candle.findMany({
            select: { symbol: true },
            distinct: ['symbol'],
            orderBy: { symbol: 'asc' },
            take: 100,
          });
          symbols = candles.map(c => c.symbol);
          
          if (symbols.length > 0) {
            this.logger.log(`Found ${symbols.length} symbols in database with candle data`);
          } else {
            symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT'];
            this.logger.warn('No candles found in database, using default popular symbols');
          }
        } catch (error) {
          this.logger.warn('Database query failed, using default symbols:', error.message);
          symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT'];
        }
      } else {
        this.logger.warn('Database not available, using default symbols');
        symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT'];
      }
    }

    return symbols;
  }

  /**
   * Run initial analysis on startup for all timeframes
   */
  private async runInitialAnalysis() {
    this.logger.log('Running initial analysis for all timeframes...');
    
    // Analyze all timeframes sequentially
    for (const timeframe of this.allTimeframes) {
      try {
        await this.analyzeMarketsForTimeframe(timeframe);
        // Small delay between timeframes
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        this.logger.error(`Error in initial analysis for ${timeframe}: ${error.message}`);
      }
    }
    
    this.logger.log('Initial analysis completed for all timeframes');
  }

  /**
   * Helper method to analyze markets for specific timeframe
   */
  private async analyzeMarketsForTimeframe(timeframe: string) {
    this.logger.log(`Starting ${timeframe} market analysis (30s after candle close)...`);

    const symbols = await this.getSymbolsForAnalysis();

    if (symbols.length === 0) {
      this.logger.warn('No symbols to analyze');
      return;
    }

    this.logger.log(`Analyzing ${symbols.length} symbols for ${timeframe}: ${symbols.slice(0, 10).join(', ')}${symbols.length > 10 ? '...' : ''}`);

    let totalSignals = 0;
    let errors = 0;

    for (const symbol of symbols) {
      try {
        const signals = await this.signalsService.generateSignals(symbol, timeframe);
        if (signals && signals.length > 0) {
          totalSignals += signals.length;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        errors++;
        this.logger.error(`Error analyzing ${symbol} ${timeframe}: ${error.message}`);
      }
    }

    this.logger.log(`Market analysis completed for ${timeframe}. Generated ${totalSignals} signals. Errors: ${errors}`);
  }

  /**
   * 5m Analysis: Every 5 minutes at :00:30 (30 seconds after candle close)
   * Hammer: 5m
   * RSI Alerts: 5m
   */
  @Cron('30 */5 * * * *')
  async analyze5m() {
    await this.analyzeMarketsForTimeframe('5m');
  }

  /**
   * 15m Analysis: Every 15 minutes at :00:30 (30 seconds after candle close)
   * Hammer: 15m
   * RSI Alerts: 15m
   */
  @Cron('30 */15 * * * *')
  async analyze15m() {
    await this.analyzeMarketsForTimeframe('15m');
  }

  /**
   * 1h Analysis: Every hour at :00:30 (30 seconds after candle close)
   * Super Engulfing: 1h (with time check and RSI filter 40-60)
   * RSI Divergence: 1h (with time check)
   * Hammer: 1h
   * RSI Alerts: 1h
   */
  @Cron('30 * * * *')
  async analyze1h() {
    await this.analyzeMarketsForTimeframe('1h');
  }

  /**
   * 4h Analysis: Every 4 hours at :00:30 (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
   * Super Engulfing: 4h (with time check)
   * RSI Divergence: 4h (with time check)
   * Hammer: 4h
   */
  @Cron('30 0,4,8,12,16,20 * * *')
  async analyze4h() {
    await this.analyzeMarketsForTimeframe('4h');
  }

  /**
   * 1d Analysis: Daily at 04:00:30 UTC (30 seconds after candle close)
   * Super Engulfing: 1d
   * RSI Divergence: 1d
   * ICT Bias: 1d (only on 1d, matches Java bot)
   * Hammer: 1d
   */
  @Cron('30 4 * * *')
  async analyze1d() {
    await this.analyzeMarketsForTimeframe('1d');
  }

  /**
   * 1w Analysis: Monday at 04:00:30 UTC (30 seconds after candle close)
   * Super Engulfing: 1w
   * Hammer: 1w
   */
  @Cron('30 4 * * 1')
  async analyze1w() {
    await this.analyzeMarketsForTimeframe('1w');
  }
}
