import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface Candle {
  open: Prisma.Decimal;
  high: Prisma.Decimal;
  low: Prisma.Decimal;
  close: Prisma.Decimal;
  openTime: Date;
}

/**
 * RSI Alerts Service
 * Matches Java bot's RSI alert logic for 5m, 15m, 1h timeframes
 * Checks for overbought (RSI > 70) and oversold (RSI < 30) conditions
 */
@Injectable()
export class RsiAlertsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate RSI (Relative Strength Index)
   * Period: 14 (default, matches Java bot)
   */
  calculateRSI(candles: Candle[], period: number = 14): number[] {
    if (candles.length < period + 1) {
      return [];
    }

    const closes = candles.map((c) => Number(c.close));
    const rsiValues: number[] = new Array(candles.length).fill(NaN);

    let avgGain = 0;
    let avgLoss = 0;

    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) {
        avgGain += change;
      } else {
        avgLoss += Math.abs(change);
      }
    }

    avgGain /= period;
    avgLoss /= period;

    // Calculate first RSI value
    if (avgLoss === 0) {
      rsiValues[period] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsiValues[period] = 100 - (100 / (1 + rs));
    }

    // Calculate subsequent RSI values using exponential smoothing
    for (let i = period + 1; i < candles.length; i++) {
      const change = closes[i] - closes[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      // Exponential smoothing (Wilder's smoothing)
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      if (avgLoss === 0) {
        rsiValues[i] = 100;
      } else {
        const rs = avgGain / avgLoss;
        rsiValues[i] = 100 - (100 / (1 + rs));
      }
    }

    return rsiValues;
  }

  /**
   * Check RSI alerts for overbought/oversold conditions
   * Matches Java bot's RSI alert logic
   */
  checkRsiAlerts(candles: Candle[], timeframe: string): {
    isOverbought: boolean;
    isOversold: boolean;
    rsiValue: number;
  } {
    if (candles.length < 15) {
      return {
        isOverbought: false,
        isOversold: false,
        rsiValue: NaN,
      };
    }

    const rsiValues = this.calculateRSI(candles, 14);
    const lastRsi = rsiValues[rsiValues.length - 1];

    if (isNaN(lastRsi)) {
      return {
        isOverbought: false,
        isOversold: false,
        rsiValue: NaN,
      };
    }

    // Overbought: RSI > 70
    // Oversold: RSI < 30
    return {
      isOverbought: lastRsi > 70,
      isOversold: lastRsi < 30,
      rsiValue: lastRsi,
    };
  }

  async getCandlesForAnalysis(symbol: string, timeframe: string, limit: number = 100) {
    return this.prisma.candle.findMany({
      where: {
        symbol,
        timeframe,
      },
      orderBy: {
        openTime: 'desc',
      },
      take: limit,
    });
  }
}
