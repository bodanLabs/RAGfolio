"""Database table models using SQLAlchemy ORM."""

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean, CheckConstraint, Column, DateTime, Enum, Float,
    ForeignKey, Index, Integer, String, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from app.db.base import Base
from app.db.enums import (
    AuditActionEnum, DocumentStatusEnum, DocumentTypeEnum,
    InvitationStatusEnum, MessageRoleEnum, UserRoleEnum
)


# ============================================================================
# USER & AUTHENTICATION
# ============================================================================

class UserRecord(Base):
    """User database table."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    avatar_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    organization_memberships = relationship(
        "OrganizationMember", back_populates="user", cascade="all, delete-orphan"
    )
    chat_sessions = relationship(
        "ChatSession", back_populates="user", cascade="all, delete-orphan"
    )
    uploaded_documents = relationship(
        "Document", back_populates="uploaded_by_user", foreign_keys="Document.uploaded_by_id"
    )


# ============================================================================
# ORGANIZATIONS
# ============================================================================

class Organization(Base):
    """Organization/tenant for multi-tenancy."""

    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    members = relationship(
        "OrganizationMember", back_populates="organization", cascade="all, delete-orphan"
    )
    invitations = relationship(
        "Invitation", back_populates="organization", cascade="all, delete-orphan"
    )
    documents = relationship(
        "Document", back_populates="organization", cascade="all, delete-orphan"
    )
    llm_api_keys = relationship(
        "LLMApiKey", back_populates="organization", cascade="all, delete-orphan"
    )
    chat_sessions = relationship(
        "ChatSession", back_populates="organization", cascade="all, delete-orphan"
    )
    quota = relationship(
        "OrganizationQuota", back_populates="organization", uselist=False, cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_organizations_deleted_at", deleted_at),
    )


class OrganizationMember(Base):
    """Many-to-many relationship between users and organizations with roles."""

    __tablename__ = "organization_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(UserRoleEnum), nullable=False, default=UserRoleEnum.USER)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("UserRecord", back_populates="organization_memberships")
    organization = relationship("Organization", back_populates="members")

    __table_args__ = (
        UniqueConstraint("user_id", "organization_id", name="uq_user_organization"),
        Index("ix_organization_members_user_id", user_id),
        Index("ix_organization_members_organization_id", organization_id),
    )


class Invitation(Base):
    """Email invitations to join an organization."""

    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), nullable=False)
    role = Column(Enum(UserRoleEnum), nullable=False, default=UserRoleEnum.USER)
    status = Column(Enum(InvitationStatusEnum), nullable=False, default=InvitationStatusEnum.PENDING)
    invited_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    accepted_at = Column(DateTime, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="invitations")
    invited_by = relationship("UserRecord", foreign_keys=[invited_by_id])

    __table_args__ = (
        Index("ix_invitations_email", email),
        Index("ix_invitations_organization_id", organization_id),
        Index("ix_invitations_status", status),
    )


# ============================================================================
# DOCUMENTS & VECTOR STORAGE
# ============================================================================

class Document(Base):
    """Uploaded documents with metadata."""

    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # File metadata
    file_name = Column(String(255), nullable=False)
    file_type = Column(Enum(DocumentTypeEnum), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_path = Column(String(512), nullable=False)
    storage_type = Column(String(50), nullable=False, default="local")

    # Processing metadata
    status = Column(Enum(DocumentStatusEnum), nullable=False, default=DocumentStatusEnum.UPLOADED)
    error_message = Column(Text, nullable=True)
    chunk_count = Column(Integer, nullable=False, default=0)

    # Timestamps
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="documents")
    uploaded_by_user = relationship("UserRecord", back_populates="uploaded_documents", foreign_keys=[uploaded_by_id])
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_documents_organization_id", organization_id),
        Index("ix_documents_status", status),
        Index("ix_documents_deleted_at", deleted_at),
        Index("ix_documents_uploaded_by_id", uploaded_by_id),
    )


class DocumentChunk(Base):
    """Text chunks extracted from documents with vector embeddings."""

    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)

    # Chunk content
    chunk_index = Column(Integer, nullable=False)
    text_content = Column(Text, nullable=False)

    # Vector embedding (pgvector)
    # Dimension 1536 for OpenAI text-embedding-ada-002
    embedding = Column(Vector(1536), nullable=True)

    # Metadata
    page_number = Column(Integer, nullable=True)
    char_start = Column(Integer, nullable=True)
    char_end = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="chunks")
    message_sources = relationship("MessageSource", back_populates="chunk")

    __table_args__ = (
        UniqueConstraint("document_id", "chunk_index", name="uq_document_chunk_index"),
        Index("ix_document_chunks_document_id", document_id),
    )


# ============================================================================
# LLM API KEYS
# ============================================================================

class LLMApiKey(Base):
    """LLM API keys for organizations (multiple keys, one active)."""

    __tablename__ = "llm_api_keys"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)

    # API key details
    provider = Column(String(50), nullable=False, default="OpenAI")
    key_name = Column(String(255), nullable=False)
    api_key_encrypted = Column(String(512), nullable=False)
    is_active = Column(Boolean, nullable=False, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_used_at = Column(DateTime, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="llm_api_keys")

    __table_args__ = (
        Index("ix_llm_api_keys_organization_id", organization_id),
        Index("ix_llm_api_keys_is_active", is_active),
    )


# ============================================================================
# CHAT SESSIONS & MESSAGES
# ============================================================================

class ChatSession(Base):
    """Chat conversation sessions."""

    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    title = Column(String(255), nullable=False)
    message_count = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="chat_sessions")
    user = relationship("UserRecord", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_chat_sessions_organization_id", organization_id),
        Index("ix_chat_sessions_user_id", user_id),
        Index("ix_chat_sessions_deleted_at", deleted_at),
    )


class ChatMessage(Base):
    """Individual messages within chat sessions."""

    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)

    role = Column(Enum(MessageRoleEnum), nullable=False)
    content = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    sources = relationship("MessageSource", back_populates="message", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_chat_messages_session_id", session_id),
    )


class MessageSource(Base):
    """Links chat messages to source document chunks."""

    __tablename__ = "message_sources"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=False)
    chunk_id = Column(Integer, ForeignKey("document_chunks.id", ondelete="CASCADE"), nullable=False)

    relevance_score = Column(Float, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    message = relationship("ChatMessage", back_populates="sources")
    chunk = relationship("DocumentChunk", back_populates="message_sources")

    __table_args__ = (
        Index("ix_message_sources_message_id", message_id),
        Index("ix_message_sources_chunk_id", chunk_id),
    )


# ============================================================================
# AUDIT LOGGING
# ============================================================================

class AuditLog(Base):
    """Comprehensive audit trail for all critical operations."""

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Actor information
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)

    # Action details
    action = Column(Enum(AuditActionEnum), nullable=False)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(Integer, nullable=True)

    # Additional context
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(512), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_audit_logs_user_id", user_id),
        Index("ix_audit_logs_organization_id", organization_id),
        Index("ix_audit_logs_action", action),
        Index("ix_audit_logs_created_at", created_at),
        Index("ix_audit_logs_resource", resource_type, resource_id),
    )


# ============================================================================
# USAGE QUOTAS & LIMITS
# ============================================================================

class OrganizationQuota(Base):
    """Usage quotas and limits per organization."""

    __tablename__ = "organization_quotas"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Document limits
    max_documents = Column(Integer, nullable=False, default=100)
    max_storage_bytes = Column(Integer, nullable=False, default=1073741824)  # 1GB

    # Usage tracking
    current_documents = Column(Integer, nullable=False, default=0)
    current_storage_bytes = Column(Integer, nullable=False, default=0)
    current_chunks = Column(Integer, nullable=False, default=0)

    # Chat limits
    max_chat_sessions = Column(Integer, nullable=False, default=50)
    current_chat_sessions = Column(Integer, nullable=False, default=0)

    # API usage (optional - for future rate limiting)
    max_api_calls_per_day = Column(Integer, nullable=True)
    current_api_calls_today = Column(Integer, nullable=False, default=0)
    api_calls_reset_at = Column(DateTime, nullable=True)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="quota")

    __table_args__ = (
        CheckConstraint("current_documents <= max_documents", name="check_documents_limit"),
        CheckConstraint("current_storage_bytes <= max_storage_bytes", name="check_storage_limit"),
        CheckConstraint("current_chat_sessions <= max_chat_sessions", name="check_chat_sessions_limit"),
        Index("ix_organization_quotas_organization_id", organization_id),
    )
