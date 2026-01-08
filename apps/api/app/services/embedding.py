"""Service for generating embeddings using OpenAI."""

from typing import List, Optional
import numpy as np

from app.settings import settings


class EmbeddingService:
    """Service for generating text embeddings."""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize the EmbeddingService.
        
        Args:
            api_key: OpenAI API key (uses settings.openai_api_key if not provided)
        """
        self.api_key = api_key or settings.openai_api_key
        if not self.api_key:
            raise ValueError("OpenAI API key is required")

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector (1536 dimensions for text-embedding-ada-002)
            
        Raises:
            ValueError: If API key is not set or API call fails
        """
        try:
            from openai import OpenAI
            
            client = OpenAI(api_key=self.api_key)
            response = client.embeddings.create(
                model="text-embedding-ada-002",
                input=text
            )
            return response.data[0].embedding
        except ImportError:
            raise ImportError("openai package is required. Install with: pip install openai")
        except Exception as e:
            raise ValueError(f"Failed to generate embedding: {str(e)}") from e

    def generate_embeddings_batch(
        self, texts: List[str], batch_size: int = 100
    ) -> List[List[float]]:
        """Generate embeddings for multiple texts in batches.
        
        Args:
            texts: List of texts to embed
            batch_size: Number of texts to process per batch
            
        Returns:
            List of embedding vectors
            
        Raises:
            ValueError: If API key is not set or API call fails
        """
        try:
            from openai import OpenAI
            
            client = OpenAI(api_key=self.api_key)
            all_embeddings = []
            
            # Process in batches
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                response = client.embeddings.create(
                    model="text-embedding-ada-002",
                    input=batch
                )
                batch_embeddings = [item.embedding for item in response.data]
                all_embeddings.extend(batch_embeddings)
            
            return all_embeddings
        except ImportError:
            raise ImportError("openai package is required. Install with: pip install openai")
        except Exception as e:
            raise ValueError(f"Failed to generate embeddings: {str(e)}") from e

    def generate_query_embedding(self, query: str) -> List[float]:
        """Generate embedding for a search query.
        
        Args:
            query: Search query text
            
        Returns:
            Embedding vector
            
        Raises:
            ValueError: If API key is not set or API call fails
        """
        return self.generate_embedding(query)
