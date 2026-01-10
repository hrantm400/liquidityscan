import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import axios from 'axios';

export interface JavaBotSignal {
  strategyType: 'RSI_DIVERGENCE' | 'SUPER_ENGULFING' | 'ICT_BIAS';
  symbol: string;
  timeframe: string;
  signalType: 'BUY' | 'SELL';
  price?: number; // Цена сигнала
  detectedAt?: Date;
  metadata?: {
    patternType?: string;
    xLogic?: number;
    bias?: string;
    divergenceType?: string;
    rsiValue?: number;
    [key: string]: any;
  };
}

@Injectable()
export class JavaBotIntegrationService {
  private readonly logger = new Logger(JavaBotIntegrationService.name);
  private readonly javaBotUrl: string;
  private readonly javaBotPort: number;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private wsGateway: WebSocketGateway,
  ) {
    this.javaBotUrl = this.configService.get<string>('JAVA_BOT_URL') || 'http://localhost';
    this.javaBotPort = this.configService.get<number>('JAVA_BOT_PORT') || 8080;
  }

  /**
   * Принимает сигнал от Java бота и сохраняет его в базу данных
   */
  async receiveSignalFromJavaBot(signal: JavaBotSignal): Promise<void> {
    try {
      this.logger.log(`Received signal from Java bot: ${signal.strategyType} ${signal.symbol} ${signal.timeframe} ${signal.signalType}`);

      // Преобразуем стратегию из формата Java бота в формат нашей системы
      const strategyType = this.mapStrategyType(signal.strategyType);

      // Проверяем, не существует ли уже такой сигнал
      const existingSignal = await this.prisma.signal.findFirst({
        where: {
          strategyType,
          symbol: signal.symbol,
          timeframe: signal.timeframe,
          signalType: signal.signalType,
          status: 'ACTIVE',
          detectedAt: {
            gte: new Date(Date.now() - 60000), // В пределах последней минуты
          },
        },
      });

      if (existingSignal) {
        this.logger.debug(`Signal already exists, skipping: ${signal.strategyType} ${signal.symbol} ${signal.timeframe}`);
        return;
      }

      // Создаем сигнал в базе данных
      const createdSignal = await this.prisma.signal.create({
        data: {
          strategyType,
          symbol: signal.symbol,
          timeframe: signal.timeframe,
          signalType: signal.signalType,
          price: signal.price || 0, // Добавляем обязательное поле price
          status: 'ACTIVE',
          detectedAt: signal.detectedAt || new Date(),
          metadata: signal.metadata || {},
        },
      });

      this.logger.log(`Signal saved to database: ${createdSignal.id}`);

      // Отправляем сигнал через WebSocket
      this.wsGateway.emitSignal(createdSignal);
    } catch (error) {
      this.logger.error(`Error processing signal from Java bot:`, error);
      throw error;
    }
  }

  /**
   * Маппинг типов стратегий из Java бота в наш формат
   */
  private mapStrategyType(javaStrategyType: string): string {
    const mapping: Record<string, string> = {
      'RSI_DIVERGENCE': 'RSI_DIVERGENCE',
      'SUPER_ENGULFING': 'SUPER_ENGULFING',
      'ICT_BIAS': 'ICT_BIAS',
    };

    return mapping[javaStrategyType] || javaStrategyType;
  }

  /**
   * Проверяет доступность Java бота
   */
  async checkJavaBotHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.javaBotUrl}:${this.javaBotPort}/actuator/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      this.logger.warn(`Java bot is not accessible at ${this.javaBotUrl}:${this.javaBotPort}`);
      return false;
    }
  }

  /**
   * Получает статус Java бота
   */
  async getJavaBotStatus(): Promise<{ isRunning: boolean; url: string }> {
    const isRunning = await this.checkJavaBotHealth();
    return {
      isRunning,
      url: `${this.javaBotUrl}:${this.javaBotPort}`,
    };
  }
}
