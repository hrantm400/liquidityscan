import { Controller, Get, Post, Body, Headers, UnauthorizedException, Query } from '@nestjs/common';
import { SignalsService } from './signals.service';

const WEBHOOK_SECRET_HEADER = 'x-webhook-secret';

@Controller('signals')
export class SignalsController {
  constructor(private readonly signalsService: SignalsService) {}

  @Post('webhook')
  async webhook(
    @Headers(WEBHOOK_SECRET_HEADER) secret: string | undefined,
    @Body() body: unknown,
  ): Promise<{ received: number }> {
    const expected = (process.env.SIGNALS_WEBHOOK_SECRET ?? '').trim();
    const secretTrimmed = (secret ?? '').trim();
    if (!expected || secretTrimmed !== expected) {
      throw new UnauthorizedException('Invalid or missing webhook secret');
    }
    const arr = this.signalsService.normalizeWebhookBody(body);
    const received = this.signalsService.addSignals(arr);
    return { received };
  }

  @Get()
  getSignals(@Query('strategyType') strategyType?: string) {
    return this.signalsService.getSignals(strategyType || undefined);
  }
}
