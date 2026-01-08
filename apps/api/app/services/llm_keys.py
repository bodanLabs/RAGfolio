"""Service for LLM API key management."""

from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.db.tables import LLMApiKey
from app.utils.encryption import EncryptionService
from app.services.audit import AuditService
from app.db.enums import AuditActionEnum


class LLMKeyService:
    """Service for managing LLM API keys."""

    def __init__(self, db: Session):
        """Initialize the LLMKeyService with a database session.
        
        Args:
            db: SQLAlchemy session
        """
        self.db = db
        self.encryption = EncryptionService()
        self.audit_service = AuditService(db)

    def create_api_key(
        self, organization_id: int, key_name: str, api_key: str, provider: str = "OpenAI"
    ) -> LLMApiKey:
        """Create a new API key.
        
        Args:
            organization_id: Organization ID
            key_name: Name for the API key
            api_key: The API key value (will be encrypted)
            provider: Provider name (default: OpenAI)
            
        Returns:
            Created LLMApiKey
        """
        encrypted_key = self.encryption.encrypt(api_key)
        
        llm_key = LLMApiKey(
            organization_id=organization_id,
            provider=provider,
            key_name=key_name,
            api_key_encrypted=encrypted_key,
            is_active=False  # New keys are inactive by default
        )
        
        self.db.add(llm_key)
        self.db.commit()
        self.db.refresh(llm_key)
        
        # Audit log
        self.audit_service.log_organization_action(
            action=AuditActionEnum.API_KEY_CREATE,
            user_id=None,  # Will be set by router
            organization_id=organization_id,
            resource_type="llm_api_key",
            resource_id=llm_key.id,
            details=f"Created API key: {key_name}"
        )
        
        return llm_key

    def get_api_keys(self, organization_id: int) -> list[LLMApiKey]:
        """Get all API keys for an organization.
        
        Args:
            organization_id: Organization ID
            
        Returns:
            List of LLMApiKey records
        """
        return self.db.query(LLMApiKey).filter(
            LLMApiKey.organization_id == organization_id
        ).all()

    def get_api_key(self, key_id: int, organization_id: int) -> Optional[LLMApiKey]:
        """Get a specific API key.
        
        Args:
            key_id: API key ID
            organization_id: Organization ID
            
        Returns:
            LLMApiKey if found, None otherwise
        """
        return self.db.query(LLMApiKey).filter(
            LLMApiKey.id == key_id,
            LLMApiKey.organization_id == organization_id
        ).first()

    def get_active_api_key(self, organization_id: int) -> Optional[LLMApiKey]:
        """Get the active API key for an organization.
        
        Args:
            organization_id: Organization ID
            
        Returns:
            Active LLMApiKey if found, None otherwise
        """
        return self.db.query(LLMApiKey).filter(
            LLMApiKey.organization_id == organization_id,
            LLMApiKey.is_active == True
        ).first()

    def decrypt_api_key(self, llm_key: LLMApiKey) -> str:
        """Decrypt an API key.
        
        Args:
            llm_key: LLMApiKey record
            
        Returns:
            Decrypted API key string
        """
        return self.encryption.decrypt(llm_key.api_key_encrypted)

    def update_api_key(
        self, key_id: int, organization_id: int, key_name: Optional[str] = None,
        api_key: Optional[str] = None, user_id: Optional[int] = None
    ) -> Optional[LLMApiKey]:
        """Update an API key.
        
        Args:
            key_id: API key ID
            organization_id: Organization ID
            key_name: New name (optional)
            api_key: New API key value (optional, will be encrypted)
            user_id: User ID performing the update
            
        Returns:
            Updated LLMApiKey if found, None otherwise
        """
        llm_key = self.get_api_key(key_id, organization_id)
        if llm_key is None:
            return None
        
        if key_name is not None:
            llm_key.key_name = key_name
        
        if api_key is not None:
            llm_key.api_key_encrypted = self.encryption.encrypt(api_key)
        
        llm_key.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(llm_key)
        
        # Audit log
        if user_id:
            self.audit_service.log_organization_action(
                action=AuditActionEnum.API_KEY_UPDATE,
                user_id=user_id,
                organization_id=organization_id,
                resource_type="llm_api_key",
                resource_id=key_id,
                details=f"Updated API key: {key_name or llm_key.key_name}"
            )
        
        return llm_key

    def activate_api_key(
        self, key_id: int, organization_id: int, user_id: Optional[int] = None
    ) -> Optional[LLMApiKey]:
        """Activate an API key (deactivates others).
        
        Args:
            key_id: API key ID to activate
            organization_id: Organization ID
            user_id: User ID performing the action
            
        Returns:
            Activated LLMApiKey if found, None otherwise
        """
        llm_key = self.get_api_key(key_id, organization_id)
        if llm_key is None:
            return None
        
        # Deactivate all other keys for this organization
        self.db.query(LLMApiKey).filter(
            LLMApiKey.organization_id == organization_id,
            LLMApiKey.id != key_id
        ).update({"is_active": False})
        
        # Activate this key
        llm_key.is_active = True
        llm_key.last_used_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(llm_key)
        
        # Audit log
        if user_id:
            self.audit_service.log_organization_action(
                action=AuditActionEnum.API_KEY_ACTIVATE,
                user_id=user_id,
                organization_id=organization_id,
                resource_type="llm_api_key",
                resource_id=key_id,
                details=f"Activated API key: {llm_key.key_name}"
            )
        
        return llm_key

    def delete_api_key(
        self, key_id: int, organization_id: int, user_id: Optional[int] = None
    ) -> bool:
        """Delete an API key.
        
        Args:
            key_id: API key ID
            organization_id: Organization ID
            user_id: User ID performing the deletion
            
        Returns:
            True if deleted, False if not found
        """
        llm_key = self.get_api_key(key_id, organization_id)
        if llm_key is None:
            return False
        
        key_name = llm_key.key_name
        self.db.delete(llm_key)
        self.db.commit()
        
        # Audit log
        if user_id:
            self.audit_service.log_organization_action(
                action=AuditActionEnum.API_KEY_DELETE,
                user_id=user_id,
                organization_id=organization_id,
                resource_type="llm_api_key",
                resource_id=key_id,
                details=f"Deleted API key: {key_name}"
            )
        
        return True

    def test_api_key(self, api_key: str, provider: str = "OpenAI") -> bool:
        """Test if an API key is valid.
        
        Args:
            api_key: API key to test
            provider: Provider name (default: OpenAI)
            
        Returns:
            True if valid, False otherwise
        """
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            # Simple test: list models
            client.models.list()
            return True
        except Exception:
            return False
