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

interface SuperEngulfing {
  type: 'BULLISH' | 'BEARISH';
  previousCandle: Candle;
  currentCandle: Candle;
  hasWickFilter?: boolean;
  is3X?: boolean;
}

@Injectable()
export class SuperEngulfingService {
  constructor(private prisma: PrismaService) {}

  detectSuperEngulfing(previousCandle: Candle, currentCandle: Candle): boolean {
    const prevOpen = Number(previousCandle.open);
    const prevClose = Number(previousCandle.close);
    const prevHigh = Number(previousCandle.high);
    const prevLow = Number(previousCandle.low);

    const currOpen = Number(currentCandle.open);
    const currClose = Number(currentCandle.close);
    const currHigh = Number(currentCandle.high);
    const currLow = Number(currentCandle.low);

    const isPrevBullish = prevClose > prevOpen;
    const isPrevBearish = prevClose < prevOpen;
    const isCurrBullish = currClose > currOpen;
    const isCurrBearish = currClose < currOpen;

    // Bullish Engulfing: previous bearish, current bullish
    if (isPrevBearish && isCurrBullish) {
      const prevBody = Math.abs(prevClose - prevOpen);
      const currBody = Math.abs(currClose - currOpen);

      // Current candle must engulf previous
      if (currLow < prevLow && currClose > prevOpen && currBody > prevBody) {
        return true;
      }
    }

    // Bearish Engulfing: previous bullish, current bearish
    if (isPrevBullish && isCurrBearish) {
      const prevBody = Math.abs(prevClose - prevOpen);
      const currBody = Math.abs(currClose - currOpen);

      // Current candle must engulf previous
      if (currHigh > prevHigh && currClose < prevOpen && currBody > prevBody) {
        return true;
      }
    }

    return false;
  }

  detectSuperEngulfing2X(previousCandle: Candle, currentCandle: Candle): { isEngulfing: boolean; hasWickFilter: boolean } {
    const isEngulfing = this.detectSuperEngulfing(previousCandle, currentCandle);

    if (!isEngulfing) {
      return { isEngulfing: false, hasWickFilter: false };
    }

    const prevOpen = Number(previousCandle.open);
    const prevClose = Number(previousCandle.close);
    const currClose = Number(currentCandle.close);
    const currOpen = Number(currentCandle.open);

    const isBullish = currClose > currOpen;
    const hasWickFilter = isBullish
      ? this.isWick3XLargerThanPreviousBody(currentCandle, previousCandle, true)
      : this.isWick3XLargerThanPreviousBody(currentCandle, previousCandle, false);

    return { isEngulfing: true, hasWickFilter };
  }

  detectSuperEngulfing3X(
    firstCandle: Candle,
    secondCandle: Candle,
    thirdCandle: Candle,
  ): boolean {
    const firstType = this.getCandleType(firstCandle);
    const secondType = this.getCandleType(secondCandle);
    const thirdType = this.getCandleType(thirdCandle);

    // Check if first and third are same type, and second is opposite
    if (firstType === 'BULLISH' && thirdType === 'BULLISH' && secondType === 'BEARISH') {
      // First engulfs second, second engulfs third
      const firstEngulfsSecond = this.detectSuperEngulfing(secondCandle, firstCandle);
      const secondEngulfsThird = this.detectSuperEngulfing(thirdCandle, secondCandle);

      if (firstEngulfsSecond && secondEngulfsThird) {
        // Additional check: first low < second low < third low
        const firstLow = Number(firstCandle.low);
        const secondLow = Number(secondCandle.low);
        const thirdLow = Number(thirdCandle.low);

        return firstLow < secondLow && secondLow < thirdLow;
      }
    }

    if (firstType === 'BEARISH' && thirdType === 'BEARISH' && secondType === 'BULLISH') {
      // First engulfs second, second engulfs third
      const firstEngulfsSecond = this.detectSuperEngulfing(secondCandle, firstCandle);
      const secondEngulfsThird = this.detectSuperEngulfing(thirdCandle, secondCandle);

      if (firstEngulfsSecond && secondEngulfsThird) {
        // Additional check: first high > second high > third high
        const firstHigh = Number(firstCandle.high);
        const secondHigh = Number(secondCandle.high);
        const thirdHigh = Number(thirdCandle.high);

        return firstHigh > secondHigh && secondHigh > thirdHigh;
      }
    }

    return false;
  }

