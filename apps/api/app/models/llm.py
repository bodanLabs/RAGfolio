"""Pydantic schemas for LLM API key requests and responses."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class LLMApiKeyCreate(BaseModel):
    """Request schema for creating an LLM API key."""
    key_name: str = Field(..., min_length=1, max_length=255, description="Name for the API key")
    api_key: str = Field(..., min_length=1, description="API key value")
    provider: str = Field(default="OpenAI", description="Provider name")


class LLMApiKeyUpdate(BaseModel):
    """Request schema for updating an LLM API key."""
    key_name: Optional[str] = Field(None, min_length=1, max_length=255)
    api_key: Optional[str] = Field(None, min_length=1)


class LLMApiKeyResponse(BaseModel):
    """Response schema for LLM API key."""
    id: int
    organization_id: int
    provider: str
    key_name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_used_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LLMApiKeyTest(BaseModel):
    """Request schema for testing an API key."""
    api_key: str = Field(..., min_length=1, description="API key to test")
    provider: str = Field(default="OpenAI", description="Provider name")


class LLMApiKeyTestResponse(BaseModel):
    """Response schema for API key test."""
    valid: bool
    message: str
