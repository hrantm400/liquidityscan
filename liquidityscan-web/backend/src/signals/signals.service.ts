import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RsiDivergenceService } from '../strategies/rsi-divergence.service';
import { SuperEngulfingService } from '../strategies/super-engulfing.service';
import { IctBiasService } from '../strategies/ict-bias.service';
import { HammerPatternService } from '../strategies/hammer-pattern.service';
import { RsiAlertsService } from '../strategies/rsi-alerts.service';
import { TimeCheckerUtil } from '../common/utils/time-checker.util';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { CacheService } from '../common/cache/cache.service';
import { BinanceService } from '../exchanges/binance.service';
import { MexcService } from '../exchanges/mexc.service';

@Injectable()
export class SignalsService {
  private readonly logger = new Logger(SignalsService.name);

  constructor(
    private prisma: PrismaService,
    private rsiService: RsiDivergenceService,
    private superEngulfingService: SuperEngulfingService,
    private ictBiasService: IctBiasService,
    private hammerPatternService: HammerPatternService,
    private rsiAlertsService: RsiAlertsService,
    private wsGateway: WebSocketGateway,
    private cacheService: CacheService,
    @Inject(forwardRef(() => BinanceService))
    private binanceService: BinanceService,
    @Inject(forwardRef(() => MexcService))
    private mexcService: MexcService,
  ) {}

