import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    item_type = Column(String(20), nullable=False)  # "MATERIAL" or "QUESTION"
    item_id = Column(String(36), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="bookmarks")

class LearningProgress(Base):
    __tablename__ = "learning_progress"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(String(36), ForeignKey("study_materials.id", ondelete="CASCADE"), nullable=False, index=True)
    is_completed = Column(Boolean, default=True, nullable=False)
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="progress")
    material = relationship("StudyMaterial", back_populates="progress_records")

