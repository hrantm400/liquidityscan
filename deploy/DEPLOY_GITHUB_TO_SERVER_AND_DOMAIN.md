# LiquidityScan: GitHub → сервер → домен liquidityscan.io

Полная пошаговая инструкция: что пушить в GitHub, как развернуть на сервере 173.249.3.156, привязать домен liquidityscan.io (Namecheap), настроить SSL, webhook для разработчика и Google OAuth. **На сервере уже есть проект superengulfing — его не трогать.**

---

## 1. GitHub

### Что в репозитории

- **liquidityscan-web/** — фронт (Vite/React) и бэкенд (NestJS).
- **deploy/** — конфиги Nginx, скрипты, инструкции (включая этот файл).

### Что не попадает в GitHub (.gitignore)

- Файлы окружения и секреты: `.env`, `.env.local`, `.env.*.local`
- Зависимости и сборки: `node_modules/`, `dist/`, `**/dist/`

Перед push убедись, что в репозитории нет `.env` и секретов. Backend и frontend имеют свои `.gitignore` с теми же правилами.

### Команды для push

На локальной машине из корня проекта:

```bash
git status
git add .
git commit -m "Deploy: .gitignore, .env.example, nginx domain config, deploy doc"
git push origin main
```

(Замени `main` на свою ветку, если другая.) Теги при необходимости: `git tag v1.0.0 && git push origin v1.0.0`.

---

## 2. Сервер 173.249.3.156

**SSH:** `ssh root@173.249.3.156`

### Что на сервере не трогать

- **Nginx:** конфиги и симлинки для **superengulfing** и **default** (`/etc/nginx/sites-available/superengulfing`, `sites-enabled/superengulfing`, `default`).
- **Папки:** `/var/www/superengulfing`, `/var/www/html`.
- **PM2:** процессы **api** и **remix** (это superengulfing). Не останавливать и не удалять.

### Установка git / Node / PM2 (если ещё нет)

```bash
apt update
apt install -y git
node -v   # нужен Node 18+
npm -v
# При необходимости:
# curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
# apt install -y nodejs
npm install -g pm2
```

### Клонирование репозитория

Подставь свой URL репозитория (HTTPS или SSH):

```bash
cd /var/www
git clone https://github.com/YOUR_USER/YOUR_REPO.git liquidityscan
```

После clone должны быть пути:

- `/var/www/liquidityscan/liquidityscan-web/backend/`
- `/var/www/liquidityscan/liquidityscan-web/frontend/`
- `/var/www/liquidityscan/deploy/`

### Backend: зависимости, .env, сборка, PM2

```bash
cd /var/www/liquidityscan/liquidityscan-web/backend
npm ci
cp .env.example .env
nano .env
```

В `.env` обязательно задать (остальное по .env.example):

- **DATABASE_URL** — строка подключения к PostgreSQL на сервере (пользователь, пароль, БД `liquidityscan_db`).
- **PORT=3002** (порты 3000 и 3001 заняты superengulfing).
- **JWT_SECRET**, **JWT_REFRESH_SECRET** — свои случайные строки.
- **GOOGLE_CLIENT_ID**, **GOOGLE_CLIENT_SECRET** — из Google Cloud Console.
- **GOOGLE_CALLBACK_URL=https://liquidityscan.io/api/auth/google/callback** (после SSL; до SSL — `http://...`).
- **CORS_ORIGIN=https://liquidityscan.io**
- **FRONTEND_URL=https://liquidityscan.io**
- **SIGNALS_WEBHOOK_SECRET** — длинный случайный ключ (его же передать разработчику Grno).
- **ADMIN_EMAILS** — твой email через запятую.

Создание БД и пользователя (если ещё не сделано):

```bash
# По необходимости: см. backend/scripts/ (create-db-user.sql, grant-public.sql)
# Затем:
npx prisma generate
npx prisma migrate deploy
# или: npx prisma db push
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Проверка: `curl -s http://127.0.0.1:3002/api/health` — должен вернуть JSON.

### Frontend: зависимости и сборка

```bash
cd /var/www/liquidityscan/liquidityscan-web/frontend
npm ci --legacy-peer-deps
# При ошибке "vite: Permission denied":
chmod +x node_modules/.bin/*
npm run build
ls dist
```

Должна появиться папка `dist/` с `index.html` и `assets/`.

### Nginx: только LiquidityScan

Копируем конфиг для домена, включаем сайт, перезагружаем Nginx. **Не менять** конфиги superengulfing и default.

