"""LLM API key management routes."""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_db, get_current_user, get_organization, require_admin
)
from app.db.tables import UserRecord, Organization, OrganizationMember
from app.models.llm import (
    LLMApiKeyCreate, LLMApiKeyUpdate, LLMApiKeyResponse,
    LLMApiKeyTest, LLMApiKeyTestResponse
)
from app.services.llm_keys import LLMKeyService

router = APIRouter(tags=["llm"], prefix="/api/organizations")


def get_llm_key_service(db: Session = Depends(get_db)) -> LLMKeyService:
    """Dependency for LLMKeyService."""
    return LLMKeyService(db)


@router.get("/{org_id}/llm-keys", response_model=list[LLMApiKeyResponse])
async def list_llm_keys(
    org: Organization = Depends(get_organization),
    membership: OrganizationMember = Depends(require_admin),
    llm_key_service: LLMKeyService = Depends(get_llm_key_service),
):
    """List LLM API keys for an organization (admin only).
    
    Args:
        org: Organization from dependency
        membership: Membership (guaranteed to be admin)
        llm_key_service: LLMKeyService instance
        
    Returns:
        List of API keys
    """
    keys = llm_key_service.get_api_keys(org.id)
    return [LLMApiKeyResponse.model_validate(key) for key in keys]


@router.post("/{org_id}/llm-keys", response_model=LLMApiKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_llm_key(
    request: LLMApiKeyCreate,
    org: Organization = Depends(get_organization),
    membership: OrganizationMember = Depends(require_admin),
    current_user: UserRecord = Depends(get_current_user),
    llm_key_service: LLMKeyService = Depends(get_llm_key_service),
):
    """Create a new LLM API key (admin only).
    
    Args:
        request: API key creation request
        org: Organization from dependency
        membership: Membership (guaranteed to be admin)
        current_user: Current authenticated user
        llm_key_service: LLMKeyService instance
        
    Returns:
        Created API key
    """
    key = llm_key_service.create_api_key(
        organization_id=org.id,
        key_name=request.key_name,
        api_key=request.api_key,
        provider=request.provider
    )
    return LLMApiKeyResponse.model_validate(key)


@router.patch("/{org_id}/llm-keys/{key_id}", response_model=LLMApiKeyResponse)
async def update_llm_key(
    key_id: int,
    request: LLMApiKeyUpdate,
    org: Organization = Depends(get_organization),
    membership: OrganizationMember = Depends(require_admin),
    current_user: UserRecord = Depends(get_current_user),
    llm_key_service: LLMKeyService = Depends(get_llm_key_service),
):
    """Update an LLM API key (admin only).
    
    Args:
        key_id: API key ID
        request: API key update request
        org: Organization from dependency
        membership: Membership (guaranteed to be admin)
        current_user: Current authenticated user
        llm_key_service: LLMKeyService instance
        
    Returns:
        Updated API key
        
    Raises:
        HTTPException: 404 if key not found
    """
    key = llm_key_service.update_api_key(
        key_id=key_id,
        organization_id=org.id,
        key_name=request.key_name,
        api_key=request.api_key,
        user_id=current_user.id
    )
    if key is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    return LLMApiKeyResponse.model_validate(key)


@router.delete("/{org_id}/llm-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_llm_key(
    key_id: int,
    org: Organization = Depends(get_organization),
    membership: OrganizationMember = Depends(require_admin),
    current_user: UserRecord = Depends(get_current_user),
    llm_key_service: LLMKeyService = Depends(get_llm_key_service),
):
    """Delete an LLM API key (admin only).
    
    Args:
        key_id: API key ID
        org: Organization from dependency
        membership: Membership (guaranteed to be admin)
        current_user: Current authenticated user
        llm_key_service: LLMKeyService instance
        
    Raises:
        HTTPException: 404 if key not found
    """
    deleted = llm_key_service.delete_api_key(
        key_id=key_id,
        organization_id=org.id,
        user_id=current_user.id
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )


@router.post("/{org_id}/llm-keys/{key_id}/activate", response_model=LLMApiKeyResponse)
async def activate_llm_key(
    key_id: int,
    org: Organization = Depends(get_organization),
    membership: OrganizationMember = Depends(require_admin),
    current_user: UserRecord = Depends(get_current_user),
    llm_key_service: LLMKeyService = Depends(get_llm_key_service),
):
    """Activate an LLM API key (admin only).
    
    Args:
        key_id: API key ID
        org: Organization from dependency
        membership: Membership (guaranteed to be admin)
        current_user: Current authenticated user
        llm_key_service: LLMKeyService instance
        
    Returns:
        Activated API key
        
    Raises:
        HTTPException: 404 if key not found
    """
    key = llm_key_service.activate_api_key(
        key_id=key_id,
        organization_id=org.id,
        user_id=current_user.id
    )
    if key is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    return LLMApiKeyResponse.model_validate(key)


@router.post("/{org_id}/llm-keys/test", response_model=LLMApiKeyTestResponse)
async def test_llm_key(
    request: LLMApiKeyTest = Body(...),
    org: Organization = Depends(get_organization),
    membership: OrganizationMember = Depends(require_admin),
    llm_key_service: LLMKeyService = Depends(get_llm_key_service),
):
    """Test if an LLM API key is valid (admin only).
    
    Args:
        request: API key test request
        org: Organization from dependency
        membership: Membership (guaranteed to be admin)
        llm_key_service: LLMKeyService instance
        
    Returns:
        Test result
    """
    is_valid = llm_key_service.test_api_key(
        api_key=request.api_key,
        provider=request.provider
    )
    
    return LLMApiKeyTestResponse(
        valid=is_valid,
        message="API key is valid" if is_valid else "API key is invalid or test failed"
    )
