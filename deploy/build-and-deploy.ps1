# Скрипт для сборки и подготовки статики к развертыванию (PowerShell)
# Использование: .\build-and-deploy.ps1 -Domain "yourdomain.com" -ServerUser "root" -ServerIP "123.45.67.89"

param(
    [string]$Domain = "yourdomain.com",
    [string]$ServerUser = "root",
    [string]$ServerIP = "",
    [switch]$SkipUpload
)

$ErrorActionPreference = "Stop"

# Цвета для вывода
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

$FrontendDir = "liquidityscan-web\frontend"
$BuildDir = "$FrontendDir\dist"
$DeployDir = "deploy"
$ArchiveName = "homepage-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"

Write-Success "=== Скрипт сборки и подготовки к развертыванию ==="
Write-Host ""

# Проверка наличия директории frontend
if (-not (Test-Path $FrontendDir)) {
    Write-Error "Ошибка: Директория $FrontendDir не найдена!"
    exit 1
}

# Переход в директорию frontend
Write-Warning "Шаг 1: Переход в директорию frontend..."
Push-Location $FrontendDir

try {
    # Проверка наличия node_modules
    if (-not (Test-Path "node_modules")) {
        Write-Warning "Шаг 2: Установка зависимостей..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Ошибка при установке зависимостей!"
            exit 1
        }
    } else {
        Write-Success "Зависимости уже установлены."
    }

    # Очистка предыдущей сборки
    if (Test-Path "dist") {
        Write-Warning "Шаг 3: Очистка предыдущей сборки..."
        Remove-Item -Recurse -Force dist
    }

    # Сборка проекта
    Write-Warning "Шаг 4: Сборка production версии..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Ошибка при сборке проекта!"
        exit 1
    }

    # Проверка успешности сборки
    if (-not (Test-Path "dist") -or (Get-ChildItem "dist" | Measure-Object).Count -eq 0) {
        Write-Error "Ошибка: Сборка не удалась или директория dist пуста!"
        exit 1
    }

    Write-Success "✓ Сборка завершена успешно!"
} finally {
    # Возврат в корневую директорию проекта
    Pop-Location
}

# Создание архива
Write-Warning "Шаг 5: Создание архива для развертывания..."
if (Test-Path $ArchiveName) {
    Remove-Item -Force $ArchiveName
}

# Создание ZIP архива
$distPath = Join-Path (Get-Location) $BuildDir
Compress-Archive -Path "$distPath\*" -DestinationPath $ArchiveName -Force

Write-Success "✓ Архив создан: $ArchiveName"

# Вывод информации о размере
$ArchiveSize = (Get-Item $ArchiveName).Length / 1MB
Write-Success "Размер архива: $([math]::Round($ArchiveSize, 2)) MB"
Write-Host ""

# Опциональная загрузка на сервер
if ($ServerIP -and -not $SkipUpload) {
    Write-Warning "Шаг 6: Загрузка на сервер..."
    Write-Success "Домен: $Domain"
    Write-Success "Сервер: ${ServerUser}@${ServerIP}"
    Write-Success "Директория на сервере: /var/www/$Domain"
    Write-Host ""

    $response = Read-Host "Продолжить загрузку? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        # Проверка наличия SCP (через SSH)
        $scpAvailable = Get-Command scp -ErrorAction SilentlyContinue
        if (-not $scpAvailable) {
            Write-Warning "SCP не найден. Установите OpenSSH или используйте другой метод загрузки."
            Write-Warning "Архив готов для ручной загрузки: $ArchiveName"
        } else {
            # Создание директории на сервере (если не существует)
            Write-Warning "Создание директории на сервере..."
            ssh "${ServerUser}@${ServerIP}" "sudo mkdir -p /var/www/$Domain"

            # Загрузка архива
            Write-Warning "Загрузка архива..."
            scp $ArchiveName "${ServerUser}@${ServerIP}:/tmp/"

            # Распаковка на сервере
            Write-Warning "Распаковка на сервере..."
            $remoteScript = @"
sudo unzip -q -o /tmp/$ArchiveName -d /var/www/$Domain/
sudo chown -R www-data:www-data /var/www/$Domain
sudo chmod -R 755 /var/www/$Domain
rm /tmp/$ArchiveName
"@
            ssh "${ServerUser}@${ServerIP}" $remoteScript

            Write-Success "✓ Файлы успешно загружены на сервер!"
            Write-Warning "Не забудьте настроить веб-сервер (Nginx/Apache) и DNS!"
        }
    } else {
        Write-Warning "Загрузка отменена. Архив готов для ручной загрузки."
    }
} else {
    Write-Warning "Шаг 6: Пропущен (не указан IP сервера или пропущена загрузка)"
    Write-Success "Архив готов для ручной загрузки: $ArchiveName"
}

Write-Host ""
Write-Success "=== Готово! ==="
Write-Host ""
Write-Host "Следующие шаги:"
Write-Host "1. Загрузите архив $ArchiveName на сервер (если еще не загружен)"
Write-Host "2. Распакуйте в /var/www/$Domain/"
Write-Host "3. Настройте веб-сервер (см. DEPLOYMENT_GUIDE.md)"
Write-Host "4. Настройте DNS в Namecheap"
Write-Host "5. Проверьте работу сайта"
