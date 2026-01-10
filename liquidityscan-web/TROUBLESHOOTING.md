# Troubleshooting Guide

## Проблема: ERR_CONNECTION_REFUSED

### Симптомы:
- В браузере ошибки: `Failed to load resource: net::ERR_CONNECTION_REFUSED`
- WebSocket не подключается: `WebSocket connection to 'ws://localhost:3000/socket.io/...' failed`
- Фронтенд не может получить данные с бэкенда

### Решение:

1. **Убедитесь, что бэкенд запущен:**
   ```powershell
   cd liquidityscan-web/backend
   npm run start:dev
   ```
   
   Должно появиться сообщение: `Application is running on: http://localhost:3000`

2. **Проверьте, что бэкенд слушает на порту 3000:**
   - Откройте браузер и перейдите на `http://localhost:3000/api/health`
   - Должен вернуться ответ `{"status":"ok"}`

3. **Проверьте переменные окружения:**
   - Убедитесь, что файл `.env` существует в `liquidityscan-web/backend/`
   - Проверьте, что `PORT=3000` (или не указан, тогда используется 3000 по умолчанию)

4. **Перезапустите фронтенд:**
   ```powershell
   cd liquidityscan-web/frontend
   npm run dev
   ```

5. **Проверьте прокси в vite.config.ts:**
   - Убедитесь, что прокси настроен правильно:
   ```typescript
   proxy: {
     '/api': {
       target: 'http://localhost:3000',
       changeOrigin: true,
       secure: false,
     },
     '/socket.io': {
       target: 'http://localhost:3000',
       changeOrigin: true,
       secure: false,
       ws: true,
     },
   }
   ```

## Проблема: WebSocket постоянно переподключается к биржам

### Симптомы:
- В логах бэкенда постоянно появляются сообщения: `WebSocket closed, reconnecting...`
- Подписки на символы постоянно переподключаются

### Причины:
1. **Rate limiting от биржи** - слишком много подписок одновременно
2. **Проблемы с сетью** - нестабильное интернет-соединение
3. **Превышение лимита подписок** - Binance/MEXC имеют лимиты на количество одновременных подписок

### Решение:
1. **Уменьшите количество символов** в `ANALYZE_SYMBOLS` в `.env`
2. **Увеличьте задержку между подписками** в `market-analyzer.service.ts`
3. **Проверьте интернет-соединение**

## Проблема: Сигналы не отображаются на фронтенде

### Симптомы:
- Страницы пустые, нет сигналов
- В консоли браузера нет ошибок, но данные не приходят

### Решение:

1. **Проверьте логи бэкенда:**
   - Должны быть сообщения: `"Generating signals for SYMBOL TIMEFRAME"`
   - Должны быть сообщения: `"Signal created: ..."`
   - Должны быть сообщения: `"GET /signals - returning X signals"`

2. **Проверьте базу данных:**
   ```sql
   SELECT COUNT(*) FROM signals;
   SELECT * FROM signals ORDER BY detected_at DESC LIMIT 10;
   ```

3. **Проверьте фильтры на страницах:**
   - Убедитесь, что фильтры не скрывают все сигналы
   - Попробуйте сбросить все фильтры

4. **Проверьте WebSocket подключение:**
   - В консоли браузера должно быть: `"WebSocket connected"`
   - Должны приходить сообщения: `"New signal received via WebSocket"`

## Проблема: Бэкенд не запускается

### Симптомы:
- Ошибки при запуске `npm run start:dev`
- Ошибки подключения к базе данных
- Ошибки подключения к Redis

### Решение:

1. **Проверьте базу данных:**
   ```powershell
   # Убедитесь, что PostgreSQL запущен
   # Проверьте подключение в .env:
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   ```

2. **Проверьте Redis:**
   ```powershell
   # Убедитесь, что Redis запущен
   # Проверьте подключение в .env:
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

3. **Выполните миграции:**
   ```powershell
   cd liquidityscan-web/backend
   npx prisma migrate dev
   ```

4. **Проверьте зависимости:**
   ```powershell
   npm install
   ```

## Быстрая проверка работоспособности

1. **Запустите бэкенд:**
   ```powershell
   cd liquidityscan-web/backend
   npm run start:dev
   ```

2. **В другом терминале запустите фронтенд:**
   ```powershell
   cd liquidityscan-web/frontend
   npm run dev
   ```

3. **Проверьте health endpoint:**
   - Откройте `http://localhost:3000/api/health` в браузере
   - Должен вернуться `{"status":"ok"}`

4. **Проверьте API сигналов:**
   - Откройте `http://localhost:3000/api/signals?strategyType=SUPER_ENGULFING&limit=10`
   - Должен вернуться массив сигналов (может быть пустым, если сигналов еще нет)

5. **Откройте фронтенд:**
   - Откройте `http://localhost:5173` в браузере
   - Проверьте консоль браузера (F12) на наличие ошибок
