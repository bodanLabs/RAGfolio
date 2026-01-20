# RAGfolio - Start All Services Script
# This script starts all required services for the RAGfolio application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RAGfolio - Starting All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory (project root)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check if PostgreSQL is accessible (optional check)
Write-Host "  - PostgreSQL: " -NoNewline
try {
    $pgTest = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($pgTest.TcpTestSucceeded) {
        Write-Host "Running" -ForegroundColor Green
    } else {
        Write-Host "Not accessible (make sure PostgreSQL is running)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Not accessible (make sure PostgreSQL is running)" -ForegroundColor Yellow
}

# Check if Redis is accessible (optional check)
Write-Host "  - Redis: " -NoNewline
try {
    $redisTest = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($redisTest.TcpTestSucceeded) {
        Write-Host "Running" -ForegroundColor Green
    } else {
        Write-Host "Not accessible (make sure Redis is running)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Not accessible (make sure Redis is running)" -ForegroundColor Yellow
}

Write-Host ""

# Check if Python venv exists
$venvPath = Join-Path $scriptPath "apps\api\.venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "ERROR: Python virtual environment not found at: $venvPath" -ForegroundColor Red
    Write-Host "Please create it first: cd apps\api && python -m venv .venv" -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "WARNING: node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Green
Write-Host ""

# Start Celery Worker (in a new window)
Write-Host "  [1/3] Starting Celery Worker..." -ForegroundColor Cyan
$celeryScript = @"
cd `"$scriptPath\apps\api`"
.\.venv\Scripts\Activate.ps1
Write-Host 'Celery Worker Started (Windows - using solo pool)' -ForegroundColor Green
celery -A app.celery_app worker --loglevel=info --pool=solo
"@
$celeryScript | Out-File -FilePath "$env:TEMP\start_celery.ps1" -Encoding UTF8
Start-Process powershell -ArgumentList "-NoExit", "-File", "$env:TEMP\start_celery.ps1" -WindowStyle Normal

# Wait a moment for Celery to start
Start-Sleep -Seconds 2

# Start FastAPI Backend (in a new window)
Write-Host "  [2/3] Starting FastAPI Backend..." -ForegroundColor Cyan
$apiScript = @"
cd `"$scriptPath\apps\api`"
.\.venv\Scripts\Activate.ps1
Write-Host 'FastAPI Backend Started on http://localhost:8000' -ForegroundColor Green
Write-Host 'API Docs: http://localhost:8000/docs' -ForegroundColor Green
uvicorn app.main:app --reload --port 8000
"@
$apiScript | Out-File -FilePath "$env:TEMP\start_api.ps1" -Encoding UTF8
Start-Process powershell -ArgumentList "-NoExit", "-File", "$env:TEMP\start_api.ps1" -WindowStyle Normal

# Wait a moment for API to start
Start-Sleep -Seconds 3

# Start Frontend Web App (in a new window)
Write-Host "  [3/3] Starting Frontend Web App..." -ForegroundColor Cyan
$webScript = @"
cd `"$scriptPath\apps\web`"
Write-Host 'Frontend Web App Starting...' -ForegroundColor Green
pnpm dev
"@
$webScript | Out-File -FilePath "$env:TEMP\start_web.ps1" -Encoding UTF8
Start-Process powershell -ArgumentList "-NoExit", "-File", "$env:TEMP\start_web.ps1" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All services are starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor Yellow
Write-Host "  - Celery Worker: Processing documents" -ForegroundColor White
Write-Host "  - FastAPI Backend: http://localhost:8000" -ForegroundColor White
Write-Host "  - API Documentation: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  - Frontend Web App: http://localhost:8080 (or check the web window)" -ForegroundColor White
Write-Host ""
Write-Host "Note: Each service runs in a separate PowerShell window." -ForegroundColor Gray
Write-Host "      Close the windows to stop the services." -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit this script (services will continue running)..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
