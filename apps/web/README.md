# RAGfolio Web

React + TypeScript frontend for the RAGfolio application.

## Tech Stack

- React 18
- TypeScript 5
- Vite 5
- ESLint

## Getting Started

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

The app will be available at http://localhost:3000

### Building

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
src/
├── components/     # React components
├── hooks/          # Custom React hooks
├── services/       # API services
├── types/          # TypeScript types (imported from @ragfolio/types)
├── utils/          # Utility functions
├── App.tsx         # Main app component
├── main.tsx        # Entry point
└── index.css       # Global styles
```

## API Integration

The Vite dev server is configured to proxy API requests to the FastAPI backend:

- Frontend: http://localhost:3000
- API Proxy: http://localhost:3000/api → http://localhost:8000

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Lint code
- `pnpm clean` - Clean build artifacts

## Next Steps

- Add routing (React Router)
- Add state management (Zustand/Redux)
- Add UI component library (shadcn/ui, MUI, etc.)
- Add styling solution (Tailwind CSS, CSS Modules, etc.)
- Implement chat interface for RAG
- Add authentication
