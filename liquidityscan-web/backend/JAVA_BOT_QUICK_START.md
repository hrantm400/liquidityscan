# Быстрый старт: Интеграция Java бота

## Что сделано

✅ Создан HTTP endpoint для приема сигналов от Java бота  
✅ Создан сервис интеграции (`JavaBotIntegrationService`)  
✅ Создан скрипт для запуска Java бота с API ключами из `.env`  
✅ Сигналы автоматически сохраняются в базу данных и отправляются через WebSocket

## Как использовать

### 1. Добавьте API ключи в `.env`

Откройте `liquidityscan-web/backend/.env` и добавьте:

```env
# Binance API Keys
BINANCE_API_KEY=ваш_binance_api_key
BINANCE_API_SECRET=ваш_binance_api_secret

# MEXC API Keys
MEXC_API_KEY=ваш_mexc_api_key
MEXC_API_SECRET=ваш_mexc_api_secret
```

### 2. Запустите NestJS backend

```powershell
cd liquidityscan-web/backend
npm run start:dev
```

### 3. Запустите Java бот

```powershell
cd liquidityscan-web/backend
powershell -ExecutionPolicy Bypass -File scripts/start-java-bot.ps1
```

Скрипт автоматически:
- Загрузит API ключи из `.env`
- Создаст `application.properties` с правильными ключами
- Запустит Java бот на порту 8080

### 4. Модифицируйте Java бот (если нужно)

Если у вас есть исходный код Java бота, добавьте отправку сигналов в наш backend:

**Endpoint:** `POST http://localhost:3000/api/integrations/java-bot/signals`

**Формат сигнала:**
```json
{
  "strategyType": "SUPER_ENGULFING",
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "signalType": "BUY",
  "detectedAt": "2026-01-09T12:00:00Z",
  "metadata": {
    "patternType": "RUN+",
    "xLogic": 3
  }
}
```

## Проверка работы

1. **Проверьте статус интеграции:**
   ```
   GET http://localhost:3000/api/integrations/java-bot/status
   ```

2. **Проверьте сигналы в базе данных:**
   - Сигналы автоматически сохраняются в таблицу `Signal`
   - Отображаются во фронтенде через WebSocket

## Важно

- Java бот должен быть модифицирован для отправки сигналов в наш endpoint
- Если модификация невозможна, можно использовать наш собственный код генерации сигналов (уже реализовано)
- API ключи из `.env` используются для подключения к биржам через Java бот

## Альтернатива

Если модификация Java бота невозможна, можно использовать наш собственный код:
- Уже реализованы все 3 стратегии (RSI Divergence, Super Engulfing, ICT Bias)
- Прямое подключение к Binance и MEXC через WebSocket
- Сигналы генерируются по расписанию cron jobs

Подробнее: `JAVA_BOT_INTEGRATION.md`
