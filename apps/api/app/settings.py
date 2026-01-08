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

    # File Storage
    storage_type: str = "local"  # "local" or "s3"
    storage_local_path: str = "./storage"
    storage_s3_bucket: str = ""
    storage_s3_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    # Encryption (for LLM API keys)
    # Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    encryption_key: str = "change-me-in-production-encryption-key"

    # Invitations
    invitation_expiry_hours: int = 72  # 3 days

    # CORS (comma-separated string in .env, e.g. "http://localhost:5173,http://localhost:3000")
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Redis (for caching and rate limiting)
    redis_url: str = "redis://localhost:6379/0"

    # Celery
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"

    # OpenAI (for embeddings and chat)
    openai_api_key: str = ""

    # Performance
    default_page_size: int = 20
    max_page_size: int = 100
    rate_limit_requests_per_minute: int = 100
    vector_search_default_limit: int = 5
    vector_search_max_limit: int = 10
    embedding_batch_size: int = 100
    max_file_size_mb: int = 50

    # Database connection pool
    db_pool_size: int = 20
    db_max_overflow: int = 10
    db_pool_recycle: int = 3600  # 1 hour

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
