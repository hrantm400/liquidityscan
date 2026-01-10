# Добавление 120 монет для анализа

## 📋 Инструкция:

### Шаг 1: Откройте файл `.env` в папке `liquidityscan-web/backend/`

### Шаг 2: Добавьте или обновите строку:

```env
ANALYZE_SYMBOLS=BTCUSDT,ETHUSDT,BNBUSDT,SOLUSDT,XRPUSDT,ADAUSDT,DOGEUSDT,MATICUSDT,AVAXUSDT,DOTUSDT,SHIBUSDT,LINKUSDT,UNIUSDT,ATOMUSDT,ETCUSDT,LTCUSDT,XLMUSDT,ALGOUSDT,VETUSDT,ICPUSDT,FILUSDT,TRXUSDT,EOSUSDT,AAVEUSDT,MKRUSDT,SNXUSDT,COMPUSDT,YFIUSDT,SUSHIUSDT,CRVUSDT,1INCHUSDT,DYDXUSDT,ARBUSDT,OPUSDT,APTUSDT,SUIUSDT,SEIUSDT,TIAUSDT,INJUSDT,NEARUSDT,FTMUSDT,AXSUSDT,SANDUSDT,MANAUSDT,GALAUSDT,IMXUSDT,PIXELUSDT,PEPEUSDT,FLOKIUSDT,BONKUSDT,FETUSDT,AGIXUSDT,OCEANUSDT,RNDRUSDT,AIUSDT,XAIUSDT,ORDIUSDT,1000SATSUSDT,WLDUSDT,JTOUSDT,PYTHUSDT,BLURUSDT,ACEUSDT,NFPUSDT,MANTAUSDT,ALTUSDT,PORTALUSDT,PUNDIXUSDT,METISUSDT,AEVOUSDT,BOMEUSDT,ENAUSDT,WUSDT,TNSRUSDT,SAGAUSDT,REZUSDT,BBUSDT,NOTUSDT,IOUSDT,ZROUSDT,LISTAUSDT,TAOUSDT,OMNIUSDT,ZKUSDT,BCHUSDT,XMRUSDT,ZECUSDT,DASHUSDT,WAVESUSDT,ZILUSDT,BATUSDT,ENJUSDT,CHZUSDT,HBARUSDT,EGLDUSDT,THETAUSDT,GRTUSDT,RENUSDT,KSMUSDT,CAKEUSDT,BAKEUSDT,ALPACAUSDT,ALPHAUSDT,BELUSDT,BIFIUSDT,BURGERUSDT,DODOUSDT,FRONTUSDT,FUNUSDT,GFTUSDT,GMTUSDT,GTOUSDT,HARDUSDT,HOTUSDT,IDUSDT,ILVUSDT,JASMYUSDT,KLAYUSDT,KMDUSDT,KNCUSDT,LINAUSDT,LITUSDT,LRCUSDT,MAGICUSDT,MASKUSDT,MDTUSDT,MINAUSDT,MTLUSDT,NEOUSDT,NKNUSDT,OGNUSDT,OMGUSDT,ONTUSDT,ORNUSDT,OXTUSDT,PENDLEUSDT
```

### Шаг 3: Сохраните файл

### Шаг 4: Перезапустите Backend

```bash
# Остановите текущий процесс (Ctrl+C)
# Затем запустите снова:
cd liquidityscan-web/backend
npm run start:dev
```

## ✅ Что произойдет:

После перезапуска вы увидите в логах:

```
[MarketAnalyzerService] Using 120 symbols from ANALYZE_SYMBOLS config
[MarketAnalyzerService] Subscribing to 60 symbols on Binance and 60 symbols on MEXC (480 total subscriptions)
```

**480 подписок** = 120 монет × 4 таймфрейма (1h, 4h, 1d, 1w)

## 📊 Список монет (120 штук):

1. **Топ 10:** BTC, ETH, BNB, SOL, XRP, ADA, DOGE, MATIC, AVAX, DOT
2. **Топ 20:** SHIB, LINK, UNI, ATOM, ETC, LTC, XLM, ALGO, VET, ICP
3. **Топ 30:** FIL, TRX, EOS, AAVE, MKR, SNX, COMP, YFI, SUSHI, CRV
4. **DeFi:** 1INCH, DYDX, ARB, OP, APT, SUI, SEI, TIA, INJ, NEAR
5. **Gaming/NFT:** FTM, AXS, SAND, MANA, GALA, IMX, PIXEL
6. **Meme:** PEPE, FLOKI, BONK
7. **AI:** FET, AGIX, OCEAN, RNDR, AI, XAI
8. **Новые:** ORDI, 1000SATS, WLD, JTO, PYTH, BLUR, ACE, NFP, MANTA, ALT, PORTAL, PUNDIX, METIS, AEVO, BOME, ENA, W, TNSR, SAGA, REZ, BB, NOT, IO, ZRO, LISTA, TAO, OMNI, ZK
9. **Privacy:** BCH, XMR, ZEC, DASH
10. **Другие популярные:** WAVES, ZIL, BAT, ENJ, CHZ, HBAR, EGLD, THETA, GRT, REN, KSM, CAKE, BAKE, ALPACA, ALPHA, BEL, BIFI, BURGER, DODO, FRONT, FUN, GFT, GMT, GTO, HARD, HOT, ID, ILV, JASMY, KLAY, KMD, KNC, LINA, LIT, LRC, MAGIC, MASK, MDT, MINA, MTL, NEO, NKN, OGN, OMG, ONT, ORN, OXT, PENDLE

## ⚠️ Важно:

- **120 монет** = **480 WebSocket подписок** (120 × 4 таймфрейма)
- Это может создать большую нагрузку на систему
- Рекомендуется мониторить использование ресурсов
- Если система перегружена, уменьшите количество монет

## 🔍 Проверка:

После запуска проверьте логи:
- Должны быть успешные подписки на Binance и MEXC
- Не должно быть много ошибок подключения
- Сигналы должны генерироваться для разных монет

## 📝 Файл с готовым списком:

Готовый список также сохранен в файле `120_COINS_ENV.txt` - просто скопируйте оттуда строку в ваш `.env` файл.
