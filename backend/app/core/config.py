import os
from typing import List, Set
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI/ML Roadmap & Academic Resource Management System"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database (Dual-Engine: Defaults to SQLite for zero-setup local dev, toggleable to PostgreSQL in .env)
    DATABASE_URL: str = "sqlite:///./database/aiml_roadmap.db"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    
    # File Storage
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    MAX_FILE_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB
    ALLOWED_EXTENSIONS: Set[str] = {".pdf", ".docx", ".pptx", ".txt", ".png", ".jpg", ".jpeg", ".zip"}
    
    # Firebase Cloud Storage (Optional - falls back to local storage if not configured)
    FIREBASE_CREDENTIALS_PATH: str = ""
    FIREBASE_STORAGE_BUCKET: str = ""
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()

