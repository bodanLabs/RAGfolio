from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.settings import settings

# Create database engine
# connect_args = {"check_same_thread": False} # Only for SQLite

engine = create_engine(
    settings.database_url, 
    # connect_args=connect_args
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
