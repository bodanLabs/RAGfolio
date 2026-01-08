"""Service for audit logging operations."""

from typing import Optional
from sqlalchemy.orm import Session

from app.db.tables import AuditLog, UserRecord, Organization
from app.db.enums import AuditActionEnum


class AuditService:
    """Service for audit logging.
    
    This service provides methods to log all critical operations for compliance
    and security monitoring.
    """

    def __init__(self, db: Session):
        """Initialize the AuditService with a database session.
        
        Args:
            db: SQLAlchemy session
        """
        self.db = db

    def log(
        self,
        action: AuditActionEnum,
        user_id: Optional[int] = None,
        organization_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        details: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Create an audit log entry.
        
        Args:
            action: The action that was performed
            user_id: ID of the user who performed the action (optional)
            organization_id: ID of the organization (optional)
            resource_type: Type of resource affected (e.g., "document", "member")
            resource_id: ID of the resource affected (optional)
            details: Additional details about the action (optional)
            ip_address: IP address of the request (optional)
            user_agent: User agent string (optional)
            
        Returns:
            Created AuditLog entry
        """
        audit_log = AuditLog(
            action=action,
            user_id=user_id,
            organization_id=organization_id,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(audit_log)
        
        return audit_log

    def log_user_action(
        self,
        action: AuditActionEnum,
        user_id: int,
        details: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Log a user-level action.
        
        Args:
            action: The action performed
            user_id: ID of the user
            details: Additional details
            ip_address: IP address
            user_agent: User agent
            
        Returns:
            Created AuditLog entry
        """
        return self.log(
            action=action,
            user_id=user_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    def log_organization_action(
        self,
        action: AuditActionEnum,
        user_id: int,
        organization_id: int,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        details: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Log an organization-level action.
        
        Args:
            action: The action performed
            user_id: ID of the user who performed it
            organization_id: ID of the organization
            resource_type: Type of resource affected
            resource_id: ID of the resource affected
            details: Additional details
            ip_address: IP address
            user_agent: User agent
            
        Returns:
            Created AuditLog entry
        """
        return self.log(
            action=action,
            user_id=user_id,
            organization_id=organization_id,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )