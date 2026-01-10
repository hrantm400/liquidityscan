# Signal Logic Testing Guide

This document describes how to verify that the signal detection logic is working correctly according to the PineScript specifications.

## Changes Implemented

### 1. SuperEngulfing Pattern Detection

**Patterns Implemented:**
- **RUN** (Continuation): Same color candles with liquidity grab
  - Bullish RUN: `prevBull AND currBull AND low < low[1] AND close > close[1]`
  - Bearish RUN: `prevBear AND currBear AND high > high[1] AND close < close[1]`
  
- **REV** (Reversal): Color change with sweep
  - Bullish REV: `prevBear AND currBull AND low < low[1] AND close > open[1]`
  - Bearish REV: `prevBull AND currBear AND high > high[1] AND close < open[1]`
  
- **PLUS (+) Modifier**: Close beyond previous candle's extreme
  - RUN+: RUN pattern + `close > high[1]` (bull) or `close < low[1]` (bear)
  - REV+: REV pattern + `close > high[1]` (bull) or `close < low[1]` (bear)

- **x Logic**: Counts how many previous same-color candles the current candle closes beyond
  - Minimum: x2 (as specified by user)
  - Stored in metadata as `xLogic` and displayed as "RUN x3", "REV+ x5", etc.

**Timeframes:** 4h, 1d, 1w

### 2. ICT Bias Detection

**Logic:**
```
if prev_close < prev_prev_low → Bearish
if prev_close > prev_prev_high → Bullish
else → Ranging (not signaled)
```

**Timeframes:** 4h, 1d, 1w (high timeframes only)

### 3. RSI Divergence Detection

**Already correct** - No changes needed.

**Filters:**
- Bullish: Start pivot RSI < 30 (oversold)
- Bearish: Start pivot RSI > 70 (overbought)

**Timeframes:** 1h, 4h, 1d

### 4. Scheduler Timing

| Timeframe | Schedule | Cron Expression |
|-----------|----------|-----------------|
| 1h | Every hour at :00:30 | `30 * * * *` |
| 4h | Every 4h at :00:30 (00:00, 04:00, 08:00, 12:00, 16:00, 20:00) | `30 0,4,8,12,16,20 * * *` |
| 1d | Daily at 04:00:30 UTC | `30 4 * * *` |
| 1w | Monday at 04:00:30 UTC | `30 4 * * 1` |

**30-second delay:** All cron jobs run 30 seconds after candle close to allow exchanges to update data.

## Testing Checklist

### Manual Testing

1. **SuperEngulfing Patterns**
   - [ ] Navigate to SuperEngulfing monitor page
   - [ ] Verify signals show pattern type: RUN, REV, RUN+, or REV+
   - [ ] Check metadata includes `xLogic` value (e.g., "x3", "x5")
   - [ ] Confirm signals only appear on 4h, 1d, 1w timeframes
   - [ ] Verify RUN patterns have same-color consecutive candles
   - [ ] Verify REV patterns have color change (red→green or green→red)
   - [ ] Check PLUS (+) patterns have close beyond previous candle's high/low

2. **ICT Bias**
   - [ ] Navigate to ICT Bias monitor page
   - [ ] Verify signals only appear on 4h, 1d, 1w timeframes
   - [ ] Check no "Ranging" bias signals (should be filtered out)
   - [ ] Confirm Bullish bias: `prev_close > prev_prev_high`
   - [ ] Confirm Bearish bias: `prev_close < prev_prev_low`

3. **RSI Divergence**
   - [ ] Navigate to RSI Divergence monitor page
   - [ ] Verify signals only appear on 1h, 4h, 1d timeframes
   - [ ] Check Bullish divergences start with RSI < 30
   - [ ] Check Bearish divergences start with RSI > 70

