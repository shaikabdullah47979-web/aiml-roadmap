from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class SubjectCreateRequest(BaseModel):
    semester_id: int
    code: str
    name: str
    description: Optional[str] = None
    credits: int = 4
    assigned_staff_ids: Optional[List[str]] = []

class SubjectUpdateRequest(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[int] = None
    semester_id: Optional[int] = None
    assigned_staff_ids: Optional[List[str]] = None

class AssignedStaffBrief(BaseModel):
    id: str
    full_name: str
    email: str

class SubjectResponse(BaseModel):
    id: str
    semester_id: int
    code: str
    name: str
    description: Optional[str] = None
    credits: int
    created_at: datetime
    materials_count: Optional[int] = 0
    questions_count: Optional[int] = 0
    textbooks_count: Optional[int] = 0
    assigned_staff: Optional[List[AssignedStaffBrief]] = []

    class Config:
        from_attributes = True

class SemesterResponse(BaseModel):
    id: int
    title: str
    academic_year: Optional[str] = None
    is_active: int
    subjects_count: Optional[int] = 0
    materials_count: Optional[int] = 0
    subjects: Optional[List[SubjectResponse]] = []

    class Config:
        from_attributes = True

