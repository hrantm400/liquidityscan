# Java Bot Integration Guide

## Обзор

Эта интеграция позволяет использовать Java Trading Bot (`tradingBot.jar`) как источник данных для нашего NestJS backend. Java бот будет отправлять сигналы напрямую в наш backend через HTTP API.

## Архитектура

```
Java Trading Bot (tradingBot.jar)
    ↓ (HTTP POST)
NestJS Backend (/api/integrations/java-bot/signals)
    ↓
Database (Prisma)
    ↓
WebSocket → Frontend
```

## Настройка

### 1. Добавьте API ключи в `.env`

Добавьте в `liquidityscan-web/backend/.env`:

```env
# Binance API Keys (для Java бота)
BINANCE_API_KEY=your_binance_api_key_here
BINANCE_API_SECRET=your_binance_api_secret_here

# MEXC API Keys (для Java бота)
MEXC_API_KEY=your_mexc_api_key_here
MEXC_API_SECRET=your_mexc_api_secret_here

# Java Bot Configuration (опционально)
JAVA_BOT_URL=http://localhost
JAVA_BOT_PORT=8080
```

### 2. Запуск Java бота

Используйте PowerShell скрипт для запуска:

```powershell
cd liquidityscan-web/backend
powershell -ExecutionPolicy Bypass -File scripts/start-java-bot.ps1
```

Скрипт автоматически:
- Проверяет наличие Java
- Загружает API ключи из `.env`
- Создает `application.properties` с правильными ключами
- Запускает Java бот на порту 8080

### 3. Модификация Java бота (если нужно)

Если у вас есть исходный код Java бота, добавьте отправку сигналов в наш backend:

```java
// Пример кода для отправки сигнала в NestJS backend
private void sendSignalToBackend(Signal signal) {
    try {
        String backendUrl = "http://localhost:3000/api/integrations/java-bot/signals";
        
        RestTemplate restTemplate = new RestTemplate();
        
        Map<String, Object> payload = new HashMap<>();
        payload.put("strategyType", signal.getStrategyType());
        payload.put("symbol", signal.getSymbol());
        payload.put("timeframe", signal.getTimeframe());
        payload.put("signalType", signal.getSignalType());
        payload.put("detectedAt", signal.getDetectedAt());
        payload.put("metadata", signal.getMetadata());
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
        
        ResponseEntity<String> response = restTemplate.postForEntity(
            backendUrl, 
            request, 
            String.class
        );
        
        if (response.getStatusCode().is2xxSuccessful()) {
            logger.info("Signal sent to backend successfully");
        }
    } catch (Exception e) {
        logger.error("Error sending signal to backend: " + e.getMessage());
    }
}
```

## API Endpoints

### POST `/api/integrations/java-bot/signals`

Принимает сигнал от Java бота.

**Request Body:**
```json
{
  "strategyType": "SUPER_ENGULFING",
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "signalType": "BUY",
  "detectedAt": "2026-01-09T12:00:00Z",
  "metadata": {
    "patternType": "RUN+",
    "xLogic": 3,
    "bias": "BULLISH"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signal received and processed"
}
```

### GET `/api/integrations/java-bot/status`

Проверяет статус интеграции с Java ботом.

**Response:**
```json
{
  "isRunning": true,
  "url": "http://localhost:8080",
  "integrationEnabled": true
}
```

## Формат сигналов

Java бот должен отправлять сигналы в следующем формате:

### Super Engulfing
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

### RSI Divergence
```json
{
  "strategyType": "RSI_DIVERGENCE",
  "symbol": "ETHUSDT",
  "timeframe": "4h",
  "signalType": "SELL",
  "detectedAt": "2026-01-09T12:00:00Z",
  "metadata": {
    "divergenceType": "Regular",
    "rsiValue": 72.5
  }
}
```

### ICT Bias
```json
{
  "strategyType": "ICT_BIAS",
  "symbol": "SOLUSDT",
  "timeframe": "1d",
  "signalType": "BUY",
  "detectedAt": "2026-01-09T12:00:00Z",
  "metadata": {
    "bias": "BULLISH"
  }
}
```

## Преимущества интеграции

1. **Использование проверенной логики** - Java бот уже работает и генерирует правильные сигналы
2. **Единая база данных** - Все сигналы хранятся в одной базе данных
3. **Единый фронтенд** - Все сигналы отображаются в одном интерфейсе
4. **WebSocket в реальном времени** - Сигналы сразу появляются во фронтенде
5. **API ключи из .env** - Безопасное хранение ключей

## Troubleshooting

### Java бот не запускается
- Проверьте, что Java 17+ установлена: `java -version`
- Убедитесь, что `tradingBot.jar` существует в корне проекта
- Проверьте, что порт 8080 свободен

### Сигналы не приходят
- Проверьте, что NestJS backend запущен на порту 3000
- Проверьте логи Java бота на наличие ошибок
- Убедитесь, что Java бот модифицирован для отправки сигналов в наш endpoint

### API ключи не работают
- Проверьте, что ключи правильно добавлены в `.env`
- Убедитесь, что скрипт `start-java-bot.ps1` правильно загружает переменные окружения
- Проверьте файл `application.properties` в корне проекта

## Альтернативный подход

Если модификация Java бота невозможна, можно:

1. Использовать наш собственный код генерации сигналов (уже реализовано)
2. Использовать те же API ключи для прямого подключения к биржам через NestJS
3. Запустить оба сервиса параллельно и объединить сигналы

Текущая реализация уже использует прямые подключения к Binance и MEXC через WebSocket, поэтому Java бот не обязателен, но может быть полезен как дополнительный источник данных.