4. **Scheduler Timing**
   - [ ] Check backend logs at :00:30 of each hour (1h analysis)
   - [ ] Check backend logs at 00:00:30, 04:00:30, 08:00:30, etc. (4h analysis)
   - [ ] Check backend logs at 04:00:30 daily (1d analysis)
   - [ ] Check backend logs at 04:00:30 on Monday (1w analysis)
   - [ ] Verify 30-second delay: logs should show "(30s after candle close)"

### API Testing

```bash
# Test signal generation for a specific symbol/timeframe
curl http://localhost:3000/api/signals?symbol=BTCUSDT&timeframe=4h

# Check recent SuperEngulfing signals
curl http://localhost:3000/api/signals?strategyType=SUPER_ENGULFING&limit=10

# Check signal metadata includes xLogic
curl http://localhost:3000/api/signals/SIGNAL_ID
```

### Database Queries

```sql
-- Check SuperEngulfing signals with metadata
SELECT 
  symbol, 
  timeframe, 
  signal_type as "signalType",
  metadata->>'pattern' as pattern,
  metadata->>'patternDisplay' as "patternDisplay",
  metadata->>'xLogic' as "xLogic",
  detected_at as "detectedAt"
FROM signals
WHERE strategy_type = 'SUPER_ENGULFING'
ORDER BY detected_at DESC
LIMIT 20;

-- Verify ICT Bias only on high timeframes
SELECT 
  symbol, 
  timeframe, 
  COUNT(*) as count
FROM signals
WHERE strategy_type = 'ICT_BIAS'
GROUP BY symbol, timeframe
ORDER BY timeframe;
-- Should only show 4h, 1d, 1w

-- Verify RSI Divergence timeframes
SELECT 
  symbol, 
  timeframe, 
  COUNT(*) as count
FROM signals
WHERE strategy_type = 'RSI_DIVERGENCE'
GROUP BY symbol, timeframe
ORDER BY timeframe;
-- Should only show 1h, 4h, 1d
```

### Expected Results

1. **SuperEngulfing signals should include:**
   - `metadata.pattern`: "RUN", "REV", "RUN_PLUS", or "REV_PLUS"
   - `metadata.patternType`: "CONTINUATION" or "REVERSAL"
   - `metadata.patternDisplay`: "RUN x3", "REV+ x5", etc.
   - `metadata.xLogic`: number (2, 3, 4, 5, etc.) or null
   - Only on 4h, 1d, 1w timeframes

2. **ICT Bias signals should:**
   - Only appear on 4h, 1d, 1w timeframes
   - Never show "Ranging" bias
   - Include `metadata.bias`: "BULLISH" or "BEARISH"

3. **RSI Divergence signals should:**
   - Only appear on 1h, 4h, 1d timeframes
   - Bullish signals: `metadata.rsiLow < 30`
   - Bearish signals: `metadata.rsiHigh > 70`

4. **Cron jobs should:**
   - Fire at :00:30 of scheduled times
   - Show "(30s after candle close)" in logs
   - Not fire at :00:00 (old behavior)

## Troubleshooting

### No signals generated
- Check if there are enough candles in the database (minimum 10 for SuperEngulfing, 50 for RSI)
- Verify WebSocket connections are active
- Check if patterns actually exist in the current market conditions

### Wrong timeframes
- Verify `strategyTimeframes` configuration in `market-analyzer.service.ts`
- Check that conditional checks in `signals.service.ts` match the correct timeframes

### Missing xLogic
- Ensure `calculateXLogic()` is being called in `signals.service.ts`
- Check that there are at least 10 candles available for analysis
- Verify the candle array is in chronological order (oldest first)

### Cron jobs not firing
- Check NestJS scheduler is enabled in app.module
- Verify system timezone is set correctly
- Check backend logs for cron execution messages

## Next Steps

After verifying all tests pass:
1. Monitor signals in production for 24-48 hours
2. Compare with Java bot output (if available)
3. Validate x logic calculations match expectations
4. Confirm cron timing aligns with candle closes
