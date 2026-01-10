import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';

@WSGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
})
export class WebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private redisAdapter: any;

  constructor(private configService: ConfigService) {}

  async afterInit(server: Server) {
    await this.initRedisAdapter(server);
  }

  private async initRedisAdapter(server: Server) {
    try {
      const redisUrl = `redis://${this.configService.get('REDIS_HOST') || 'localhost'}:${this.configService.get('REDIS_PORT') || 6379}`;
      
      const pubClient = createClient({
        url: redisUrl,
      });
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      this.redisAdapter = createAdapter(pubClient, subClient);
      
      // Socket.IO v4+ with NestJS - try to set adapter
      // Note: Redis adapter is only needed for multi-instance scaling
      // For single instance, default in-memory adapter works fine
      try {
        // Try different ways to set adapter based on Socket.IO version
        if ((server as any).io && (server as any).io.adapter) {
          (server as any).io.adapter(this.redisAdapter);
        } else if ((server as any).adapter && typeof (server as any).adapter === 'function') {
          (server as any).adapter(this.redisAdapter);
        } else {
          // Adapter setting not available - this is OK for single instance
          this.logger.debug('Redis adapter created but not set (using default adapter)');
          this.logger.debug('This is normal for single-instance deployments');
          return; // Exit early, adapter not needed
        }
        this.logger.log('Redis adapter initialized for WebSocket scaling');
      } catch (adapterError) {
        // Adapter setting failed - not critical for single instance
        this.logger.debug('Could not set Redis adapter, using default in-memory adapter');
        this.logger.debug('This is fine for single-instance deployments');
      }
    } catch (error) {
      this.logger.warn('Redis adapter initialization failed, using default adapter');
      this.logger.debug(`Redis connection error: ${error instanceof Error ? error.message : String(error)}`);
      // Continue without Redis adapter - Socket.IO will use default in-memory adapter
      // This is fine for single-instance deployments and doesn't affect signal generation
    }
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:symbol')
  handleSubscribeSymbol(@ConnectedSocket() client: Socket, @MessageBody() data: { symbol: string; timeframe?: string }) {
    const room = `symbol:${data.symbol}${data.timeframe ? `:${data.timeframe}` : ''}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { success: true, room };
  }

  @SubscribeMessage('unsubscribe:symbol')
  handleUnsubscribeSymbol(@ConnectedSocket() client: Socket, @MessageBody() data: { symbol: string; timeframe?: string }) {
    const room = `symbol:${data.symbol}${data.timeframe ? `:${data.timeframe}` : ''}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
    return { success: true, room };
  }

  @SubscribeMessage('subscribe:strategy')
  handleSubscribeStrategy(@ConnectedSocket() client: Socket, @MessageBody() data: { strategyType: string }) {
    const room = `strategy:${data.strategyType}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { success: true, room };
  }

  emitSignal(signal: any) {
    try {
      // Emit to symbol room
      this.server.to(`symbol:${signal.symbol}:${signal.timeframe}`).emit('signal:new', signal);
      this.server.to(`symbol:${signal.symbol}`).emit('signal:new', signal);

      // Emit to strategy room
      this.server.to(`strategy:${signal.strategyType}`).emit('signal:new', signal);

      // Emit to all clients
      this.server.emit('signal:new', signal);
      
      this.logger.debug(`Signal emitted: ${signal.strategyType} ${signal.symbol} ${signal.timeframe} ${signal.signalType}`);
    } catch (error) {
      this.logger.error(`Error emitting signal: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  emitCandleUpdate(candle: any) {
    this.server.to(`symbol:${candle.symbol}:${candle.timeframe}`).emit('candle:update', candle);
  }

  emitPriceUpdate(symbol: string, price: number) {
    this.server.to(`symbol:${symbol}`).emit('price:update', { symbol, price });
  }
}
