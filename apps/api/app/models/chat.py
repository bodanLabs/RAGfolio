"""Pydantic schemas for chat requests and responses."""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field


class ChatSessionResponse(BaseModel):
    """Response schema for chat session."""
    id: int
    organization_id: int
    user_id: int
    title: str
    message_count: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ChatSessionCreate(BaseModel):
    """Request schema for creating a chat session."""
    title: Optional[str] = Field(default="New Chat", max_length=255)


class ChatSessionUpdate(BaseModel):
    """Request schema for updating a chat session."""
    title: str = Field(..., max_length=255)


class ChatMessageResponse(BaseModel):
    """Response schema for chat message."""
    id: int
    session_id: int
    role: str
    content: str
    created_at: datetime
    sources: Optional[List[dict]] = None

    model_config = ConfigDict(from_attributes=True)


class ChatMessageCreate(BaseModel):
    """Request schema for creating a chat message."""
    content: str = Field(..., min_length=1, description="Message content")


class ChatMessageWithSources(ChatMessageResponse):
    """Chat message with source documents."""
    sources: List[dict] = Field(default_factory=list)
