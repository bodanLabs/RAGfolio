"""Chat routes for sessions and messages."""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_db, get_current_user, get_organization_from_query
)
from app.db.tables import MessageSource, DocumentChunk, Document
from app.db.tables import UserRecord, Organization
from app.models.chat import (
    ChatSessionResponse, ChatSessionCreate, ChatSessionUpdate,
    ChatMessageResponse, ChatMessageCreate, ChatMessageWithSources
)
from app.services.chat import ChatService

router = APIRouter(tags=["chat"], prefix="/api/chat")


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    org_id: Annotated[int, Query(description="Organization ID")] = None,
    org: Optional[Organization] = Depends(get_organization_from_query),
    current_user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List chat sessions with pagination.
    
    Args:
        page: Page number
        page_size: Items per page
        org_id: Organization ID from query
        org: Organization from dependency
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of chat sessions
        
    Raises:
        HTTPException: 400 if organization ID is required
    """
    if not org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID is required"
        )
    
    chat_service = ChatService(db, org.id)
    skip = (page - 1) * page_size
    sessions = chat_service.list_sessions(
        user_id=current_user.id,
        skip=skip,
        limit=page_size
    )
    return [ChatSessionResponse.model_validate(session) for session in sessions]


@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    request: ChatSessionCreate,
    org_id: Annotated[int, Query(description="Organization ID")] = None,
    org: Optional[Organization] = Depends(get_organization_from_query),
    current_user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new chat session.
    
    Args:
        request: Session creation request
        org_id: Organization ID from query
        org: Organization from dependency
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Created chat session
        
    Raises:
        HTTPException: 400 if organization ID is required or quota exceeded
    """
    if not org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID is required"
        )
    
    chat_service = ChatService(db, org.id)
    try:
        session = chat_service.create_session(
            user_id=current_user.id,
            title=request.title
        )
        return ChatSessionResponse.model_validate(session)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_session(
    session_id: int,
    org_id: Annotated[int, Query(description="Organization ID")] = None,
    org: Optional[Organization] = Depends(get_organization_from_query),
    current_user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get chat session details.
    
    Args:
        session_id: Session ID
        org_id: Organization ID from query
        org: Organization from dependency
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Chat session details
        
    Raises:
        HTTPException: 400 if organization ID is required, 404 if session not found
    """
    if not org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID is required"
        )
    
    chat_service = ChatService(db, org.id)
    session = chat_service.get_session(session_id, current_user.id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    return ChatSessionResponse.model_validate(session)


@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_session(
    session_id: int,
    request: ChatSessionUpdate,
    org_id: Annotated[int, Query(description="Organization ID")] = None,
    org: Optional[Organization] = Depends(get_organization_from_query),
    current_user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a chat session (title).
    
    Args:
        session_id: Session ID
        request: Session update request
        org_id: Organization ID from query
        org: Organization from dependency
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated chat session
        
    Raises:
        HTTPException: 400 if organization ID is required, 404 if session not found
    """
    if not org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID is required"
        )
    
    chat_service = ChatService(db, org.id)
    session = chat_service.update_session(
        session_id=session_id,
        user_id=current_user.id,
        title=request.title
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    return ChatSessionResponse.model_validate(session)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: int,
    org_id: Annotated[int, Query(description="Organization ID")] = None,
    org: Optional[Organization] = Depends(get_organization_from_query),
    current_user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a chat session.
    
    Args:
        session_id: Session ID
        org_id: Organization ID from query
        org: Organization from dependency
        current_user: Current authenticated user
        db: Database session
        
    Raises:
        HTTPException: 400 if organization ID is required, 404 if session not found
    """
    if not org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID is required"
        )
    
    chat_service = ChatService(db, org.id)
    deleted = chat_service.delete_session(session_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageWithSources])
async def get_messages(
    session_id: int,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    org_id: Annotated[int, Query(description="Organization ID")] = None,
    org: Optional[Organization] = Depends(get_organization_from_query),
    current_user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get messages in a chat session.
    
    Args:
        session_id: Session ID
        limit: Maximum number of messages to return
        org_id: Organization ID from query
        org: Organization from dependency
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of messages with sources
        
    Raises:
        HTTPException: 400 if organization ID is required
    """
    if not org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID is required"
        )
    
    chat_service = ChatService(db, org.id)
    messages = chat_service.get_messages(session_id, current_user.id, limit=limit)
    
    # Get sources for assistant messages
    result = []
    for msg in messages:
        msg_dict = ChatMessageResponse.model_validate(msg).model_dump()
        
        if msg.role.value == "assistant":
            # Get sources for this message
            sources = []
            for msg_source in db.query(MessageSource).filter(
                MessageSource.message_id == msg.id
            ).all():
                chunk = db.query(DocumentChunk).filter(
                    DocumentChunk.id == msg_source.chunk_id
                ).first()
                if chunk:
                    doc = db.query(Document).filter(
                        Document.id == chunk.document_id
                    ).first()
                    if doc:
                        sources.append({
                            "document_id": doc.id,
                            "file_name": doc.file_name,
                            "chunk_id": chunk.id,
                            "relevance_score": msg_source.relevance_score,
                            "text_preview": chunk.text_content[:200] + "..." if len(chunk.text_content) > 200 else chunk.text_content
                        })
            msg_dict["sources"] = sources
        
        result.append(ChatMessageWithSources(**msg_dict))
    
    return result


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageWithSources)
async def send_message(
    session_id: int,
    request: ChatMessageCreate = Body(...),
    org_id: Annotated[int, Query(description="Organization ID")] = None,
    org: Optional[Organization] = Depends(get_organization_from_query),
    current_user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a message and get AI response.
    
    Args:
        session_id: Session ID
        request: Message creation request
        org_id: Organization ID from query
        org: Organization from dependency
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Assistant message with sources
        
    Raises:
        HTTPException: 400 if organization ID is required, session not found, or RAG processing fails
    """
    if not org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID is required"
        )
    
    chat_service = ChatService(db, org.id)
    try:
        user_msg, assistant_msg = await chat_service.send_message(
            session_id=session_id,
            user_id=current_user.id,
            content=request.content
        )
        
        # Get sources for assistant message
        from app.db.tables import MessageSource, DocumentChunk, Document
        sources = []
        for msg_source in db.query(MessageSource).filter(
            MessageSource.message_id == assistant_msg.id
        ).all():
            chunk = db.query(DocumentChunk).filter(
                DocumentChunk.id == msg_source.chunk_id
            ).first()
            if chunk:
                doc = db.query(Document).filter(
                    Document.id == chunk.document_id
                ).first()
                if doc:
                    sources.append({
                        "document_id": doc.id,
                        "file_name": doc.file_name,
                        "chunk_id": chunk.id,
                        "relevance_score": msg_source.relevance_score,
                        "text_preview": chunk.text_content[:200] + "..." if len(chunk.text_content) > 200 else chunk.text_content
                    })
        
        msg_dict = ChatMessageResponse.model_validate(assistant_msg).model_dump()
        msg_dict["sources"] = sources
        
        return ChatMessageWithSources(**msg_dict)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e
