# Google OAuth - Быстрая настройка

## 🚀 Быстрые шаги

### 1. Google Cloud Console
👉 https://console.cloud.google.com/

### 2. Создать проект
- New Project → Название: `LiquidityScan` → Create

### 3. Включить API
- APIs & Services → Library → Поиск: `Google+ API` → Enable

### 4. Создать OAuth Client
- APIs & Services → Credentials → + CREATE CREDENTIALS → OAuth client ID
- Application type: **Web application**
- Name: `LiquidityScan Web Client`

### 5. Настроить URLs

**Authorized JavaScript origins:**
```
http://localhost:5173
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/google/callback
```

### 6. Скопировать данные
- **Client ID** - скопировать
- **Client Secret** - скопировать (показывается только 1 раз!)

### 7. Добавить в .env

Открыть `backend/.env` и добавить:

```env
GOOGLE_CLIENT_ID=ваш_client_id_здесь
GOOGLE_CLIENT_SECRET=ваш_client_secret_здесь
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### 8. Перезапустить бэкенд

```bash
cd backend
npm run start:dev
```

## ✅ Проверка

1. Открыть: http://localhost:5173/login
2. Нажать "Sign in with Google"
3. Должно перенаправить на Google

## 📝 Где найти данные позже?

Если забыли Client Secret:
- Google Cloud Console → APIs & Services → Credentials
- Найти ваш OAuth Client → Reset secret (создаст новый)

## 🔗 Полная инструкция

См. [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) для подробностей
