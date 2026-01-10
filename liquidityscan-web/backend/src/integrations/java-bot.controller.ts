import { Controller, Post, Body, Get, Logger } from '@nestjs/common';
import { JavaBotIntegrationService } from './java-bot-integration.service';
import type { JavaBotSignal } from './java-bot-integration.service';

@Controller('integrations/java-bot')
export class JavaBotController {
  private readonly logger = new Logger(JavaBotController.name);

  constructor(private javaBotIntegrationService: JavaBotIntegrationService) {}

  /**
   * Webhook endpoint для приема сигналов от Java бота
   * POST /api/integrations/java-bot/signals
   */
  @Post('signals')
  async receiveSignal(@Body() signal: JavaBotSignal) {
    this.logger.log(`Received signal from Java bot: ${JSON.stringify(signal)}`);
    
    try {
      await this.javaBotIntegrationService.receiveSignalFromJavaBot(signal);
      return {
        success: true,
        message: 'Signal received and processed',
      };
    } catch (error) {
      this.logger.error(`Error processing signal:`, error);
      return {
        success: false,
        message: error.message || 'Error processing signal',
      };
    }
  }

  /**
   * Проверка статуса интеграции
   * GET /api/integrations/java-bot/status
   */
  @Get('status')
  async getStatus() {
    const status = await this.javaBotIntegrationService.getJavaBotStatus();
    return {
      ...status,
      integrationEnabled: true,
    };
  }
}
