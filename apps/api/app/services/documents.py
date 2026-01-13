"""Service for document operations."""

from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.db.tables import Document, DocumentChunk, Organization
from app.db.enums import DocumentStatusEnum, DocumentTypeEnum
from app.services.file_storage import FileStorageService
from app.services.quota import QuotaService
from app.services.audit import AuditService
from app.db.enums import AuditActionEnum
from app.tasks.document_processing import process_document_task


class DocumentService:
    """Service for document management."""

    def __init__(self, db: Session):
        """Initialize the DocumentService with a database session.
        
        Args:
            db: SQLAlchemy session
        """
        self.db = db
        self.file_storage = FileStorageService()
        self.quota_service = QuotaService(db)
        self.audit_service = AuditService(db)

    def create_document(
        self,
        organization_id: int,
        uploaded_by_id: int,
        file_name: str,
        file_type: str,
        file_content: bytes
    ) -> Document:
        """Create and save a document.
        
        Args:
            organization_id: Organization ID
            uploaded_by_id: User ID who uploaded the document
            file_name: Name of the file
            file_type: Type of file (txt, pdf, docx)
            file_content: File content as bytes
            
        Returns:
            Created Document
            
        Raises:
            ValueError: If quota exceeded or file type is invalid
        """
        # Check quota
        can_add, error = self.quota_service.check_document_quota(organization_id)
        if not can_add:
            raise ValueError(error)
        
        # Check storage quota
        can_store, error = self.quota_service.check_storage_quota(
            organization_id, len(file_content)
        )
        if not can_store:
            raise ValueError(error)
        
        # Validate file type
        try:
            doc_type = DocumentTypeEnum(file_type.lower())
        except ValueError:
            raise ValueError(f"Unsupported file type: {file_type}")
        
        # Save file
        file_path = self.file_storage.save_file(
            file_content, file_name, organization_id
        )
        
        # Create document record
        document = Document(
            organization_id=organization_id,
            uploaded_by_id=uploaded_by_id,
            file_name=file_name,
            file_type=doc_type,
            file_size=len(file_content),
            file_path=file_path,
            storage_type="local",
            status=DocumentStatusEnum.UPLOADED,
            chunk_count=0
        )
        
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        
        # Update quotas
        self.quota_service.update_document_count(organization_id, 1)
        self.quota_service.update_storage_count(organization_id, len(file_content))
        
        # Audit log
        self.audit_service.log_organization_action(
            action=AuditActionEnum.DOC_UPLOAD,
            user_id=uploaded_by_id,
            organization_id=organization_id,
            resource_type="document",
            resource_id=document.id,
            details=f"Uploaded document: {file_name}"
        )
        
        # Trigger async processing
        from app.services.llm_keys import LLMKeyService
        llm_service = LLMKeyService(self.db)
        api_key_obj = llm_service.get_active_api_key(organization_id)
        api_key_str = llm_service.decrypt_api_key(api_key_obj) if api_key_obj else None
        
        process_document_task.delay(
            document_id=document.id,
            organization_id=organization_id,
            api_key=api_key_str
        )
        
        return document

    def get_document(self, document_id: int, organization_id: int) -> Optional[Document]:
        """Get a document by ID.
        
        Args:
            document_id: Document ID
            organization_id: Organization ID
            
        Returns:
            Document if found, None otherwise
        """
        return self.db.query(Document).filter(
            Document.id == document_id,
            Document.organization_id == organization_id,
            Document.deleted_at.is_(None)
        ).first()

    def list_documents(
        self,
        organization_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[DocumentStatusEnum] = None,
        search: Optional[str] = None
    ) -> List[Document]:
        """List documents for an organization.
        
        Args:
            organization_id: Organization ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Filter by status (optional)
            search: Search in file names (optional)
            
        Returns:
            List of documents
        """
        query = self.db.query(Document).filter(
            Document.organization_id == organization_id,
            Document.deleted_at.is_(None)
        )
        
        if status is not None:
            query = query.filter(Document.status == status)
        
        if search:
            query = query.filter(Document.file_name.ilike(f"%{search}%"))
        
        return query.order_by(Document.uploaded_at.desc()).offset(skip).limit(limit).all()

    def delete_document(
        self, document_id: int, organization_id: int, deleted_by_id: int
    ) -> bool:
        """Soft delete a document.
        
        Args:
            document_id: Document ID
            organization_id: Organization ID
            deleted_by_id: User ID who is deleting the document
            
        Returns:
            True if deleted, False if not found
        """
        document = self.get_document(document_id, organization_id)
        if document is None:
            return False
        
        # Soft delete
        document.deleted_at = datetime.utcnow()
        
        # Delete file from storage
        self.file_storage.delete_file(document.file_path)
        
        # Update quotas
        self.quota_service.update_document_count(organization_id, -1)
        self.quota_service.update_storage_count(organization_id, -document.file_size)
        
        # Delete chunks (cascade should handle this, but update quota)
        # Use func.count() to avoid loading all columns (including embedding which may not exist)
        chunk_count = self.db.query(func.count(DocumentChunk.id)).filter(
            DocumentChunk.document_id == document_id
        ).scalar() or 0
        self.quota_service.update_chunk_count(organization_id, -chunk_count)
        
        self.db.commit()
        
        # Audit log
        self.audit_service.log_organization_action(
            action=AuditActionEnum.DOC_DELETE,
            user_id=deleted_by_id,
            organization_id=organization_id,
            resource_type="document",
            resource_id=document_id,
            details=f"Deleted document: {document.file_name}"
        )
        
        return True

    def reprocess_document(
        self, document_id: int, organization_id: int, requested_by_id: int
    ) -> Optional[Document]:
        """Reprocess a document.
        
        Args:
            document_id: Document ID
            organization_id: Organization ID
            requested_by_id: User ID who requested reprocessing
            
        Returns:
            Document if found, None otherwise
        """
        document = self.get_document(document_id, organization_id)
        if document is None:
            return None
        
        # Reset status
        document.status = DocumentStatusEnum.UPLOADED
        document.chunk_count = 0
        document.error_message = None
        
        # Delete existing chunks
        self.db.query(DocumentChunk).filter(
            DocumentChunk.document_id == document_id
        ).delete()
        
        self.db.commit()
        
        # Trigger async processing
        from app.services.llm_keys import LLMKeyService
        llm_service = LLMKeyService(self.db)
        api_key_obj = llm_service.get_active_api_key(organization_id)
        api_key_str = llm_service.decrypt_api_key(api_key_obj) if api_key_obj else None
        
        process_document_task.delay(
            document_id=document.id,
            organization_id=organization_id,
            api_key=api_key_str
        )
        
        return document

    def get_document_stats(self, organization_id: int) -> dict:
        """Get document statistics for an organization.
        
        Args:
            organization_id: Organization ID
            
        Returns:
            Dictionary with statistics
        """
        stats = self.db.query(
            func.count(Document.id).label("total"),
            func.sum(case((Document.status == DocumentStatusEnum.READY, 1), else_=0)).label("ready"),
            func.sum(case((Document.status == DocumentStatusEnum.PROCESSING, 1), else_=0)).label("processing"),
            func.sum(case((Document.status == DocumentStatusEnum.FAILED, 1), else_=0)).label("failed"),
            func.sum(Document.file_size).label("total_size"),
            func.sum(Document.chunk_count).label("total_chunks")
        ).filter(
            Document.organization_id == organization_id,
            Document.deleted_at.is_(None)
        ).first()
        
        return {
            "total_documents": stats.total or 0,
            "ready_documents": stats.ready or 0,
            "processing_documents": stats.processing or 0,
            "failed_documents": stats.failed or 0,
            "total_chunks": stats.total_chunks or 0,
            "total_size": stats.total_size or 0
        }
