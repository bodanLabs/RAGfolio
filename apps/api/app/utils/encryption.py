"""Encryption utilities for LLM API keys."""

from typing import Optional
from cryptography.fernet import Fernet

from app.settings import settings


class EncryptionService:
    """Service for encrypting and decrypting sensitive data."""

    def __init__(self, key: Optional[str] = None):
        """Initialize the EncryptionService.
        
        Args:
            key: Encryption key (uses settings.encryption_key if not provided)
        """
        key_str = key or settings.encryption_key
        key_bytes = key_str.encode() if isinstance(key_str, str) else key_str
        
        # Ensure key is valid Fernet key (32 bytes base64-encoded)
        try:
            self.cipher = Fernet(key_bytes)
        except ValueError:
            # If key is not valid, generate a new one
            raise ValueError(
                "Invalid encryption key. Generate a new key with: "
                "python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
            )

    def encrypt(self, data: str) -> str:
        """Encrypt a string.
        
        Args:
            data: String to encrypt
            
        Returns:
            Encrypted string (base64 encoded)
        """
        data_bytes = data.encode('utf-8')
        encrypted = self.cipher.encrypt(data_bytes)
        return encrypted.decode('utf-8')

    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt an encrypted string.
        
        Args:
            encrypted_data: Encrypted string (base64 encoded)
            
        Returns:
            Decrypted string
            
        Raises:
            ValueError: If decryption fails
        """
        try:
            encrypted_bytes = encrypted_data.encode('utf-8')
            decrypted = self.cipher.decrypt(encrypted_bytes)
            return decrypted.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Failed to decrypt data: {str(e)}") from e
