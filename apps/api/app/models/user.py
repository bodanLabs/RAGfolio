from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr

class User(BaseModel):
    """User model for responses."""
    
    id: int
    email: EmailStr
    name: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
