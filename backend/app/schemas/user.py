from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr

class StaffCreateRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    identifier: Optional[str] = None
    assigned_subject_ids: Optional[List[str]] = []

class StaffResponse(BaseModel):
    id: str
    full_name: str
    email: str
    identifier: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    assigned_subjects: Optional[List[dict]] = []

    class Config:
        from_attributes = True

class StudentCreateRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    identifier: str  # Roll Number / USN (Mandatory for students)
    semester_id: int # 1 to 8

class StudentBulkItem(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    identifier: str
    semester_id: int

class StudentBulkCreateRequest(BaseModel):
    students: List[StudentBulkItem]

class StudentResponse(BaseModel):
    id: str
    full_name: str
    email: str
    identifier: Optional[str] = None
    semester_id: Optional[int] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    semester_id: Optional[int] = None
    password: Optional[str] = None

