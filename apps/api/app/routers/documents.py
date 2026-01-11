"""Document routes for upload, list, delete, and reprocess operations."""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_db, get_current_user, get_organization, require_admin,
    get_organization_from_query, get_organization_from_form
)
from app.db.tables import OrganizationMember, Document
from app.db.tables import UserRecord, Organization
from app.db.enums import DocumentStatusEnum, DocumentTypeEnum
from app.models.document import (
    DocumentResponse, DocumentUploadResponse, DocumentStats, DocumentListResponse
)
from app.services.documents import DocumentService
from app.settings import settings

router = APIRouter(tags=["documents"], prefix="/api/documents")


def get_document_service(db: Session = Depends(get_db)) -> DocumentService:
    """Dependency for DocumentService."""
    return DocumentService(db)


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    status: Annotated[Optional[str], Query(description="Filter by status")] = None,
    search: Annotated[Optional[str], Query(description="Search in file names")] = None,
    org_id: Annotated[int, Query(description="Organization ID")] = None,
    org: Optional[Organization] = Depends(get_organization_from_query),
    current_user: UserRecord = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
):
    """List documents with pagination and filters.
    
    Args:
        page: Page number
        page_size: Items per page
        status: Filter by status (optional)
        search: Search in file names (optional)
        org_id: Organization ID from query
        org: Organization from dependency (if org_id provided)
        current_user: Current authenticated user
        document_service: DocumentService instance
        
    Returns:
        Paginated list of documents
        
    Raises:
        HTTPException: 400 if invalid status
    """
    # Get organization from query or require org_id in query
    if org_id and not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found or you are not a member"
        )
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID is required"
        )
    
    status_enum = None
    if status:
        try:
            status_enum = DocumentStatusEnum(status.upper())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {[e.value for e in DocumentStatusEnum]}"
            )
    
    skip = (page - 1) * page_size
    documents = document_service.list_documents(
        organization_id=org.id,
        skip=skip,
        limit=page_size,
        status=status_enum,
        search=search
    )
    
    # Get total count for pagination
    total = document_service.db.query(Document).filter(
        Document.organization_id == org.id,
        Document.deleted_at.is_(None)
    ).count()
    
    return DocumentListResponse(
        items=[DocumentResponse.model_validate(doc) for doc in documents],
        pagination={
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
            "has_next": page * page_size < total,
            "has_prev": page > 1
        }
    )


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: int,
    org_id: Annotated[int, Query(description="Organization ID")],
    org: Organization = Depends(get_organization),
    document_service: DocumentService = Depends(get_document_service),
):
    """Get document details.
    
    Args:
        doc_id: Document ID
        org_id: Organization ID from query
        org: Organization from dependency
        document_service: DocumentService instance
        
    Returns:
        Document details
        
    Raises:
        HTTPException: 404 if document not found
    """
    document = document_service.get_document(doc_id, org.id)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return DocumentResponse.model_validate(document)


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    org_id: Annotated[int, Form(description="Organization ID")] = None,
    org: Optional[Organization] = Depends(get_organization_from_form),
    current_user: UserRecord = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
):
    """Upload a document.
    
    Args:
        file: File to upload
        org_id: Organization ID from form
        org: Organization from dependency
        current_user: Current authenticated user
        document_service: DocumentService instance
        
    Returns:
        Uploaded document info
        
    Raises:
        HTTPException: 400 if file is invalid or quota exceeded
    """
    if not org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID is required"
        )
    
    # Validate file size
    file_content = await file.read()
    max_size = settings.max_file_size_mb * 1024 * 1024
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum ({settings.max_file_size_mb} MB)"
        )
    
    # Get file extension
    file_ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    
    try:
        document = document_service.create_document(
            organization_id=org.id,
            uploaded_by_id=current_user.id,
            file_name=file.filename,
            file_type=file_ext,
            file_content=file_content
        )
        return DocumentUploadResponse.model_validate(document)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: int,
    org_id: Annotated[int, Query(description="Organization ID")],
    org: Organization = Depends(get_organization),
    membership: OrganizationMember = Depends(require_admin),
    current_user: UserRecord = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
):
    """Delete a document (admin only).
    
    Args:
        doc_id: Document ID
        org_id: Organization ID from query
        org: Organization from dependency
        membership: Membership (guaranteed to be admin)
        current_user: Current authenticated user
        document_service: DocumentService instance
        
    Raises:
        HTTPException: 404 if document not found
    """
    deleted = document_service.delete_document(
        document_id=doc_id,
        organization_id=org.id,
        deleted_by_id=current_user.id
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )


@router.post("/{doc_id}/reprocess", response_model=DocumentResponse)
async def reprocess_document(
    doc_id: int,
    org_id: Annotated[int, Query(description="Organization ID")],
    org: Organization = Depends(get_organization),
    membership: OrganizationMember = Depends(require_admin),
    current_user: UserRecord = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
):
    """Reprocess a document (admin only).
    
    Args:
        doc_id: Document ID
        org_id: Organization ID from query
        org: Organization from dependency
        membership: Membership (guaranteed to be admin)
        current_user: Current authenticated user
        document_service: DocumentService instance
        
    Returns:
        Updated document
        
    Raises:
        HTTPException: 404 if document not found
    """
    document = document_service.reprocess_document(
        document_id=doc_id,
        organization_id=org.id,
        requested_by_id=current_user.id
    )
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return DocumentResponse.model_validate(document)


@router.get("/organizations/{org_id}/stats", response_model=DocumentStats)
async def get_document_stats(
    org: Organization = Depends(get_organization),
    document_service: DocumentService = Depends(get_document_service),
):
    """Get document statistics for an organization.
    
    Args:
        org: Organization from dependency
        document_service: DocumentService instance
        
    Returns:
        Document statistics
    """
    stats = document_service.get_document_stats(org.id)
    return DocumentStats.model_validate(stats)
