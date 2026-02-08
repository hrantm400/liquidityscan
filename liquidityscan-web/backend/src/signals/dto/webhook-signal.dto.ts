import { IsString, IsNumber, IsOptional, IsIn, IsObject } from 'class-validator';

/** Allowed timeframes for Super Engulfing (4h, 1d, 1w only). */
export const SUPER_ENGULFING_TIMEFRAMES = ['4h', '1d', '1w'] as const;
export type SuperEngulfingTimeframe = (typeof SUPER_ENGULFING_TIMEFRAMES)[number];

export class WebhookSignalDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsIn(['SUPER_ENGULFING'])
  strategyType: string;

  @IsString()
  symbol: string;

  @IsString()
  @IsIn(SUPER_ENGULFING_TIMEFRAMES)
  timeframe: string;

  @IsString()
  @IsIn(['BUY', 'SELL'])
  signalType: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  detectedAt?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'EXPIRED', 'FILLED', 'CLOSED'])
  status?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
