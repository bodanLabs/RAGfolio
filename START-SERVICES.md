# Starting RAGfolio Services

This guide explains how to start all services required for RAGfolio.

## Prerequisites

Before starting, make sure you have:

1. **PostgreSQL** running with pgvector extension enabled
   - Default connection: `postgresql://rag_admin:raG_admiN@localhost:5432/ragfolio_db`
   - Enable pgvector: `CREATE EXTENSION vector;`

2. **Redis** running
   - Default: `redis://localhost:6379/0`

3. **Python virtual environment** created and dependencies installed
   ```powershell
   cd apps/api
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

4. **Node.js dependencies** installed
   ```powershell
   pnpm install
   ```

## Method 1: Using the PowerShell Script (Recommended)

### Start All Services
```powershell
.\start-all.ps1
```

This will open separate PowerShell windows for:
- Celery Worker (document processing)
- FastAPI Backend (http://localhost:8000)
- Frontend Web App (http://localhost:8080)

### Stop All Services
```powershell
.\stop-all.ps1
```

Or simply close the PowerShell windows.

## Method 2: Using pnpm (Single Terminal)

Start all services in one terminal:

```powershell
pnpm dev
```

This starts:
- Frontend Web App
- FastAPI Backend
- Celery Worker

All output will be in the same terminal with color-coded prefixes.

## Method 3: Manual Start (Separate Terminals)

### Terminal 1: Celery Worker
```powershell
cd apps/api
.\.venv\Scripts\Activate.ps1
celery -A app.celery_app worker --loglevel=info
```

### Terminal 2: FastAPI Backend
```powershell
cd apps/api
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

### Terminal 3: Frontend Web App
```powershell
cd apps/web
pnpm dev
```

## Service URLs

Once started, access:

- **Frontend**: http://localhost:8080 (or check Vite output)
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

## Troubleshooting

### Services won't start

1. **Check PostgreSQL is running**
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 5432
   ```

2. **Check Redis is running**
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 6379
   ```

3. **Check virtual environment**
   ```powershell
   cd apps/api
   .\.venv\Scripts\Activate.ps1
   python --version
   ```

4. **Run diagnostics**
   ```powershell
   cd apps/api
   .\.venv\Scripts\Activate.ps1
   python diagnose_rag.py <your_organization_id>
   ```

### Port already in use

If you get "port already in use" errors:

1. Find what's using the port:
   ```powershell
   Get-NetTCPConnection -LocalPort 8000
   Get-NetTCPConnection -LocalPort 8080
   ```

2. Stop the process or use different ports in your `.env` file

## Quick Commands

```powershell
# Start everything (PowerShell script)
.\start-all.ps1

# Start everything (pnpm - single terminal)
pnpm dev

# Stop everything
.\stop-all.ps1

# Or use pnpm scripts
pnpm start:all
pnpm stop:all
```
