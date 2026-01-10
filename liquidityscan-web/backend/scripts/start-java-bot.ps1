# PowerShell script to start Java Trading Bot with integration to NestJS backend
# This script configures the Java bot to send signals to our NestJS backend

$ErrorActionPreference = "Stop"

# Get the project root directory
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$javaBotJar = Join-Path $projectRoot "tradingBot.jar"
$backendUrl = "http://localhost:3000"
$javaBotPort = 8080

# Check if Java is installed
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "Java found: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Java is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Java 17 or higher" -ForegroundColor Yellow
    exit 1
}

# Check if JAR file exists
if (-not (Test-Path $javaBotJar)) {
    Write-Host "ERROR: Java bot JAR file not found at: $javaBotJar" -ForegroundColor Red
    exit 1
}

# Load environment variables from .env file
$envFile = Join-Path $projectRoot "liquidityscan-web\backend\.env"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables from .env..." -ForegroundColor Cyan
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remove quotes if present
            $value = $value -replace '^["'']|["'']$', ''
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Get API keys from environment
$binanceApiKey = $env:BINANCE_API_KEY
$binanceSecretKey = $env:BINANCE_API_SECRET
$mexcApiKey = $env:MEXC_API_KEY
$mexcSecretKey = $env:MEXC_API_SECRET

# Check if API keys are set
if (-not $binanceApiKey -or -not $binanceSecretKey) {
    Write-Host "WARNING: Binance API keys not found in environment variables" -ForegroundColor Yellow
    Write-Host "The bot will use keys from application.properties if available" -ForegroundColor Yellow
}

if (-not $mexcApiKey -or -not $mexcSecretKey) {
    Write-Host "WARNING: MEXC API keys not found in environment variables" -ForegroundColor Yellow
    Write-Host "The bot will use keys from application.properties if available" -ForegroundColor Yellow
}

# Create application.properties with API keys from .env if they exist
$propertiesFile = Join-Path $projectRoot "application.properties"
$propertiesContent = @"
server.port=$javaBotPort

# API Keys from .env file
"@

if ($binanceApiKey -and $binanceSecretKey) {
    $propertiesContent += @"

binance.api.key=$binanceApiKey
binance.secret.key=$binanceSecretKey
"@
}

if ($mexcApiKey -and $mexcSecretKey) {
    $propertiesContent += @"

mexc.api.key=$mexcApiKey
mexc.secret.key=$mexcSecretKey
"@
}

# Write properties file
$propertiesContent | Out-File -FilePath $propertiesFile -Encoding UTF8 -Force
Write-Host "Created application.properties with API keys from .env" -ForegroundColor Green

# Set Java options
$javaOpts = @(
    "-Xmx512m",
    "-Xms256m",
    "-Dspring.config.location=file:$propertiesFile"
)

# Build Java command
$javaCmd = "java"
$javaArgs = $javaOpts + @(
    "-jar",
    "`"$javaBotJar`""
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Starting Java Trading Bot" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "JAR File: $javaBotJar" -ForegroundColor White
Write-Host "Port: $javaBotPort" -ForegroundColor White
Write-Host "Backend URL: $backendUrl" -ForegroundColor White
Write-Host "`nThe bot will send signals to: $backendUrl/api/integrations/java-bot/signals" -ForegroundColor Yellow
Write-Host "`nPress Ctrl+C to stop the bot`n" -ForegroundColor Yellow

# Start Java bot
try {
    & $javaCmd $javaArgs
} catch {
    Write-Host "`nERROR: Failed to start Java bot" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
