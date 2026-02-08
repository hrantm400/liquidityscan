# Backend tunnel (for NOWPayments IPN)

Чтобы NOWPayments мог слать уведомления о платежах на ваш локальный бэкенд, нужен публичный HTTPS-адрес. Для этого используется Cloudflare Quick Tunnel.

## 1. Установка cloudflared (один раз)

**Windows (winget):**
```powershell
winget install Cloudflare.cloudflared
```

Или скачайте: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

## 2. Запуск туннеля

1. **Запустите бэкенд** (в одном терминале):
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Запустите туннель** (в другом терминале):
   ```powershell
   cd backend
   .\scripts\tunnel-backend.ps1
   ```

3. В выводе появится строка вида:
   ```
   https://xxxx-xx-xx-xx-xx.trycloudflare.com
   ```

4. **Добавьте в `.env`:**
   ```
   NOWPAYMENTS_IPN_CALLBACK_URL=https://xxxx-xx-xx-xx-xx.trycloudflare.com/api/payments/nowpayments-webhook
   ```
   (подставьте свой хост из вывода)

5. Перезапустите бэкенд, чтобы подхватить новый `.env`.

**Важно:** Пока туннель запущен, NOWPayments сможет достучаться до вашего бэкенда. URL меняется при каждом новом запуске туннеля — обновляйте `.env` при необходимости.
