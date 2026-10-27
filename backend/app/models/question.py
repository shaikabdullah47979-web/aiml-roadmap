import uuid
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class QuestionType(str, Enum):
    SHORT = "SHORT"
    LONG = "LONG"
    MCQ = "MCQ"
    NUMERICAL = "NUMERICAL"
    CODE = "CODE"

class QuestionDifficulty(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    unit_or_module = Column(String(100), nullable=True)
    topic = Column(String(200), nullable=True)
    question_type = Column(String(20), default=QuestionType.SHORT.value, nullable=False)
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=True)
    marks = Column(Integer, default=5, nullable=False)
    difficulty = Column(String(20), default=QuestionDifficulty.MEDIUM.value, nullable=False)
    status = Column(String(20), default="PUBLISHED", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    subject = relationship("Subject", back_populates="questions")
    author = relationship("User", back_populates="questions", foreign_keys=[created_by])

