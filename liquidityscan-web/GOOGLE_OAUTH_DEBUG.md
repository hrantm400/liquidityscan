# Отладка Google OAuth

## Проблема: После подтверждения в Google возвращает на лендинг

## Проверьте:

### 1. FRONTEND_URL в backend/.env

Убедитесь что в `liquidityscan-web/backend/.env` есть:

```env
FRONTEND_URL=http://localhost:5173
```

Или если используете Cloudflare Tunnel:
```env
FRONTEND_URL=https://your-tunnel-url.trycloudflare.com
```

### 2. Google OAuth Callback URL

В Google Cloud Console убедитесь что callback URL правильный:

**Для локальной разработки:**
```
http://localhost:3000/api/auth/google/callback
```

**Для Cloudflare Tunnel:**
```
https://your-backend-tunnel-url.trycloudflare.com/api/auth/google/callback
```

### 3. Проверьте логи Backend

После попытки входа через Google, проверьте логи backend. Должны увидеть:

```
[Google OAuth] User data received: { email: '...', hasData: true }
[Google OAuth] Redirecting to frontend (tokens hidden)
```

Если видите ошибки - они укажут на проблему.

### 4. Проверьте URL в браузере

После редиректа от Google, проверьте URL в адресной строке браузера. Должен быть:

```
http://localhost:5173/app/login?token=...&refreshToken=...
```

Если URL другой - проблема в FRONTEND_URL.

### 5. Проверьте консоль браузера

Откройте DevTools (F12) → Console и проверьте ошибки.

### 6. Проверьте Network tab

В DevTools → Network проверьте:
- Запрос к `/api/auth/google` - должен быть 302 redirect на Google
- Запрос к `/api/auth/google/callback` - должен быть 302 redirect на frontend
- Запрос к `/app/login?token=...` - должен загрузить страницу Login

## Быстрое решение:

1. Убедитесь что `FRONTEND_URL` в backend/.env правильный
2. Перезапустите backend
3. Попробуйте снова

## Если не помогает:

Добавьте в backend/.env:
```env
FRONTEND_URL=http://localhost:5173
GOOGLE_CALLBACK_URL=/api/auth/google/callback
```

И перезапустите backend.
