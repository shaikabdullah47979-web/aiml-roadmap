import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class Textbook(Base):
    __tablename__ = "textbooks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    added_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    author = Column(String(255), nullable=False)
    edition = Column(String(50), nullable=True)
    publisher = Column(String(200), nullable=True)
    isbn = Column(String(50), nullable=True)
    external_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    subject = relationship("Subject", back_populates="textbooks")
    creator = relationship("User", foreign_keys=[added_by])

