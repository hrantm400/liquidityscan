# Настройка локальной БД (PostgreSQL без Docker)

Один раз создай пользователя и базу для приложения.

## Не знаешь пароль postgres? (рекомендуется)

Запусти **один раз** скрипт от имени администратора — он временно разрешит вход без пароля, создаст пользователя и БД, потом вернёт защиту.

1. Открой **PowerShell от имени администратора** (правый клик по PowerShell → «Запуск от имени администратора»).
2. Выполни:
   ```powershell
   cd "C:\Users\hrant\Desktop\liquidityscan -MEGA\liquidityscan-web\backend"
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
   .\scripts\setup-db-no-password.ps1
   ```
3. Дождись сообщения «Done».
4. В обычном терминале (из папки `backend`):
   ```bash
   
   npm run start:dev
   ```

Готово. Приложение использует пользователя **liquidityscan** с паролем **liquidityscan_password** (уже прописано в `.env`). Пароль postgres менять не нужно.

---

## Если знаешь пароль postgres

```bash
cd backend
npm run db:setup
```
Введи пароль postgres дважды. Затем:
```bash
npm run db:push
npm run start:dev
```

---

## Вручную (pgAdmin или psql)

1. Подключись к PostgreSQL как **postgres**.
2. Выполни **scripts/create-db-user.sql** (создаётся пользователь `liquidityscan` и БД `liquidityscan_db`).
3. Подключись к БД **liquidityscan_db** и выполни **scripts/grant-public.sql**.
4. В папке backend: `npm run db:push`, затем `npm run start:dev`.

---

В `.env` уже указано: `postgresql://liquidityscan:liquidityscan_password@localhost:5432/liquidityscan_db?schema=public`. Менять не нужно.
npm run db:push