  async generateSignals(symbol: string, timeframe: string) {
    this.logger.debug(`Generating signals for ${symbol} ${timeframe}`);

    // Ensure we have enough candles before generating signals
    // If not enough in DB, fetch from exchange API
    await this.ensureCandlesAvailable(symbol, timeframe, 200);

    const signals: any[] = [];

    // RSI Divergence - only on 1h, 4h, 1d timeframes
    // Java bot: 1h and 4h only work during working hours (10:00-21:00 Asia/Yerevan)
    try {
      if (timeframe === '1h' || timeframe === '4h' || timeframe === '1d') {
        // Check working hours for 1h and 4h (matches Java bot)
        if ((timeframe === '1h' || timeframe === '4h') && !TimeCheckerUtil.isWithinAllowedTime()) {
          this.logger.debug(`Skipping RSI Divergence for ${symbol} ${timeframe} - outside working hours (10:00-21:00)`);
        } else {
          const candles = await this.rsiService.getCandlesForAnalysis(symbol, timeframe, 200);
          if (candles.length >= 50) {
            const divergences = await this.rsiService.detectRSIDivergences(candles);

          for (const div of divergences.bullish) {
            // PineScript filter: Start pivot RSI must be < 30 (oversold)
            // div.rsiLow is the previous (start) pivot RSI value
            if (div.rsiLow >= 30) {
              continue; // Skip if start pivot is not oversold
            }

            // Determine divergence type: Regular (Run) or Hidden (Rev)
            // Regular Bullish: price makes lower low, RSI makes higher low
            // Hidden Bullish: price makes higher low, RSI makes lower low
            const isRegular = div.priceLow < div.priceHigh; // Price made lower low (Regular)
            const isHidden = div.priceLow > div.priceHigh; // Price made higher low (Hidden)
            const rsiDiff = Math.abs(div.rsiHigh - div.rsiLow);
            const isStrong = rsiDiff > 10; // Strong divergence if RSI difference is significant
            
            let divergenceType: string;
            if (isRegular && isStrong) {
              divergenceType = 'Regular Bullish Divergence (Strong)';
            } else if (isRegular) {
              divergenceType = 'Regular Bullish Divergence';
            } else if (isHidden && isStrong) {
              divergenceType = 'Hidden Bullish Divergence (Strong)';
            } else {
              divergenceType = 'Hidden Bullish Divergence';
            }
            
            const confidence = isStrong ? 'HIGH' : 'MED';
            
            const signal = await this.createSignal({
              strategyType: 'RSI_DIVERGENCE',
              symbol,
              timeframe,
              signalType: 'BUY',
              price: div.priceHigh, // Use higher price (entry point)
              metadata: {
                type: 'BULLISH',
                divergenceType,
                rsiValue: div.rsiHigh, // Current RSI (higher)
                rsiLow: div.rsiLow, // Start pivot RSI (must be < 30)
                rsiHigh: div.rsiHigh,
                pivotIndex: div.pivotIndex,
                confidence,
              },
            });
            if (signal) signals.push(signal);
          }

          for (const div of divergences.bearish) {
            // PineScript filter: Start pivot RSI must be > 70 (overbought)
            // div.rsiHigh is the previous (start) pivot RSI value
            if (div.rsiHigh <= 70) {
              continue; // Skip if start pivot is not overbought
            }

            // From detectRSIDivergences: currPrice > prevPrice && currRSI < prevRSI
            // This means: priceHigh (current) > priceLow (previous) = Regular Bearish
            // All detected bearish divergences from pivotHighs are Regular (price makes higher high, RSI makes lower high)
            const isRegular = div.priceHigh > div.priceLow; // Price made higher high (Regular)
            const rsiDiff = Math.abs(div.rsiHigh - div.rsiLow);
            const isStrong = rsiDiff > 10;
            
            // All detected divergences are Regular (from pivotLows/pivotHighs)
            // Hidden divergences would require different detection logic (in trend continuation)
            let divergenceType: string;
            if (isRegular && isStrong) {
              divergenceType = 'Regular Bearish Divergence (Strong)';
            } else if (isRegular) {
              divergenceType = 'Regular Bearish Divergence';
            } else {
              // This shouldn't happen with current detection, but handle it
              divergenceType = 'Bearish Divergence';
            }
            
            const confidence = isStrong ? 'HIGH' : 'MED';
            
            const signal = await this.createSignal({
              strategyType: 'RSI_DIVERGENCE',
              symbol,
              timeframe,
              signalType: 'SELL',
              price: div.priceLow, // Use lower price (entry point)
              metadata: {
                type: 'BEARISH',
                divergenceType,
                rsiValue: div.rsiLow, // Current RSI (lower)
                rsiLow: div.rsiLow,
                rsiHigh: div.rsiHigh, // Start pivot RSI (must be > 70)
                pivotIndex: div.pivotIndex,
                confidence,
              },
            });
            if (signal) signals.push(signal);
          }
        }
        }
      }
    } catch (error) {
      this.logger.error(`Error generating RSI signals: ${error.message}`);
    }

    // Super Engulfing - on 1h (with time check and RSI filter), 4h (with time check), 1d, 1w
    // Java bot: 1h and 4h only work during working hours (10:00-21:00), 1h requires RSI 40-60
    try {
      if (timeframe === '1h' || timeframe === '4h' || timeframe === '1d' || timeframe === '1w') {
        // Check working hours for 1h and 4h (matches Java bot)
        if ((timeframe === '1h' || timeframe === '4h') && !TimeCheckerUtil.isWithinAllowedTime()) {
          this.logger.debug(`Skipping Super Engulfing for ${symbol} ${timeframe} - outside working hours (10:00-21:00)`);
        } else {
        const candles = await this.superEngulfingService.getCandlesForAnalysis(symbol, timeframe, 100);
        if (candles.length >= 10) { // Need more candles for x logic calculation
          // For 1h timeframe: Java bot requires RSI filter 40-60
          let shouldProcess = true;
          if (timeframe === '1h') {
            // Calculate RSI using the same method as RSI Divergence service
            const rsiValues = this.rsiService.calculateRSI(candles, 14);
            const lastRsi = rsiValues[rsiValues.length - 1];
            if (isNaN(lastRsi) || lastRsi < 40 || lastRsi > 60) {
              this.logger.debug(`Skipping Super Engulfing for ${symbol} 1h - RSI ${lastRsi.toFixed(2)} not in range 40-60`);
              shouldProcess = false; // Skip Super Engulfing for 1h if RSI not in range
            } else {
              // RSI is in range 40-60, proceed with detection
              this.logger.debug(`Super Engulfing for ${symbol} 1h - RSI ${lastRsi.toFixed(2)} is in range 40-60, proceeding`);
            }
          }

          if (shouldProcess) {
            // Reverse to get chronological order (oldest first)
            const reversed = [...candles].reverse();

            // Check last two candles for RUN and REV patterns
            // Index [length-2] = previous candle, [length-1] = current candle
            const prev = reversed[reversed.length - 2];
            const current = reversed[reversed.length - 1];
            const currentIndex = reversed.length - 1;

            // Calculate x logic (how many candles this one closes beyond)
            const xLogic = this.superEngulfingService.calculateXLogic(reversed, currentIndex);

            // Check RUN pattern (Continuation)
            const runPattern = this.superEngulfingService.detectRunPattern(prev, current);
            if (runPattern.isRun) {
              const patternName = runPattern.hasPlus ? 'RUN+' : 'RUN';
              const patternWithX = xLogic > 0 ? `${patternName} x${xLogic}` : patternName;
              
              // Apply Kill Zone modifier if in Kill Zone (17:00-20:00)
              const displayName = TimeCheckerUtil.isKillZone() 
                ? TimeCheckerUtil.formatMessageWithKillZone(`Super Engulfing_${timeframe} ${symbol}`)
                : `Super Engulfing_${timeframe} ${symbol}`;
              
              const signal = await this.createSignal({
                strategyType: 'SUPER_ENGULFING',
                symbol,
                timeframe,
                signalType: runPattern.type === 'BULLISH' ? 'BUY' : 'SELL',
                price: Number(current.close),
                metadata: {
                  pattern: runPattern.hasPlus ? 'RUN_PLUS' : 'RUN',
                  patternType: 'CONTINUATION',
                  patternDisplay: patternWithX,
                  displayName,
                  xLogic: xLogic || null,
                  confidence: runPattern.hasPlus ? 'HIGH' : 'MED',
                  previousCandle: {
                    open: Number(prev.open),
                    high: Number(prev.high),
                    low: Number(prev.low),
                    close: Number(prev.close),
                  },
                  currentCandle: {
                    open: Number(current.open),
                    high: Number(current.high),
                    low: Number(current.low),
                    close: Number(current.close),
                  },
                },
              });
              if (signal) signals.push(signal);
            }

            // Check REV pattern (Reversal)
            const revPattern = this.superEngulfingService.detectRevPattern(prev, current);
            if (revPattern.isRev) {
              const patternName = revPattern.hasPlus ? 'REV+' : 'REV';
              const patternWithX = xLogic > 0 ? `${patternName} x${xLogic}` : patternName;
              
              // Apply Kill Zone modifier if in Kill Zone (17:00-20:00)
              const displayName = TimeCheckerUtil.isKillZone() 
                ? TimeCheckerUtil.formatMessageWithKillZone(`Super Engulfing_${timeframe} ${symbol}`)
                : `Super Engulfing_${timeframe} ${symbol}`;
              
              const signal = await this.createSignal({
                strategyType: 'SUPER_ENGULFING',
                symbol,
                timeframe,
                signalType: revPattern.type === 'BULLISH' ? 'BUY' : 'SELL',
                price: Number(current.close),
                metadata: {
                  pattern: revPattern.hasPlus ? 'REV_PLUS' : 'REV',
                  patternType: 'REVERSAL',
                  patternDisplay: patternWithX,
                  displayName,
                  xLogic: xLogic || null,
                  confidence: revPattern.hasPlus ? 'HIGH' : 'MED',
                  previousCandle: {
                    open: Number(prev.open),
                    high: Number(prev.high),
                    low: Number(prev.low),
                    close: Number(prev.close),
                  },
                  currentCandle: {
                    open: Number(current.open),
                    high: Number(current.high),
                    low: Number(current.low),
                    close: Number(current.close),
                  },
                },
              });
              if (signal) signals.push(signal);
            }
          }
        }
        }
      }
    } catch (error) {
      this.logger.error(`Error generating Super Engulfing signals: ${error.message}`);
    }

    // Hammer Pattern - on all timeframes (matches Java bot)
    try {
      const candles = await this.hammerPatternService.getCandlesForAnalysis(symbol, timeframe, 10);
      if (candles.length >= 4) {
        // Reverse to get chronological order (oldest first)
        const reversed = [...candles].reverse();
        const prev = reversed[reversed.length - 2];
        const current = reversed[reversed.length - 1];

        // Check for strong reversal pairs (1:3 ratio) - used for 1d and 1w in Java bot
        if (timeframe === '1d' || timeframe === '1w') {
          const isStrongReversal = this.hammerPatternService.findStrongReversalPairs(prev, current);
          if (isStrongReversal) {
            const patternType = timeframe === '1d' ? '1:3 Daily' : '1:3 Weekly';
            const signal = await this.createSignal({
              strategyType: 'HAMMER',
              symbol,
              timeframe,
              signalType: Number(current.close) > Number(current.open) ? 'BUY' : 'SELL',
              price: Number(current.close),
              metadata: {
                pattern: patternType,
                patternType: 'REVERSAL',
                previousCandle: {
                  open: Number(prev.open),
                  high: Number(prev.high),
                  low: Number(prev.low),
                  close: Number(prev.close),
                },
                currentCandle: {
                  open: Number(current.open),
                  high: Number(current.high),
                  low: Number(current.low),
                  close: Number(current.close),
                },
              },
            });
            if (signal) signals.push(signal);
          }
        }

        // Check for classic Hammer pattern on all timeframes
        const hammer = this.hammerPatternService.detectHammer(current);
        if (hammer.isHammer) {
          const signal = await this.createSignal({
            strategyType: 'HAMMER',
            symbol,
            timeframe,
            signalType: hammer.type === 'BULLISH' ? 'BUY' : 'SELL',
            price: Number(current.close),
            metadata: {
              pattern: 'Hammer',
              patternType: 'REVERSAL',
              hammerType: hammer.type,
              currentCandle: {
                open: Number(current.open),
                high: Number(current.high),
                low: Number(current.low),
                close: Number(current.close),
              },
            },
          });
          if (signal) signals.push(signal);
        }
      }
    } catch (error) {
      this.logger.error(`Error generating Hammer signals: ${error.message}`);
    }

    // ICT Daily Bias - only on 1d timeframe (matches Java bot)
    try {
      if (timeframe === '1d') {
        this.logger.debug(`[ICT Bias] Checking ${symbol} ${timeframe} for bias signals...`);
        const dailyCandles = await this.ictBiasService.getDailyCandlesForAnalysis(symbol, 30);
        this.logger.debug(`[ICT Bias] Found ${dailyCandles.length} daily candles for ${symbol}`);
        
        if (dailyCandles.length >= 3) {
          const bias = await this.ictBiasService.detectDailyBiasFromCandles(dailyCandles);
          this.logger.debug(`[ICT Bias] ${symbol} ${timeframe}: bias=${bias.bias}, isValid=${bias.isValid}, message=${bias.message}`);

          if (bias.isValid && bias.bias !== 'UNKNOWN' && bias.bias !== 'RANGING') {
            // Determine bias strength and type
            const prevDay = dailyCandles[dailyCandles.length - 2];
            const currDay = dailyCandles[dailyCandles.length - 1];
            
            const prevClose = Number(prevDay.close);
            const prevHigh = Number(prevDay.high);
            const prevLow = Number(prevDay.low);
            const currClose = Number(currDay.close);
            
            // Calculate strength based on how far close is from high/low
            const range = prevHigh - prevLow;
            const distanceFromLow = prevClose - prevLow;
            const distanceFromHigh = prevHigh - prevClose;
            
            let biasType = 'Trend Continuation';
            let confidence = 'MED';
            
            if (bias.bias === 'BULLISH') {
              // Strong bullish: close very close to high
              if (distanceFromHigh < range * 0.1) {
                biasType = 'Strong Bullish Confirmation';
                confidence = 'HIGH';
              } else if (distanceFromHigh < range * 0.3) {
                biasType = 'Bullish Confirmation';
                confidence = 'MED';
              }
            } else if (bias.bias === 'BEARISH') {
              // Strong bearish: close very close to low
              if (distanceFromLow < range * 0.1) {
                biasType = 'Strong Bearish Reversal';
                confidence = 'HIGH';
              } else if (distanceFromLow < range * 0.3) {
                biasType = 'Bearish Reversal';
                confidence = 'MED';
              }
            }
            
            const signal = await this.createSignal({
              strategyType: 'ICT_BIAS',
              symbol,
              timeframe,
              signalType: bias.bias === 'BULLISH' ? 'BUY' : 'SELL',
              price: Number(currClose),
              metadata: {
                bias: bias.bias,
                biasType,
                message: bias.message,
                high: Number(bias.high),
                low: Number(bias.low),
                confidence,
                strength: confidence === 'HIGH' ? 'STRONG' : 'MEDIUM',
              },
            });
            if (signal) {
              signals.push(signal);
              this.logger.log(`[ICT Bias] Generated signal for ${symbol} ${timeframe}: ${bias.bias} ${biasType}`);
            }
          } else {
            this.logger.debug(`[ICT Bias] ${symbol} ${timeframe}: Skipped - bias=${bias.bias}, isValid=${bias.isValid}`);
          }
        } else {
          this.logger.debug(`[ICT Bias] ${symbol} ${timeframe}: Not enough daily candles (${dailyCandles.length} < 3)`);
        }
      }
    } catch (error) {
      this.logger.error(`Error generating ICT Bias signals for ${symbol} ${timeframe}: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
    }

    // RSI Alerts - on 5m, 15m, 1h timeframes (matches Java bot)
    try {
      if (timeframe === '5m' || timeframe === '15m' || timeframe === '1h') {
        const candles = await this.rsiAlertsService.getCandlesForAnalysis(symbol, timeframe, 100);
        if (candles.length >= 15) {
          const alerts = this.rsiAlertsService.checkRsiAlerts(candles, timeframe);
          
          if (!isNaN(alerts.rsiValue)) {
            if (alerts.isOverbought) {
              const signal = await this.createSignal({
                strategyType: 'RSI_ALERT',
                symbol,
                timeframe,
                signalType: 'SELL',
                price: Number(candles[0].close),
                metadata: {
                  type: 'OVERBOUGHT',
                  rsiValue: alerts.rsiValue,
                  message: `RSI Alert! ${symbol} is overbought on the ${timeframe} interval with an RSI of ${alerts.rsiValue.toFixed(2)}. Consider selling or shorting.`,
                },
              });
              if (signal) signals.push(signal);
            }
            
            if (alerts.isOversold) {
              const signal = await this.createSignal({
                strategyType: 'RSI_ALERT',
                symbol,
                timeframe,
                signalType: 'BUY',
                price: Number(candles[0].close),
                metadata: {
                  type: 'OVERSOLD',
                  rsiValue: alerts.rsiValue,
                  message: `RSI Alert! ${symbol} is oversold on the ${timeframe} interval with an RSI of ${alerts.rsiValue.toFixed(2)}. Consider buying or going long.`,
                },
              });
              if (signal) signals.push(signal);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error generating RSI Alerts: ${error.message}`);
    }

    // Emit signals via WebSocket
    if (signals.length > 0) {
      this.logger.log(`Emitting ${signals.length} signals via WebSocket for ${symbol} ${timeframe}`);
      for (const signal of signals) {
        try {
          this.wsGateway.emitSignal(signal);
          this.logger.debug(`Emitted signal: ${signal.strategyType} ${signal.symbol} ${signal.timeframe} ${signal.signalType}`);
        } catch (error) {
          this.logger.error(`Error emitting signal: ${error.message}`);
        }
      }
    } else {
      this.logger.debug(`No signals generated for ${symbol} ${timeframe}`);
    }

    // Invalidate cache
    try {
      await this.cacheService.invalidatePattern('signals:*');
    } catch (error) {
      this.logger.warn(`Error invalidating cache: ${error.message}`);
    }

    return signals;
  }

