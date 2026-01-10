# PowerShell script to clear all signals via API
Write-Host "🗑️  Clearing all signals from database..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/signals/all" -Method Delete
    Write-Host "✅ Successfully deleted signals!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error clearing signals: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
