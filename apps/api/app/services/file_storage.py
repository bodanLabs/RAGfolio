"""Service for local file storage operations."""

import os
import shutil
from pathlib import Path
from typing import Optional
import hashlib

from app.settings import settings


class FileStorageService:
    """Service for managing file storage (local filesystem)."""

    def __init__(self):
        """Initialize the FileStorageService."""
        self.storage_path = Path(settings.storage_local_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def get_file_path(self, file_name: str, organization_id: int) -> Path:
        """Get the full file path for a file.
        
        Args:
            file_name: Name of the file
            organization_id: Organization ID
            
        Returns:
            Path object for the file
        """
        org_dir = self.storage_path / str(organization_id)
        org_dir.mkdir(parents=True, exist_ok=True)
        return org_dir / file_name

    def save_file(
        self, file_content: bytes, file_name: str, organization_id: int
    ) -> str:
        """Save a file to storage.
        
        Args:
            file_content: File content as bytes
            file_name: Name of the file
            organization_id: Organization ID
            
        Returns:
            Relative file path string
        """
        file_path = self.get_file_path(file_name, organization_id)
        file_path.write_bytes(file_content)
        
        # Return relative path
        return str(file_path.relative_to(self.storage_path))

    def get_file(self, file_path: str) -> bytes:
        """Get file content.
        
        Args:
            file_path: Relative file path (stored in database)
            
        Returns:
            File content as bytes
            
        Raises:
            FileNotFoundError: If file doesn't exist
        """
        full_path = self.storage_path / file_path
        if not full_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        return full_path.read_bytes()

    def delete_file(self, file_path: str) -> bool:
        """Delete a file.
        
        Args:
            file_path: Relative file path
            
        Returns:
            True if deleted, False if not found
        """
        full_path = self.storage_path / file_path
        if full_path.exists():
            full_path.unlink()
            return True
        return False

    def file_exists(self, file_path: str) -> bool:
        """Check if a file exists.
        
        Args:
            file_path: Relative file path
            
        Returns:
            True if exists, False otherwise
        """
        full_path = self.storage_path / file_path
        return full_path.exists()

    def get_file_hash(self, file_content: bytes) -> str:
        """Get SHA-256 hash of file content for deduplication.
        
        Args:
            file_content: File content as bytes
            
        Returns:
            SHA-256 hash string
        """
        return hashlib.sha256(file_content).hexdigest()

    def get_file_size(self, file_path: str) -> int:
        """Get file size in bytes.
        
        Args:
            file_path: Relative file path
            
        Returns:
            File size in bytes
            
        Raises:
            FileNotFoundError: If file doesn't exist
        """
        full_path = self.storage_path / file_path
        if not full_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        return full_path.stat().st_size