  private async createSignal(data: {
    strategyType: string;
    symbol: string;
    timeframe: string;
    signalType: string;
    price: number;
    metadata?: any;
  }) {
    // Check if similar signal already exists (within current candle timeframe)
    // This allows new signals when a new candle closes, like the Java bot
    const timeframeMs = this.getTimeframeMs(data.timeframe);
    const timeframeAgo = new Date(Date.now() - timeframeMs);
    
    const existing = await this.prisma.signal.findFirst({
      where: {
        strategyType: data.strategyType,
        symbol: data.symbol,
        timeframe: data.timeframe,
        signalType: data.signalType,
        detectedAt: {
          gte: timeframeAgo,
        },
        status: 'ACTIVE',
      },
    });

    if (existing) {
      this.logger.debug(`Duplicate signal skipped: ${data.strategyType} ${data.symbol} ${data.timeframe} ${data.signalType} (exists since ${existing.detectedAt})`);
      return null; // Skip duplicate
    }

    const signal = await this.prisma.signal.create({
      data: {
        strategyType: data.strategyType,
        symbol: data.symbol,
        timeframe: data.timeframe,
        signalType: data.signalType,
        price: data.price,
        metadata: data.metadata || {},
        status: 'ACTIVE',
      },
    });
    
    this.logger.log(`Signal created: ${signal.id} - ${signal.strategyType} ${signal.symbol} ${signal.timeframe} ${signal.signalType}`);
    
    // Отправляем сигнал через WebSocket
    try {
      this.wsGateway.emitSignal(signal);
      this.logger.debug(`Signal emitted via WebSocket: ${signal.id}`);
    } catch (error) {
      this.logger.warn(`Failed to emit signal via WebSocket: ${error.message}`);
    }
    
    return signal;
  }

