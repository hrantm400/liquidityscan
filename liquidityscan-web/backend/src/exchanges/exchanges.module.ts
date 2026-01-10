import { Module, forwardRef } from '@nestjs/common';
import { ExchangesService } from './exchanges.service';
import { BinanceService } from './binance.service';
import { MexcService } from './mexc.service';
import { WebSocketModule } from '../websocket/websocket.module';
import { SignalsModule } from '../signals/signals.module';

@Module({
  imports: [WebSocketModule, forwardRef(() => SignalsModule)],
  providers: [ExchangesService, BinanceService, MexcService],
  exports: [ExchangesService, BinanceService, MexcService],
})
export class ExchangesModule {}
