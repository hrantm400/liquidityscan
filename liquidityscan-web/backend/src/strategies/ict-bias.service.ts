import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface Candle {
  open: Prisma.Decimal;
  high: Prisma.Decimal;
  low: Prisma.Decimal;
  close: Prisma.Decimal;
  openTime: Date;
  volume?: Prisma.Decimal;
  quoteVolume?: Prisma.Decimal;
}

export type BiasType = 'BULLISH' | 'BEARISH' | 'RANGING' | 'UNKNOWN';

export interface ICTBiasResult {
  bias: BiasType;
  message: string;
  high: Prisma.Decimal;
  low: Prisma.Decimal;
  isValid: boolean;
}

@Injectable()
export class IctBiasService {
  constructor(private prisma: PrismaService) {}

  detectDailyBias(previousDay: Candle, currentDay: Candle): ICTBiasResult {
    // PineScript logic: compare prev_close (close[1]) with prev_prev_high/low (high[2]/low[2])
    // In our case: previousDay = close[1], currentDay = close[0] (current forming)
    // We need to compare previousDay.close with previousDay.high/low
    // But actually, PineScript uses: prev_close = close[1], prev_prev_high = high[2]
    // So we need: previousDay.close vs previousDay.high/low (which is correct)
    
    const prevClose = Number(previousDay.close);
    const prevHigh = Number(previousDay.high);
    const prevLow = Number(previousDay.low);
    const currHigh = Number(currentDay.high);
    const currLow = Number(currentDay.low);

    let bias: BiasType;
    let message: string;

    // ICT Daily Bias logic (from PineScript):
    // Compare PREVIOUS day's close with PREVIOUS day's high/low
    // If prev_close < prev_prev_low -> BEARISH
    // If prev_close > prev_prev_high -> BULLISH
    // Otherwise -> RANGING
    
    if (prevClose < prevLow) {
      // Previous close broke below previous day's low - BEARISH
      bias = 'BEARISH';
      message = "Bearish Daily Bias\nWe expect today's candle to touch lower daily level";
    } else if (prevClose > prevHigh) {
      // Previous close broke above previous day's high - BULLISH
      bias = 'BULLISH';
      message = "Bullish Daily Bias\nWe expect today's candle to touch higher daily level";
    } else {
      // Previous close is within previous day's range - RANGING
      bias = 'RANGING';
      message = 'Ranging Daily Bias\nNo expectation where the market is likely to go';
    }

    return {
      bias,
      message,
      high: currentDay.high,
      low: currentDay.low,
      isValid: true,
    };
  }

  async detectDailyBiasFromCandles(
    candles: Candle[],
    timezone: string = 'UTC',
  ): Promise<ICTBiasResult> {
    // Aggregate candles into daily candles
    const dailyCandles = this.aggregateDailyCandles(candles);

    if (dailyCandles.length < 3) {
      return {
        bias: 'UNKNOWN',
        message: 'Not enough daily data (current day must have started)',
        high: new Prisma.Decimal(0),
        low: new Prisma.Decimal(0),
        isValid: false,
      };
    }

    // PineScript logic: compare prev_close (close[1]) with prev_prev_high/low (high[2]/low[2])
    // In our array: [length-3] = prev_prev, [length-2] = prev (close[1]), [length-1] = current (close[0])
    // We need: prev_close = close[length-2], prev_prev_high = high[length-3], prev_prev_low = low[length-3]
    if (dailyCandles.length < 3) {
      return {
        bias: 'UNKNOWN',
        message: 'Not enough daily data (need at least 3 days)',
        high: new Prisma.Decimal(0),
        low: new Prisma.Decimal(0),
        isValid: false,
      };
    }

    const prevPrevDay = dailyCandles[dailyCandles.length - 3]; // high[2]/low[2]
    const prevDay = dailyCandles[dailyCandles.length - 2]; // close[1]
    const currentDay = dailyCandles[dailyCandles.length - 1]; // current day

    // Compare prev_close (close[1]) with prev_prev_high/low (high[2]/low[2])
    const prevClose = Number(prevDay.close);
    const prevPrevHigh = Number(prevPrevDay.high);
    const prevPrevLow = Number(prevPrevDay.low);

    let bias: BiasType;
    let message: string;

    // PineScript logic
    if (prevClose < prevPrevLow) {
      bias = 'BEARISH';
      message = "Bearish Daily Bias\nWe expect today's candle to touch lower daily level";
    } else if (prevClose > prevPrevHigh) {
      bias = 'BULLISH';
      message = "Bullish Daily Bias\nWe expect today's candle to touch higher daily level";
    } else {
      bias = 'RANGING';
      message = 'Ranging Daily Bias\nNo expectation where the market is likely to go';
    }

    return {
      bias,
      message,
      high: currentDay.high,
      low: currentDay.low,
      isValid: true,
    };
  }

