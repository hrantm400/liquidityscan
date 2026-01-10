# PowerShell script to filter Google OAuth logs from backend
# Usage: npm run start:dev | Select-String -Pattern "Google|OAuth|CORS" | Tee-Object -FilePath "oauth-logs.txt"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Google OAuth Log Filter" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To use this filter, run:" -ForegroundColor Yellow
Write-Host "  npm run start:dev | Select-String -Pattern 'Google|OAuth|CORS|Strategy' | Tee-Object -FilePath 'oauth-logs.txt'" -ForegroundColor Green
Write-Host ""
Write-Host "Or to see only OAuth logs in real-time:" -ForegroundColor Yellow
Write-Host "  npm run start:dev | Select-String -Pattern 'Google|OAuth|CORS|Strategy'" -ForegroundColor Green
Write-Host ""
Write-Host "This will show only:" -ForegroundColor Yellow
Write-Host "  - [GoogleStrategy] logs" -ForegroundColor White
Write-Host "  - [Google OAuth Callback] logs" -ForegroundColor White
Write-Host "  - [CORS] logs" -ForegroundColor White
Write-Host "  - [OAuthHandler] logs (if any)" -ForegroundColor White
Write-Host ""
