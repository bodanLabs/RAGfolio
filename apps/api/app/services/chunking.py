"""Service for chunking text into smaller pieces for embedding."""

from typing import List, Optional
from dataclasses import dataclass


@dataclass
class TextChunk:
    """Represents a chunk of text with metadata."""
    text: str
    chunk_index: int
    char_start: Optional[int] = None
    char_end: Optional[int] = None
    page_number: Optional[int] = None


class ChunkingService:
    """Service for chunking text into smaller pieces."""

    def __init__(
        self,
        chunk_size: int = 1000,  # tokens (~750 words)
        overlap: int = 200,  # tokens (~150 words)
        separator: str = "\n\n"
    ):
        """Initialize the ChunkingService.
        
        Args:
            chunk_size: Target chunk size in tokens
            overlap: Overlap size in tokens
            separator: Text separator to use for splitting
        """
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.separator = separator

    def chunk_text(self, text: str, page_number: Optional[int] = None) -> List[TextChunk]:
        """Chunk text into smaller pieces.
        
        This uses a simple character-based approach. For production,
        consider using a tokenizer for more accurate token counting.
        
        Args:
            text: Text to chunk
            page_number: Optional page number for metadata
            
        Returns:
            List of TextChunk objects
        """
        # Simple approach: use character count as proxy for tokens
        # 1 token ≈ 4 characters for English text
        chars_per_token = 4
        char_chunk_size = self.chunk_size * chars_per_token
        char_overlap = self.overlap * chars_per_token
        
        chunks = []
        chunk_index = 0
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = min(start + char_chunk_size, text_length)
            
            # Try to split at a sentence or paragraph boundary
            chunk_text = text[start:end]
            
            # If not at the end, try to find a good split point
            if end < text_length:
                # Look for paragraph separator
                last_separator = chunk_text.rfind(self.separator)
                if last_separator > char_chunk_size // 2:  # Only use if not too early
                    chunk_text = chunk_text[:last_separator + len(self.separator)]
                    end = start + len(chunk_text)
            
            chunk_text = chunk_text.strip()
            if chunk_text:  # Only add non-empty chunks
                chunks.append(TextChunk(
                    text=chunk_text,
                    chunk_index=chunk_index,
                    char_start=start,
                    char_end=end,
                    page_number=page_number
                ))
                chunk_index += 1
            
            # Move start position with overlap
            start = end - char_overlap
            if start >= end:  # Prevent infinite loop
                start = end
            if start < 0:  # Prevent negative start (when text is shorter than overlap)
                start = end
            if start >= text_length:  # We've processed all text
                break
        
        return chunks

    def chunk_text_by_sentences(
        self, text: str, page_number: Optional[int] = None
    ) -> List[TextChunk]:
        """Chunk text by sentences for better context preservation.
        
        Args:
            text: Text to chunk
            page_number: Optional page number for metadata
            
        Returns:
            List of TextChunk objects
        """
        import re
        
        # Split into sentences (simple approach)
        sentences = re.split(r'[.!?]+\s+', text)
        
        chunks = []
        chunk_index = 0
        current_chunk = []
        current_length = 0
        
        chars_per_token = 4
        target_chars = self.chunk_size * chars_per_token
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            sentence_length = len(sentence)
            
            # If adding this sentence would exceed chunk size, save current chunk
            if current_length + sentence_length > target_chars and current_chunk:
                chunk_text = ' '.join(current_chunk)
                chunks.append(TextChunk(
                    text=chunk_text,
                    chunk_index=chunk_index,
                    page_number=page_number
                ))
                chunk_index += 1
                
                # Keep last sentences for overlap
                overlap_sentences = []
                overlap_length = 0
                for s in reversed(current_chunk):
                    if overlap_length + len(s) <= self.overlap * chars_per_token:
                        overlap_sentences.insert(0, s)
                        overlap_length += len(s)
                    else:
                        break
                current_chunk = overlap_sentences
                current_length = overlap_length
            
            current_chunk.append(sentence)
            current_length += sentence_length + 1  # +1 for space
        
        # Add remaining chunk
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            chunks.append(TextChunk(
                text=chunk_text,
                chunk_index=chunk_index,
                page_number=page_number
            ))
        
        return chunks
