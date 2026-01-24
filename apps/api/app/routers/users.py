"""Users routes."""

from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_service, get_current_user_model, get_current_user
from app.db.tables import UserRecord
from app.models.user import User
from app.services.auth import AuthService


class UserUpdate(BaseModel):
    """User update request model."""
    name: Optional[str] = Field(None, min_length=1)
    password: Optional[str] = Field(None, min_length=8)


router = APIRouter(tags=["users"], prefix="/users")


@router.patch("/me", response_model=User)
async def update_current_user(
    update_data: UserUpdate = Body(...),
    current_user: UserRecord = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Update current user profile.

    Args:
        update_data: Fields to update (name, password)
        current_user: Current authenticated user record
        auth_service: Injected AuthService instance

    Returns:
        Updated user information
    """
    # Only update if fields are provided
    if update_data.name is None and update_data.password is None:
        return current_user

    updated_user = auth_service.update_user(
        user=current_user,
        name=update_data.name,
        password=update_data.password
    )

    return updated_user
