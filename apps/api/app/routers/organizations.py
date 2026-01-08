"""Organization routes for CRUD operations, members, and invitations."""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_db, get_current_user, get_organization, require_admin,
    get_organization_membership
)
from app.db.tables import Organization, OrganizationMember, UserRecord
from app.db.enums import UserRoleEnum
from app.models.organization import (
    OrganizationCreate, OrganizationUpdate, OrganizationResponse,
    OrganizationWithStats, OrganizationStats, MemberResponse, MemberUpdate,
    InvitationCreate, InvitationResponse, InvitationAccept, PaginationParams
)
from app.services.organizations import OrganizationService
from app.services.members import MemberService
from app.services.invitations import InvitationService

router = APIRouter(tags=["organizations"], prefix="/api/organizations")


def get_organization_service(db: Session = Depends(get_db)) -> OrganizationService:
    """Dependency for OrganizationService."""
    return OrganizationService(db)


def get_member_service(db: Session = Depends(get_db)) -> MemberService:
    """Dependency for MemberService."""
    return MemberService(db)


def get_invitation_service(db: Session = Depends(get_db)) -> InvitationService:
    """Dependency for InvitationService."""
    return InvitationService(db)


@router.get("", response_model=list[OrganizationResponse])
async def list_organizations(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    current_user: UserRecord = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_organization_service),
):
    """List user's organizations with pagination.
    
    Args:
        page: Page number
        page_size: Items per page
        current_user: Current authenticated user
        org_service: OrganizationService instance
        
    Returns:
        List of organizations
    """
    skip = (page - 1) * page_size
    orgs = org_service.get_user_organizations(
        user_id=current_user.id,
        skip=skip,
        limit=page_size
    )
    return [OrganizationResponse.model_validate(org) for org in orgs]


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    request: OrganizationCreate,
    current_user: UserRecord = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_organization_service),
):
    """Create a new organization.
    
    Args:
        request: Organization creation request
        current_user: Current authenticated user
        org_service: OrganizationService instance
        
    Returns:
        Created organization
        
    Raises:
        HTTPException: 400 if slug already exists
    """
    try:
        org = org_service.create_organization(
            name=request.name,
            user_id=current_user.id
        )
        return OrganizationResponse.model_validate(org)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization_details(
    org: Organization = Depends(get_organization),
):
    """Get organization details.
    
    Args:
        org: Organization from dependency
        
    Returns:
        Organization details
    """
    return OrganizationResponse.model_validate(org)


@router.patch("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    request: OrganizationUpdate,
    org: Organization = Depends(get_organization),
    membership: OrganizationMember = Depends(require_admin),
    current_user: UserRecord = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_organization_service),
):
    """Update an organization (admin only).
    
    Args:
        request: Organization update request
        org: Organization from dependency
        membership: Membership (guaranteed to be admin)
        current_user: Current authenticated user
        org_service: OrganizationService instance
        
    Returns:
        Updated organization
        
    Raises:
        HTTPException: 400 if slug already exists, 404 if not found
    """
    try:
        updated_org = org_service.update_organization(
            org_id=org.id,
            user_id=current_user.id,
            name=request.name,
            slug=request.slug
        )
        if updated_org is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        return OrganizationResponse.model_validate(updated_org)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    org: Organization = Depends(get_organization),
    membership: OrganizationMember = Depends(require_admin),
    current_user: UserRecord = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_organization_service),
):
    """Soft delete an organization (admin only).
    
    Args:
        org: Organization from dependency
        membership: Membership (guaranteed to be admin)
        current_user: Current authenticated user
        org_service: OrganizationService instance
    """
    deleted = org_service.delete_organization(
        org_id=org.id,
        user_id=current_user.id
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )


