# Configuration of Analyzed Symbols

## Overview

The system analyzes **300+ cryptocurrency trading pairs** to generate trading signals using three strategies:
- **RSI Divergence**
- **Super Engulfing**
- **ICT Daily Bias**

The system supports **both Binance and MEXC exchanges**, automatically splitting symbols between them for optimal performance.

## How Symbols are Selected

The system uses symbols in the following priority order:

### 1. Environment Variable (Highest Priority)

Set the `ANALYZE_SYMBOLS` environment variable in your `.env` file:

```env
ANALYZE_SYMBOLS=BTCUSDT,ETHUSDT,SOLUSDT,ADAUSDT,XRPUSDT,...
```

This allows you to specify exactly which symbols to analyze. Symbols should be comma-separated and will be automatically converted to uppercase.

**Symbols are automatically split between Binance and MEXC:**
- First half → Binance
- Second half → MEXC

### 2. Database Symbols

If `ANALYZE_SYMBOLS` is not set, the system will:
- Query the `candle` table for all unique symbols
- Use up to **300 symbols** found in the database
- This ensures you only analyze symbols for which you have historical data

### 3. Popular Symbols (Default Fallback)

If no symbols are found in the database, the system uses a predefined list of **300+ popular trading pairs**:

**Major Cryptocurrencies:**
- BTCUSDT, ETHUSDT, BNBUSDT

**Large Cap Altcoins:**
- SOLUSDT, XRPUSDT, ADAUSDT, DOGEUSDT, DOTUSDT, AVAXUSDT, SHIBUSDT, MATICUSDT, LINKUSDT, UNIUSDT, ATOMUSDT, ETCUSDT, LTCUSDT, XLMUSDT, ALGOUSDT, VETUSDT, ICPUSDT, FILUSDT, TRXUSDT, EOSUSDT

**DeFi Tokens:**
- AAVEUSDT, MKRUSDT, SNXUSDT, COMPUSDT, YFIUSDT, SUSHIUSDT, CRVUSDT, 1INCHUSDT, DYDXUSDT

**Layer 1 & Layer 2:**
- ARBUSDT, OPUSDT, APTUSDT, SUIUSDT, SEIUSDT, TIAUSDT, INJUSDT, NEARUSDT, FTMUSDT

**Gaming & Metaverse:**
- AXSUSDT, SANDUSDT, MANAUSDT, GALAUSDT, IMXUSDT, PIXELUSDT

**AI & Meme Coins:**
- PEPEUSDT, FLOKIUSDT, BONKUSDT, FETUSDT, AGIXUSDT, OCEANUSDT, RNDRUSDT, AIUSDT, XAIUSDT

**Other Popular:**
- ORDIUSDT, 1000SATSUSDT, WLDUSDT, JTOUSDT, PYTHUSDT, BLURUSDT, ACEUSDT, NFPUSDT, MANTAUSDT, ALTUSDT, PORTALUSDT, PUNDIXUSDT, METISUSDT, AEVOUSDT, BOMEUSDT, ENAUSDT, WUSDT, TNSRUSDT, SAGAUSDT, REZUSDT, BBUSDT, NOTUSDT, IOUSDT, ZROUSDT, LISTAUSDT, TAOUSDT, OMNIUSDT, ZKUSDT

**Total: 300+ popular symbols**

The symbols are automatically split between exchanges:
- **Binance**: First ~150 symbols
- **MEXC**: Remaining ~150+ symbols

## WebSocket Subscriptions

When the backend starts, it automatically subscribes to **both Binance and MEXC WebSocket streams** for:
- All configured symbols (split between exchanges)
- All timeframes: `5m`, `15m`, `1h`, `4h`, `1d`, `1w`

This ensures real-time candle data is continuously received from both exchanges and stored in the database.

### Exchange Configuration

Make sure your `.env` file has the necessary API keys configured:

```env
# Binance (optional, for authenticated endpoints)
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret

# MEXC (optional, for authenticated endpoints)
MEXC_API_KEY=your_mexc_api_key
MEXC_API_SECRET=your_mexc_api_secret
```

**Note:** WebSocket streams for market data (klines) don't require API keys, but they may be needed for other features.

## Analysis Schedule

The system analyzes markets every 5 minutes using a cron job:
- Checks all configured symbols
- Analyzes all timeframes: `5m`, `15m`, `1h`, `4h`, `1d`, `1w`
- Generates signals for each strategy (RSI, Super Engulfing, Bias)

## Customization

### Adding More Symbols

1. **Via Environment Variable** (Recommended):
   ```env
   ANALYZE_SYMBOLS=BTCUSDT,ETHUSDT,YOUR_SYMBOL1USDT,YOUR_SYMBOL2USDT
   ```

2. **Via Code** (Edit `src/config/symbols.config.ts`):
   Add symbols to the `POPULAR_SYMBOLS` array

### Limiting Symbols

To reduce load, you can:
- Set `ANALYZE_SYMBOLS` with fewer symbols
- The system supports up to 300+ symbols by default
- Symbols are automatically distributed between Binance and MEXC for optimal performance

## Notes

- All symbols must be in the format `SYMBOLUSDT` (e.g., `BTCUSDT`)
- Symbols are automatically converted to uppercase
- The system only analyzes symbols for which it has candle data
- WebSocket subscriptions are established on backend startup
- Historical data is fetched from the database, not from external APIs
