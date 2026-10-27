import uuid
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class HODTransferStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"

class HODTransferRequest(Base):
    __tablename__ = "hod_transfer_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    current_hod_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target_staff_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default=HODTransferStatus.PENDING.value, nullable=False, index=True)
    initiated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    responded_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    reason = Column(Text, nullable=True)

    current_hod = relationship("User", foreign_keys=[current_hod_id])
    target_staff = relationship("User", foreign_keys=[target_staff_id])

