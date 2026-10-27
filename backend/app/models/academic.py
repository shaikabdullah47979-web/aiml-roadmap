import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True)  # 1 to 8
    title = Column(String(50), nullable=False)  # "Semester 1", "Semester 2", etc.
    academic_year = Column(String(50), nullable=True, default="2024-2028")
    is_active = Column(Integer, default=1, nullable=False)

    subjects = relationship("Subject", back_populates="semester", cascade="all, delete-orphan")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(50), nullable=False, index=True)  # e.g., "AI301"
    name = Column(String(200), nullable=False)            # e.g., "Machine Learning"
    description = Column(Text, nullable=True)
    credits = Column(Integer, default=4, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    semester = relationship("Semester", back_populates="subjects")
    materials = relationship("StudyMaterial", back_populates="subject", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="subject", cascade="all, delete-orphan")
    textbooks = relationship("Textbook", back_populates="subject", cascade="all, delete-orphan")
    staff_assignments = relationship("StaffSubjectAssignment", back_populates="subject", cascade="all, delete-orphan")

class StaffSubjectAssignment(Base):
    __tablename__ = "staff_subject_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    staff_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    staff = relationship("User", back_populates="assigned_subjects")
    subject = relationship("Subject", back_populates="staff_assignments")

