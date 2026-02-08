# Руководство по развертыванию домашней страницы на Contabo

Это пошаговое руководство поможет вам развернуть статическую домашнюю страницу (LandingPage) на сервере Contabo с привязкой домена из Namecheap.

## Предварительные требования

- Доступ к серверу Contabo (SSH)
- Домен, зарегистрированный в Namecheap
- Локальная копия проекта с установленными зависимостями
- Базовые знания работы с Linux командной строкой

## ⚠️ ВАЖНО: Проверка окружения сервера ПЕРЕД развертыванием

**КРИТИЧЕСКИ ВАЖНО:** Перед развертыванием необходимо проверить окружение сервера, чтобы убедиться, что мы не затронем существующие веб-сайты и боты!

### Шаг 0: Проверка сервера

#### Вариант A: Использование скрипта проверки (рекомендуется)

**С Windows:**
```powershell
.\deploy\check-server-env.ps1 -ServerUser "root" -ServerIP "123.45.67.89"
```

**С Linux/macOS:**
```bash
chmod +x deploy/check-server-env.sh
./deploy/check-server-env.sh root 123.45.67.89
```

**Или выполнить напрямую на сервере:**
```bash
# Загрузите check-server-env.sh на сервер и выполните:
bash check-server-env.sh
```

#### Вариант B: Ручная проверка

Подключитесь к серверу и выполните следующие команды:

```bash
# 1. Проверка операционной системы
cat /etc/os-release

# 2. Проверка установленных веб-серверов
which nginx && nginx -v
which apache2 && apache2 -v
which httpd && httpd -v

# 3. Проверка активных сайтов
# Для Nginx:
ls -la /etc/nginx/sites-enabled/

# Для Apache:
ls -la /etc/apache2/sites-enabled/
# или
ls -la /etc/httpd/conf.d/

# 4. Проверка существующих доменов
# Для Nginx:
grep -h 'server_name' /etc/nginx/sites-enabled/* | grep -v '^#' | sort -u

# Для Apache:
grep -h 'ServerName\|ServerAlias' /etc/apache2/sites-enabled/* | grep -v '^#' | sort -u

# 5. Проверка существующих директорий
ls -la /var/www/

# 6. Проверка запущенных процессов (боты и другие сервисы)
ps aux | grep -E 'python|node|java|telegram|bot' | grep -v grep
```

### Что проверить:

1. **Какой веб-сервер установлен?** (Nginx, Apache, или оба)
2. **Какие домены уже настроены?** (чтобы избежать конфликтов)
3. **Какие директории используются?** (чтобы не перезаписать существующие)
4. **Какие порты заняты?** (80, 443)
5. **Какие процессы запущены?** (боты, другие сервисы)

### ⚠️ Критические моменты безопасности:

- ✅ **НЕ изменяйте** существующие конфигурационные файлы
- ✅ **НЕ используйте** существующие директории веб-серверов
- ✅ **НЕ останавливайте** существующие сервисы
- ✅ Используйте **отдельный виртуальный хост** для нового домена
- ✅ Используйте **отдельную директорию** `/var/www/yourdomain.com`
- ✅ **Проверяйте конфигурацию** перед применением (`nginx -t` или `apache2ctl configtest`)

## Шаг 1: Локальная подготовка

### 1.1 Переход в директорию frontend

```bash
cd liquidityscan-web/frontend
```

### 1.2 Установка зависимостей (если еще не установлены)

```bash
npm install
```

### 1.3 Сборка production версии

```bash
npm run build
```

После успешной сборки файлы будут находиться в директории `dist/`.

### 1.4 Проверка содержимого dist/

Убедитесь, что в `dist/` есть:
- `index.html` - главный HTML файл
- `assets/` - директория с JS, CSS и другими ресурсами

## Шаг 2: Подготовка сервера

### 2.1 Подключение к серверу

```bash
ssh user@your-contabo-server-ip
```

Замените `user` на ваше имя пользователя и `your-contabo-server-ip` на IP адрес вашего сервера.

### 2.2 Создание директории для домена

```bash
sudo mkdir -p /var/www/yourdomain.com
```

Замените `yourdomain.com` на ваш фактический домен.

### 2.3 Установка правильных прав доступа

```bash
sudo chown -R www-data:www-data /var/www/yourdomain.com
sudo chmod -R 755 /var/www/yourdomain.com
```

## Шаг 3: Загрузка файлов на сервер

### Вариант A: Использование SCP (с вашего компьютера)

```bash
# Из директории проекта
scp -r liquidityscan-web/frontend/dist/* user@your-contabo-server-ip:/var/www/yourdomain.com/
```

