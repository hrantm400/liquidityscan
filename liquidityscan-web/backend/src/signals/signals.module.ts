import { Module, forwardRef } from '@nestjs/common';
import { SignalsService } from './signals.service';
import { SignalsController } from './signals.controller';
import { StrategiesModule } from '../strategies/strategies.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { CacheModule } from '../common/cache/cache.module';
import { ExchangesModule } from '../exchanges/exchanges.module';

@Module({
  imports: [StrategiesModule, WebSocketModule, CacheModule, forwardRef(() => ExchangesModule)],
  controllers: [SignalsController],
  providers: [SignalsService],
  exports: [SignalsService],
})
export class SignalsModule {}
