# RAGfolio

A modern RAG (Retrieval-Augmented Generation) application built with a monorepo architecture. RAGfolio enables organizations to upload documents, process them into vector embeddings, and interact with them through an AI-powered chat interface using RAG technology.

## Project Description

RAGfolio is a comprehensive RAG application that allows organizations to:
- Upload and manage documents (PDF, DOCX, TXT)
- Process documents into searchable vector embeddings
- Chat with documents using AI-powered RAG (Retrieval-Augmented Generation)
- Manage organizations, members, and invitations
- Configure and manage LLM API keys securely
- Track usage and quotas

The application uses PostgreSQL with pgvector extension for vector storage, Redis for caching and task queuing, and Celery for background document processing.

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **UI Library**: shadcn-ui
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router
- **Form Management**: React Hook Form + Zod

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Server**: Uvicorn
- **Database**: PostgreSQL with pgvector extension
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Task Queue**: Celery with Redis broker
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **AI/ML**: OpenAI API for embeddings and chat

### Infrastructure
- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Background Tasks**: Celery
- **Message Broker**: Redis
- **File Storage**: Local filesystem (configurable for S3)

## Project Structure

```
RAGfolio/
├── apps/
│   ├── web/              # React frontend application
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── pages/       # Page components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── contexts/    # React contexts
│   │   │   └── api/         # API client functions
│   │   └── package.json
│   └── api/              # FastAPI backend application
│       ├── app/
│       │   ├── routers/     # API route handlers
│       │   ├── models/      # Pydantic models
│       │   ├── services/    # Business logic
│       │   ├── db/          # Database configuration
│       │   ├── tasks/       # Celery tasks
│       │   └── main.py      # Application entry point
│       ├── alembic/         # Database migrations
│       └── requirements.txt
├── packages/
│   ├── types/            # Shared TypeScript types
│   └── config/           # Shared configurations (ESLint, TypeScript)
└── package.json          # Root package.json with workspace scripts
```

## Features & Functionalities

### Authentication & Authorization
- User registration and login
- JWT-based authentication
- Organization-based access control
- Member management and invitations
- Role-based permissions

### Document Management
- Upload documents (PDF, DOCX, TXT)
- Automatic text extraction
- Document chunking and processing
- Vector embedding generation
- Document search and retrieval
- Document statistics and analytics

### RAG Chat System
- Create and manage chat sessions
- AI-powered chat with document context
- Source citation and references
- Message history
- Vector similarity search for relevant chunks

### Organization Management
- Create and manage organizations
- Invite members via email
- Manage member roles and permissions
- Organization statistics and quotas
- Usage tracking

### LLM Configuration
- Secure storage of LLM API keys (encrypted)
- Multiple LLM provider support
- API key testing and validation
- Active key management

### Background Processing
- Asynchronous document processing with Celery
- Background embedding generation
- Task queue management with Redis

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **Python**: >= 3.11
- **PostgreSQL**: >= 14.0 (with pgvector extension)
- **Redis**: >= 6.0

### Installing Prerequisites

#### Node.js and pnpm
```bash
# Install Node.js from https://nodejs.org/
# Install pnpm globally
npm install -g pnpm
```

#### PostgreSQL with pgvector

**On Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install pgvector extension:
   ```bash
   # Using pgAdmin or psql, connect to your database and run:
   CREATE EXTENSION vector;
   ```

**On macOS (using Homebrew):**
```bash
brew install postgresql@14
brew install pgvector
```

**On Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql-14 postgresql-contrib
# Install pgvector from source or using apt
```

#### Redis

**On Windows:**
- Download from https://redis.io/download or use WSL

**On macOS:**
```bash
brew install redis
brew services start redis
```

**On Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

## Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd RAGfolio
```

### Step 2: Install Node.js Dependencies

```bash
pnpm install
```

### Step 3: Set Up Python Environment

```bash
cd apps/api

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows
.\venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### Step 4: Set Up PostgreSQL Database

1. **Create PostgreSQL database and user:**

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE ragfolio_db;

-- Create user
CREATE USER rag_admin WITH PASSWORD 'raG_admiN';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ragfolio_db TO rag_admin;

-- Connect to the database
\c ragfolio_db

-- Enable pgvector extension
CREATE EXTENSION vector;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO rag_admin;
```

2. **Verify pgvector extension:**
```sql
\dx vector
```

You should see the `vector` extension listed.

### Step 5: Set Up Redis

1. **Start Redis server:**

```bash
# On Windows (if installed)
redis-server

# On macOS/Linux
sudo systemctl start redis
# or
redis-server
```

2. **Verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

### Step 6: Configure Environment Variables

Create a `.env` file in `apps/api/` directory:

```bash
cd apps/api
cp .env.example .env  # If .env.example exists
# Otherwise, create .env manually
```

**Required Environment Variables:**

