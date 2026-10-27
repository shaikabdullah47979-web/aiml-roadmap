import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# If using SQLite, ensure directory exists
if settings.DATABASE_URL.startswith("sqlite"):
    db_file_path = settings.DATABASE_URL.replace("sqlite:///", "")
    db_dir = os.path.dirname(db_file_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    connect_args = {"check_same_thread": False}
else:
    connect_args = {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency that provides an independent database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

