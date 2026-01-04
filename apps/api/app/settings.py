from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings using Pydantic Settings."""
    
    # Application
    app_name: str = "RAGfolio API"
    debug: bool = False
    
    # Database
    database_url: str = "postgresql://rag_admin:raG_admiN@localhost:5432/ragfolio_db"
    
    # JWT Authentication
    jwt_secret_key: str = "change-me-in-production-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