### Вариант B: Использование rsync (рекомендуется)

```bash
rsync -avz --progress liquidityscan-web/frontend/dist/ user@your-contabo-server-ip:/var/www/yourdomain.com/
```

### Вариант C: Использование SFTP клиента

1. Подключитесь к серверу через SFTP (FileZilla, WinSCP и т.д.)
2. Загрузите все файлы из `dist/` в `/var/www/yourdomain.com/`

### 2.4 Проверка загруженных файлов

На сервере выполните:

```bash
ls -la /var/www/yourdomain.com/
```

Должны быть видны `index.html` и директория `assets/`.

## Шаг 4: Настройка веб-сервера

**⚠️ ВАЖНО:** Используйте тот веб-сервер, который уже установлен и работает на вашем сервере. Не устанавливайте новый веб-сервер, если это не необходимо!

Выберите один из вариантов в зависимости от того, какой веб-сервер установлен на вашем сервере (проверьте это на Шаге 0).

### Вариант A: Nginx (рекомендуется)

#### 4.1 Копирование конфигурации

**⚠️ ВАЖНО:** Убедитесь, что файл с таким именем еще не существует, чтобы не перезаписать существующую конфигурацию!

```bash
# Проверьте, нет ли уже конфигурации для этого домена
ls -la /etc/nginx/sites-available/yourdomain.com
ls -la /etc/nginx/sites-enabled/yourdomain.com

# Если файлы существуют, используйте другое имя или проверьте их содержимое
# Создайте новый файл конфигурации
sudo nano /etc/nginx/sites-available/yourdomain.com
```

Скопируйте содержимое из `deploy/nginx-homepage.conf` и замените `yourdomain.com` на ваш фактический домен.

**Проверьте, что `server_name` в конфигурации не конфликтует с существующими доменами!**

#### 4.2 Активация конфигурации

```bash
# Создать символическую ссылку
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/

# Или если файл уже существует, просто создать ссылку
```

#### 4.3 Проверка конфигурации

```bash
sudo nginx -t
```

Если проверка прошла успешно, вы увидите:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

#### 4.4 Перезагрузка Nginx

```bash
sudo systemctl reload nginx
```

### Вариант B: Apache

#### 4.1 Включение необходимых модулей

```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod expires
sudo a2enmod deflate
```

#### 4.2 Копирование конфигурации

**⚠️ ВАЖНО:** Убедитесь, что файл с таким именем еще не существует, чтобы не перезаписать существующую конфигурацию!

```bash
# Проверьте, нет ли уже конфигурации для этого домена
ls -la /etc/apache2/sites-available/yourdomain.com.conf
ls -la /etc/apache2/sites-enabled/yourdomain.com.conf

# Если файлы существуют, используйте другое имя или проверьте их содержимое
# Создайте новый файл конфигурации
sudo nano /etc/apache2/sites-available/yourdomain.com.conf
```

Скопируйте содержимое из `deploy/apache-homepage.conf` и замените `yourdomain.com` на ваш фактический домен.

**Проверьте, что `ServerName` и `ServerAlias` в конфигурации не конфликтуют с существующими доменами!**

#### 4.3 Активация сайта

```bash
sudo a2ensite yourdomain.com.conf
```

#### 4.4 Проверка конфигурации

```bash
sudo apache2ctl configtest
```

Если проверка прошла успешно, вы увидите:
```
Syntax OK
```

#### 4.5 Перезагрузка Apache

```bash
sudo systemctl reload apache2
```

## Шаг 5: Настройка DNS в Namecheap

### 5.1 Вход в панель управления

1. Войдите в ваш аккаунт Namecheap
2. Перейдите в раздел **Domain List**
3. Нажмите **Manage** рядом с вашим доменом

### 5.2 Настройка Advanced DNS

1. Перейдите на вкладку **Advanced DNS**
2. Найдите секцию **Host Records**

### 5.3 Добавление A-записи

Добавьте новую A-запись:

- **Type**: A Record
- **Host**: @ (для основного домена) или `www` (для поддомена www)
- **Value**: IP адрес вашего Contabo сервера
- **TTL**: Automatic (или 1800 секунд)

**Пример:**
```
Type: A Record
Host: @
Value: 123.45.67.89
TTL: Automatic
```

Для поддомена www добавьте еще одну запись:
```
Type: A Record
Host: www
Value: 123.45.67.89
TTL: Automatic
```

### 5.4 Сохранение изменений

Нажмите кнопку **Save All Changes** (зеленая галочка)

### 5.5 Ожидание распространения DNS

