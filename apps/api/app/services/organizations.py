"""Service for organization operations."""

from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from app.db.tables import Organization, OrganizationMember, OrganizationQuota, UserRecord
from app.db.enums import UserRoleEnum
from app.services.quota import QuotaService
from app.services.audit import AuditService
from app.db.enums import AuditActionEnum
import re


class OrganizationService:
    """Service for organization management.
    
    This service handles organization CRUD operations, member management,
    and statistics.
    """

    def __init__(self, db: Session):
        """Initialize the OrganizationService with a database session.
        
        Args:
            db: SQLAlchemy session
        """
        self.db = db
        self.quota_service = QuotaService(db)
        self.audit_service = AuditService(db)

    @staticmethod
    def _generate_slug(name: str) -> str:
        """Generate a URL-friendly slug from organization name.
        
        Args:
            name: Organization name
            
        Returns:
            URL-friendly slug
        """
        slug = re.sub(r'[^\w\s-]', '', name.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        return slug.strip('-')[:255]

    def create_organization(
        self, name: str, user_id: int, slug: Optional[str] = None
    ) -> Organization:
        """Create a new organization and add the creator as an admin.
        
        Args:
            name: Organization name
            user_id: ID of the user creating the organization
            slug: Optional slug (auto-generated if not provided)
            
        Returns:
            Created Organization
            
        Raises:
            ValueError: If slug already exists
        """
        if slug is None:
            base_slug = self._generate_slug(name)
            slug = base_slug
            counter = 1
            
            # Ensure slug is unique
            while self.db.query(Organization).filter(Organization.slug == slug).first():
                slug = f"{base_slug}-{counter}"
                counter += 1
        
        org = Organization(name=name, slug=slug)
        
        try:
            self.db.add(org)
            self.db.flush()  # Get the ID
            
            # Add creator as admin
            member = OrganizationMember(
                user_id=user_id,
                organization_id=org.id,
                role=UserRoleEnum.ADMIN
            )
            self.db.add(member)
            
            # Create default quota
            quota = OrganizationQuota(organization_id=org.id)
            self.db.add(quota)
            
            self.db.commit()
            self.db.refresh(org)
            
            # Audit log
            self.audit_service.log_organization_action(
                action=AuditActionEnum.ORG_CREATE,
                user_id=user_id,
                organization_id=org.id,
                resource_type="organization",
                resource_id=org.id,
                details=f"Created organization: {name}"
            )
            
            return org
        except IntegrityError as e:
            self.db.rollback()
            if "slug" in str(e).lower() or "unique" in str(e).lower():
                raise ValueError(f"Organization slug '{slug}' already exists") from e
            raise ValueError("Failed to create organization") from e

    def get_organization(self, org_id: int) -> Optional[Organization]:
        """Get an organization by ID.
        
        Args:
            org_id: Organization ID
            
        Returns:
            Organization if found, None otherwise
        """
        return self.db.query(Organization).filter(
            Organization.id == org_id,
            Organization.deleted_at.is_(None)
        ).first()

    def get_user_organizations(
        self, user_id: int, skip: int = 0, limit: int = 100
    ) -> list[Organization]:
        """Get all organizations a user is a member of.
        
        Args:
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of organizations
        """
        return self.db.query(Organization).join(
            OrganizationMember
        ).filter(
            OrganizationMember.user_id == user_id,
            Organization.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()

    def update_organization(
        self, org_id: int, user_id: int, name: Optional[str] = None,
        slug: Optional[str] = None
    ) -> Optional[Organization]:
        """Update an organization.
        
        Args:
            org_id: Organization ID
            user_id: User ID performing the update
            name: New name (optional)
            slug: New slug (optional)
            
        Returns:
            Updated Organization if found, None otherwise
            
        Raises:
            ValueError: If slug already exists
        """
        org = self.get_organization(org_id)
        if org is None:
            return None
        
        if name is not None:
            org.name = name
            # Auto-generate slug if name changed and slug not provided
            if slug is None:
                slug = self._generate_slug(name)
        
        if slug is not None:
            # Check if slug is already taken
            existing = self.db.query(Organization).filter(
                Organization.slug == slug,
                Organization.id != org_id,
                Organization.deleted_at.is_(None)
            ).first()
            if existing:
                raise ValueError(f"Slug '{slug}' already exists")
            org.slug = slug
        
        org.updated_at = datetime.utcnow()
        
        try:
            self.db.commit()
            self.db.refresh(org)
            
            # Audit log
            self.audit_service.log_organization_action(
                action=AuditActionEnum.ORG_UPDATE,
                user_id=user_id,
                organization_id=org_id,
                resource_type="organization",
                resource_id=org_id,
                details=f"Updated organization: {name or org.name}"
            )
            
            return org
        except IntegrityError as e:
            self.db.rollback()
            if "slug" in str(e).lower() or "unique" in str(e).lower():
                raise ValueError(f"Slug '{slug}' already exists") from e
            raise

    def delete_organization(self, org_id: int, user_id: int) -> bool:
        """Soft delete an organization.
        
        Args:
            org_id: Organization ID
            user_id: User ID performing the deletion
            
        Returns:
            True if deleted, False if not found
        """
        org = self.get_organization(org_id)
        if org is None:
            return False
        
        org.deleted_at = datetime.utcnow()
        self.db.commit()
        
        # Audit log
        self.audit_service.log_organization_action(
            action=AuditActionEnum.ORG_DELETE,
            user_id=user_id,
            organization_id=org_id,
            resource_type="organization",
            resource_id=org_id,
            details=f"Deleted organization: {org.name}"
        )
        
        return True

    def get_organization_stats(self, org_id: int) -> Optional[OrganizationQuota]:
        """Get organization statistics.
        
        Args:
            org_id: Organization ID
            
        Returns:
            OrganizationQuota with statistics if found, None otherwise
        """
        return self.quota_service.get_or_create_quota(org_id)

    def get_user_role(self, user_id: int, org_id: int) -> Optional[UserRoleEnum]:
        """Get user's role in an organization.
        
        Args:
            user_id: User ID
            org_id: Organization ID
            
        Returns:
            UserRoleEnum if user is a member, None otherwise
        """
        membership = self.db.query(OrganizationMember).filter(
            OrganizationMember.user_id == user_id,
            OrganizationMember.organization_id == org_id
        ).first()
        
        return membership.role if membership else None

    def is_member(self, user_id: int, org_id: int) -> bool:
        """Check if user is a member of an organization.
        
        Args:
            user_id: User ID
            org_id: Organization ID
            
        Returns:
            True if user is a member, False otherwise
        """
        return self.get_user_role(user_id, org_id) is not None

    def is_admin(self, user_id: int, org_id: int) -> bool:
        """Check if user is an admin of an organization.
        
        Args:
            user_id: User ID
            org_id: Organization ID
            
        Returns:
            True if user is an admin, False otherwise
        """
        role = self.get_user_role(user_id, org_id)
        return role == UserRoleEnum.ADMIN
