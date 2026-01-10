# Скрипт для быстрого запуска проекта с Cloudflare Tunnel для демонстрации
# Требуется: cloudflared установлен

Write-Host "🚀 Запуск проекта для демонстрации..." -ForegroundColor Green

# Проверка cloudflared
$cloudflaredInstalled = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflaredInstalled) {
    Write-Host "❌ cloudflared не установлен!" -ForegroundColor Red
    Write-Host "Установите Cloudflare Tunnel:" -ForegroundColor Yellow
    Write-Host "  - Через Chocolatey: choco install cloudflared" -ForegroundColor Gray
    Write-Host "  - Или скачайте: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Gray
    Write-Host "  - Или через npm: npm install -g cloudflared" -ForegroundColor Gray
    exit 1
}

# Проверка Docker
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Docker не запущен. Запускаю Docker services..." -ForegroundColor Yellow
    docker-compose up -d
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "📋 Инструкции:" -ForegroundColor Cyan
Write-Host "1. Запустите Backend в отдельном терминале:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm run start:dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Запустите Frontend в отдельном терминале:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. После запуска Backend и Frontend, запустите Cloudflare Tunnel:" -ForegroundColor White
Write-Host "   cloudflared tunnel --url http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Скопируйте HTTPS URL от Cloudflare Tunnel и дайте товарищу!" -ForegroundColor Green
Write-Host "   (URL будет вида: https://xxxx-xxxx.trycloudflare.com)" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Не забудьте обновить CORS_ORIGIN в backend/.env с URL от Cloudflare Tunnel!" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Преимущества Cloudflare Tunnel:" -ForegroundColor Cyan
Write-Host "   - Бесплатно и безлимитно" -ForegroundColor Gray
Write-Host "   - Быстрее чем ngrok" -ForegroundColor Gray
Write-Host "   - Не нужна регистрация" -ForegroundColor Gray
Write-Host ""

# Опционально: автоматический запуск cloudflared (раскомментируйте если нужно)
# Write-Host "Запускаю Cloudflare Tunnel для Frontend..." -ForegroundColor Green
# Start-Process cloudflared -ArgumentList "tunnel --url http://localhost:5173"
