# RAGfolio

A modern RAG (Retrieval-Augmented Generation) application built with a monorepo architecture.

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: CSS (easily extensible to Tailwind CSS or other solutions)

### Backend
- **Framework**: FastAPI (Python)
- **Server**: Uvicorn
- **AI/ML**: Ready for LangChain, OpenAI, ChromaDB, and other RAG tools

### Monorepo
- **Tool**: Turborepo
- **Package Manager**: pnpm
- **Shared Packages**: TypeScript types and configs

## Project Structure

```
RAGfolio/
├── apps/
│   ├── web/          # React frontend application
│   └── api/          # FastAPI backend application
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── config/       # Shared configurations (ESLint, TypeScript)
├── docs/             # Documentation
└── .github/          # CI/CD workflows
```

## Getting Started

### Prerequisites

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **Python**: >= 3.11

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RAGfolio
   ```

2. **Install Node.js dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Python environment for backend**
   ```bash
   cd apps/api
   python -m venv venv

   # On Windows
   .\venv\Scripts\activate

   # On macOS/Linux
   source venv/bin/activate

   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   # Root level
   cp .env.example .env

   # Backend
   cp apps/api/.env.example apps/api/.env
   ```

### Development

#### Run everything (recommended)
```bash
pnpm dev
```

#### Run frontend only
```bash
cd apps/web
pnpm dev
```
Frontend will be available at: http://localhost:3000

#### Run backend only
```bash
cd apps/api
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
uvicorn app.main:app --reload --port 8000
```
API will be available at: http://localhost:8000
API docs will be available at: http://localhost:8000/docs

### Building for Production

```bash
# Build all apps
pnpm build

# Build frontend only
cd apps/web
pnpm build

# Backend doesn't require a build step
```

## Available Scripts

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps for production
- `pnpm lint` - Lint all apps
- `pnpm test` - Run tests for all apps
- `pnpm clean` - Clean all build artifacts and dependencies

## Project Features

- **Monorepo Architecture**: Organized with Turborepo for efficient builds
- **Type Safety**: Shared TypeScript types between frontend and backend
- **Modern Stack**: Latest versions of React, Vite, and FastAPI
- **Developer Experience**: Hot reload, fast builds, proper tooling
- **RAG-Ready**: Backend structure supports vector databases, LLMs, and embedding integrations
- **Scalable**: Easy to add more apps or packages as needed

## Next Steps

1. **Frontend**: Add UI components, routing, state management
2. **Backend**: Implement RAG endpoints, integrate LangChain, add vector database
3. **Shared Types**: Expand type definitions as the API grows
4. **Testing**: Add unit and integration tests
5. **CI/CD**: Set up GitHub Actions workflows
6. **Documentation**: Expand API documentation

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