  private getCandleType(candle: Candle): 'BULLISH' | 'BEARISH' {
    return Number(candle.close) > Number(candle.open) ? 'BULLISH' : 'BEARISH';
  }

  private isWick3XLargerThanPreviousBody(currentCandle: Candle, previousCandle: Candle, isBottomWick: boolean): boolean {
    const prevOpen = Number(previousCandle.open);
    const prevClose = Number(previousCandle.close);
    const prevBody = Math.abs(prevClose - prevOpen);

    let wick: number;
    if (isBottomWick) {
      const low = Number(currentCandle.low);
      const open = Number(currentCandle.open);
      const close = Number(currentCandle.close);
      wick = Math.min(open, close) - low;
    } else {
      const high = Number(currentCandle.high);
      const open = Number(currentCandle.open);
      const close = Number(currentCandle.close);
      wick = high - Math.max(open, close);
    }

    return wick >= prevBody * 3;
  }

  /**
   * Detect RUN pattern (Continuation: two candles of the same color)
   * Based on PineScript: SuperEngulfing: REV + RUN [Plus]
   * 
   * Bullish RUN: prevBull && currBull && low < low[1] && close > close[1]
   * Bearish RUN: prevBear && currBear && high > high[1] && close < close[1]
   * PLUS: close > high[1] (bull) or close < low[1] (bear)
   */
  detectRunPattern(prevCandle: Candle, currCandle: Candle): {
    isRun: boolean;
    type: 'BULLISH' | 'BEARISH' | null;
    hasPlus: boolean;
  } {
    const prevOpen = Number(prevCandle.open);
    const prevClose = Number(prevCandle.close);
    const prevHigh = Number(prevCandle.high);
    const prevLow = Number(prevCandle.low);

    const currOpen = Number(currCandle.open);
    const currClose = Number(currCandle.close);
    const currHigh = Number(currCandle.high);
    const currLow = Number(currCandle.low);

    const isPrevBullish = prevClose > prevOpen;
    const isPrevBearish = prevClose < prevOpen;
    const isCurrBullish = currClose > currOpen;
    const isCurrBearish = currClose < currOpen;

    // Bullish RUN: Green -> Green with liquidity grab and stronger close
    if (isPrevBullish && isCurrBullish) {
      const hasLiquidityGrab = currLow < prevLow; // Low < low[1]
      const hasStrongerClose = currClose > prevClose; // Close > close[1]
      
      if (hasLiquidityGrab && hasStrongerClose) {
        const hasPlus = currClose > prevHigh; // Close > high[1]
        return {
          isRun: true,
          type: 'BULLISH',
          hasPlus,
        };
      }
    }

    // Bearish RUN: Red -> Red with liquidity grab and weaker close
    if (isPrevBearish && isCurrBearish) {
      const hasLiquidityGrab = currHigh > prevHigh; // High > high[1]
      const hasWeakerClose = currClose < prevClose; // Close < close[1]
      
      if (hasLiquidityGrab && hasWeakerClose) {
        const hasPlus = currClose < prevLow; // Close < low[1]
        return {
          isRun: true,
          type: 'BEARISH',
          hasPlus,
        };
      }
    }

    return {
      isRun: false,
      type: null,
      hasPlus: false,
    };
  }

