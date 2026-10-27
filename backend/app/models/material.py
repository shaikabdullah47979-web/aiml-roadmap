import uuid
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class MaterialCategory(str, Enum):
    CLASS_NOTES = "CLASS_NOTES"
    DETAILED_NOTES = "DETAILED_NOTES"
    IMPORTANT_QUESTIONS = "IMPORTANT_QUESTIONS"
    QUESTION_BANK = "QUESTION_BANK"
    PREVIOUS_YEAR_PAPERS = "PREVIOUS_YEAR_PAPERS"
    MODEL_PAPERS = "MODEL_PAPERS"
    TEXTBOOK_REFERENCES = "TEXTBOOK_REFERENCES"
    LAB_MANUAL = "LAB_MANUAL"
    PRACTICAL_FILES = "PRACTICAL_FILES"
    SYLLABUS = "SYLLABUS"
    OTHER = "OTHER"

class MaterialStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    PUBLISHED = "PUBLISHED"
    REJECTED = "REJECTED"

class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, default=MaterialCategory.CLASS_NOTES.value)
    topic_or_unit = Column(String(100), nullable=True)  # e.g., "Unit 1: Introduction to AI"
    file_name = Column(String(255), nullable=False)     # safe storage filename
    file_url = Column(String(500), nullable=False)      # download url or relative path
    file_type = Column(String(20), nullable=False)      # pdf, docx, pptx, zip, etc.
    file_size_bytes = Column(Integer, default=0, nullable=False)
    status = Column(String(20), default=MaterialStatus.SUBMITTED.value, nullable=False, index=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    subject = relationship("Subject", back_populates="materials")
    uploader = relationship("User", back_populates="materials", foreign_keys=[uploaded_by])
    approvals = relationship("MaterialApproval", back_populates="material", cascade="all, delete-orphan")
    progress_records = relationship("LearningProgress", back_populates="material", cascade="all, delete-orphan")

class MaterialApproval(Base):
    __tablename__ = "material_approvals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    material_id = Column(String(36), ForeignKey("study_materials.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewed_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(20), nullable=False)  # APPROVED or REJECTED
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    material = relationship("StudyMaterial", back_populates="approvals")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

