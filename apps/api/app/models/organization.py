"""Pydantic schemas for organization requests and responses."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class OrganizationBase(BaseModel):
    """Base organization schema."""
    name: str = Field(..., min_length=1, max_length=255, description="Organization name")
    slug: Optional[str] = Field(None, max_length=255, description="Organization slug (auto-generated if not provided)")


class OrganizationCreate(BaseModel):
    """Request schema for creating an organization."""
    name: str = Field(..., min_length=1, max_length=255, description="Organization name")


class OrganizationUpdate(BaseModel):
    """Request schema for updating an organization."""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Organization name")
    slug: Optional[str] = Field(None, max_length=255, description="Organization slug")


class OrganizationResponse(BaseModel):
    """Response schema for organization."""
    id: int
    name: str
    slug: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrganizationStats(BaseModel):
    """Organization statistics."""
    file_count: int
    total_chunks: int
    total_size: int = Field(..., description="Total storage in bytes")
    current_documents: int
    current_storage_bytes: int
    current_chunks: int
    current_chat_sessions: int
    max_documents: int
    max_storage_bytes: int
    max_chat_sessions: int

    model_config = ConfigDict(from_attributes=True)


class OrganizationWithStats(OrganizationResponse):
    """Organization with statistics."""
    stats: Optional[OrganizationStats] = None


class MemberBase(BaseModel):
    """Base member schema."""
    role: str = Field(..., description="Member role (ADMIN or USER)")


class MemberResponse(BaseModel):
    """Response schema for organization member."""
    id: int
    user_id: int
    organization_id: int
    role: str
    joined_at: datetime
    user: "MemberUser"

    model_config = ConfigDict(from_attributes=True)


class MemberUser(BaseModel):
    """User information in member context."""
    id: int
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MemberUpdate(BaseModel):
    """Request schema for updating member role."""
    role: str = Field(..., description="New role (ADMIN or USER)")


class InvitationCreate(BaseModel):
    """Request schema for creating an invitation."""
    email: str = Field(..., description="Email address to invite")
    role: str = Field(default="USER", description="Role to assign (ADMIN or USER)")


class InvitationResponse(BaseModel):
    """Response schema for invitation."""
    id: int
    organization_id: int
    email: str
    role: str
    status: str
    invited_by_id: Optional[int] = None
    expires_at: datetime
    created_at: datetime
    accepted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InvitationAccept(BaseModel):
    """Request schema for accepting an invitation."""
    password: Optional[str] = Field(None, min_length=8, description="Password if creating new account")
    name: Optional[str] = Field(None, description="Name if creating new account")


class PaginationParams(BaseModel):
    """Pagination parameters."""
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""
    items: list[BaseModel]
    pagination: dict

    model_config = ConfigDict(from_attributes=True)
