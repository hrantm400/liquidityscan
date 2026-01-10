import { Module } from '@nestjs/common';
import { JavaBotIntegrationService } from './java-bot-integration.service';
import { JavaBotController } from './java-bot.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebSocketModule],
  providers: [JavaBotIntegrationService],
  controllers: [JavaBotController],
  exports: [JavaBotIntegrationService],
})
export class IntegrationsModule {}
