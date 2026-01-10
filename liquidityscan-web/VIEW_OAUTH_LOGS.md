# Как просмотреть OAuth логи в Backend

## Проблема
Backend логи идут очень быстро и теряются в потоке других сообщений.

## Решение 1: Фильтрация в PowerShell

### Вариант A: Только OAuth логи в реальном времени
```powershell
cd liquidityscan-web/backend
npm run start:dev | Select-String -Pattern "Google|OAuth|CORS|Strategy"
```

Это покажет только строки содержащие:
- `Google`
- `OAuth`
- `CORS`
- `Strategy`

### Вариант B: Сохранить OAuth логи в файл
```powershell
cd liquidityscan-web/backend
npm run start:dev | Select-String -Pattern "Google|OAuth|CORS|Strategy" | Tee-Object -FilePath "oauth-logs.txt"
```

Логи будут:
- Показаны в консоли
- Сохранены в файл `oauth-logs.txt`

### Вариант C: Только важные OAuth события
```powershell
cd liquidityscan-web/backend
npm run start:dev | Select-String -Pattern "Google OAuth Callback|GoogleStrategy|Redirecting to"
```

## Решение 2: Использовать отдельное окно терминала

1. Откройте **НОВОЕ** окно PowerShell
2. Перейдите в папку backend:
   ```powershell
   cd "C:\Users\hrant\Desktop\liquidityscan -MEGA\liquidityscan-web\backend"
   ```
3. Запустите фильтр:
   ```powershell
   npm run start:dev | Select-String -Pattern "Google|OAuth|CORS"
   ```

## Решение 3: Использовать файл логов

Если вы используете `pm2` или другой процесс-менеджер, логи можно перенаправить в файл:

```powershell
npm run start:dev > backend-logs.txt 2>&1
```

Затем в другом окне:
```powershell
Get-Content backend-logs.txt -Wait | Select-String -Pattern "Google|OAuth|CORS"
```

## Что искать в логах

### Успешный OAuth flow должен показать:

1. **Инициализация:**
   ```
   [GoogleStrategy] Initializing with:
     - Client ID: ...
     - Client Secret: SET
     - Callback URL: http://localhost:3000/api/auth/google/callback
   ```

2. **Когда пользователь выбирает аккаунт:**
   ```
   [GoogleStrategy.validate] Called with profile: { id: '...', displayName: '...', emailsCount: 1 }
   [GoogleStrategy.validate] Email extracted: user@example.com
   ```

3. **Обработка callback:**
   ```
   [Google OAuth Callback] ========================================
   [Google OAuth Callback] Received callback from Google
   [Google OAuth Callback] User data received from GoogleStrategy: { email: '...' }
   [Google OAuth Callback] Tokens generated successfully
   [Google OAuth Callback] Redirecting to: http://localhost:5173/app/login?token=***&refreshToken=***
   ```

### Если есть ошибки:

- `ERROR: req.user is undefined` → GoogleStrategy не вернул данные
- `ERROR: Failed to generate tokens` → Проблема с базой данных или JWT
- `CORS` ошибки → Проблема с настройками CORS

## Быстрая команда (скопируйте и вставьте)

```powershell
cd "C:\Users\hrant\Desktop\liquidityscan -MEGA\liquidityscan-web\backend"; npm run start:dev | Select-String -Pattern "Google|OAuth|CORS|Strategy"
```
