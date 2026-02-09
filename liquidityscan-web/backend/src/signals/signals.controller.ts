import { Controller, Get, Post, Body, Headers, UnauthorizedException, Query, Logger } from '@nestjs/common';
import { SignalsService } from './signals.service';

const WEBHOOK_SECRET_HEADER = 'x-webhook-secret';

@Controller('signals')
export class SignalsController {
  private readonly logger = new Logger(SignalsController.name);

  constructor(private readonly signalsService: SignalsService) {}

  @Post('webhook')
  async webhook(
    @Headers(WEBHOOK_SECRET_HEADER) secret: string | undefined,
    @Body() body: unknown,
  ): Promise<{ received: number }> {
    this.logger.log('Webhook POST /signals/webhook — request received');
    const expected = (process.env.SIGNALS_WEBHOOK_SECRET ?? '').trim();
    const secretTrimmed = (secret ?? '').trim();
    if (!expected || secretTrimmed !== expected) {
      this.logger.warn('Webhook rejected: invalid or missing x-webhook-secret');
      throw new UnauthorizedException('Invalid or missing webhook secret');
    }
    this.logger.log('Webhook authenticated (secret OK)');
    const b = body as Record<string, unknown> | null;
    const coinsInPayload = Array.isArray(b?.signals) ? b.signals.length : (b?.symbol && b?.signals_by_timeframe ? 1 : 0);
    const arr = this.signalsService.normalizeWebhookBody(body);
    const received = this.signalsService.addSignals(arr);
    this.logger.log(
      `Webhook result: payload coins=${coinsInPayload}, parsed (4h/1d/1w)=${arr.length}, accepted=${received}`,
    );
    return { received };
  }

  @Get()
  getSignals(@Query('strategyType') strategyType?: string) {
    const list = this.signalsService.getSignals(strategyType || undefined);
    this.logger.log(`GET /signals strategyType=${strategyType ?? 'all'} -> ${list.length} signals`);
    return list;
  }
}
