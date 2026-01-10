import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { SignalsService } from '../signals/signals.service';
import WebSocket from 'ws';

interface BinanceKline {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  k: {
    t: number; // Kline start time
    T: number; // Kline close time
    s: string; // Symbol
    i: string; // Interval
    o: string; // Open price
    c: string; // Close price
    h: string; // High price
    l: string; // Low price
    v: string; // Volume
    n: number; // Number of trades
    x: boolean; // Is this kline closed?
    q: string; // Quote asset volume
  };
}

@Injectable()
export class BinanceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BinanceService.name);
  private ws: WebSocket | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private readonly baseUrl = 'wss://stream.binance.com:9443/ws';
  private subscriptions = new Map<string, Set<string>>(); // symbol -> Set<timeframes>
  private pendingSubscriptions: Array<{ symbol: string; timeframe: string }> = []; // Pending subscriptions to resubscribe on reconnect
  private isReconnecting = false;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private wsGateway: WebSocketGateway,
    @Inject(forwardRef(() => SignalsService))
    private signalsService: SignalsService,
  ) {}

  async onModuleInit() {
    // Will be initialized when symbols are subscribed
  }

  async onModuleDestroy() {
    this.disconnect();
  }

  async subscribeToKlines(symbol: string, timeframe: string) {
    const streamName = `${symbol.toLowerCase()}@kline_${timeframe}`;
    
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set());
    }
    this.subscriptions.get(symbol)!.add(timeframe);

    // Add to pending subscriptions for reconnection
    const subKey = `${symbol}_${timeframe}`;
    if (!this.pendingSubscriptions.find(s => `${s.symbol}_${s.timeframe}` === subKey)) {
      this.pendingSubscriptions.push({ symbol, timeframe });
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
      // Wait a bit after connection to ensure it's stable
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Check connection again before subscribing
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Will resubscribe on reconnect
      return;
    }

    const subscribeMessage = {
      method: 'SUBSCRIBE',
      params: [streamName],
      id: Date.now(),
    };

    try {
      this.ws.send(JSON.stringify(subscribeMessage));
      this.logger.debug(`Subscribed to ${streamName}`);
    } catch (error) {
      this.logger.error(`Failed to send subscription for ${streamName}:`, error);
      // Don't throw - will retry on reconnect
    }
  }

  // Batch subscribe to multiple streams at once (more efficient)
  async batchSubscribeToKlines(subscriptions: Array<{ symbol: string; timeframe: string }>) {
    if (subscriptions.length === 0) return;

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('Cannot batch subscribe: WebSocket not connected');
      return;
    }

    // Binance allows up to 200 streams per subscription request
    const batchSize = 200;
    let totalSubscribed = 0;
    
    for (let i = 0; i < subscriptions.length; i += batchSize) {
      const batch = subscriptions.slice(i, i + batchSize);
      const streamNames = batch.map(sub => 
        `${sub.symbol.toLowerCase()}@kline_${sub.timeframe}`
      );

      const subscribeMessage = {
        method: 'SUBSCRIBE',
        params: streamNames,
        id: Date.now(),
      };

      try {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(subscribeMessage));
          totalSubscribed += batch.length;
          this.logger.debug(`Batch subscribed to ${batch.length} streams (${totalSubscribed}/${subscriptions.length})`);
          
          // Add to subscriptions map and pending list
          batch.forEach(({ symbol, timeframe }) => {
            if (!this.subscriptions.has(symbol)) {
              this.subscriptions.set(symbol, new Set());
            }
            this.subscriptions.get(symbol)!.add(timeframe);
            
            // Ensure it's in pending list for reconnection
            const subKey = `${symbol}_${timeframe}`;
            if (!this.pendingSubscriptions.find(s => `${s.symbol}_${s.timeframe}` === subKey)) {
              this.pendingSubscriptions.push({ symbol, timeframe });
            }
          });

          // Small delay between batches to avoid overwhelming the connection
          if (i + batchSize < subscriptions.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } else {
          this.logger.warn('WebSocket closed during batch subscription');
          break;
        }
      } catch (error) {
        this.logger.error(`Failed to batch subscribe:`, error);
        // Continue with next batch
      }
    }
    
    this.logger.log(`Batch subscription completed: ${totalSubscribed}/${subscriptions.length} streams`);
  }

  async unsubscribeFromKlines(symbol: string, timeframe: string) {
    const streamName = `${symbol.toLowerCase()}@kline_${timeframe}`;
    
    if (this.subscriptions.has(symbol)) {
      this.subscriptions.get(symbol)!.delete(timeframe);
      if (this.subscriptions.get(symbol)!.size === 0) {
        this.subscriptions.delete(symbol);
      }
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const unsubscribeMessage = {
        method: 'UNSUBSCRIBE',
        params: [streamName],
        id: Date.now(),
      };
      this.ws.send(JSON.stringify(unsubscribeMessage));
      this.logger.log(`Unsubscribed from ${streamName}`);
    }
  }

  private async connect() {
    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.baseUrl);

        this.ws.on('open', () => {
          this.logger.log('Connected to Binance WebSocket');
          this.clearReconnectInterval();
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (error) {
            this.logger.error('Error parsing WebSocket message', error);
          }
        });

        this.ws.on('error', (error) => {
          this.logger.error('WebSocket error', error);
          reject(error);
        });

        this.ws.on('close', () => {
          if (!this.isReconnecting) {
            this.logger.warn('WebSocket closed, reconnecting...');
            this.scheduleReconnect();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: any) {
    if (message.result === null && message.id) {
      // Subscription confirmation
      return;
    }

    if (message.e === 'kline') {
      this.processKline(message as BinanceKline);
    }
  }

  private async processKline(klineData: BinanceKline) {
    const { k } = klineData;
    
    if (!k.x) {
      // Kline is not closed yet, skip
      return;
    }

    try {
      const symbol = k.s;
      const timeframe = this.mapBinanceInterval(k.i);

      // Save to database
      await this.prisma.candle.upsert({
        where: {
          symbol_timeframe_openTime: {
            symbol,
            timeframe,
            openTime: new Date(k.t),
          },
        },
        update: {
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v),
          quoteVolume: parseFloat(k.q),
        },
        create: {
          symbol,
          timeframe,
          openTime: new Date(k.t),
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v),
          quoteVolume: parseFloat(k.q),
        },
      });

      this.logger.debug(`Saved candle: ${symbol} ${timeframe} at ${new Date(k.t).toISOString()}`);
      
      // Emit candle update via WebSocket
      try {
        this.wsGateway.emitCandleUpdate({
          symbol,
          timeframe,
          openTime: new Date(k.t),
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v),
          quoteVolume: parseFloat(k.q),
        });
      } catch (error) {
        // Ignore WebSocket errors
      }

      // NOTE: Signal generation is handled by cron jobs in MarketAnalyzerService
      // with proper timing (30 seconds after candle close) to ensure data consistency.
      // Do NOT generate signals here - it would create duplicates and ignore the schedule.
    } catch (error) {
      this.logger.error('Error processing kline', error);
    }
  }

  private mapBinanceInterval(interval: string): string {
    const mapping: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
      '1w': '1w',
    };
    return mapping[interval] || interval;
  }

  private scheduleReconnect() {
    this.clearReconnectInterval();
    this.isReconnecting = true;
    this.reconnectInterval = setTimeout(async () => {
      try {
        await this.connect();
        // Resubscribe to all pending subscriptions
        if (this.pendingSubscriptions.length > 0) {
          this.logger.log(`Resubscribing to ${this.pendingSubscriptions.length} streams after reconnect...`);
          await this.batchSubscribeToKlines(this.pendingSubscriptions);
        }
        this.isReconnecting = false;
      } catch (error) {
        this.logger.error('Reconnection failed', error);
        this.isReconnecting = false;
        this.scheduleReconnect();
      }
    }, 5000);
  }

  private clearReconnectInterval() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  private disconnect() {
    this.clearReconnectInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async getHistoricalKlines(symbol: string, timeframe: string, limit: number = 500) {
    // First try to get from database
    try {
      const dbCandles = await this.prisma.candle.findMany({
        where: {
          symbol,
          timeframe,
        },
        orderBy: {
          openTime: 'desc',
        },
        take: limit,
      });
      
      // If we have enough candles in DB, return them
      if (dbCandles.length >= Math.min(limit, 50)) {
        return dbCandles.reverse(); // Oldest first
      }
      
      // If not enough candles, fetch from Binance REST API
      this.logger.log(`Not enough candles in DB (${dbCandles.length}), fetching from Binance API for ${symbol} ${timeframe}...`);
      
      const binanceInterval = this.mapToBinanceInterval(timeframe);
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      
      const data = await response.json();
      const candles = data.map((k: any[]) => ({
        symbol,
        timeframe,
        openTime: new Date(k[0]),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
        quoteVolume: parseFloat(k[7]),
      }));
      
      // Save to database
      for (const candle of candles) {
        try {
          await this.prisma.candle.upsert({
            where: {
              symbol_timeframe_openTime: {
                symbol: candle.symbol,
                timeframe: candle.timeframe,
                openTime: candle.openTime,
              },
            },
            update: {
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
              volume: candle.volume,
              quoteVolume: candle.quoteVolume,
            },
            create: candle,
          });
        } catch (error) {
          // Ignore individual save errors
        }
      }
      
      this.logger.log(`Loaded ${candles.length} historical candles from Binance API for ${symbol} ${timeframe}`);
      
      // Return candles (Prisma will handle Decimal conversion when saving)
      return candles;
    } catch (error) {
      this.logger.error(`Error fetching historical klines: ${error.message}`);
      return [];
    }
  }

  private mapToBinanceInterval(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
      '1w': '1w',
    };
    return mapping[timeframe] || timeframe;
  }
}
