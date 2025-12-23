# RAGfolio API

FastAPI backend for the RAGfolio application.

## Tech Stack

- FastAPI
- Python 3.11+
- Uvicorn
- Pydantic

## Getting Started

### Installation

1. **Create virtual environment**
   ```bash
   python -m venv venv
   ```

2. **Activate virtual environment**
   ```bash
   # On Windows
   .\venv\Scripts\activate

   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

### Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration.

### Development

Start the development server:

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Interactive docs (Swagger): http://localhost:8000/docs
- Alternative docs (ReDoc): http://localhost:8000/redoc

## Project Structure

```
app/
├── routers/        # API route handlers
├── models/         # Pydantic models
├── services/       # Business logic
├── utils/          # Utility functions
└── main.py         # Application entry point

tests/              # Test files
```

## API Endpoints

### Health Check
- `GET /` - Root endpoint with API info
- `GET /health` - Health check

### Coming Soon
- `POST /api/chat` - Chat with RAG system
- `POST /api/documents` - Upload documents
- `GET /api/documents` - List documents
- `DELETE /api/documents/{id}` - Delete document

## Testing

Run tests with pytest:

```bash
pytest
```

With coverage:

```bash
pytest --cov=app tests/
```

## RAG Integration

This backend is structured to easily integrate RAG components:

1. **Vector Database**: Add ChromaDB, Pinecone, or Weaviate in `services/`
2. **Embeddings**: Use OpenAI, Hugging Face, or Sentence Transformers
3. **LLM**: Integrate OpenAI, Anthropic, or local models via LangChain
4. **Document Processing**: Add loaders in `utils/` for PDF, DOCX, etc.

Example dependencies to add:

```bash
pip install langchain openai chromadb sentence-transformers
```

## Available Scripts

- `uvicorn app.main:app --reload` - Start development server
- `pytest` - Run tests
- `black .` - Format code
- `isort .` - Sort imports

## Next Steps

- Implement RAG endpoints
- Add vector database integration
- Integrate LLM (OpenAI, Anthropic, etc.)
- Add document processing
- Implement authentication
- Add rate limiting
- Set up logging
- Add caching
