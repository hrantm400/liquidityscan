# Исправление проблемы 401 Unauthorized в админ панели

## Проблема
Получаете ошибку `401 (Unauthorized)` при попытке доступа к админ панели, даже если email добавлен в `ADMIN_EMAILS`.

## Пошаговая диагностика

### 1. Проверьте формат ADMIN_EMAILS в .env

Откройте файл `liquidityscan-web/backend/.env` и убедитесь, что:

```env
ADMIN_EMAILS=hromelkyan@gmail.com
```

**Важно:**
- ✅ Email должен быть **точно таким же**, как при регистрации/логине
- ✅ Без пробелов до и после запятой (если несколько админов)
- ✅ Регистр не важен (система автоматически приводит к lowercase)
- ✅ Если несколько админов: `ADMIN_EMAILS=admin1@example.com,admin2@example.com`

### 2. Перезапустите бэкенд

После изменения `.env` **обязательно перезапустите бэкенд**:

```bash
# Остановите бэкенд (Ctrl+C)
# Затем запустите снова
cd liquidityscan-web/backend
npm run dev
```

### 3. Проверьте логи бэкенда

При запуске бэкенда вы должны увидеть в консоли:

```
[AdminGuard] Loaded 1 admin emails from configuration
```

Если видите:
```
[AdminGuard] ADMIN_EMAILS not configured in environment
```

Значит переменная не загружается. Проверьте:
- Файл `.env` находится в `liquidityscan-web/backend/`
- Нет опечаток в названии переменной
- Нет лишних пробелов или кавычек

### 4. Проверьте JWT токен

Откройте DevTools в браузере (F12) → Application/Storage → Local Storage → найдите `auth-storage`

Проверьте, что:
- ✅ Токен существует
- ✅ Токен не истек
- ✅ Email в токене совпадает с email в `ADMIN_EMAILS`

### 5. Проверьте логи при запросе

Когда делаете запрос к админ панели, в консоли бэкенда должны появиться логи:

```
[JwtAuthGuard] JWT authentication failed: ...
[AdminGuard] Admin access check - User: {...}
[AdminGuard] Admin emails configured: 1 emails
[AdminGuard] Admin emails list: ["hromelkyan@gmail.com"]
```

**Если видите ошибку JWT:**
- Выйдите и войдите снова (получите новый токен)
- Проверьте, что `JWT_SECRET` в `.env` не изменился

**Если видите, что email не в списке:**
- Проверьте точное совпадение email (включая регистр в исходном email)
- Убедитесь, что перезапустили бэкенд после изменения `.env`

### 6. Проверьте Network запросы

В DevTools → Network → найдите запрос к `/api/admin/analytics/dashboard`

Проверьте Headers:
- ✅ `Authorization: Bearer <token>` присутствует
- ✅ Токен не пустой

## Быстрое решение

1. **Откройте** `liquidityscan-web/backend/.env`
2. **Добавьте/проверьте:**
   ```env
   ADMIN_EMAILS=hromelkyan@gmail.com
   ```
3. **Сохраните** файл
4. **Перезапустите бэкенд** (остановите Ctrl+C и запустите снова `npm run dev`)
5. **Выйдите** из приложения (logout)
6. **Войдите снова** с email `hromelkyan@gmail.com`
7. **Попробуйте** открыть админ панель

## Если проблема сохраняется

### Проверьте формат email в базе данных

Подключитесь к базе данных и проверьте:

```sql
SELECT email FROM users WHERE email LIKE '%hromelkyan%';
```

Убедитесь, что email в базе **точно совпадает** с email в `ADMIN_EMAILS`.

### Включите debug логирование

В `liquidityscan-web/backend/src/admin/guards/admin.guard.ts` уже добавлено debug логирование. 

Чтобы увидеть debug логи, установите в `.env`:
```env
LOG_LEVEL=debug
```

Или временно измените `this.logger.debug` на `this.logger.log` в AdminGuard.

### Проверьте переменные окружения

Добавьте в `main.ts` временно для проверки:

```typescript
console.log('ADMIN_EMAILS:', process.env.ADMIN_EMAILS);
```

Запустите бэкенд и проверьте, что переменная загружается.

## Частые ошибки

❌ **Неправильно:**
```env
ADMIN_EMAILS = hromelkyan@gmail.com  # Пробелы вокруг =
ADMIN_EMAILS="hromelkyan@gmail.com"  # Кавычки не нужны
ADMIN_EMAILS=hromelkyan@Gmail.com   # Регистр важен только для исходного email
```

✅ **Правильно:**
```env
ADMIN_EMAILS=hromelkyan@gmail.com
```

## Контакты для помощи

Если проблема не решается, проверьте:
1. Логи бэкенда при запросе
2. Network tab в браузере (заголовки запроса)
3. Local Storage (токен)
4. Формат `.env` файла
