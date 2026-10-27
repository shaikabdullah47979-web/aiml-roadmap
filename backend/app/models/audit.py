import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)        # e.g., "HOD_TRANSFER", "CREATE_STAFF", "DELETE_SUBJECT"
    entity_type = Column(String(50), nullable=True)     # "USER", "MATERIAL", "SUBJECT"
    entity_id = Column(String(36), nullable=True)
    details = Column(Text, nullable=True)               # JSON or human-readable description
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")

