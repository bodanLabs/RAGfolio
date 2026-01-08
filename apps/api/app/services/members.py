"""Service for organization member management."""

from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.tables import OrganizationMember, UserRecord, Organization
from app.db.enums import UserRoleEnum
from app.services.audit import AuditService
from app.db.enums import AuditActionEnum


class MemberService:
    """Service for managing organization members."""

    def __init__(self, db: Session):
        """Initialize the MemberService with a database session.
        
        Args:
            db: SQLAlchemy session
        """
        self.db = db
        self.audit_service = AuditService(db)

    def get_members(
        self, organization_id: int, skip: int = 0, limit: int = 100
    ) -> list[OrganizationMember]:
        """Get all members of an organization.
        
        Args:
            organization_id: Organization ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of OrganizationMember records
        """
        return self.db.query(OrganizationMember).filter(
            OrganizationMember.organization_id == organization_id
        ).offset(skip).limit(limit).all()

    def get_member(
        self, organization_id: int, user_id: int
    ) -> Optional[OrganizationMember]:
        """Get a specific membership.
        
        Args:
            organization_id: Organization ID
            user_id: User ID
            
        Returns:
            OrganizationMember if found, None otherwise
        """
        return self.db.query(OrganizationMember).filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id
        ).first()

    def add_member(
        self, organization_id: int, user_id: int, role: UserRoleEnum,
        added_by_id: int
    ) -> OrganizationMember:
        """Add a member to an organization.
        
        Args:
            organization_id: Organization ID
            user_id: User ID to add
            role: Role to assign
            added_by_id: User ID who is adding the member
            
        Returns:
            Created OrganizationMember
            
        Raises:
            ValueError: If member already exists
        """
        # Check if already a member
        existing = self.get_member(organization_id, user_id)
        if existing:
            raise ValueError("User is already a member of this organization")
        
        member = OrganizationMember(
            organization_id=organization_id,
            user_id=user_id,
            role=role
        )
        
        try:
            self.db.add(member)
            self.db.commit()
            self.db.refresh(member)
            
            # Audit log
            user = self.db.query(UserRecord).filter(UserRecord.id == user_id).first()
            user_email = user.email if user else f"user_{user_id}"
            
            self.audit_service.log_organization_action(
                action=AuditActionEnum.MEMBER_JOIN,
                user_id=added_by_id,
                organization_id=organization_id,
                resource_type="member",
                resource_id=member.id,
                details=f"Added member: {user_email} as {role.value}"
            )
            
            return member
        except IntegrityError:
            self.db.rollback()
            raise ValueError("User is already a member of this organization")

    def update_member_role(
        self, member_id: int, new_role: UserRoleEnum, updated_by_id: int
    ) -> Optional[OrganizationMember]:
        """Update a member's role.
        
        Args:
            member_id: Member ID
            new_role: New role
            updated_by_id: User ID who is updating the role
            
        Returns:
            Updated OrganizationMember if found, None otherwise
        """
        member = self.db.query(OrganizationMember).filter(
            OrganizationMember.id == member_id
        ).first()
        
        if member is None:
            return None
        
        old_role = member.role
        member.role = new_role
        
        self.db.commit()
        self.db.refresh(member)
        
        # Audit log
        user = self.db.query(UserRecord).filter(UserRecord.id == member.user_id).first()
        user_email = user.email if user else f"user_{member.user_id}"
        
        self.audit_service.log_organization_action(
            action=AuditActionEnum.MEMBER_ROLE_CHANGE,
            user_id=updated_by_id,
            organization_id=member.organization_id,
            resource_type="member",
            resource_id=member.id,
            details=f"Changed role for {user_email} from {old_role.value} to {new_role.value}"
        )
        
        return member

    def remove_member(
        self, organization_id: int, user_id: int, removed_by_id: int
    ) -> bool:
        """Remove a member from an organization.
        
        Args:
            organization_id: Organization ID
            user_id: User ID to remove
            removed_by_id: User ID who is removing the member
            
        Returns:
            True if removed, False if not found
        """
        member = self.get_member(organization_id, user_id)
        if member is None:
            return False
        
        member_id = member.id
        
        # Get user info before deletion for audit log
        user = self.db.query(UserRecord).filter(UserRecord.id == user_id).first()
        user_email = user.email if user else f"user_{user_id}"
        
        self.db.delete(member)
        self.db.commit()
        
        # Audit log
        self.audit_service.log_organization_action(
            action=AuditActionEnum.MEMBER_REMOVE,
            user_id=removed_by_id,
            organization_id=organization_id,
            resource_type="member",
            resource_id=member_id,
            details=f"Removed member: {user_email}"
        )
        
        return True
