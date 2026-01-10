# Как поделиться проектом с товарищем

## 🚀 Быстрый способ (для демонстрации)

### Вариант 1: Использовать Cloudflare Tunnel (РЕКОМЕНДУЕТСЯ! ⭐)

**Преимущества:** Бесплатно, быстро, безлимитно, без регистрации!

1. **Установите Cloudflare Tunnel (cloudflared):**
   ```bash
   # Windows (Chocolatey)
   choco install cloudflared
   
   # Windows (вручную)
   # Скачайте с https://github.com/cloudflare/cloudflared/releases
   # Распакуйте cloudflared.exe в папку в PATH
   
   # Или через npm
   npm install -g cloudflared
   ```

2. **Запустите ваш проект:**
   ```bash
   # Терминал 1 - Docker
   cd liquidityscan-web
   docker-compose up -d

   # Терминал 2 - Backend
   cd liquidityscan-web/backend
   npm run start:dev

   # Терминал 3 - Frontend
   cd liquidityscan-web/frontend
   npm run dev
   ```

3. **Создайте туннель для Frontend:**
   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```

4. **Обновите CORS в backend:**
   - Скопируйте HTTPS URL из Cloudflare Tunnel (например: `https://xxxx-xxxx.trycloudflare.com`)
   - В `.env` файле backend добавьте:
   ```env
   CORS_ORIGIN=https://xxxx-xxxx.trycloudflare.com
   ```
   - Перезапустите Backend

5. **Дай товарищу ссылку:**
   - Frontend URL: `https://xxxx-xxxx.trycloudflare.com`
   - Полная ссылка: `https://xxxx-xxxx.trycloudflare.com/app/dashboard`

**✅ Преимущества Cloudflare Tunnel:**
- Бесплатно и безлимитно
- Быстрее чем ngrok (сеть Cloudflare)
- Не нужна регистрация
- Автоматический HTTPS
- Более стабильный

### Вариант 2: Использовать ngrok (альтернатива)

1. **Установите ngrok:**
   - Скачайте с https://ngrok.com/download
   - Или через npm: `npm install -g ngrok`

2. **Зарегистрируйтесь на ngrok.com** (бесплатно) и получите authtoken

3. **Настройте ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

4. **Создайте туннель:**
   ```bash
   ngrok http 5173
   ```

5. **Обновите CORS:**
   ```env
   CORS_ORIGIN=https://your-ngrok-url.ngrok.io
   ```

### Вариант 3: Использовать localtunnel (проще, но менее стабильно)

1. **Установите localtunnel:**
   ```bash
   npm install -g localtunnel
   ```

2. **Запустите туннель для Frontend:**
   ```bash
   lt --port 5173 --subdomain liquidityscan
   ```

3. **Запустите туннель для Backend:**
   ```bash
   lt --port 3000 --subdomain liquidityscan-api
   ```

4. **Обновите CORS в backend .env:**
   ```env
   CORS_ORIGIN=https://liquidityscan.loca.lt
   ```

5. **Дай товарищу ссылку:**
   - `https://liquidityscan.loca.lt/app/dashboard`

### Вариант 3: Локальная сеть (если товарищ в той же WiFi)

1. **Узнай свой локальный IP:**
   ```bash
   # Windows
   ipconfig
   # Ищи IPv4 Address, например: 192.168.1.100

   # Mac/Linux
   ifconfig
   # Или
   ip addr show
   ```

2. **Обновите vite.config.ts** (временно):
   ```typescript
   server: {
     host: '0.0.0.0', // Позволяет доступ извне
     // ... остальное
   }
   ```

3. **Обновите backend .env:**
   ```env
   CORS_ORIGIN=http://192.168.1.100:5173
   ```

4. **Дай товарищу ссылку:**
   - `http://192.168.1.100:5173/app/dashboard`

## ⚠️ Важные замечания:

1. **Безопасность:**
   - ngrok/localtunnel создают публичные ссылки
   - Не используйте для продакшена с реальными данными
   - Только для демонстрации!

2. **Стабильность:**
   - ngrok (бесплатный) - ссылка меняется при каждом перезапуске
   - ngrok (платный) - можно зафиксировать домен
   - localtunnel - может быть нестабильным

3. **Оба сервера должны работать:**
   - Backend на порту 3000
   - Frontend на порту 5173
   - Docker services (PostgreSQL, Redis) должны быть запущены

## 📝 Пример команды для быстрого запуска:

```bash
# Терминал 1: Docker
cd liquidityscan-web
docker-compose up -d

# Терминал 2: Backend
cd liquidityscan-web/backend
npm run start:dev

# Терминал 3: Frontend
cd liquidityscan-web/frontend
npm run dev

# Терминал 4: ngrok для Frontend
ngrok http 5173
```

## 🌐 Для постоянного доступа (Production):

Если нужен постоянный доступ, лучше развернуть на хостинге:
- **Vercel** (для frontend) + **Railway/Render** (для backend)
- **DigitalOcean** / **AWS** / **Google Cloud**
- См. `DEPLOYMENT.md` для инструкций
