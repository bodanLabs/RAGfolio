# RAGfolio - Stop All Services Script
# This script stops all RAGfolio services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RAGfolio - Stopping All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop processes by name
$processes = @(
    "celery",
    "uvicorn",
    "node"  # This will stop Vite, but be careful - it might stop other Node processes
)

$stopped = 0

foreach ($procName in $processes) {
    $procs = Get-Process -Name $procName -ErrorAction SilentlyContinue
    if ($procs) {
        Write-Host "Stopping $procName processes..." -ForegroundColor Yellow
        foreach ($proc in $procs) {
            # Check if it's related to our project by checking command line
            $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
            if ($cmdLine -match "ragfolio|celery|uvicorn|vite" -or $procName -eq "celery" -or $procName -eq "uvicorn") {
                try {
                    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                    Write-Host "  - Stopped process $($proc.Id) ($procName)" -ForegroundColor Green
                    $stopped++
                } catch {
                    Write-Host "  - Could not stop process $($proc.Id)" -ForegroundColor Red
                }
            }
        }
    }
}

# Also try to stop by port (more reliable)
Write-Host ""
Write-Host "Checking ports..." -ForegroundColor Yellow

# Port 8000 - FastAPI
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($port8000) {
    $pid8000 = $port8000.OwningProcess
    Write-Host "Stopping process on port 8000 (PID: $pid8000)..." -ForegroundColor Yellow
    Stop-Process -Id $pid8000 -Force -ErrorAction SilentlyContinue
    $stopped++
}

# Port 8080 or 5173 - Vite (check common ports)
$vitePorts = @(8080, 5173, 3000)
foreach ($port in $vitePorts) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        $pid = $conn.OwningProcess
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -eq "node") {
            Write-Host "Stopping process on port $port (PID: $pid)..." -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            $stopped++
        }
    }
}

Write-Host ""
if ($stopped -gt 0) {
    Write-Host "Stopped $stopped service(s)" -ForegroundColor Green
} else {
    Write-Host "No RAGfolio services found running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Note: If services are still running, you may need to close the PowerShell windows manually." -ForegroundColor Gray
Write-Host ""
