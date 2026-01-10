# Тестирование генерации сигналов

## Проблема
Сигналы не генерируются автоматически или генерируются редко.

## Решение

### 1. Ручной запуск анализа

Используйте новые endpoints для ручного запуска анализа:

#### Анализ конкретного таймфрейма
```bash
POST http://localhost:3000/api/market-analyzer/analyze?timeframe=1h
POST http://localhost:3000/api/market-analyzer/analyze?timeframe=4h
POST http://localhost:3000/api/market-analyzer/analyze?timeframe=1d
POST http://localhost:3000/api/market-analyzer/analyze?timeframe=1w
```

#### Анализ всех таймфреймов
```bash
POST http://localhost:3000/api/market-analyzer/analyze-all
```

#### Проверка статуса cron jobs
```bash
GET http://localhost:3000/api/market-analyzer/status
```

### 2. Проверка расписания cron jobs

Cron jobs работают по следующему расписанию (UTC):

- **1h**: Каждый час в :00:30 (например, 12:00:30, 13:00:30)
- **4h**: В 00:00:30, 04:00:30, 08:00:30, 12:00:30, 16:00:30, 20:00:30
- **1d**: Каждый день в 04:00:30
- **1w**: Каждый понедельник в 04:00:30

**Ваше время (UTC-4):**
- **1h**: Каждый час в :00:30 (например, 08:00:30, 09:00:30)
- **4h**: В 20:00:30, 00:00:30, 04:00:30, 08:00:30, 12:00:30, 16:00:30
- **1d**: Каждый день в 00:00:30 (полночь)
- **1w**: Каждый понедельник в 00:00:30 (полночь)

### 3. Проверка наличия данных

Сигналы генерируются только если:
1. ✅ Есть достаточно свечей в базе данных (минимум 50-200)
2. ✅ WebSocket подключения работают
3. ✅ Символы подписаны на WebSocket потоки

**Проверка свечей:**
```bash
GET http://localhost:3000/api/signals/candles?symbol=BTCUSDT&timeframe=1h&limit=200
```

**Проверка сигналов:**
```bash
GET http://localhost:3000/api/signals?strategyType=SUPER_ENGULFING&limit=10
```

### 4. Отладка

#### Проверка логов
Смотрите логи backend сервера на наличие:
- `Starting {timeframe} market analysis`
- `Signal created: {id}`
- `Signal emitted via WebSocket`

#### Проверка WebSocket
Сигналы должны автоматически отправляться через WebSocket после создания.

#### Ручная генерация сигнала
```bash
POST http://localhost:3000/api/signals/generate
Content-Type: application/json

{
  "symbol": "BTCUSDT",
  "timeframe": "1h"
}
```

### 5. Частые проблемы

#### Проблема: Нет свечей в базе данных
**Решение:** Дождитесь, пока WebSocket потоки загрузят данные (обычно 1-2 минуты после запуска)

#### Проблема: Cron jobs не запускаются
**Решение:** 
- Проверьте, что `ScheduleModule.forRoot()` импортирован в `AppModule`
- Проверьте логи на наличие ошибок при запуске cron jobs
- Используйте ручной запуск через API

#### Проблема: Сигналы не появляются во фронтенде
**Решение:**
- Проверьте WebSocket подключение
- Проверьте, что сигналы действительно создаются в БД
- Проверьте логи на наличие `Signal emitted via WebSocket`

### 6. Тестирование прямо сейчас

1. **Запустите анализ для 1h:**
   ```bash
   curl -X POST "http://localhost:3000/api/market-analyzer/analyze?timeframe=1h"
   ```

2. **Проверьте созданные сигналы:**
   ```bash
   curl "http://localhost:3000/api/signals?limit=10"
   ```

3. **Если сигналов нет, проверьте свечи:**
   ```bash
   curl "http://localhost:3000/api/signals/candles?symbol=BTCUSDT&timeframe=1h&limit=50"
   ```

4. **Если свечей мало, подождите 1-2 минуты** и повторите шаг 1

### 7. Автоматический тест

Создайте скрипт для автоматического тестирования:

```powershell
# test-signals.ps1
$baseUrl = "http://localhost:3000"

Write-Host "Testing signal generation..." -ForegroundColor Cyan

# 1. Check status
Write-Host "`n1. Checking cron job status..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$baseUrl/api/market-analyzer/status" -Method Get

# 2. Run analysis for 1h
Write-Host "`n2. Running analysis for 1h..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$baseUrl/api/market-analyzer/analyze?timeframe=1h" -Method Post

# 3. Wait a bit
Start-Sleep -Seconds 5

# 4. Check signals
Write-Host "`n3. Checking generated signals..." -ForegroundColor Yellow
$signals = Invoke-RestMethod -Uri "$baseUrl/api/signals?limit=10" -Method Get
Write-Host "Found $($signals.Count) signals" -ForegroundColor Green

# 5. Check candles
Write-Host "`n4. Checking candles..." -ForegroundColor Yellow
$candles = Invoke-RestMethod -Uri "$baseUrl/api/signals/candles?symbol=BTCUSDT&timeframe=1h&limit=50" -Method Get
Write-Host "Found $($candles.Count) candles for BTCUSDT 1h" -ForegroundColor Green
```

Запустите:
```powershell
powershell -ExecutionPolicy Bypass -File test-signals.ps1
```
