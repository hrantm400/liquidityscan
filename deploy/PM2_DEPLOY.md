# Деплой на сервер и запуск с PM2

## Что нужно «кинуть» на сервер

На сервере должны быть:

1. **Бэкенд** (API) — папка `liquidityscan-web/backend` со сборкой и зависимостями.
2. **Фронтенд** — собранная статика `liquidityscan-web/frontend/dist` (для раздачи через Nginx).
3. Файл **`.env`** в `liquidityscan-web/backend` (с `DATABASE_URL`, `JWT_SECRET`, `SIGNALS_WEBHOOK_SECRET` и т.д.).

---

## Вариант A: Загрузить весь репозиторий

1. На своём компьютере соберите проект:
   ```bash
   cd liquidityscan-web/backend
   npm ci
   npm run build

   cd ../frontend
   npm ci
   npm run build
   ```

2. Загрузите на сервер папку `liquidityscan-web` (через git clone, scp, rsync или архив).

3. На сервере:
   ```bash
   cd /path/to/liquidityscan-web/backend
   cp .env.example .env   # и отредактируйте .env (DATABASE_URL, секреты и т.д.)
   npm ci --omit=dev      # только production-зависимости
   npm run build          # если не собирали локально
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup            # автозапуск PM2 после перезагрузки (выполнить команду, которую выведет PM2)
   ```

4. Настройте Nginx (или Apache): раздавать статику из `liquidityscan-web/frontend/dist` и проксировать `/api` на `http://127.0.0.1:3000`.

---

## Вариант B: Один архив для загрузки

1. Локально (в корне репозитория):
   ```bash
   cd liquidityscan-web/backend
   npm ci
   npm run build

   cd ../frontend
   npm ci
   npm run build
   ```

2. Создайте архив, например:
   ```bash
   tar -czvf liquidityscan-deploy.tar.gz \
     liquidityscan-web/backend/dist \
     liquidityscan-web/backend/package.json \
     liquidityscan-web/backend/package-lock.json \
     liquidityscan-web/backend/ecosystem.config.cjs \
     liquidityscan-web/backend/prisma \
     liquidityscan-web/frontend/dist
   ```

3. Загрузите `liquidityscan-deploy.tar.gz` на сервер, распакуйте.

4. На сервере:
   ```bash
   mkdir -p liquidityscan-web/backend liquidityscan-web/frontend
   tar -xzvf liquidityscan-deploy.tar.gz -C liquidityscan-web/
   cd liquidityscan-web/backend
   # Создайте .env вручную (скопируйте с другого места или настройте)
   npm ci --omit=dev
   npx prisma generate
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

(Пути в архиве можно подправить под свою структуру папок.)

---

## Полезные команды PM2

| Команда | Описание |
|--------|----------|
| `pm2 start ecosystem.config.cjs` | Запустить приложение |
| `pm2 stop liquidityscan-api` | Остановить |
| `pm2 restart liquidityscan-api` | Перезапустить после изменений |
| `pm2 logs liquidityscan-api` | Логи |
| `pm2 status` | Список процессов |
| `pm2 save` | Сохранить список процессов |
| `pm2 startup` | Включить автозапуск PM2 при перезагрузке сервера |

---

## Важно

- В `liquidityscan-web/backend/.env` на сервере должны быть заданы: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SIGNALS_WEBHOOK_SECRET` и при необходимости `CORS_ORIGIN`, `FRONTEND_URL`.
- Порт API по умолчанию — 3000. В Nginx проксируйте `location /api { proxy_pass http://127.0.0.1:3000; ... }`.
- Статику фронта отдавайте из `liquidityscan-web/frontend/dist` (root или alias в Nginx).