  private aggregateDailyCandles(candles: Candle[]): Candle[] {
    const dailyMap = new Map<string, Candle>();

    for (const candle of candles) {
      const date = new Date(candle.openTime);
      date.setHours(0, 0, 0, 0);
      const dayKey = date.toISOString().split('T')[0];

      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, {
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          openTime: date,
          volume: candle.volume || new Prisma.Decimal(0),
          quoteVolume: candle.quoteVolume || new Prisma.Decimal(0),
        });
      } else {
        const dailyCandle = dailyMap.get(dayKey)!;
        // Update high and low
        if (Number(candle.high) > Number(dailyCandle.high)) {
          dailyCandle.high = candle.high;
        }
        if (Number(candle.low) < Number(dailyCandle.low)) {
          dailyCandle.low = candle.low;
        }
        // Update close (use latest)
        dailyCandle.close = candle.close;
        // Aggregate volumes
        if (candle.volume) {
          dailyCandle.volume = new Prisma.Decimal(Number(dailyCandle.volume) + Number(candle.volume));
        }
        if (candle.quoteVolume) {
          dailyCandle.quoteVolume = new Prisma.Decimal(
            Number(dailyCandle.quoteVolume) + Number(candle.quoteVolume),
          );
        }
      }
    }

    return Array.from(dailyMap.values()).sort((a, b) => a.openTime.getTime() - b.openTime.getTime());
  }

  async getDailyCandlesForAnalysis(symbol: string, limit: number = 30) {
    // First, try to get 1d candles directly (most efficient)
    const dailyCandlesDirect = await this.prisma.candle.findMany({
      where: {
        symbol,
        timeframe: '1d',
      },
      orderBy: {
        openTime: 'desc',
      },
      take: limit,
    });

    if (dailyCandlesDirect.length >= 3) {
      // We have direct daily candles, use them
      return dailyCandlesDirect.reverse() as Candle[];
    }

    // If not enough daily candles, try to aggregate from smaller timeframes
    // Try 1h first (more efficient)
    const hourlyCandles = await this.prisma.candle.findMany({
      where: {
        symbol,
        timeframe: '1h',
      },
      orderBy: {
        openTime: 'desc',
      },
      take: limit * 24, // 24 hours per day
    });

    if (hourlyCandles.length > 0) {
      const aggregated = this.aggregateDailyCandles(hourlyCandles.reverse() as Candle[]);
      if (aggregated.length >= 3) {
        return aggregated;
      }
    }

    // Try 4h candles
    const fourHourCandles = await this.prisma.candle.findMany({
      where: {
        symbol,
        timeframe: '4h',
      },
      orderBy: {
        openTime: 'desc',
      },
      take: limit * 6, // 6 four-hour candles per day
    });

    if (fourHourCandles.length > 0) {
      const aggregated = this.aggregateDailyCandles(fourHourCandles.reverse() as Candle[]);
      if (aggregated.length >= 3) {
        return aggregated;
      }
    }

    // Last resort: try smaller timeframes
    const candles = await this.prisma.candle.findMany({
      where: {
        symbol,
        timeframe: {
          in: ['5m', '15m', '1h'],
        },
      },
      orderBy: {
        openTime: 'desc',
      },
      take: limit * 24 * 12, // Approximate for 5m candles
    });

    return this.aggregateDailyCandles(candles.reverse() as Candle[]);
  }
}
