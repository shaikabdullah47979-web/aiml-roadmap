import uuid
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class UserRole(str, Enum):
    HOD = "HOD"
    STAFF = "STAFF"
    STUDENT = "STUDENT"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default=UserRole.STUDENT.value)
    identifier = Column(String(100), nullable=True)  # Employee ID or Student Roll/USN
    semester_id = Column(Integer, nullable=True)     # For student enrollment (1 to 8)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    materials = relationship("StudyMaterial", back_populates="uploader", foreign_keys="StudyMaterial.uploaded_by")
    questions = relationship("Question", back_populates="author", foreign_keys="Question.created_by")
    bookmarks = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("LearningProgress", back_populates="user", cascade="all, delete-orphan")
    assigned_subjects = relationship("StaffSubjectAssignment", back_populates="staff", cascade="all, delete-orphan")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(500), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