  /**
   * Get milliseconds for a timeframe string
   * Used for duplicate detection window
   */
  private getTimeframeMs(timeframe: string): number {
    const tf = timeframe.toLowerCase();
    const multipliers: Record<string, number> = {
      '1m': 1 * 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
    };
    return multipliers[tf] || 60 * 60 * 1000; // Default to 1 hour if unknown
  }

  /**
   * Ensure we have enough candles in the database for analysis
   * If not, fetch from exchange API
   */
  private async ensureCandlesAvailable(symbol: string, timeframe: string, minCandles: number = 200): Promise<void> {
    try {
      const normalizedSymbol = symbol.toUpperCase();
      const normalizedTimeframe = timeframe.toLowerCase();

      // Check current candle count
      const count = await this.prisma.candle.count({
        where: {
          symbol: normalizedSymbol,
          timeframe: normalizedTimeframe,
        },
      });

      if (count < minCandles) {
        this.logger.debug(`Only ${count} candles in DB for ${normalizedSymbol} ${normalizedTimeframe}, fetching from API...`);
        
        try {
          // Try Binance first, then MEXC
          let exchangeCandles: any[] = [];
          
          try {
            exchangeCandles = await this.binanceService.getHistoricalKlines(normalizedSymbol, normalizedTimeframe, minCandles);
          } catch (binanceError) {
            this.logger.debug(`Binance fetch failed, trying MEXC: ${binanceError.message}`);
            try {
              exchangeCandles = await this.mexcService.getHistoricalKlines(normalizedSymbol, normalizedTimeframe, minCandles);
            } catch (mexcError) {
              this.logger.warn(`Both exchanges failed to fetch candles: Binance=${binanceError.message}, MEXC=${mexcError.message}`);
            }
          }

          if (exchangeCandles && exchangeCandles.length > 0) {
            this.logger.log(`Fetched ${exchangeCandles.length} candles from exchange API for ${normalizedSymbol} ${normalizedTimeframe}`);
          }
        } catch (error) {
          this.logger.warn(`Error fetching candles for ${normalizedSymbol} ${normalizedTimeframe}: ${error.message}`);
          // Continue anyway - strategies will work with whatever candles we have
        }
      }
    } catch (error) {
      this.logger.warn(`Error checking candles for ${symbol} ${timeframe}: ${error.message}`);
      // Don't throw - allow signal generation to continue
    }
  }

