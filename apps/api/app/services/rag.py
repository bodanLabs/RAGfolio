"""Service for RAG (Retrieval-Augmented Generation) operations."""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text
from pgvector.sqlalchemy import Vector

from app.db.tables import DocumentChunk, Document
from app.db.enums import DocumentStatusEnum
from app.services.embedding import EmbeddingService
from app.services.llm import LLMService
from app.services.llm_keys import LLMKeyService
from app.settings import settings


class RAGService:
    """Service for RAG operations."""

    def __init__(self, db: Session, organization_id: int):
        """Initialize the RAGService.
        
        Args:
            db: Database session
            organization_id: Organization ID
        """
        self.db = db
        self.organization_id = organization_id
        self.llm_key_service = LLMKeyService(db)

    def _get_llm_service(self) -> LLMService:
        """Get LLM service with organization's API key.
        
        Returns:
            LLMService instance
            
        Raises:
            ValueError: If no API key is configured
        """
        api_key_obj = self.llm_key_service.get_active_api_key(self.organization_id)
        if api_key_obj is None:
            raise ValueError("No active LLM API key configured for this organization")
        
        api_key = self.llm_key_service.decrypt_api_key(api_key_obj)
        return LLMService(api_key=api_key)

    def search_relevant_chunks(
        self,
        query: str,
        limit: int = 5,
        min_score: float = 0.7
    ) -> List[Tuple[DocumentChunk, float]]:
        """Search for relevant document chunks using vector similarity.
        
        Args:
            query: Search query
            limit: Maximum number of chunks to return
            min_score: Minimum similarity score (0-1)
            
        Returns:
            List of tuples (chunk, similarity_score)
            
        Raises:
            ValueError: If embedding generation fails
        """
        # Check if pgvector extension is enabled (required for vector search)
        try:
            check_ext = self.db.execute(text("""
                SELECT EXISTS(
                    SELECT 1 FROM pg_extension WHERE extname = 'vector'
                )
            """))
            extension_enabled = check_ext.scalar()
            if not extension_enabled:
                # pgvector is not installed/enabled, return empty results
                return []
        except Exception:
            # If check fails, assume extension is not available
            return []
        
        # Generate query embedding using organization's API key
        api_key_obj = self.llm_key_service.get_active_api_key(self.organization_id)
        if api_key_obj is None:
            raise ValueError("No active LLM API key configured for this organization")
        api_key = self.llm_key_service.decrypt_api_key(api_key_obj)
        embedding_service = EmbeddingService(api_key=api_key)
        query_embedding = embedding_service.generate_query_embedding(query)
        
        # Import numpy array for embedding
        import numpy as np
        embedding_array = np.array(query_embedding)
        
        # Vector similarity search using pgvector
        # Use raw SQL for vector operations
        # pgvector uses <=> operator for cosine distance (smaller is better)
        # We need to convert to similarity (1 - distance)
        query_sql = text("""
            SELECT dc.id, 
                   1 - (dc.embedding <=> CAST(:query_embedding AS vector)) as similarity
            FROM document_chunks dc
            JOIN documents d ON dc.document_id = d.id
            WHERE d.organization_id = :org_id
              AND d.status = :status
              AND d.deleted_at IS NULL
              AND dc.embedding IS NOT NULL
            ORDER BY dc.embedding <=> CAST(:query_embedding AS vector)
            LIMIT :limit
        """)
        
        # Convert embedding to string format for PostgreSQL
        embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
        
        result = self.db.execute(
            query_sql,
            {
                "query_embedding": embedding_str,
                "org_id": self.organization_id,
                "status": DocumentStatusEnum.READY.value,
                "limit": limit
            }
        )
        
        chunks_with_scores = []
        for row in result:
            chunk_id = row.id
            similarity = float(row.similarity)
            # Log similarity scores for debugging (can be removed later)
            if similarity >= min_score:
                chunk = self.db.query(DocumentChunk).filter(
                    DocumentChunk.id == chunk_id
                ).first()
                if chunk:
                    chunks_with_scores.append((chunk, similarity))
        
        # If no chunks found, check if it's because of low similarity scores
        if not chunks_with_scores and result.rowcount > 0:
            # Re-query to see what similarity scores we got
            debug_result = self.db.execute(
                query_sql,
                {
                    "query_embedding": embedding_str,
                    "org_id": self.organization_id,
                    "status": DocumentStatusEnum.READY.value,
                    "limit": limit
                }
            )
            similarities = [float(row.similarity) for row in debug_result]
            if similarities:
                import logging
                logger = logging.getLogger(__name__)
                logger.debug(f"Found {len(similarities)} chunks but all below min_score {min_score}. "
                           f"Max similarity: {max(similarities):.3f}, Min: {min(similarities):.3f}")
        
        return chunks_with_scores

    async def generate_rag_response(
        self,
        user_query: str,
        conversation_history: Optional[List[dict]] = None,
        max_chunks: int = 5,
        model: str = "gpt-3.5-turbo"
    ) -> Tuple[str, List[dict]]:
        """Generate a RAG response with context from documents.
        
        Args:
            user_query: User's question
            conversation_history: Previous messages in conversation (optional)
            max_chunks: Maximum number of chunks to use as context
            model: LLM model to use
            
        Returns:
            Tuple of (response_text, sources_list)
            
        Raises:
            ValueError: If RAG processing fails
        """
        # Search for relevant chunks
        chunks_with_scores = self.search_relevant_chunks(
            query=user_query,
            limit=max_chunks
        )
        
        if not chunks_with_scores:
            return "I couldn't find relevant information in the documents to answer your question.", []
        
        # Build context from chunks
        context_parts = []
        sources = []
        
        for chunk, score in chunks_with_scores:
            document = self.db.query(Document).filter(
                Document.id == chunk.document_id
            ).first()
            
            if document:
                context_parts.append(f"[{document.file_name}]\n{chunk.text_content}")
                sources.append({
                    "document_id": document.id,
                    "file_name": document.file_name,
                    "chunk_id": chunk.id,
                    "relevance_score": score,
                    "text_preview": chunk.text_content[:200] + "..." if len(chunk.text_content) > 200 else chunk.text_content
                })
        
        context = "\n\n---\n\n".join(context_parts)
        
        # Build system prompt
        system_prompt = """You are a helpful assistant that answers questions based on the provided context from documents.
Use the context to answer the user's question. If the context doesn't contain enough information,
say so. Cite the document names when referencing specific information."""
        
        # Build messages
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add context as a system message or user message
        context_message = f"""Context from documents:
{context}

Based on the above context, answer the user's question:"""
        
        # Add conversation history if provided
        if conversation_history:
            # Limit history to last 10 messages
            recent_history = conversation_history[-10:]
            messages.extend(recent_history)
        
        # Add context and query
        messages.append({"role": "user", "content": context_message})
        messages.append({"role": "user", "content": user_query})
        
        # Generate response (this will run in thread pool executor)
        llm_service = self._get_llm_service()
        response = await llm_service.generate_response(
            messages=messages,
            model=model,
            temperature=0.7
        )
        
        return response, sources

    async def generate_summary(
        self,
        text_to_summarize: str,
        model: str = "gpt-3.5-turbo"
    ) -> str:
        """Generate a short summary of the text.
        
        Args:
            text_to_summarize: Text to summarize
            model: LLM model to use
            
        Returns:
            Summary text
        """
        system_prompt = "Summarize the following message in 3-5 words to be used as a chat title. Do not wrap in quotes."
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text_to_summarize}
        ]
        
        llm_service = self._get_llm_service()
        summary = await llm_service.generate_response(
            messages=messages,
            model=model,
            temperature=0.5,
            max_tokens=20
        )
        
        return summary.strip()