```bash
sudo cp /var/www/liquidityscan/deploy/nginx-liquidityscan-domain.conf /etc/nginx/sites-available/liquidityscan.io
# Проверить путь root в конфиге (должен быть /var/www/liquidityscan/liquidityscan-web/frontend/dist)
sudo ln -sf /etc/nginx/sites-available/liquidityscan.io /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

После настройки DNS (шаг 3) сайт будет открываться по `http://liquidityscan.io`. Затем настроить SSL (шаг 4).

---

## 3. Домен liquidityscan.io (Namecheap)

1. Зайти в панель Namecheap → Domain List → Manage для **liquidityscan.io**.
2. Раздел **Advanced DNS**.
3. Добавить или изменить A-записи:
   - **Type:** A, **Host:** @, **Value:** 173.249.3.156, **TTL:** Automatic (или 300).
   - **Type:** A, **Host:** www, **Value:** 173.249.3.156, **TTL:** Automatic.
4. Сохранить. TXT (DMARC, DKIM и т.д.) не трогать, если нужны для почты.
5. Подождать распространения DNS (от нескольких минут до 24–48 ч). Проверка с любого компьютера:

```bash
nslookup liquidityscan.io
nslookup www.liquidityscan.io
```

В ответе должен быть адрес **173.249.3.156**.

---

## 4. SSL (HTTPS) для liquidityscan.io

На сервере после того, как DNS указывает на 173.249.3.156 и Nginx обслуживает liquidityscan.io по HTTP:

```bash
apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d liquidityscan.io -d www.liquidityscan.io
```

Следовать подсказкам (email, согласие с условиями). Certbot сам изменит конфиг Nginx для HTTPS.

После успеха:

- Сайт: **https://liquidityscan.io**
- API и webhook: **https://liquidityscan.io/api/...**

В `.env` бэкенда обновить (если ещё не сделано):

- `GOOGLE_CALLBACK_URL=https://liquidityscan.io/api/auth/google/callback`
- `CORS_ORIGIN=https://liquidityscan.io`
- `FRONTEND_URL=https://liquidityscan.io`

Перезапуск бэкенда: `pm2 restart liquidityscan-api`.

---

## 5. Webhook для разработчика (Grno)

После деплоя передать разработчику:

### 1) Webhook URL

- С SSL: **https://liquidityscan.io/api/signals/webhook**
- До SSL: **http://liquidityscan.io/api/signals/webhook**

### 2) Preferred secret key

Значение переменной **SIGNALS_WEBHOOK_SECRET** из `.env` на сервере (то же, что в бэкенде). Передать только строку, без имени переменной.

### 3) Как слать запросы

- **Метод:** POST  
- **Content-Type:** application/json  
- **Заголовок:** `x-webhook-secret: <значение_SIGNALS_WEBHOOK_SECRET>`  
- **Тело:** JSON — один объект сигнала или массив объектов. Формат: см. **liquidityscan-web/backend/docs/SIGNALS_WEBHOOK_FOR_PYTHON.md** (strategyType SUPER_ENGULFING, symbol, timeframe 4h/1d/1w, signalType BUY/SELL, price и т.д.).

Ответ при успехе: `{ "received": N }`. При неверном или отсутствующем заголовке — 401.

---

## 6. Google OAuth с доменом

1. **На сервере в `.env` бэкенда:**
   - `GOOGLE_CALLBACK_URL=https://liquidityscan.io/api/auth/google/callback`

2. **В Google Cloud Console:**  
   APIs & Services → Credentials → OAuth 2.0 Client ID (Web application):
   - **Authorized JavaScript origins:** `https://liquidityscan.io`, при необходимости `https://www.liquidityscan.io`
   - **Authorized redirect URIs:** `https://liquidityscan.io/api/auth/google/callback`
   Сохранить.

3. Перезапуск бэкенда: `pm2 restart liquidityscan-api`

---

## 7. Проверка

- Открыть **https://liquidityscan.io** — загружается фронт LiquidityScan.
- Вход через Google — редирект на callback и успешный вход.
- **GET** https://liquidityscan.io/api/signals — в ответе массив сигналов (или пустой массив).
- **POST** https://liquidityscan.io/api/signals/webhook с заголовком `x-webhook-secret` и телом JSON — ответ `{ "received": N }`.
- **Superengulfing** по-прежнему открывается и работает: https://superengulfing.com (и процессы PM2 **api**, **remix** в статусе online).

При проблемах: логи бэкенда `pm2 logs liquidityscan-api`, логи Nginx `sudo tail -50 /var/log/nginx/liquidityscan.io.error.log`.
