"""Service for authentication operations."""

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.tables import UserRecord
from app.utils.auth import hash_password, verify_password


class AuthService:
    """Service for authentication and user management.

    This service is created per-request with a database session.
    """

    def __init__(self, db: Session):
        """Initialize the AuthService with a database session.

        Args:
            db: SQLAlchemy session
        """
        self.db = db

    def signup(self, email: str, password: str, name: str | None = None) -> UserRecord:
        """Create a new user account.

        Args:
            email: User email address
            password: Plain text password (will be hashed)
            name: Optional user name

        Returns:
            Created UserRecord

        Raises:
            ValueError: If email already exists
        """
        hashed_password = hash_password(password)

        user = UserRecord(
            email=email,
            password_hash=hashed_password,
            name=name,
        )

        try:
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            return user
        except IntegrityError:
            self.db.rollback()
            raise ValueError("Email already exists")

    def login(self, email: str, password: str) -> UserRecord | None:
        """Authenticate a user with email and password.

        Args:
            email: User email address
            password: Plain text password

        Returns:
            UserRecord if credentials are valid, None otherwise
        """
        user = self.get_user_by_email(email)
        if user is None:
            return None

        if not verify_password(password, user.password_hash):
            return None

        return user

    def get_user_by_email(self, email: str) -> UserRecord | None:
        """Get user by email address.

        Args:
            email: User email address

        Returns:
            UserRecord if found, None otherwise
        """
        return self.db.query(UserRecord).filter(UserRecord.email == email).first()

    def update_user(self, user: UserRecord, name: str | None = None, password: str | None = None) -> UserRecord:
        """Update user profile.

        Args:
            user: User record to update
            name: New name (optional)
            password: New password (optional)

        Returns:
            Updated UserRecord
        """
        if name is not None:
            user.name = name
        
        if password is not None:
            user.password_hash = hash_password(password)
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