```env
# Application
APP_NAME=RAGfolio API
DEBUG=True

# Database (PostgreSQL with pgvector)
DATABASE_URL=postgresql+psycopg://rag_admin:raG_admiN@localhost:5432/ragfolio_db

# JWT Authentication
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Storage
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./storage

# For S3 storage (optional):
# STORAGE_TYPE=s3
# STORAGE_S3_BUCKET=your-bucket-name
# STORAGE_S3_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key

# Encryption (for LLM API keys)
# Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
ENCRYPTION_KEY=your-encryption-key-generate-with-fernet

# Invitations
INVITATION_EXPIRY_HOURS=72

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:8080,http://localhost:5173,http://localhost:3000

# Redis (for caching and rate limiting)
REDIS_URL=redis://localhost:6379/0

# Celery (background tasks)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# OpenAI (for embeddings and chat)
OPENAI_API_KEY=your-openai-api-key

# Performance Settings
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
RATE_LIMIT_REQUESTS_PER_MINUTE=100
VECTOR_SEARCH_DEFAULT_LIMIT=5
VECTOR_SEARCH_MAX_LIMIT=10
EMBEDDING_BATCH_SIZE=100
MAX_FILE_SIZE_MB=50

# Database Connection Pool
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10
DB_POOL_RECYCLE=3600

# Email (optional, for invitations)
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=noreply@ragfolio.com
MAIL_PORT=587
MAIL_SERVER=
MAIL_STARTTLS=True
MAIL_SSL_TLS=False
MAIL_USE_CREDENTIALS=True
MAIL_VALIDATE_CERTS=True
```

**Important Notes:**
- Generate a secure `JWT_SECRET_KEY` for production
- Generate an `ENCRYPTION_KEY` using the command shown in the comment
- Add your `OPENAI_API_KEY` to enable embeddings and chat functionality
- Update `DATABASE_URL` if your PostgreSQL credentials differ

### Step 7: Run Database Migrations

```bash
cd apps/api

# Make sure virtual environment is activated
# On Windows
.\venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

# Run migrations
alembic upgrade head
```

This will:
- Create all necessary database tables
- Enable the pgvector extension (if not already enabled)
- Set up the schema for users, organizations, documents, chat sessions, etc.

### Step 8: Start Services

You have three options to start the application:

#### Option 1: Start All Services with pnpm (Recommended)

```bash
# From project root
pnpm dev
```

