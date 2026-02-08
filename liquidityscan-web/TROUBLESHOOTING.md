# Решение проблем (Troubleshooting)

## Порт 3000 уже занят

### Проблема
```
Error: listen EADDRINUSE: address already in use :::3000
```

### Решение 1: Остановить процесс автоматически

```bash
cd backend
npm run kill:3000
```

Или для другого порта:
```bash
npm run kill:port 3001
```

### Решение 2: Найти и остановить вручную

**Windows:**
```powershell
# Найти процесс
netstat -ano | findstr ":3000"

# Остановить по PID (замените XXXX на реальный PID)
taskkill /F /PID XXXX
```

**Linux/Mac:**
```bash
# Найти процесс
lsof -ti:3000

# Остановить
kill -9 $(lsof -ti:3000)
```

### Решение 3: Изменить порт

Измените в `backend/.env`:
```env
PORT=3001
```

И обновите `GOOGLE_CALLBACK_URL`:
```env
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

## База данных не подключается

### Проверка локального PostgreSQL

1. Убедитесь, что служба PostgreSQL запущена (порт 5432).
2. Проверьте `DATABASE_URL` в `backend/.env`: хост, порт 5432, пользователь, пароль, имя БД.
3. Убедитесь, что база данных существует (например, `liquidityscan_db`).
4. Если используется файрвол, проверьте, что порт 5432 разрешён.

### Проверка подключения

```bash
cd backend
npm run db:check
```

## Google OAuth не работает

### Проверка credentials

1. Убедитесь, что в `backend/.env` есть:
   ```env
   GOOGLE_CLIENT_ID=ваш_id
   GOOGLE_CLIENT_SECRET=ваш_secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
   ```

2. Перезапустите бэкенд после изменения `.env`

3. Проверьте, что URLs в Google Cloud Console совпадают с `.env`

### Ошибка "redirect_uri_mismatch"

URL в `.env` должен **точно** совпадать с URL в Google Cloud Console:
- Включая `http://` или `https://`
- Включая порт
- Включая полный путь

## CORS ошибки

### Проблема
```
Access to fetch at 'http://localhost:3000/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

### Решение

Убедитесь, что в `backend/.env`:
```env
CORS_ORIGIN=http://localhost:5173
```

И перезапустите бэкенд.

## Prisma ошибки

### "Prisma Client не сгенерирован"

```bash
cd backend
npm run prisma:generate
```

### "База данных не синхронизирована"

```bash
cd backend
npm run db:push
```

### "Миграции не применены"

```bash
cd backend
npm run prisma:migrate
```

## Модули не найдены

### Переустановка зависимостей

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

## Полезные команды

```bash
# Проверить подключение к БД
npm run db:check

# Освободить порт 3000
npm run kill:3000

# Открыть Prisma Studio
npm run prisma:studio

# Посмотреть логи бэкенда
# (в терминале где запущен npm run start:dev)
```

## Получение помощи

Если проблема не решена:
1. Проверьте логи бэкенда
2. Убедитесь, что PostgreSQL запущен и доступен на порту 5432
3. Убедитесь, что все зависимости установлены
4. Проверьте версии Node.js (требуется 18+)
