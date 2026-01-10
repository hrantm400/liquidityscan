import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { SignalsService } from '../signals/signals.service';
import WebSocket from 'ws';

interface MexcKline {
  c: string; // Close price
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Volume
  q: string; // Quote volume
  t: number; // Open time
  T: number; // Close time
}

interface MexcKlineMessage {
  c: string; // Channel
  d: {
    c: string; // Close
    o: string; // Open
    h: string; // High
    l: string; // Low
    v: string; // Volume
    q: string; // Quote volume
    t: number; // Open time
    T: number; // Close time
    i: string; // Interval
    S: string; // Symbol
  };
  t: number; // Timestamp
}

@Injectable()
export class MexcService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MexcService.name);
  private ws: WebSocket | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private readonly baseUrl = 'wss://wbs.mexc.com/ws';
  private subscriptions = new Map<string, Set<string>>(); // symbol -> Set<timeframes>

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
    const mexcTimeframe = this.mapToMexcInterval(timeframe);
    
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set());
    }
    this.subscriptions.get(symbol)!.add(timeframe);

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
      // Wait a bit after connection to ensure it's stable
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check connection again before subscribing
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('MEXC WebSocket is not connected');
    }

    // MEXC WebSocket subscription format
    // Format: spot@public.kline.v3.api@SYMBOL@INTERVAL
    const streamName = `spot@public.kline.v3.api@${symbol}@${mexcTimeframe}`;
    
    const subscribeMessage = {
      method: 'sub.kline',
      param: {
        symbol: symbol,
        interval: mexcTimeframe,
      },
      id: Date.now(),
    };

    try {
      this.ws.send(JSON.stringify(subscribeMessage));
      this.logger.debug(`Subscribed to MEXC ${symbol} ${timeframe} (${streamName})`);
    } catch (error) {
      this.logger.error(`Failed to send MEXC subscription for ${symbol} ${timeframe}:`, error);
      throw error;
    }
  }

  async unsubscribeFromKlines(symbol: string, timeframe: string) {
    const mexcTimeframe = this.mapToMexcInterval(timeframe);
    
    if (this.subscriptions.has(symbol)) {
      this.subscriptions.get(symbol)!.delete(timeframe);
      if (this.subscriptions.get(symbol)!.size === 0) {
        this.subscriptions.delete(symbol);
      }
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const unsubscribeMessage = {
        method: 'unsub.kline',
        param: {
          symbol: symbol,
          interval: mexcTimeframe,
        },
        id: Date.now(),
      };
      this.ws.send(JSON.stringify(unsubscribeMessage));
      this.logger.log(`Unsubscribed from MEXC ${symbol} ${timeframe}`);
    }
  }

  private async connect() {
    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.baseUrl);

        this.ws.on('open', () => {
          this.logger.log('Connected to MEXC WebSocket');
          this.clearReconnectInterval();
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (error) {
            this.logger.error('Error parsing MEXC WebSocket message', error);
          }
        });

        this.ws.on('error', (error) => {
          this.logger.error('MEXC WebSocket error', error);
          reject(error);
        });

        this.ws.on('close', () => {
          this.logger.warn('MEXC WebSocket closed, reconnecting...');
          this.scheduleReconnect();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: any) {
    if (message.c === 'spot@public.kline.v3.api') {
      this.processKline(message as MexcKlineMessage);
    }
  }

  private async processKline(klineData: MexcKlineMessage) {
    const { d } = klineData;
    
    try {
      const symbol = d.S;
      const timeframe = this.mapFromMexcInterval(d.i);

      // Save to database
      await this.prisma.candle.upsert({
        where: {
          symbol_timeframe_openTime: {
            symbol,
            timeframe,
            openTime: new Date(d.t),
          },
        },
        update: {
          open: parseFloat(d.o),
          high: parseFloat(d.h),
          low: parseFloat(d.l),
          close: parseFloat(d.c),
          volume: parseFloat(d.v),
          quoteVolume: parseFloat(d.q),
        },
        create: {
          symbol,
          timeframe,
          openTime: new Date(d.t),
          open: parseFloat(d.o),
          high: parseFloat(d.h),
          low: parseFloat(d.l),
          close: parseFloat(d.c),
          volume: parseFloat(d.v),
          quoteVolume: parseFloat(d.q),
        },
      });

      this.logger.debug(`Saved MEXC candle: ${symbol} ${timeframe} at ${new Date(d.t).toISOString()}`);
      
      // Emit candle update via WebSocket
      try {
        this.wsGateway.emitCandleUpdate({
          symbol,
          timeframe,
          openTime: new Date(d.t),
          open: parseFloat(d.o),
          high: parseFloat(d.h),
          low: parseFloat(d.l),
          close: parseFloat(d.c),
          volume: parseFloat(d.v),
          quoteVolume: parseFloat(d.q),
        });
      } catch (error) {
        // Ignore WebSocket errors
      }

      // NOTE: Signal generation is handled by cron jobs in MarketAnalyzerService
      // with proper timing (30 seconds after candle close) to ensure data consistency.
      // Do NOT generate signals here - it would create duplicates and ignore the schedule.
    } catch (error) {
      this.logger.error('Error processing MEXC kline', error);
    }
  }

  private mapToMexcInterval(interval: string): string {
    const mapping: Record<string, string> = {
      '1m': 'Min1',
      '5m': 'Min5',
      '15m': 'Min15',
      '1h': 'Hour1',
      '4h': 'Hour4',
      '1d': 'Day1',
      '1w': 'Week1',
    };
    return mapping[interval] || interval;
  }

  private mapFromMexcInterval(interval: string): string {
    const mapping: Record<string, string> = {
      'Min1': '1m',
      'Min5': '5m',
      'Min15': '15m',
      'Hour1': '1h',
      'Hour4': '4h',
      'Day1': '1d',
      'Week1': '1w',
    };
    return mapping[interval] || interval;
  }

  private scheduleReconnect() {
    this.clearReconnectInterval();
    this.reconnectInterval = setTimeout(() => {
      this.connect().catch((error) => {
        this.logger.error('MEXC reconnection failed', error);
        this.scheduleReconnect();
      });
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
    // Get historical data from database (real data)
    try {
      const candles = await this.prisma.candle.findMany({
        where: {
          symbol,
          timeframe,
        },
        orderBy: {
          openTime: 'desc',
        },
        take: limit,
      });
      return candles.reverse(); // Oldest first
    } catch (error) {
      this.logger.error(`Error fetching MEXC historical klines: ${error.message}`);
      return [];
    }
  }
}
