# Настройка аутентификации (Google OAuth + Email/Password)

## ✅ Что было реализовано:

### Backend:
1. ✅ Google OAuth стратегия (`google.strategy.ts`)
2. ✅ API endpoints:
   - `POST /api/auth/register` - регистрация через email
   - `POST /api/auth/login` - вход через email
   - `GET /api/auth/google` - инициация Google OAuth
   - `GET /api/auth/google/callback` - callback от Google
   - `POST /api/auth/refresh` - обновление токена

### Frontend:
1. ✅ Страница Login (`/app/login`)
2. ✅ Страница Register (`/app/register`)
3. ✅ Интеграция с Google OAuth
4. ✅ Сохранение токенов в localStorage через Zustand

## 🔧 Настройка:

### 1. Google OAuth Credentials

Следуйте инструкциям в `liquidityscan-web/backend/GOOGLE_OAUTH_SETUP.md`

Добавьте в `.env` файл backend:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

### 2. JWT Secrets

Убедитесь, что в `.env` есть:
```env
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### 3. CORS

Убедитесь, что `CORS_ORIGIN` в backend `.env` включает frontend URL:
```env
CORS_ORIGIN=http://localhost:5173
```

## 🚀 Использование:

1. **Регистрация через Email:**
   - Перейдите на `/app/register`
   - Заполните форму (имя, email, пароль)
   - Нажмите "Create Account"

2. **Вход через Email:**
   - Перейдите на `/app/login`
   - Введите email и пароль
   - Нажмите "Sign In"

3. **Вход через Google:**
   - На странице Login или Register
   - Нажмите "Continue with Google"
   - Вы будете перенаправлены на Google для авторизации
   - После успешной авторизации вернетесь в приложение

## 📝 Примечания:

- Токены сохраняются в localStorage через Zustand persist middleware
- После успешной аутентификации пользователь перенаправляется на `/dashboard`
- Google OAuth создает пользователя автоматически, если его еще нет в базе
