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

interface Pivot {
  index: number;
  value: number;
}

interface Divergence {
  type: 'BULLISH' | 'BEARISH';
  priceLow: number;
  priceHigh: number;
  rsiLow: number;
  rsiHigh: number;
  timestamp: number;
  pivotIndex: number;
}

@Injectable()
export class RsiDivergenceService {
  constructor(private prisma: PrismaService) {}

  async detectRSIDivergences(
    candles: Candle[],
    rsiPeriod: number = 14,
    leftBars: number = 5,
    rightBars: number = 5,
    minCandlesBetween: number = 5,
    maxCandlesBetween: number = 60,
  ): Promise<{ bullish: Divergence[]; bearish: Divergence[] }> {
    if (!candles || candles.length < rsiPeriod + 20) {
      return { bullish: [], bearish: [] };
    }

    // Calculate RSI values
    const rsiValues = this.calculateRSI(candles, rsiPeriod);
    
    // Extract prices
    const lows = candles.map((c) => Number(c.low));
    const highs = candles.map((c) => Number(c.high));
    const timestamps = candles.map((c) => c.openTime.getTime());

    // Find pivot points
    const pivotLows = this.findPivotLows(rsiValues, leftBars, rightBars);
    const pivotHighs = this.findPivotHighs(rsiValues, leftBars, rightBars);

    const bullishDivergences: Divergence[] = [];
    const bearishDivergences: Divergence[] = [];

    // Detect bullish divergences (price makes lower lows, RSI makes higher lows)
    for (let i = 1; i < pivotLows.length; i++) {
      const prevIndex = pivotLows[i - 1];
      const currIndex = pivotLows[i];
      const distance = currIndex - prevIndex;

      if (distance < minCandlesBetween || distance > maxCandlesBetween) {
        continue;
      }

      const prevPrice = lows[prevIndex];
      const currPrice = lows[currIndex];
      const prevRSI = rsiValues[prevIndex];
      const currRSI = rsiValues[currIndex];

      // Bullish divergence: price makes lower low, RSI makes higher low
      // Price goes down (currPrice < prevPrice), RSI goes up (currRSI > prevRSI)
      if (currPrice < prevPrice && currRSI > prevRSI) {
        bullishDivergences.push({
          type: 'BULLISH',
          priceLow: currPrice, // Lower price (current)
          priceHigh: prevPrice, // Higher price (previous)
          rsiLow: prevRSI, // Lower RSI (previous)
          rsiHigh: currRSI, // Higher RSI (current)
          timestamp: timestamps[currIndex],
          pivotIndex: currIndex,
        });
      }
    }

    // Detect bearish divergences (price makes higher highs, RSI makes lower highs)
    for (let i = 1; i < pivotHighs.length; i++) {
      const prevIndex = pivotHighs[i - 1];
      const currIndex = pivotHighs[i];
      const distance = currIndex - prevIndex;

      if (distance < minCandlesBetween || distance > maxCandlesBetween) {
        continue;
      }

      const prevPrice = highs[prevIndex];
      const currPrice = highs[currIndex];
      const prevRSI = rsiValues[prevIndex];
      const currRSI = rsiValues[currIndex];

      // Bearish divergence: price makes higher high, RSI makes lower high
      // Price goes up (currPrice > prevPrice), RSI goes down (currRSI < prevRSI)
      if (currPrice > prevPrice && currRSI < prevRSI) {
        bearishDivergences.push({
          type: 'BEARISH',
          priceLow: prevPrice, // Lower price (previous)
          priceHigh: currPrice, // Higher price (current)
          rsiLow: currRSI, // Lower RSI (current)
          rsiHigh: prevRSI, // Higher RSI (previous)
          timestamp: timestamps[currIndex],
          pivotIndex: currIndex,
        });
      }
    }

    // Reverse lists to have most recent first
    bullishDivergences.reverse();
    bearishDivergences.reverse();

    return { bullish: bullishDivergences, bearish: bearishDivergences };
  }

  calculateRSI(candles: Candle[], period: number): number[] {
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
      rsiValues[period] = 100 - 100 / (1 + rs);
    }

    // Calculate remaining RSI values using exponential smoothing
    for (let i = period + 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      // Exponential moving average
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      if (avgLoss === 0) {
        rsiValues[i] = 100;
      } else {
        const rs = avgGain / avgLoss;
        rsiValues[i] = 100 - 100 / (1 + rs);
      }
    }

    return rsiValues;
  }

  private findPivotLows(values: number[], leftBars: number, rightBars: number): number[] {
    const pivots: number[] = [];

    for (let i = leftBars; i < values.length - rightBars; i++) {
      const currentValue = values[i];

      if (isNaN(currentValue)) {
        continue;
      }

      // Check left side
      let isPivot = true;
      for (let j = 1; j <= leftBars; j++) {
        if (currentValue >= values[i - j]) {
          isPivot = false;
          break;
        }
      }

      if (!isPivot) {
        continue;
      }

      // Check right side
      for (let j = 1; j <= rightBars; j++) {
        if (currentValue >= values[i + j]) {
          isPivot = false;
          break;
        }
      }

      if (isPivot) {
        pivots.push(i);
      }
    }

    return pivots;
  }

  private findPivotHighs(values: number[], leftBars: number, rightBars: number): number[] {
    const pivots: number[] = [];

    for (let i = leftBars; i < values.length - rightBars; i++) {
      const currentValue = values[i];

      if (isNaN(currentValue)) {
        continue;
      }

      // Check left side
      let isPivot = true;
      for (let j = 1; j <= leftBars; j++) {
        if (currentValue <= values[i - j]) {
          isPivot = false;
          break;
        }
      }

      if (!isPivot) {
        continue;
      }

      // Check right side
      for (let j = 1; j <= rightBars; j++) {
        if (currentValue <= values[i + j]) {
          isPivot = false;
          break;
        }
      }

      if (isPivot) {
        pivots.push(i);
      }
    }

    return pivots;
  }

  async getCandlesForAnalysis(symbol: string, timeframe: string, limit: number = 200) {
    return this.prisma.candle.findMany({
      where: {
        symbol,
        timeframe,
      },
      orderBy: {
        openTime: 'asc',
      },
      take: limit,
    });
  }
}
