from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class HODTransferInitiateRequest(BaseModel):
    target_staff_id: str
    hod_password: str  # Outgoing HOD must re-enter their password for verification
    reason: Optional[str] = None

class HODTransferAcceptRequest(BaseModel):
    staff_password: str # Selected staff member must enter their own password to accept

class HODTransferResponse(BaseModel):
    id: str
    current_hod_id: str
    current_hod_name: str
    target_staff_id: str
    target_staff_name: str
    status: str
    reason: Optional[str] = None
    initiated_at: datetime
    expires_at: datetime
    responded_at: Optional[datetime] = None

    class Config:
        from_attributes = True

