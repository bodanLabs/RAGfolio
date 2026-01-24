"""Service for organization invitation management."""

import secrets
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.tables import Invitation, Organization, OrganizationMember, UserRecord
from app.db.enums import InvitationStatusEnum, UserRoleEnum
from app.services.audit import AuditService
from app.db.enums import AuditActionEnum
from app.services.members import MemberService
from app.settings import settings



from fastapi import BackgroundTasks
from app.services.email import EmailService

class InvitationService:
    """Service for managing organization invitations."""

    def __init__(self, db: Session):
        """Initialize the InvitationService with a database session.
        
        Args:
            db: SQLAlchemy session
        """
        self.db = db
        self.audit_service = AuditService(db)
        self.member_service = MemberService(db)
        self.email_service = EmailService()

    def _generate_token(self) -> str:
        """Generate a secure invitation token.
        
        Returns:
            Secure random token string
        """
        return secrets.token_urlsafe(32)

    def create_invitation(
        self, 
        organization_id: int, 
        email: str, 
        role: UserRoleEnum, 
        invited_by_id: int,
        background_tasks: BackgroundTasks
    ) -> Invitation:
        """Create a new invitation.
        
        Args:
            organization_id: Organization ID
            email: Email address to invite
            role: Role to assign
            invited_by_id: User ID who is sending the invitation
            background_tasks: Background tasks for sending email
            
        Returns:
            Created Invitation
            
        Raises:
            ValueError: If invitation already exists or user is already a member
        """
        # Check if user is already a member
        user = self.db.query(UserRecord).filter(UserRecord.email == email).first()
        if user:
            membership = self.member_service.get_member(organization_id, user.id)
            if membership:
                raise ValueError("User is already a member of this organization")
        
        # Check for existing pending invitation
        existing = self.db.query(Invitation).filter(
            Invitation.organization_id == organization_id,
            Invitation.email == email,
            Invitation.status == InvitationStatusEnum.PENDING
        ).first()
        
        if existing:
            # Check if expired
            if existing.expires_at < datetime.utcnow():
                existing.status = InvitationStatusEnum.EXPIRED
                self.db.commit()
            else:
                raise ValueError("Pending invitation already exists for this email")
        
        expires_at = datetime.utcnow() + timedelta(hours=settings.invitation_expiry_hours)
        token = self._generate_token()
        
        invitation = Invitation(
            organization_id=organization_id,
            email=email,
            role=role,
            invited_by_id=invited_by_id,
            token=token,
            expires_at=expires_at,
            status=InvitationStatusEnum.PENDING
        )
        
        try:
            self.db.add(invitation)
            self.db.commit()
            self.db.refresh(invitation)
            
            # Audit log
            self.audit_service.log_organization_action(
                action=AuditActionEnum.MEMBER_INVITE,
                user_id=invited_by_id,
                organization_id=organization_id,
                resource_type="invitation",
                resource_id=invitation.id,
                details=f"Invited {email} as {role.value}"
            )
            
            # Send email
            org = self.db.query(Organization).filter(Organization.id == organization_id).first()
            # We assume the frontend URL is localhost:5173 for now if not in settings
            # But checking settings.py, we didn't add webapp_url yet. 
            # I will use a hardcoded default or derive from cors_origins if possible, 
            # but for now I'll use http://localhost:5173 as safe default for this user.
            base_url = "http://localhost:5173"
            invite_link = f"{base_url}/accept-invite?token={token}"
            
            self.email_service.send_invitation_email(
                email_to=email,
                invite_link=invite_link,
                organization_name=org.name if org else "the organization",
                role=role.value,
                background_tasks=background_tasks
            )
            
            return invitation
        except IntegrityError:
            self.db.rollback()
            raise ValueError("Failed to create invitation")

    # ... get_invitation_by_token, get_invitations, accept_invitation ... 
    # (Since I'm replacing chunks, I need to be careful not to delete these methods if I can't see them all)
    # The file view showed lines 1-308. I will replace the whole file content for safety or use targeted replaced if I can match perfectly.
    # The tool `replace_file_content` is for single contiguous block.
    # I can replace from `class InvitationService:` down to `def accept_invitation` start, or use `multi_replace`.
    # I think I'll use `multi_replace` to be surgical.
    

    def resend_invitation(
        self, 
        invitation_id: int, 
        organization_id: int, 
        resent_by_id: int,
        background_tasks: BackgroundTasks
    ) -> Invitation:
        """Resend an invitation by creating a new one.
        
        Args:
            invitation_id: Original invitation ID
            organization_id: Organization ID
            resent_by_id: User ID who is resending
            background_tasks: Background tasks for email
            
        Returns:
            New Invitation
            
        Raises:
            ValueError: If original invitation is not found
        """
        original = self.db.query(Invitation).filter(
            Invitation.id == invitation_id,
            Invitation.organization_id == organization_id
        ).first()
        
        if original is None:
            raise ValueError("Invitation not found")
        
        # Mark old invitation as expired
        original.status = InvitationStatusEnum.EXPIRED
        
        # Create new invitation
        new_invitation = self.create_invitation(
            organization_id=organization_id,
            email=original.email,
            role=original.role,
            invited_by_id=resent_by_id,
            background_tasks=background_tasks
        )
        
        return new_invitation


    def get_invitation_by_token(self, token: str) -> Optional[Invitation]:
        """Get an invitation by token.
        
        Args:
            token: Invitation token
            
        Returns:
            Invitation if found and valid, None otherwise
        """
        invitation = self.db.query(Invitation).filter(
            Invitation.token == token
        ).first()
        
        if invitation is None:
            return None
        
        # Check if expired
        if invitation.expires_at < datetime.utcnow():
            if invitation.status == InvitationStatusEnum.PENDING:
                invitation.status = InvitationStatusEnum.EXPIRED
                self.db.commit()
            return None if invitation.status == InvitationStatusEnum.EXPIRED else invitation
        
        return invitation

    def get_invitations(
        self, organization_id: int, skip: int = 0, limit: int = 100,
        status: Optional[InvitationStatusEnum] = None
    ) -> list[Invitation]:
        """Get invitations for an organization.
        
        Args:
            organization_id: Organization ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Filter by status (optional)
            
        Returns:
            List of Invitation records
        """
        query = self.db.query(Invitation).filter(
            Invitation.organization_id == organization_id
        )
        
        if status is not None:
            query = query.filter(Invitation.status == status)
        
        return query.offset(skip).limit(limit).all()

    def accept_invitation(
        self, token: str, user_id: Optional[int] = None,
        password: Optional[str] = None, name: Optional[str] = None
    ) -> tuple[Invitation, OrganizationMember]:
        """Accept an invitation.
        
        Args:
            token: Invitation token
            user_id: User ID if user already exists (optional)
            password: Password if creating new account (required if user_id not provided)
            name: Name if creating new account (optional)
            
        Returns:
            Tuple of (Invitation, OrganizationMember)
            
        Raises:
            ValueError: If invitation is invalid or expired
        """
        invitation = self.get_invitation_by_token(token)
        
        if invitation is None:
            raise ValueError("Invalid or expired invitation")
        
        if invitation.status != InvitationStatusEnum.PENDING:
            raise ValueError("Invitation has already been used or expired")
        
        # Check if user exists by email
        user = self.db.query(UserRecord).filter(
            UserRecord.email == invitation.email
        ).first()
        
        if user is None:
            # Create new user
            if password is None:
                raise ValueError("Password required to create new account")
            
            from app.services.auth import AuthService
            auth_service = AuthService(self.db)
            user = auth_service.signup(
                email=invitation.email,
                password=password,
                name=name
            )
        elif user_id is not None and user.id != user_id:
            raise ValueError("Email does not match authenticated user")
        
        # Check if already a member (edge case)
        existing_member = self.member_service.get_member(
            invitation.organization_id, user.id
        )
        if existing_member:
            # Mark invitation as accepted anyway
            invitation.status = InvitationStatusEnum.ACCEPTED
            invitation.accepted_at = datetime.utcnow()
            self.db.commit()
            return invitation, existing_member
        
        # Add user as member
        member = self.member_service.add_member(
            organization_id=invitation.organization_id,
            user_id=user.id,
            role=invitation.role,
            added_by_id=invitation.invited_by_id or user.id
        )
        
        # Update invitation
        invitation.status = InvitationStatusEnum.ACCEPTED
        invitation.accepted_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(invitation)
        
        return invitation, member

    def revoke_invitation(
        self, invitation_id: int, organization_id: int, revoked_by_id: int
    ) -> bool:
        """Revoke an invitation.
        
        Args:
            invitation_id: Invitation ID
            organization_id: Organization ID
            revoked_by_id: User ID who is revoking the invitation
            
        Returns:
            True if revoked, False if not found
        """
        invitation = self.db.query(Invitation).filter(
            Invitation.id == invitation_id,
            Invitation.organization_id == organization_id
        ).first()
        
        if invitation is None:
            return False
        
        if invitation.status == InvitationStatusEnum.ACCEPTED:
            raise ValueError("Cannot revoke an accepted invitation")
        
        # Mark as expired (soft delete)
        invitation.status = InvitationStatusEnum.EXPIRED
        self.db.commit()
        
        # Audit log
        self.audit_service.log_organization_action(
            action=AuditActionEnum.MEMBER_INVITE,  # Reuse this action type
            user_id=revoked_by_id,
            organization_id=organization_id,
            resource_type="invitation",
            resource_id=invitation_id,
            details=f"Revoked invitation for {invitation.email}"
        )
        
        return True