This starts:
- Frontend web app (http://localhost:8080)
- FastAPI backend (http://localhost:8000)
- Celery worker (for background tasks)

#### Option 2: Start All Services with PowerShell Script (Windows)

```powershell
.\start-all.ps1
```

This opens separate PowerShell windows for each service.

#### Option 3: Start Services Manually (Separate Terminals)

**Terminal 1: Celery Worker**
```bash
cd apps/api

# Activate virtual environment
.\venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # macOS/Linux

# Start Celery worker
celery -A app.celery_app worker --loglevel=info --pool=solo
# Note: --pool=solo is required on Windows
```

**Terminal 2: FastAPI Backend**
```bash
cd apps/api

# Activate virtual environment
.\venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # macOS/Linux

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

**Terminal 3: Frontend Web App**
```bash
cd apps/web
pnpm dev
```

### Step 9: Verify Installation

1. **Check Backend API:**
   - API: http://localhost:8000
   - API Docs (Swagger): http://localhost:8000/docs
   - Alternative Docs (ReDoc): http://localhost:8000/redoc
   - Health Check: http://localhost:8000/health

2. **Check Frontend:**
   - Web App: http://localhost:8080 (or port shown in Vite output)

3. **Check Celery:**
   - Look for "celery@hostname ready" message in Celery worker terminal

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Organizations
- `GET /api/organizations` - List user's organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/{org_id}` - Get organization details
- `PATCH /api/organizations/{org_id}` - Update organization
- `DELETE /api/organizations/{org_id}` - Delete organization
- `GET /api/organizations/{org_id}/stats` - Get organization statistics
- `GET /api/organizations/{org_id}/members` - List members
- `POST /api/organizations/{org_id}/invitations` - Send invitation
- `GET /api/organizations/{org_id}/invitations` - List invitations
- `POST /api/organizations/invitations/{token}/accept` - Accept invitation

### Documents
- `GET /api/documents` - List documents
- `GET /api/documents/{doc_id}` - Get document details
- `POST /api/documents/upload` - Upload document
- `DELETE /api/documents/{doc_id}` - Delete document
- `POST /api/documents/{doc_id}/reprocess` - Reprocess document
- `GET /api/documents/organizations/{org_id}/stats` - Get document statistics

### Chat
- `GET /api/chat/sessions` - List chat sessions
- `POST /api/chat/sessions` - Create chat session
- `GET /api/chat/sessions/{session_id}` - Get session details
- `PATCH /api/chat/sessions/{session_id}` - Update session
- `DELETE /api/chat/sessions/{session_id}` - Delete session
- `GET /api/chat/sessions/{session_id}/messages` - Get messages
- `POST /api/chat/sessions/{session_id}/messages` - Send message

### LLM Keys
- `GET /api/organizations/{org_id}/llm-keys` - List LLM API keys
- `POST /api/organizations/{org_id}/llm-keys` - Add LLM API key
- `PATCH /api/organizations/{org_id}/llm-keys/{key_id}` - Update LLM API key
- `DELETE /api/organizations/{org_id}/llm-keys/{key_id}` - Delete LLM API key
- `POST /api/organizations/{org_id}/llm-keys/{key_id}/activate` - Activate key
- `POST /api/organizations/{org_id}/llm-keys/test` - Test API key

### Users
- `PATCH /api/users/me` - Update current user profile

## Available Scripts

### Root Level (Monorepo)
- `pnpm dev` - Start all apps in development mode (frontend, backend, Celery)
- `pnpm build` - Build all apps for production
- `pnpm lint` - Lint all apps
- `pnpm test` - Run tests for all apps
- `pnpm clean` - Clean all build artifacts and dependencies
- `pnpm start:all` - Start all services using PowerShell script (Windows)
- `pnpm stop:all` - Stop all services using PowerShell script (Windows)

### Frontend (apps/web)
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

### Backend (apps/api)
- `uvicorn app.main:app --reload` - Start development server
- `alembic upgrade head` - Run database migrations
- `alembic revision --autogenerate -m "description"` - Create new migration
- `celery -A app.celery_app worker --loglevel=info` - Start Celery worker
- `pytest` - Run tests

## Troubleshooting

### Database Connection Issues

1. **Verify PostgreSQL is running:**
   ```bash
   # Windows
   Test-NetConnection -ComputerName localhost -Port 5432
   
   # macOS/Linux
   psql -U postgres -h localhost -c "SELECT version();"
   ```

2. **Check pgvector extension:**
   ```sql
   psql -U rag_admin -d ragfolio_db -c "\dx vector"
   ```

3. **Verify database credentials in `.env` file**

### Redis Connection Issues

1. **Verify Redis is running:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Check Redis URL in `.env` file**

### Celery Worker Issues

1. **On Windows, make sure to use `--pool=solo`:**
   ```bash
   celery -A app.celery_app worker --loglevel=info --pool=solo
   ```

2. **Check Celery broker URL in `.env` file**

3. **Verify Redis is running (Celery uses Redis as broker)**

### Migration Issues

1. **If migrations fail, check database connection:**
   ```bash
   cd apps/api
   python -c "from app.settings import settings; print(settings.database_url)"
   ```

2. **Reset migrations (⚠️ WARNING: This will delete all data):**
   ```bash
   alembic downgrade base
   alembic upgrade head
   ```

### Port Already in Use

1. **Find process using the port:**
   ```bash
   # Windows
   Get-NetTCPConnection -LocalPort 8000
   
   # macOS/Linux
   lsof -i :8000
   ```

2. **Kill the process or change port in `.env` file**

## Development

### Running in Development Mode

The recommended way to develop is using `pnpm dev` which starts all services concurrently:

```bash
pnpm dev
```

This will:
- Start frontend with hot module replacement
- Start backend with auto-reload
- Start Celery worker for background tasks

### Database Migrations

When you make changes to database models:

1. **Create a new migration:**
   ```bash
   cd apps/api
   alembic revision --autogenerate -m "description of changes"
   ```

2. **Review the generated migration file** in `apps/api/alembic/versions/`

3. **Apply the migration:**
   ```bash
   alembic upgrade head
   ```

### Testing

```bash
# Run all tests
cd apps/api
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py
```

## Building for Production

### Frontend

```bash
cd apps/web
pnpm build
```

The production build will be in `apps/web/dist/`

### Backend

The backend doesn't require a build step. For production:

1. Set `DEBUG=False` in `.env`
2. Use a production WSGI server like Gunicorn:
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

3. Set up a process manager (PM2, systemd, etc.) for Celery workers

## Contributing

We welcome contributions to RAGfolio! Please follow these guidelines:

### Getting Started

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes:**
   - Follow the existing code style
   - Write tests for new features
   - Update documentation as needed

4. **Commit your changes:**
   ```bash
   git commit -m "Add: description of your changes"
   ```

5. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**

### Code Style

- **Python**: Follow PEP 8, use Black for formatting
- **TypeScript/JavaScript**: Follow ESLint rules, use Prettier for formatting
- **Commit Messages**: Use conventional commits format

### Testing

- Write tests for new features
- Ensure all existing tests pass
- Aim for good test coverage

### Documentation

- Update README.md if needed
- Add docstrings to new functions/classes
- Update API documentation if endpoints change

### Pull Request Process

1. Ensure your code follows the project's style guidelines
2. Make sure all tests pass
3. Update documentation as needed
4. Request review from maintainers
5. Address any feedback

### Reporting Issues

When reporting issues, please include:
- Description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Python version, Node version, etc.)
- Relevant logs or error messages

## Support

For questions, issues, or contributions, please open an issue on GitHub or contact the maintainers.

---

**Built with ❤️ by Bodanlabs**
