from typing import Generator, Annotated, Optional

from fastapi import Depends, HTTPException, status, Path, Query, Form
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.tables import UserRecord, Organization, OrganizationMember
from app.db.enums import UserRoleEnum
from app.models.user import User
from app.services.auth import AuthService
from app.utils.auth import get_current_user as get_user_from_token

# OAuth2 scheme for Swagger UI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_db() -> Generator[Session, None, None]:
    """Dependency for getting database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Dependency for AuthService."""
    return AuthService(db)

def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db)
) -> UserRecord:
    """Dependency for getting current authenticated user (returns ORM object).
    
    Returns:
        UserRecord: The authenticated user record
    """
    user = get_user_from_token(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def get_current_user_model(
    current_user: UserRecord = Depends(get_current_user)
) -> User:
    """Dependency for getting current authenticated user (returns Pydantic model).
    
    Returns:
        User: The authenticated user as a Pydantic model
    """
    return User.model_validate(current_user)

def get_organization(
    org_id: Annotated[int, Path(..., description="Organization ID")],
    db: Session = Depends(get_db),
    current_user: UserRecord = Depends(get_current_user),
) -> Organization:
    """Dependency for getting organization and verifying user membership.
    
    Args:
        org_id: Organization ID from path
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Organization: The organization record
        
    Raises:
        HTTPException: 404 if organization not found, 403 if user is not a member
    """
    org = db.query(Organization).filter(
        Organization.id == org_id,
        Organization.deleted_at.is_(None)
    ).first()
    
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Check if user is a member
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id
    ).first()
    
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization"
        )
    
    return org

def get_organization_membership(
    org_id: Annotated[int, Path(..., description="Organization ID")],
    db: Session = Depends(get_db),
    current_user: UserRecord = Depends(get_current_user),
) -> OrganizationMember:
    """Dependency for getting user's membership in an organization.
    
    Args:
        org_id: Organization ID from path
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        OrganizationMember: The membership record
        
    Raises:
        HTTPException: 403 if user is not a member
    """
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id
    ).first()
    
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization"
        )
    
    return membership

def require_admin(
    membership: OrganizationMember = Depends(get_organization_membership)
) -> OrganizationMember:
    """Dependency to require admin role in organization.
    
    Args:
        membership: User's organization membership
        
    Returns:
        OrganizationMember: The membership record (guaranteed to be ADMIN)
        
    Raises:
        HTTPException: 403 if user is not an admin
    """
    if membership.role != UserRoleEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return membership

def get_organization_from_query(
    org_id: Annotated[Optional[int], Query(description="Organization ID")] = None,
    db: Session = Depends(get_db),
    current_user: UserRecord = Depends(get_current_user),
) -> Optional[Organization]:
    """Dependency for getting organization from query parameter.
    
    Useful for endpoints that optionally filter by organization.
    
    Args:
        org_id: Optional organization ID from query
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Optional[Organization]: The organization if org_id provided and user is member, None otherwise
    """
    if org_id is None:
        return None
    
    org = db.query(Organization).filter(
        Organization.id == org_id,
        Organization.deleted_at.is_(None)
    ).first()
    
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Check if user is a member
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id
    ).first()
    
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization"
        )
    
    return org


def get_organization_from_form(
    org_id: Annotated[Optional[int], Form(description="Organization ID")] = None,
    db: Session = Depends(get_db),
    current_user: UserRecord = Depends(get_current_user),
) -> Optional[Organization]:
    """Dependency for getting organization from form parameter.
    
    Useful for file upload endpoints.
    
    Args:
        org_id: Optional organization ID from form
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Optional[Organization]: The organization if org_id provided and user is member, None otherwise
    """
    if org_id is None:
        return None
    
    org = db.query(Organization).filter(
        Organization.id == org_id,
        Organization.deleted_at.is_(None)
    ).first()
    
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Check if user is a member
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org_id,
        OrganizationMember.user_id == current_user.id
    ).first()
    
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization"
        )
    
    return org
