"""Chat routes for sessions and messages."""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_db, get_current_user, get_organization
)
from app.db.tables import MessageSource, DocumentChunk, Document
from app.db.tables import UserRecord, Organization
from app.models.chat import (
    ChatSessionResponse, ChatSessionCreate, ChatSessionUpdate,
    ChatMessageResponse, ChatMessageCreate, ChatMessageWithSources
)
from app.services.chat import ChatService

router = APIRouter(tags=["chat"], prefix="/api/chat")


def get_chat_service(
    org: Organization = Depends(get_organization),
    db: Session = Depends(get_db)
) -> ChatService:
    """Dependency for ChatService."""
    return ChatService(db, org.id)


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    org_id: Annotated[int, Query(description="Organization ID")] = None,
    org: Organization = Depends(get_organization),
    current_user: UserRecord = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
):
    """List chat sessions with pagination.
    
    Args:
        page: Page number
        page_size: Items per page
        org_id: Organization ID from query
        org: Organization from dependency
        current_user: Current authenticated user
        chat_service: ChatService instance
        
    Returns:
        List of chat sessions
    """
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
    org: Organization = Depends(get_organization),
    current_user: UserRecord = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
):
    """Create a new chat session.
    
    Args:
        request: Session creation request
        org_id: Organization ID from query
        org: Organization from dependency
        current_user: Current authenticated user
        chat_service: ChatService instance
        
    Returns:
        Created chat session
        
    Raises:
        HTTPException: 400 if quota exceeded
    """
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
    org: Organization = Depends(get_organization),
    current_user: UserRecord = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
):
    """Get chat session details.
    
    Args:
        session_id: Session ID
        org_id: Organization ID from query
        org: Organization from dependency
        current_user: Current authenticated user
        chat_service: ChatService instance
        
    Returns:
        Chat session details
        
    Raises:
        HTTPException: 404 if session not found
    """
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
    org: Organization = Depends(get_organization),
    current_user: UserRecord = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
):
    """Update a chat session (title).
    
    Args:
        session_id: Session ID
        request: Session update request
        org_id: Organization ID from query
        org: Organization from dependency
        current_user: Current authenticated user
        chat_service: ChatService instance
        
    Returns:
        Updated chat session
        
    Raises:
        HTTPException: 404 if session not found
    """
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
    org: Organization = Depends(get_organization),
    current_user: UserRecord = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
):
    """Delete a chat session.
    
    Args:
        session_id: Session ID
        org_id: Organization ID from query
        org: Organization from dependency
        current_user: Current authenticated user
        chat_service: ChatService instance
        
    Raises:
        HTTPException: 404 if session not found
    """
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
    org: Organization = Depends(get_organization),
    current_user: UserRecord = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
    db: Session = Depends(get_db),
):
    """Get messages in a chat session.
    
    Args:
        session_id: Session ID
        limit: Maximum number of messages to return
        org_id: Organization ID from query
        org: Organization from dependency
        current_user: Current authenticated user
        chat_service: ChatService instance
        
    Returns:
        List of messages with sources
    """
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
    org: Organization = Depends(get_organization),
    current_user: UserRecord = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
    db: Session = Depends(get_db),
):
    """Send a message and get AI response.
    
    Args:
        session_id: Session ID
        request: Message creation request
        org_id: Organization ID from query
        org: Organization from dependency
        current_user: Current authenticated user
        chat_service: ChatService instance
        db: Database session
        
    Returns:
        Assistant message with sources
        
    Raises:
        HTTPException: 400 if session not found or RAG processing fails
    """
    try:
        user_msg, assistant_msg = chat_service.send_message(
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
