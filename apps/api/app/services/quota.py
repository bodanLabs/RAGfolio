"""Service for organization quota management."""

from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.tables import Organization, OrganizationQuota
from app.db.enums import DocumentStatusEnum


class QuotaService:
    """Service for managing organization quotas and usage.
    
    This service handles quota checking, updates, and creation for organizations.
    """

    def __init__(self, db: Session):
        """Initialize the QuotaService with a database session.
        
        Args:
            db: SQLAlchemy session
        """
        self.db = db

    def get_or_create_quota(self, organization_id: int) -> OrganizationQuota:
        """Get quota for an organization, creating it if it doesn't exist.
        
        Args:
            organization_id: ID of the organization
            
        Returns:
            OrganizationQuota instance
        """
        quota = self.db.query(OrganizationQuota).filter(
            OrganizationQuota.organization_id == organization_id
        ).first()
        
        if quota is None:
            quota = OrganizationQuota(organization_id=organization_id)
            self.db.add(quota)
            self.db.commit()
            self.db.refresh(quota)
        
        return quota

    def check_document_quota(
        self, organization_id: int, additional_documents: int = 1
    ) -> tuple[bool, Optional[str]]:
        """Check if organization can add more documents.
        
        Args:
            organization_id: ID of the organization
            additional_documents: Number of documents to add
            
        Returns:
            Tuple of (can_add, error_message)
        """
        quota = self.get_or_create_quota(organization_id)
        
        if quota.current_documents + additional_documents > quota.max_documents:
            return False, f"Document limit reached ({quota.max_documents})"
        
        return True, None

    def check_storage_quota(
        self, organization_id: int, additional_bytes: int
    ) -> tuple[bool, Optional[str]]:
        """Check if organization can use more storage.
        
        Args:
            organization_id: ID of the organization
            additional_bytes: Bytes to add
            
        Returns:
            Tuple of (can_add, error_message)
        """
        quota = self.get_or_create_quota(organization_id)
        
        if quota.current_storage_bytes + additional_bytes > quota.max_storage_bytes:
            max_gb = quota.max_storage_bytes / (1024 ** 3)
            return False, f"Storage limit reached ({max_gb:.2f} GB)"
        
        return True, None

    def check_chat_session_quota(
        self, organization_id: int, additional_sessions: int = 1
    ) -> tuple[bool, Optional[str]]:
        """Check if organization can create more chat sessions.
        
        Args:
            organization_id: ID of the organization
            additional_sessions: Number of sessions to add
            
        Returns:
            Tuple of (can_add, error_message)
        """
        quota = self.get_or_create_quota(organization_id)
        
        if quota.current_chat_sessions + additional_sessions > quota.max_chat_sessions:
            return False, f"Chat session limit reached ({quota.max_chat_sessions})"
        
        return True, None

    def update_document_count(
        self, organization_id: int, delta: int
    ) -> OrganizationQuota:
        """Update document count for an organization.
        
        Args:
            organization_id: ID of the organization
            delta: Change in document count (positive for add, negative for remove)
            
        Returns:
            Updated OrganizationQuota
        """
        quota = self.get_or_create_quota(organization_id)
        quota.current_documents = max(0, quota.current_documents + delta)
        self.db.commit()
        self.db.refresh(quota)
        return quota

    def update_storage_count(
        self, organization_id: int, delta_bytes: int
    ) -> OrganizationQuota:
        """Update storage usage for an organization.
        
        Args:
            organization_id: ID of the organization
            delta_bytes: Change in storage bytes (positive for add, negative for remove)
            
        Returns:
            Updated OrganizationQuota
        """
        quota = self.get_or_create_quota(organization_id)
        quota.current_storage_bytes = max(0, quota.current_storage_bytes + delta_bytes)
        self.db.commit()
        self.db.refresh(quota)
        return quota

    def update_chunk_count(
        self, organization_id: int, delta: int
    ) -> OrganizationQuota:
        """Update chunk count for an organization.
        
        Args:
            organization_id: ID of the organization
            delta: Change in chunk count
            
        Returns:
            Updated OrganizationQuota
        """
        quota = self.get_or_create_quota(organization_id)
        quota.current_chunks = max(0, quota.current_chunks + delta)
        self.db.commit()
        self.db.refresh(quota)
        return quota

    def update_chat_session_count(
        self, organization_id: int, delta: int
    ) -> OrganizationQuota:
        """Update chat session count for an organization.
        
        Args:
            organization_id: ID of the organization
            delta: Change in chat session count
            
        Returns:
            Updated OrganizationQuota
        """
        quota = self.get_or_create_quota(organization_id)
        quota.current_chat_sessions = max(0, quota.current_chat_sessions + delta)
        self.db.commit()
        self.db.refresh(quota)
        return quota

    def recalculate_usage(self, organization_id: int) -> OrganizationQuota:
        """Recalculate usage statistics from actual database records.
        
        This is useful for correcting quota counts if they become out of sync.
        
        Args:
            organization_id: ID of the organization
            
        Returns:
            Updated OrganizationQuota with recalculated values
        """
        from app.db.tables import Document, DocumentChunk, ChatSession
        
        quota = self.get_or_create_quota(organization_id)
        
        # Recalculate documents
        ready_documents = self.db.query(Document).filter(
            Document.organization_id == organization_id,
            Document.deleted_at.is_(None),
            Document.status == DocumentStatusEnum.READY,
        ).count()
        quota.current_documents = ready_documents
        
        # Recalculate storage
        total_storage = self.db.query(
            Document.file_size
        ).filter(
            Document.organization_id == organization_id,
            Document.deleted_at.is_(None),
        ).with_entities(
            Document.file_size
        ).all()
        quota.current_storage_bytes = sum(size[0] or 0 for size in total_storage)
        
        # Recalculate chunks
        total_chunks = self.db.query(DocumentChunk).join(
            Document
        ).filter(
            Document.organization_id == organization_id,
            Document.deleted_at.is_(None),
        ).count()
        quota.current_chunks = total_chunks
        
        # Recalculate chat sessions
        active_sessions = self.db.query(ChatSession).filter(
            ChatSession.organization_id == organization_id,
            ChatSession.deleted_at.is_(None),
        ).count()
        quota.current_chat_sessions = active_sessions
        
        self.db.commit()
        self.db.refresh(quota)
        return quota