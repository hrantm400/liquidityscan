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
 * Hammer Pattern Detection Service
 * Matches Java bot's HammerDetector logic
 * Detects strong reversal patterns (1:3 ratio) on all timeframes
 */
@Injectable()
export class HammerPatternService {
  constructor(private prisma: PrismaService) {}

  /**
   * Detect strong reversal pairs (1:3 ratio)
   * Based on Java bot's HammerDetector.findStrongReversalPairs()
   * 
   * Pattern: First candle body is 1/3 of second candle body
   * Used for 1d and 1w timeframes in Java bot
   */
  findStrongReversalPairs(prevCandle: Candle, currCandle: Candle): boolean {
    const prevOpen = Number(prevCandle.open);
    const prevClose = Number(prevCandle.close);
    const prevHigh = Number(prevCandle.high);
    const prevLow = Number(prevCandle.low);

    const currOpen = Number(currCandle.open);
    const currClose = Number(currCandle.close);
    const currHigh = Number(currCandle.high);
    const currLow = Number(currCandle.low);

    const prevBody = Math.abs(prevClose - prevOpen);
    const currBody = Math.abs(currClose - currOpen);

    // Check if current body is at least 3 times larger than previous body
    if (currBody === 0 || prevBody === 0) {
      return false;
    }

    const ratio = currBody / prevBody;
    
    // 1:3 ratio means current body is 3x larger than previous
    return ratio >= 3;
  }

  /**
   * Detect Hammer pattern (classic candlestick pattern)
   * Hammer has:
   * - Small body at the top (for bullish) or bottom (for bearish)
   * - Long lower shadow (at least 2x body) for bullish hammer
   * - Long upper shadow (at least 2x body) for bearish hammer
   * - Little or no upper shadow for bullish hammer
   * - Little or no lower shadow for bearish hammer
   */
  detectHammer(candle: Candle): {
    isHammer: boolean;
    type: 'BULLISH' | 'BEARISH' | null;
  } {
    const open = Number(candle.open);
    const close = Number(candle.close);
    const high = Number(candle.high);
    const low = Number(candle.low);

    const body = Math.abs(close - open);
    const upperShadow = high - Math.max(open, close);
    const lowerShadow = Math.min(open, close) - low;

    // Bullish Hammer: small body, long lower shadow, little upper shadow
    if (body > 0 && lowerShadow >= 2 * body && upperShadow <= body * 0.5) {
      return {
        isHammer: true,
        type: 'BULLISH',
      };
    }

    // Bearish Hammer (Inverted Hammer): small body, long upper shadow, little lower shadow
    if (body > 0 && upperShadow >= 2 * body && lowerShadow <= body * 0.5) {
      return {
        isHammer: true,
        type: 'BEARISH',
      };
    }

    return {
      isHammer: false,
      type: null,
    };
  }

  async getCandlesForAnalysis(symbol: string, timeframe: string, limit: number = 10) {
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
