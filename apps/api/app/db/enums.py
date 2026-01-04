"""Enum types for database models."""

import enum


class UserRoleEnum(str, enum.Enum):
    """User role within an organization."""
    ADMIN = "ADMIN"
    USER = "USER"


class InvitationStatusEnum(str, enum.Enum):
    """Status of an organization invitation."""
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    EXPIRED = "EXPIRED"


class DocumentStatusEnum(str, enum.Enum):
    """Processing status of a document."""
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"


class DocumentTypeEnum(str, enum.Enum):
    """Supported document file types."""
    TXT = "txt"
    PDF = "pdf"
    DOCX = "docx"


class MessageRoleEnum(str, enum.Enum):
    """Role of a chat message sender."""
    USER = "user"
    ASSISTANT = "assistant"


class AuditActionEnum(str, enum.Enum):
    """Types of auditable actions."""
    # User actions
    USER_LOGIN = "USER_LOGIN"
    USER_LOGOUT = "USER_LOGOUT"
    USER_SIGNUP = "USER_SIGNUP"

    # Organization actions
    ORG_CREATE = "ORG_CREATE"
    ORG_UPDATE = "ORG_UPDATE"
    ORG_DELETE = "ORG_DELETE"

    # Member actions
    MEMBER_INVITE = "MEMBER_INVITE"
    MEMBER_JOIN = "MEMBER_JOIN"
    MEMBER_REMOVE = "MEMBER_REMOVE"
    MEMBER_ROLE_CHANGE = "MEMBER_ROLE_CHANGE"

    # Document actions
    DOC_UPLOAD = "DOC_UPLOAD"
    DOC_DELETE = "DOC_DELETE"
    DOC_PROCESS_START = "DOC_PROCESS_START"
    DOC_PROCESS_COMPLETE = "DOC_PROCESS_COMPLETE"
    DOC_PROCESS_FAIL = "DOC_PROCESS_FAIL"

    # API Key actions
    API_KEY_CREATE = "API_KEY_CREATE"
    API_KEY_UPDATE = "API_KEY_UPDATE"
    API_KEY_DELETE = "API_KEY_DELETE"
    API_KEY_ACTIVATE = "API_KEY_ACTIVATE"

    # Chat actions
    CHAT_CREATE = "CHAT_CREATE"
    CHAT_DELETE = "CHAT_DELETE"
