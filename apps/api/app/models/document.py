"""Pydantic schemas for document requests and responses."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class DocumentBase(BaseModel):
    """Base document schema."""
    file_name: str
    file_type: str
    file_size: int
    status: str = "UPLOADED"


class DocumentResponse(BaseModel):
    """Response schema for document."""
    id: int
    organization_id: int
    uploaded_by_id: Optional[int] = None
    file_name: str
    file_type: str
    file_size: int
    file_path: str
    storage_type: str
    status: str
    error_message: Optional[str] = None
    chunk_count: int
    uploaded_at: datetime
    processed_at: Optional[datetime] = None
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DocumentUploadResponse(BaseModel):
    """Response schema for document upload."""
    id: int
    file_name: str
    file_type: str
    file_size: int
    status: str
    message: str = "Document uploaded successfully"

    model_config = ConfigDict(from_attributes=True)


class DocumentStats(BaseModel):
    """Document statistics for an organization."""
    total_documents: int
    ready_documents: int
    processing_documents: int
    failed_documents: int
    total_chunks: int
    total_size: int  # in bytes

    model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
    """Paginated document list response."""
    items: list[DocumentResponse]
    pagination: dict