DNS изменения могут занять от 5 минут до 48 часов, но обычно это происходит в течение 30-60 минут.

Проверить распространение можно командой:

```bash
nslookup yourdomain.com
```

или

```bash
dig yourdomain.com
```

## Шаг 6: Проверка развертывания

### 6.1 Проверка DNS

```bash
nslookup yourdomain.com
```

Должен вернуться IP адрес вашего сервера.

### 6.2 Проверка в браузере

Откройте в браузере:
- `http://yourdomain.com`
- `http://www.yourdomain.com` (если настроен)

### 6.3 Проверка существующих сервисов

Убедитесь, что существующие сервисы (Telegram боты, другие сайты) продолжают работать нормально.

## Шаг 7: Настройка SSL (HTTPS) - Опционально

После того как домен заработает, рекомендуется настроить SSL сертификат через Let's Encrypt.

### 7.1 Установка Certbot

**Для Nginx:**
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

**Для Apache:**
```bash
sudo apt update
sudo apt install certbot python3-certbot-apache
```

### 7.2 Получение сертификата

**Для Nginx:**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Для Apache:**
```bash
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com
```

Следуйте инструкциям на экране. Certbot автоматически обновит конфигурацию веб-сервера.

### 7.3 Проверка автоматического обновления

Certbot автоматически настроит обновление сертификата. Проверить можно командой:

```bash
sudo certbot renew --dry-run
```

### 7.4 Раскомментирование HTTPS конфигурации

После получения сертификата, раскомментируйте HTTPS секцию в конфигурации веб-сервера (файлы `nginx-homepage.conf` или `apache-homepage.conf`).

## Troubleshooting

### Проблема: Домен не открывается

**Решение:**
1. Проверьте DNS: `nslookup yourdomain.com`
2. Проверьте, что веб-сервер запущен: `sudo systemctl status nginx` или `sudo systemctl status apache2`
3. Проверьте логи: `sudo tail -f /var/log/nginx/yourdomain.com.error.log` или `sudo tail -f /var/log/apache2/yourdomain.com_error.log`
4. Проверьте права доступа к файлам: `ls -la /var/www/yourdomain.com/`

### Проблема: 403 Forbidden

**Решение:**
```bash
sudo chown -R www-data:www-data /var/www/yourdomain.com
sudo chmod -R 755 /var/www/yourdomain.com
```

### Проблема: 404 Not Found для маршрутов React Router

**Решение:**
Убедитесь, что в конфигурации веб-сервера включена поддержка SPA routing:
- **Nginx**: `try_files $uri $uri/ /index.html;`
- **Apache**: `RewriteRule . /index.html [L]`

### Проблема: Конфликт с существующими сервисами

**Решение:**
Убедитесь, что:
- Используется отдельный виртуальный хост для нового домена
- Конфигурация слушает только на новом домене (`server_name` в Nginx, `ServerName` в Apache)
- Существующие конфигурации не изменены
- Новый домен не совпадает с существующими доменами
- Используется отдельная директория `/var/www/yourdomain.com`

**Если конфликт обнаружен:**
1. Проверьте существующие конфигурации: `grep -r "yourdomain.com" /etc/nginx/sites-enabled/` или `grep -r "yourdomain.com" /etc/apache2/sites-enabled/`
2. Используйте другой домен или поддомен
3. Убедитесь, что DNS настроен правильно

### Проблема: Статические файлы не загружаются

**Решение:**
1. Проверьте пути к файлам в `index.html`
2. Убедитесь, что в `vite.config.ts` установлен правильный `base` (если используется поддиректория)
3. Проверьте права доступа к директории `assets/`

## Обновление сайта

Для обновления сайта повторите шаги 1 и 3:

1. Соберите новую версию: `npm run build`
2. Загрузите файлы на сервер (замените существующие)
3. Перезагрузите веб-сервер: `sudo systemctl reload nginx` или `sudo systemctl reload apache2`

## Безопасность

- ✅ Отдельный виртуальный хост изолирует новый домен от существующих сервисов
- ✅ Отдельная директория `/var/www/yourdomain.com/` изолирует файлы
- ✅ Конфигурация слушает только на новом домене
- ✅ Настроены базовые security headers
- ✅ Рекомендуется настроить SSL (HTTPS) после развертывания

## Дополнительные ресурсы

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Apache Documentation](https://httpd.apache.org/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Namecheap DNS Guide](https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/)

## Поддержка

Если возникли проблемы, проверьте:
1. Логи веб-сервера
2. Логи системы: `journalctl -u nginx` или `journalctl -u apache2`
3. Конфигурацию веб-сервера на синтаксические ошибки
