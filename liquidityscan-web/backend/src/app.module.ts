import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StrategiesModule } from './strategies/strategies.module';
import { ExchangesModule } from './exchanges/exchanges.module';
import { SignalsModule } from './signals/signals.module';
import { WebSocketModule } from './websocket/websocket.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AdminModule } from './admin/admin.module';
import { MarketAnalyzerService } from './common/scheduler/market-analyzer.service';
import { MarketAnalyzerController } from './common/scheduler/market-analyzer.controller';
import { CacheModule } from './common/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
    CacheModule,
    AuthModule,
    UsersModule,
    StrategiesModule,
    ExchangesModule,
    SignalsModule,
    WebSocketModule,
    SubscriptionsModule,
    IntegrationsModule,
    AdminModule,
  ],
  controllers: [AppController, MarketAnalyzerController],
  providers: [AppService, MarketAnalyzerService],
})
export class AppModule {}
