from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class MaterialUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    topic_or_unit: Optional[str] = None

class MaterialApprovalRequest(BaseModel):
    action: str  # "APPROVED" or "REJECTED"
    feedback: Optional[str] = None

class MaterialResponse(BaseModel):
    id: str
    subject_id: str
    uploaded_by: Optional[str] = None
    uploader_name: Optional[str] = None
    subject_name: Optional[str] = None
    semester_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    category: str
    topic_or_unit: Optional[str] = None
    file_name: str
    file_url: str
    file_type: str
    file_size_bytes: int
    status: str
    rejection_reason: Optional[str] = None
    is_bookmarked: Optional[bool] = False
    is_completed: Optional[bool] = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

