"""Authentication utilities for password hashing and JWT token management."""

from datetime import datetime, timedelta
from typing import Optional

import bcrypt
import jwt
from sqlalchemy.orm import Session

from app.db.tables import UserRecord
from app.settings import settings


def hash_password(password: str) -> str:
    """Hash a password using bcrypt.
    
    Args:
        password: Plain text password (must be bytes or str)
        
    Returns:
        Hashed password string (UTF-8 encoded)
    """
    # bcrypt requires bytes, so encode password string
    password_bytes = password.encode("utf-8")
    # Generate salt and hash with 12 rounds (bcrypt default is 12)
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return as string for storage
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to verify against
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        # bcrypt requires bytes
        password_bytes = plain_password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        # Use checkpw to verify password
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        # Return False on any error (invalid hash format, etc.)
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token.
    
    Args:
        data: Dictionary containing token claims (should include 'sub' for user ID)
        expires_delta: Optional expiration time delta. If None, uses default from settings.
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token.
    
    Args:
        token: JWT token string to decode
        
    Returns:
        Token payload dictionary if valid, None if invalid or expired
    """
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        return payload
    except jwt.InvalidTokenError:
        return None


def get_current_user(db: Session, token: str) -> Optional[UserRecord]:
    """Get user from JWT token.
    
    Args:
        db: SQLAlchemy database session
        token: JWT token string
        
    Returns:
        UserRecord if token is valid and user exists, None otherwise
    """
    payload = decode_token(token)
    if payload is None:
        return None
    
    user_id_str: Optional[str] = payload.get("sub")
    if user_id_str is None:
        return None
    
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        return None
    
    user = db.query(UserRecord).filter(UserRecord.id == user_id).first()
    return user
