"""Service for extracting text from various document formats."""

from typing import Optional
from pathlib import Path


class TextExtractionService:
    """Service for extracting text from documents."""

    def extract_text(self, file_path: str, file_type: str) -> str:
        """Extract text from a document.
        
        Args:
            file_path: Path to the file
            file_type: Type of file (txt, pdf, docx)
            
        Returns:
            Extracted text content
            
        Raises:
            ValueError: If file type is not supported
            FileNotFoundError: If file doesn't exist
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        if file_type.lower() == "txt":
            return self._extract_from_txt(path)
        elif file_type.lower() == "pdf":
            return self._extract_from_pdf(path)
        elif file_type.lower() == "docx":
            return self._extract_from_docx(path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

    def _extract_from_txt(self, path: Path) -> str:
        """Extract text from a TXT file.
        
        Args:
            path: Path to the TXT file
            
        Returns:
            Text content
        """
        try:
            return path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            # Try with different encoding
            return path.read_text(encoding='latin-1')

    def _extract_from_pdf(self, path: Path) -> str:
        """Extract text from a PDF file.
        
        Args:
            path: Path to the PDF file
            
        Returns:
            Text content
            
        Raises:
            ImportError: If PyPDF2 is not installed
        """
        try:
            import PyPDF2
        except ImportError:
            raise ImportError("PyPDF2 is required for PDF extraction. Install with: pip install PyPDF2")
        
        text_content = []
        try:
            with open(path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text = page.extract_text()
                    if text:
                        text_content.append(text)
            return "\n\n".join(text_content)
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}") from e

    def _extract_from_docx(self, path: Path) -> str:
        """Extract text from a DOCX file.
        
        Args:
            path: Path to the DOCX file
            
        Returns:
            Text content
            
        Raises:
            ImportError: If python-docx is not installed
        """
        try:
            from docx import Document
        except ImportError:
            raise ImportError("python-docx is required for DOCX extraction. Install with: pip install python-docx")
        
        try:
            doc = Document(path)
            paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
            return "\n\n".join(paragraphs)
        except Exception as e:
            raise ValueError(f"Failed to extract text from DOCX: {str(e)}") from e
