"""Pydantic schemas for authentication requests and responses."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SignupRequest(BaseModel):
    """Request schema for user signup."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password (minimum 8 characters)")
    name: str | None = Field(default=None, description="User name (optional)")

    model_config = ConfigDict(extra="forbid")


class LoginRequest(BaseModel):
    """Request schema for user login."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")

    model_config = ConfigDict(extra="forbid")


class TokenResponse(BaseModel):
    """Response schema for authentication tokens."""

    access_token: str = Field(..., description="JWT access token")
    token_type: Literal["bearer"] = Field(default="bearer", description="Token type")
    ok: bool = Field(default=True, description="Operation success status")