@router.get("/{org_id}/stats", response_model=OrganizationStats)
async def get_organization_stats(
    org: Organization = Depends(get_organization),
    org_service: OrganizationService = Depends(get_organization_service),
):
    """Get organization statistics.
    
    Args:
        org: Organization from dependency
        org_service: OrganizationService instance
        
    Returns:
        Organization statistics
    """
    quota = org_service.get_organization_stats(org.id)
    if quota is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization statistics not found"
        )
    return OrganizationStats.model_validate(quota)


# Member routes

@router.get("/{org_id}/members", response_model=list[MemberResponse])
async def list_members(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    org: Organization = Depends(get_organization),
    member_service: MemberService = Depends(get_member_service),
):
    """List organization members with pagination.
    
    Args:
        page: Page number
        page_size: Items per page
        org: Organization from dependency
        member_service: MemberService instance
        
    Returns:
        List of members
    """
    skip = (page - 1) * page_size
    members = member_service.get_members(
        organization_id=org.id,
        skip=skip,
        limit=page_size
    )
    return [MemberResponse.model_validate(member) for member in members]


@router.patch(
    "/{org_id}/members/{member_id}/role",
    response_model=MemberResponse
)
async def update_member_role(
    member_id: int,
    request: MemberUpdate,
    org: Organization = Depends(get_organization),
    membership: OrganizationMember = Depends(require_admin),
    current_user: UserRecord = Depends(get_current_user),
    member_service: MemberService = Depends(get_member_service),
):
    """Update member role (admin only).
    
    Args:
        member_id: Member ID
        request: Role update request
        org: Organization from dependency
        membership: Membership (guaranteed to be admin)
        current_user: Current authenticated user
        member_service: MemberService instance
        
    Returns:
        Updated member
        
    Raises:
        HTTPException: 400 if invalid role, 404 if member not found
    """
    try:
        role = UserRoleEnum(request.role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be {UserRoleEnum.ADMIN.value} or {UserRoleEnum.USER.value}"
        )
    
    updated_member = member_service.update_member_role(
        member_id=member_id,
        new_role=role,
        updated_by_id=current_user.id
    )
    
    if updated_member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    if updated_member.organization_id != org.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this organization"
        )
    
    return MemberResponse.model_validate(updated_member)


@router.delete("/{org_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    member_id: int,
    org: Organization = Depends(get_organization),
    membership: OrganizationMember = Depends(require_admin),
    current_user: UserRecord = Depends(get_current_user),
    member_service: MemberService = Depends(get_member_service),
):
    """Remove a member from organization (admin only).
    
    Args:
        member_id: Member ID (user_id, not membership ID)
        org: Organization from dependency
        membership: Membership (guaranteed to be admin)
        current_user: Current authenticated user
        member_service: MemberService instance
        
    Raises:
        HTTPException: 404 if member not found
    """
    # Get member to get user_id
    member = member_service.get_member(org.id, member_id)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    removed = member_service.remove_member(
        organization_id=org.id,
        user_id=member.user_id,
        removed_by_id=current_user.id
    )
    
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )


# Invitation routes

@router.post("/{org_id}/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    request: InvitationCreate,
    org: Organization = Depends(get_organization),
    membership: OrganizationMember = Depends(require_admin),
    current_user: UserRecord = Depends(get_current_user),
    invitation_service: InvitationService = Depends(get_invitation_service),
):
    """Send an invitation to join the organization (admin only).
    
    Args:
        request: Invitation creation request
        org: Organization from dependency
        membership: Membership (guaranteed to be admin)
        current_user: Current authenticated user
        invitation_service: InvitationService instance
        
    Returns:
        Created invitation
        
    Raises:
        HTTPException: 400 if invitation already exists or user is already a member
    """
    try:
        role = UserRoleEnum(request.role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be {UserRoleEnum.ADMIN.value} or {UserRoleEnum.USER.value}"
        )
    
    try:
        invitation = invitation_service.create_invitation(
            organization_id=org.id,
            email=request.email,
            role=role,
            invited_by_id=current_user.id
        )
        return InvitationResponse.model_validate(invitation)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e