  async getSignals(filters?: {
    strategyType?: string;
    symbol?: string;
    timeframe?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const where: any = {};

      if (filters?.strategyType) {
        where.strategyType = filters.strategyType;
      }
      if (filters?.symbol) {
        where.symbol = filters.symbol;
      }
      if (filters?.timeframe) {
        where.timeframe = filters.timeframe;
      }

      // Log the query for debugging
      this.logger.debug(`Fetching signals with filters: ${JSON.stringify(filters)}`);

      // First, check total count in DB
      const totalCount = await this.prisma.signal.count({ where: {} });
      const filteredCount = await this.prisma.signal.count({ where });
      this.logger.log(`Total signals in DB: ${totalCount}, matching filters: ${filteredCount}`);

      const signals = await this.prisma.signal.findMany({
        where,
        orderBy: {
          detectedAt: 'desc',
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      });

      this.logger.log(`Found ${signals.length} signals for filters: ${JSON.stringify(filters)}`);
      
      // Log first signal if exists for debugging
      if (signals.length > 0) {
        this.logger.debug(`First signal: ${JSON.stringify({
          id: signals[0].id,
          strategyType: signals[0].strategyType,
          symbol: signals[0].symbol,
          timeframe: signals[0].timeframe,
          signalType: signals[0].signalType,
          status: signals[0].status,
          detectedAt: signals[0].detectedAt,
        })}`);
      } else if (filteredCount > 0) {
        this.logger.warn(`No signals returned but ${filteredCount} match filters - possible pagination issue`);
      }

      return signals;
    } catch (error) {
      this.logger.error(`Error fetching signals: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      return []; // Return empty array on error
    }
  }

  async clearAllSignals() {
    this.logger.warn('⚠️  Clearing all signals from database...');
    const count = await this.prisma.signal.count();
    this.logger.log(`Found ${count} signals to delete`);
    
    if (count === 0) {
      this.logger.log('No signals to delete. Database is already clean.');
      return { count: 0 };
    }
    
    // Delete all signals (SignalAlert will be deleted automatically due to cascade)
    const result = await this.prisma.signal.deleteMany({});
    
    this.logger.log(`✅ Successfully deleted ${result.count} signals`);
    return result;
  }

  async getCandles(symbol: string, timeframe: string, limit: number = 500) {
    try {
      if (!symbol || !timeframe) {
        this.logger.warn(`getCandles called with invalid params: symbol=${symbol}, timeframe=${timeframe}`);
        return [];
      }

      const normalizedSymbol = symbol.toUpperCase();
      const normalizedTimeframe = timeframe.toLowerCase();

      // Get candles from database
      let candles = await this.prisma.candle.findMany({
        where: {
          symbol: normalizedSymbol,
          timeframe: normalizedTimeframe,
        },
        orderBy: {
          openTime: 'asc',
        },
        take: limit,
      });

      this.logger.debug(`Found ${candles.length} candles in DB for ${normalizedSymbol} ${normalizedTimeframe}`);

      // If not enough candles, try to fetch from exchange API
      if (candles.length < Math.min(limit, 50)) {
        this.logger.log(`Not enough candles in DB (${candles.length}), fetching from exchange API...`);
        
        try {
          // Determine which exchange to use based on symbol
          // For now, try Binance first, then MEXC
          let exchangeCandles: any[] = [];
          
          try {
            exchangeCandles = await this.binanceService.getHistoricalKlines(normalizedSymbol, normalizedTimeframe, limit);
          } catch (binanceError) {
            this.logger.debug(`Binance fetch failed, trying MEXC: ${binanceError.message}`);
            try {
              exchangeCandles = await this.mexcService.getHistoricalKlines(normalizedSymbol, normalizedTimeframe, limit);
            } catch (mexcError) {
              this.logger.warn(`Both exchanges failed: Binance=${binanceError.message}, MEXC=${mexcError.message}`);
            }
          }

          if (exchangeCandles && exchangeCandles.length > 0) {
            // Convert exchange candles to our format
            candles = exchangeCandles.map((c: any) => ({
              id: c.id || `${normalizedSymbol}-${normalizedTimeframe}-${c.openTime.getTime()}`,
              symbol: c.symbol,
              timeframe: c.timeframe,
              openTime: c.openTime,
              open: typeof c.open === 'object' ? Number(c.open) : c.open,
              high: typeof c.high === 'object' ? Number(c.high) : c.high,
              low: typeof c.low === 'object' ? Number(c.low) : c.low,
              close: typeof c.close === 'object' ? Number(c.close) : c.close,
              volume: typeof c.volume === 'object' ? Number(c.volume) : c.volume,
              quoteVolume: c.quoteVolume ? (typeof c.quoteVolume === 'object' ? Number(c.quoteVolume) : c.quoteVolume) : null,
            }));
            
            this.logger.log(`Fetched ${candles.length} candles from exchange API`);
          }
        } catch (exchangeError) {
          this.logger.warn(`Failed to fetch from exchange API: ${exchangeError.message}`);
          // Continue with whatever we have from DB
        }
      }

      return candles.map(c => ({
        id: c.id,
        symbol: c.symbol,
        timeframe: c.timeframe,
        openTime: c.openTime,
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: Number(c.volume),
        quoteVolume: c.quoteVolume ? Number(c.quoteVolume) : null,
      }));
    } catch (error) {
      this.logger.error(`Error fetching candles: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      return [];
    }
  }

  async getSignalById(id: string) {
    return this.prisma.signal.findUnique({
      where: { id },
    });
  }
}
