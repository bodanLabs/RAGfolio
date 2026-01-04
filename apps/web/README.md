# RAGFolio Web

Frontend application for RAGFolio - A modern RAG (Retrieval-Augmented Generation) application built by Bodanlabs.

## Overview

RAGFolio Web is the frontend component of the RAGFolio monorepo. It provides a modern, responsive user interface for interacting with the RAG system, managing documents, and conducting AI-powered conversations.

## Tech Stack

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React 18** - Modern UI library
- **shadcn-ui** - High-quality component library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Zod** - Schema validation

## Getting Started

### Prerequisites

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0

### Installation

1. **Install dependencies** (from the monorepo root)
   ```bash
   pnpm install
   ```

2. **Navigate to the web app**
   ```bash
   cd apps/web
   ```

### Development

#### Run from monorepo root (recommended)
```bash
pnpm dev
```

This will start both the frontend and backend concurrently.

#### Run frontend only
```bash
cd apps/web
pnpm dev
```

The application will be available at: **http://localhost:8080**

The development server includes:
- Hot module replacement (HMR)
- Fast refresh
- TypeScript type checking
- ESLint integration

### Building for Production

```bash
# Build from monorepo root
pnpm build

# Or build from web directory
cd apps/web
pnpm build
```

The production build will be output to `apps/web/dist/`.

### Preview Production Build

```bash
cd apps/web
pnpm preview
```

## Project Structure

```
apps/web/
├── src/
│   ├── components/     # React components
│   │   ├── layout/    # Layout components (AppShell, Sidebar, etc.)
│   │   └── ui/        # shadcn-ui components
│   ├── contexts/      # React contexts (AppContext, etc.)
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions
│   ├── pages/         # Page components
│   ├── types/         # TypeScript type definitions
│   ├── App.tsx        # Main app component
│   └── main.tsx       # Entry point
├── public/            # Static assets
├── index.html         # HTML template
└── vite.config.ts     # Vite configuration
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm build:dev` - Build in development mode
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

## Features

- 🎨 Modern, responsive UI with shadcn-ui components
- 🔄 Real-time updates with React Query
- 🧭 Client-side routing with React Router
- 📝 Form validation with React Hook Form + Zod
- 🎯 Type-safe code with TypeScript
- ⚡ Fast development experience with Vite
- 🎭 Dark mode support
- 📱 Mobile-responsive design

## Integration with Backend

The frontend communicates with the RAGFolio API backend:

- **API Base URL**: http://localhost:8000 (development)
- **API Documentation**: http://localhost:8000/docs

Configure the API endpoint in your environment variables if needed.

## Contributing

This project is part of the RAGFolio monorepo. See the main [README.md](../../README.md) for contribution guidelines.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## About

RAGFolio is developed by **Bodanlabs**.
