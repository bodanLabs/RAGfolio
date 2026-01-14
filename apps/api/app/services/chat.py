"""Service for chat operations."""

from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session

from app.db.tables import ChatSession, ChatMessage, MessageSource, DocumentChunk
from app.db.enums import MessageRoleEnum
from app.services.rag import RAGService
from app.services.quota import QuotaService
from app.services.audit import AuditService
from app.db.enums import AuditActionEnum


class ChatService:
    """Service for chat management."""

    def __init__(self, db: Session, organization_id: int):
        """Initialize the ChatService.
        
        Args:
            db: Database session
            organization_id: Organization ID
        """
        self.db = db
        self.organization_id = organization_id
        self.quota_service = QuotaService(db)
        self.audit_service = AuditService(db)
        self.rag_service = RAGService(db, organization_id)

    def create_session(
        self, user_id: int, title: Optional[str] = None
    ) -> ChatSession:
        """Create a new chat session.
        
        Args:
            user_id: User ID
            title: Session title (default: "New Chat")
            
        Returns:
            Created ChatSession
            
        Raises:
            ValueError: If quota exceeded
        """
        # Check quota
        can_add, error = self.quota_service.check_chat_session_quota(self.organization_id)
        if not can_add:
            raise ValueError(error)
        
        if title is None:
            title = "New Chat"
        
        session = ChatSession(
            organization_id=self.organization_id,
            user_id=user_id,
            title=title,
            message_count=0
        )
        
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        
        # Update quota
        self.quota_service.update_chat_session_count(self.organization_id, 1)
        
        # Audit log
        self.audit_service.log_organization_action(
            action=AuditActionEnum.CHAT_CREATE,
            user_id=user_id,
            organization_id=self.organization_id,
            resource_type="chat_session",
            resource_id=session.id,
            details=f"Created chat session: {title}"
        )
        
        return session

    def get_session(self, session_id: int, user_id: int) -> Optional[ChatSession]:
        """Get a chat session.
        
        Args:
            session_id: Session ID
            user_id: User ID (must be owner)
            
        Returns:
            ChatSession if found, None otherwise
        """
        return self.db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.organization_id == self.organization_id,
            ChatSession.user_id == user_id,
            ChatSession.deleted_at.is_(None)
        ).first()

    def list_sessions(
        self, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[ChatSession]:
        """List chat sessions for a user.
        
        Args:
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of ChatSession records
        """
        return self.db.query(ChatSession).filter(
            ChatSession.organization_id == self.organization_id,
            ChatSession.user_id == user_id,
            ChatSession.deleted_at.is_(None)
        ).order_by(ChatSession.updated_at.desc()).offset(skip).limit(limit).all()

    def update_session(
        self, session_id: int, user_id: int, title: str
    ) -> Optional[ChatSession]:
        """Update a chat session.
        
        Args:
            session_id: Session ID
            user_id: User ID (must be owner)
            title: New title
            
        Returns:
            Updated ChatSession if found, None otherwise
        """
        session = self.get_session(session_id, user_id)
        if session is None:
            return None
        
        session.title = title
        session.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(session)
        
        return session

    def delete_session(self, session_id: int, user_id: int) -> bool:
        """Soft delete a chat session.
        
        Args:
            session_id: Session ID
            user_id: User ID (must be owner)
            
        Returns:
            True if deleted, False if not found
        """
        session = self.get_session(session_id, user_id)
        if session is None:
            return False
        
        session.deleted_at = datetime.utcnow()
        
        # Update quota
        self.quota_service.update_chat_session_count(self.organization_id, -1)
        
        self.db.commit()
        
        # Audit log
        self.audit_service.log_organization_action(
            action=AuditActionEnum.CHAT_DELETE,
            user_id=user_id,
            organization_id=self.organization_id,
            resource_type="chat_session",
            resource_id=session_id,
            details=f"Deleted chat session: {session.title}"
        )
        
        return True

    def get_messages(
        self, session_id: int, user_id: int, limit: int = 50
    ) -> List[ChatMessage]:
        """Get messages in a session.
        
        Args:
            session_id: Session ID
            user_id: User ID (must be owner)
            limit: Maximum number of messages to return
            
        Returns:
            List of ChatMessage records (empty if session not found)
        """
        session = self.get_session(session_id, user_id)
        if session is None:
            return []
        
        messages = self.db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.created_at.asc()).limit(limit).all()
        
        return messages

    async def send_message(
        self, session_id: int, user_id: int, content: str
    ) -> tuple[ChatMessage, ChatMessage]:
        """Send a message and generate AI response using RAG.
        
        Args:
            session_id: Session ID
            user_id: User ID (must be owner)
            content: Message content
            
        Returns:
            Tuple of (user_message, assistant_message)
            
        Raises:
            ValueError: If session not found or RAG processing fails
        """
        session = self.get_session(session_id, user_id)
        if session is None:
            raise ValueError("Chat session not found")
        
        # Create user message
        user_message = ChatMessage(
            session_id=session_id,
            role=MessageRoleEnum.USER,
            content=content
        )
        self.db.add(user_message)
        self.db.flush()
        
        # Get conversation history
        previous_messages = self.get_messages(session_id, user_id, limit=15)
        conversation_history = [
            {"role": msg.role.value, "content": msg.content}
            for msg in previous_messages[-10:]  # Last 10 messages for context
        ]
        
        # Generate RAG response (async)
        response_text, sources = await self.rag_service.generate_rag_response(
            user_query=content,
            conversation_history=conversation_history
        )
        
        # Create assistant message
        assistant_message = ChatMessage(
            session_id=session_id,
            role=MessageRoleEnum.ASSISTANT,
            content=response_text
        )
        self.db.add(assistant_message)
        self.db.flush()
        
        # Create message sources
        for source in sources:
            message_source = MessageSource(
                message_id=assistant_message.id,
                chunk_id=source["chunk_id"],
                relevance_score=source["relevance_score"]
            )
            self.db.add(message_source)
        
        # Update session
        session.message_count += 2
        session.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(user_message)
        self.db.refresh(assistant_message)
        
        return user_message, assistant_message
