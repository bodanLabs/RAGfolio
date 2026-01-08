"""Celery tasks for document processing."""

from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.celery_app import celery_app
from app.db.tables import Document, DocumentChunk
from app.db.enums import DocumentStatusEnum
from app.db.session import SessionLocal
from app.services.text_extraction import TextExtractionService
from app.services.chunking import ChunkingService
from app.services.embedding import EmbeddingService
from app.services.file_storage import FileStorageService
from app.settings import settings


def get_db_session() -> Session:
    """Get a database session for Celery tasks."""
    return SessionLocal()


@celery_app.task(bind=True, name="process_document")
def process_document_task(self, document_id: int, organization_id: int, api_key: Optional[str] = None):
    """Process a document: extract text, chunk, and generate embeddings.
    
    Args:
        document_id: Document ID
        organization_id: Organization ID
        api_key: OpenAI API key (optional, uses settings if not provided)
        
    Returns:
        Dictionary with processing results
    """
    db = get_db_session()
    try:
        # Get document
        document = db.query(Document).filter(Document.id == document_id).first()
        if document is None:
            return {"error": "Document not found", "document_id": document_id}
        
        # Update status to processing
        document.status = DocumentStatusEnum.PROCESSING
        db.commit()
        
        # Initialize services
        file_storage = FileStorageService()
        text_extraction = TextExtractionService()
        chunking_service = ChunkingService()
        embedding_service = EmbeddingService(api_key=api_key)
        
        try:
            # Get full file path
            full_file_path = file_storage.storage_path / document.file_path
            
            # Extract text
            text_content = text_extraction.extract_text(
                str(full_file_path),
                document.file_type.value
            )
            
            # Chunk text
            chunks = chunking_service.chunk_text(text_content)
            
            if not chunks:
                raise ValueError("No text chunks extracted from document")
            
            # Generate embeddings in batches
            chunk_texts = [chunk.text for chunk in chunks]
            embeddings = embedding_service.generate_embeddings_batch(
                chunk_texts,
                batch_size=settings.embedding_batch_size
            )
            
            # Store chunks and embeddings
            # Convert embeddings to pgvector format
            import numpy as np
            
            chunk_objects = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                # pgvector accepts list of floats
                chunk_obj = DocumentChunk(
                    document_id=document.id,
                    chunk_index=chunk.chunk_index,
                    text_content=chunk.text,
                    embedding=embedding,  # pgvector will handle conversion
                    page_number=chunk.page_number,
                    char_start=chunk.char_start,
                    char_end=chunk.char_end
                )
                chunk_objects.append(chunk_obj)
                db.add(chunk_obj)
            
            # Update document
            document.status = DocumentStatusEnum.READY
            document.chunk_count = len(chunk_objects)
            document.processed_at = datetime.utcnow()
            document.error_message = None
            
            db.commit()
            
            # Update quota
            from app.services.quota import QuotaService
            quota_service = QuotaService(db)
            quota_service.update_chunk_count(organization_id, len(chunk_objects))
            
            return {
                "success": True,
                "document_id": document_id,
                "chunks_created": len(chunk_objects)
            }
            
        except Exception as e:
            # Mark document as failed
            document.status = DocumentStatusEnum.FAILED
            document.error_message = str(e)
            db.commit()
            
            return {
                "success": False,
                "error": str(e),
                "document_id": document_id
            }
    
    finally:
        db.close()
