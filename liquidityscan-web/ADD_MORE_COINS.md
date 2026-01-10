# Как добавить больше монет для анализа

## Текущая ситуация:

Сейчас система проверяет **3 монеты**:
- BNBUSDT
- BTCUSDT  
- ETHUSDT

Эти символы берутся из базы данных (таблица `candles`).

## Способы добавить больше монет:

### Способ 1: Через переменную окружения (РЕКОМЕНДУЕТСЯ)

Добавьте в файл `liquidityscan-web/backend/.env`:

```env
ANALYZE_SYMBOLS=BTCUSDT,ETHUSDT,BNBUSDT,SOLUSDT,XRPUSDT,ADAUSDT,DOGEUSDT,MATICUSDT,LINKUSDT,UNIUSDT
```

**Преимущества:**
- Быстро и легко
- Не требует изменений в коде
- Можно легко менять список

**После добавления:**
1. Перезапустите backend
2. Система автоматически начнет подписываться на новые символы
3. Анализ будет выполняться каждые 5 минут

### Способ 2: Через базу данных

Система автоматически подхватывает символы из таблицы `candles`. Если вы хотите добавить больше монет:

1. **Добавьте данные свечей в базу** (через API или скрипт)
2. Система автоматически найдет новые символы

### Пример популярных монет для добавления:

```env
# Топ 20 монет
ANALYZE_SYMBOLS=BTCUSDT,ETHUSDT,BNBUSDT,SOLUSDT,XRPUSDT,ADAUSDT,DOGEUSDT,MATICUSDT,LINKUSDT,UNIUSDT,ATOMUSDT,ETCUSDT,LTCUSDT,XLMUSDT,ALGOUSDT,VETUSDT,ICPUSDT,FILUSDT,TRXUSDT,EOSUSDT

# Топ 50 монет
ANALYZE_SYMBOLS=BTCUSDT,ETHUSDT,BNBUSDT,SOLUSDT,XRPUSDT,ADAUSDT,DOGEUSDT,MATICUSDT,LINKUSDT,UNIUSDT,ATOMUSDT,ETCUSDT,LTCUSDT,XLMUSDT,ALGOUSDT,VETUSDT,ICPUSDT,FILUSDT,TRXUSDT,EOSUSDT,AAVEUSDT,MKRUSDT,SNXUSDT,COMPUSDT,YFIUSDT,SUSHIUSDT,CRVUSDT,1INCHUSDT,DYDXUSDT,ARBUSDT,OPUSDT,APTUSDT,SUIUSDT,SEIUSDT,TIAUSDT,INJUSDT,NEARUSDT,FTMUSDT,AXSUSDT,SANDUSDT,MANAUSDT,GALAUSDT,IMXUSDT,PIXELUSDT,PEPEUSDT,FLOKIUSDT,BONKUSDT,FETUSDT,AGIXUSDT
```

## Проверка работы:

После добавления символов в `.env` и перезапуска backend, в логах вы увидите:

```
[MarketAnalyzerService] Using X symbols from ANALYZE_SYMBOLS config
[MarketAnalyzerService] Subscribing to X symbols on Binance and Y symbols on MEXC (Z total subscriptions)
```

## Важно:

- **Не добавляйте слишком много монет сразу** - это может перегрузить систему
- Рекомендуется начать с **10-20 монет**
- Каждая монета требует подписки на 4 таймфрейма (1h, 4h, 1d, 1w)
- Для 10 монет = 40 WebSocket подписок
- Для 50 монет = 200 WebSocket подписок

## Текущий статус:

✅ Система работает нормально
✅ Проверяет 3 монеты: BNBUSDT, BTCUSDT, ETHUSDT
✅ WebSocket подключения стабильны
✅ Сигналы генерируются корректно
✅ MEXC WebSocket автоматически переподключается (это нормально)
