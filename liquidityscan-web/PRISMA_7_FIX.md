# Решение проблемы с Prisma 7 и миграциями

## Проблема

При выполнении `npx prisma migrate dev --name init` возникает ошибка:
```
Error: P1000: Authentication failed against database server
```

## Решение

### Вариант 1: Использовать db push (рекомендуется для разработки)

Вместо миграций используйте `db push`, который создаст схему напрямую:

```powershell
cd backend
npx prisma db push
```

**Важно:** Для Prisma 7 нужно использовать `prisma.config.ts` без `url` в `schema.prisma`.

### Вариант 2: Использовать Prisma Studio для создания схемы

1. Запустите Prisma Studio:
```powershell
npx prisma studio
```

2. Откройте http://localhost:5555
3. Схема будет создана автоматически при первом подключении

### Вариант 3: Создать таблицы вручную через SQL

Подключитесь к базе данных и выполните SQL команды:

```powershell
docker-compose exec postgres psql -U liquidityscan -d liquidityscan_db
```

Затем выполните SQL из файла миграции (если он был создан).

### Вариант 4: Использовать Prisma 6 (если Prisma 7 вызывает проблемы)

```powershell
npm install -D prisma@6
npm install @prisma/client@6
npx prisma migrate dev --name init
```

## Текущая конфигурация

Файл `prisma.config.ts` настроен правильно:
- Использует `adapter: "postgresql"`
- URL указан напрямую в конфиге

Файл `schema.prisma`:
- НЕ содержит `url` (требование Prisma 7)
- Содержит только `provider = "postgresql"`

## Проверка подключения

Убедитесь, что база данных доступна:

```powershell
docker-compose exec postgres psql -U liquidityscan -d liquidityscan_db -c "SELECT 1;"
```

Если команда работает, база данных настроена правильно.

## Альтернативное решение

Если проблемы продолжаются, можно временно использовать Prisma без миграций:

1. Используйте `db push` для создания схемы
2. Генерируйте Prisma Client: `npx prisma generate`
3. Используйте приложение как обычно

Миграции можно добавить позже, когда подключение будет работать стабильно.