  /**
   * Calculate x logic: how many previous same-color candles the current candle closes beyond
   * Minimum x2 required (from user's specification)
   * 
   * For Bullish: Count how many consecutive red/green candles the green candle closed above
   * For Bearish: Count how many consecutive red/green candles the red candle closed below
   */
  calculateXLogic(candles: Candle[], currentIndex: number): number {
    if (currentIndex < 2 || candles.length < 3) {
      return 0; // Need at least 2 previous candles
    }

    const current = candles[currentIndex];
    const currClose = Number(current.close);
    const isCurrBullish = Number(current.close) > Number(current.open);

    let xCount = 0;
    
    // Look backwards from current candle
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevCandle = candles[i];
      const prevClose = Number(prevCandle.close);
      const prevOpen = Number(prevCandle.open);
      const isPrevBullish = prevClose > prevOpen;
      const isPrevBearish = prevClose < prevOpen;

      // Check if all previous candles are the same color (bullish or bearish)
      // This is a requirement: "these previous candles must have the same color"
      if (i < currentIndex - 1) {
        const nextToThis = candles[i + 1];
        const nextToPrevClose = Number(nextToThis.close);
        const nextToPrevOpen = Number(nextToThis.open);
        const isNextBullish = nextToPrevClose > nextToPrevOpen;
        const isNextBearish = nextToPrevClose < nextToPrevOpen;

        // If colors don't match between consecutive previous candles, stop counting
        if ((isPrevBullish && isNextBearish) || (isPrevBearish && isNextBullish)) {
          break;
        }
      }

      if (isCurrBullish) {
        // For bullish current candle: check if it closed higher than this previous candle
        if (currClose > prevClose) {
          xCount++;
        } else {
          break; // Stop when we find a candle we didn't close above
        }
      } else {
        // For bearish current candle: check if it closed lower than this previous candle
        if (currClose < prevClose) {
          xCount++;
        } else {
          break; // Stop when we find a candle we didn't close below
        }
      }
    }

    return xCount >= 2 ? xCount : 0; // Minimum x2 required
  }

  /**
   * Detect REV pattern (Reversal: color change + engulfing)
   * Based on PineScript: SuperEngulfing: REV + RUN [Plus]
   * 
   * Bullish REV: prevBear && currBull && low < low[1] && close > open[1]
   * Bearish REV: prevBull && currBear && high > high[1] && close < open[1]
   * PLUS: close > high[1] (bull) or close < low[1] (bear)
   */
  detectRevPattern(prevCandle: Candle, currCandle: Candle): {
    isRev: boolean;
    type: 'BULLISH' | 'BEARISH' | null;
    hasPlus: boolean;
  } {
    const prevOpen = Number(prevCandle.open);
    const prevClose = Number(prevCandle.close);
    const prevHigh = Number(prevCandle.high);
    const prevLow = Number(prevCandle.low);

    const currOpen = Number(currCandle.open);
    const currClose = Number(currCandle.close);
    const currHigh = Number(currCandle.high);
    const currLow = Number(currCandle.low);

    const isPrevBullish = prevClose > prevOpen;
    const isPrevBearish = prevClose < prevOpen;
    const isCurrBullish = currClose > currOpen;
    const isCurrBearish = currClose < currOpen;

    // Bullish REV: Red -> Green with liquidity grab and engulfing
    if (isPrevBearish && isCurrBullish) {
      const hasLiquidityGrab = currLow < prevLow; // Low < low[1]
      const hasEngulfing = currClose > prevOpen; // Close > open[1]
      
      if (hasLiquidityGrab && hasEngulfing) {
        const hasPlus = currClose > prevHigh; // Close > high[1]
        return {
          isRev: true,
          type: 'BULLISH',
          hasPlus,
        };
      }
    }

    // Bearish REV: Green -> Red with liquidity grab and engulfing
    if (isPrevBullish && isCurrBearish) {
      const hasLiquidityGrab = currHigh > prevHigh; // High > high[1]
      const hasEngulfing = currClose < prevOpen; // Close < open[1]
      
      if (hasLiquidityGrab && hasEngulfing) {
        const hasPlus = currClose < prevLow; // Close < low[1]
        return {
          isRev: true,
          type: 'BEARISH',
          hasPlus,
        };
      }
    }

    return {
      isRev: false,
      type: null,
      hasPlus: false,
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