@router.get("/{org_id}/invitations", response_model=list[InvitationResponse])
async def list_invitations(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    status: Annotated[str | None, Query(description="Filter by status")] = None,
    org: Organization = Depends(get_organization),
    membership: OrganizationMember = Depends(require_admin),
    invitation_service: InvitationService = Depends(get_invitation_service),
):
    """List organization invitations with pagination (admin only).
    
    Args:
        page: Page number
        page_size: Items per page
        status: Filter by status (PENDING, ACCEPTED, EXPIRED)
        org: Organization from dependency
        membership: Membership (guaranteed to be admin)
        invitation_service: InvitationService instance
        
    Returns:
        List of invitations
    """
    from app.db.enums import InvitationStatusEnum
    
    status_enum = None
    if status:
        try:
            status_enum = InvitationStatusEnum(status.upper())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be PENDING, ACCEPTED, or EXPIRED"
            )
    
    skip = (page - 1) * page_size
    invitations = invitation_service.get_invitations(
        organization_id=org.id,
        skip=skip,
        limit=page_size,
        status=status_enum
    )
    return [InvitationResponse.model_validate(inv) for inv in invitations]


@router.delete("/{org_id}/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_invitation(
    invitation_id: int,
    org: Organization = Depends(get_organization),
    membership: OrganizationMember = Depends(require_admin),
    current_user: UserRecord = Depends(get_current_user),
    invitation_service: InvitationService = Depends(get_invitation_service),
):
    """Revoke an invitation (admin only).
    
    Args:
        invitation_id: Invitation ID
        org: Organization from dependency
        membership: Membership (guaranteed to be admin)
        current_user: Current authenticated user
        invitation_service: InvitationService instance
        
    Raises:
        HTTPException: 400 if invitation is already accepted, 404 if not found
    """
    try:
        revoked = invitation_service.revoke_invitation(
            invitation_id=invitation_id,
            organization_id=org.id,
            revoked_by_id=current_user.id
        )
        if not revoked:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e


@router.post("/{org_id}/invitations/{invitation_id}/resend", response_model=InvitationResponse)
async def resend_invitation(
    invitation_id: int,
    org: Organization = Depends(get_organization),
    membership: OrganizationMember = Depends(require_admin),
    current_user: UserRecord = Depends(get_current_user),
    invitation_service: InvitationService = Depends(get_invitation_service),
):
    """Resend an invitation (admin only).
    
    Args:
        invitation_id: Invitation ID
        org: Organization from dependency
        membership: Membership (guaranteed to be admin)
        current_user: Current authenticated user
        invitation_service: InvitationService instance
        
    Returns:
        New invitation
        
    Raises:
        HTTPException: 404 if invitation not found
    """
    try:
        new_invitation = invitation_service.resend_invitation(
            invitation_id=invitation_id,
            organization_id=org.id,
            resent_by_id=current_user.id
        )
        return InvitationResponse.model_validate(new_invitation)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        ) from e


# Public invitation acceptance route
@router.post("/invitations/{token}/accept", response_model=dict, status_code=status.HTTP_200_OK)
async def accept_invitation(
    token: str,
    request: InvitationAccept | None = None,
    invitation_service: InvitationService = Depends(get_invitation_service),
):
    """Accept an invitation (public endpoint, no auth required).
    
    Args:
        token: Invitation token
        request: Optional invitation acceptance data (password, name if creating account)
        invitation_service: InvitationService instance
        
    Returns:
        Success message
        
    Raises:
        HTTPException: 400 if invitation is invalid or expired
    """
    try:
        invitation, member = invitation_service.accept_invitation(
            token=token,
            password=request.password if request else None,
            name=request.name if request else None
        )
        return {
            "message": "Invitation accepted successfully",
            "organization_id": invitation.organization_id,
            "member_id": member.id
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e
