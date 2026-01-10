# Cloudflare Tunnel - Быстрая настройка

## 🚀 Что такое Cloudflare Tunnel?

Cloudflare Tunnel (cloudflared) - это бесплатный инструмент от Cloudflare для создания безопасных туннелей к локальным сервисам.

## ✅ Преимущества:

- **БЕСПЛАТНО** - полностью бесплатный, без ограничений
- **БЫСТРО** - использует глобальную сеть Cloudflare (быстрее чем ngrok)
- **БЕЗЛИМИТНО** - нет ограничений на трафик, время или количество запросов
- **БЕЗ РЕГИСТРАЦИИ** - работает сразу, не нужен аккаунт
- **HTTPS** - автоматически с SSL сертификатом
- **СТАБИЛЬНО** - более надежный чем ngrok

## 📦 Установка:

### Windows:

**Вариант 1: Через Chocolatey (рекомендуется)**
```powershell
choco install cloudflared
```

**Вариант 2: Вручную**
1. Скачайте с https://github.com/cloudflare/cloudflared/releases
2. Выберите `cloudflared-windows-amd64.exe`
3. Переименуйте в `cloudflared.exe`
4. Добавьте в PATH или поместите в папку проекта

**Вариант 3: Через npm**
```bash
npm install -g cloudflared
```

### Mac:
```bash
brew install cloudflared
```

### Linux:
```bash
# Debian/Ubuntu
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
```

## 🎯 Использование:

### Базовое использование (временный туннель):

```bash
# Для Frontend (порт 5173)
cloudflared tunnel --url http://localhost:5173

# Для Backend (порт 3000) - если нужен прямой доступ к API
cloudflared tunnel --url http://localhost:3000
```

После запуска вы получите URL вида:
```
https://xxxx-xxxx.trycloudflare.com
```

### Постоянный туннель (с фиксированным доменом):

1. **Войдите в Cloudflare (бесплатно):**
   ```bash
   cloudflared tunnel login
   ```

2. **Создайте туннель:**
   ```bash
   cloudflared tunnel create liquidityscan
   ```

3. **Настройте маршрут:**
   ```bash
   cloudflared tunnel route dns liquidityscan your-subdomain.yourdomain.com
   ```

4. **Запустите туннель:**
   ```bash
   cloudflared tunnel run liquidityscan
   ```

## 🔧 Настройка для нашего проекта:

### Шаг 1: Запустите проект

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

### Шаг 2: Запустите Cloudflare Tunnel

```bash
# Терминал 4
cloudflared tunnel --url http://localhost:5173
```

Вы увидите что-то вроде:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://xxxx-xxxx.trycloudflare.com                                                       |
+--------------------------------------------------------------------------------------------+
```

### Шаг 3: Обновите CORS

Скопируйте URL из Cloudflare Tunnel и добавьте в `backend/.env`:

```env
CORS_ORIGIN=https://xxxx-xxxx.trycloudflare.com
```

Перезапустите Backend.

### Шаг 4: Дай товарищу ссылку

```
https://xxxx-xxxx.trycloudflare.com/app/dashboard
```

## 📝 Пример полного запуска:

```bash
# 1. Docker
docker-compose up -d

# 2. Backend (в новом терминале)
cd backend
npm run start:dev

# 3. Frontend (в новом терминале)
cd frontend
npm run dev

# 4. Cloudflare Tunnel (в новом терминале)
cloudflared tunnel --url http://localhost:5173
```

## ⚠️ Важные замечания:

1. **Временный туннель** - URL меняется при каждом перезапуске
2. **Для постоянного URL** - используйте настройку через Cloudflare Zero Trust (требует домен)
3. **Безопасность** - туннель публичный, используйте только для демонстрации
4. **Производительность** - Cloudflare Tunnel быстрее и стабильнее чем ngrok

## 🔗 Полезные ссылки:

- Официальный сайт: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- GitHub: https://github.com/cloudflare/cloudflared
- Документация: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
