# Скрипт для проверки окружения сервера перед развертыванием (PowerShell)
# Использование: .\check-server-env.ps1 -ServerUser "root" -ServerIP "123.45.67.89"
# Или выполнить на сервере через SSH: ssh user@server 'bash -s' < check-server-env.sh

param(
    [string]$ServerUser = "root",
    [string]$ServerIP = ""
)

$ErrorActionPreference = "Continue"

# Цвета для вывода
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "=== Проверка окружения сервера ==="
Write-Host ""

if (-not $ServerIP) {
    Write-Error "Ошибка: Укажите IP адрес сервера"
    Write-Host "Использование: .\check-server-env.ps1 -ServerUser 'root' -ServerIP '123.45.67.89'"
    exit 1
}

# Проверка наличия SSH
$sshAvailable = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $sshAvailable) {
    Write-Error "SSH не найден. Установите OpenSSH или используйте bash скрипт напрямую на сервере."
    exit 1
}

Write-Info "Подключение к серверу: ${ServerUser}@${ServerIP}"
Write-Host ""

# Загрузка и выполнение bash скрипта на сервере
$scriptContent = Get-Content "$PSScriptRoot\check-server-env.sh" -Raw -ErrorAction SilentlyContinue

if ($scriptContent) {
    # Выполняем bash скрипт на сервере
    $scriptContent | ssh "${ServerUser}@${ServerIP}" "bash -s"
} else {
    Write-Warning "Не удалось найти check-server-env.sh"
    Write-Info "Выполняю базовую проверку через SSH..."
    Write-Host ""
    
    # Базовая проверка через отдельные команды
    Write-Info "1. Информация об операционной системе:"
    ssh "${ServerUser}@${ServerIP}" "cat /etc/os-release | grep -E '^NAME=|^VERSION=' || echo 'Не удалось определить ОС'"
    Write-Host ""
    
    Write-Info "2. Проверка веб-серверов:"
    
    # Проверка Nginx
    $nginxCheck = ssh "${ServerUser}@${ServerIP}" "command -v nginx >/dev/null 2>&1 && echo 'yes' || echo 'no'"
    if ($nginxCheck -eq "yes") {
        Write-Success "✓ Nginx установлен"
        $nginxVersion = ssh "${ServerUser}@${ServerIP}" "nginx -v 2>&1 | ForEach-Object { `$_ -replace '.*/', '' }"
        Write-Success "  Версия: $nginxVersion"
        Write-Host "  Активные сайты:"
        ssh "${ServerUser}@${ServerIP}" "ls -la /etc/nginx/sites-enabled/ 2>/dev/null | Select-Object -Skip 1 || echo '  (нет активных сайтов)'"
    } else {
        Write-Error "✗ Nginx не установлен"
    }
    Write-Host ""
    
    # Проверка Apache
    $apacheCheck = ssh "${ServerUser}@${ServerIP}" "(command -v apache2 >/dev/null 2>&1 || command -v httpd >/dev/null 2>&1) && echo 'yes' || echo 'no'"
    if ($apacheCheck -eq "yes") {
        Write-Success "✓ Apache установлен"
        $apacheCmd = ssh "${ServerUser}@${ServerIP}" "command -v apache2 || command -v httpd"
        Write-Host "  Активные сайты:"
        ssh "${ServerUser}@${ServerIP}" "ls -la /etc/apache2/sites-enabled/ 2>/dev/null | Select-Object -Skip 1 || ls -la /etc/httpd/conf.d/*.conf 2>/dev/null || echo '  (нет активных сайтов)'"
    } else {
        Write-Error "✗ Apache не установлен"
    }
    Write-Host ""
    
    Write-Info "3. Существующие директории веб-серверов:"
    ssh "${ServerUser}@${ServerIP}" "ls -ld /var/www/* 2>/dev/null | ForEach-Object { `$_.Split()[8] } || echo '  (нет директорий в /var/www/)'"
    Write-Host ""
}

Write-Host ""
Write-Success "=== Проверка завершена ==="
Write-Host ""
Write-Warning "ВАЖНО: Перед развертыванием убедитесь, что:"
Write-Host "  1. Новый домен не конфликтует с существующими"
Write-Host "  2. Используется отдельная директория: /var/www/yourdomain.com"
Write-Host "  3. Конфигурация проверена перед применением"
Write-Host "  4. Существующие сервисы не затронуты"
