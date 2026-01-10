# Очистка всех сигналов из базы данных

После обновления логики генерации сигналов (RUN/REV паттерны, правильные таймфреймы) необходимо очистить старые сигналы.

## Способ 1: Через API (рекомендуется)

1. Убедитесь, что бэкенд запущен:
   ```bash
   cd liquidityscan-web/backend
   npm run start:dev
   ```

2. Вызовите API endpoint:
   ```bash
   # PowerShell
   Invoke-WebRequest -Uri "http://localhost:3000/api/signals/all" -Method DELETE
   
   # или через браузер/Postman
   DELETE http://localhost:3000/api/signals/all
   ```

## Способ 2: Через SQL напрямую

Если у вас есть доступ к базе данных:

```sql
DELETE FROM signals;
```

## Способ 3: Через скрипт (требует правильной конфигурации DATABASE_URL)

```bash
cd liquidityscan-web/backend
npm run clear:signals
```

**Примечание:** После очистки сигналов новые сигналы будут генерироваться автоматически с правильной логикой (RUN/REV паттерны, правильные таймфреймы).
