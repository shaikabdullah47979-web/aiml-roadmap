from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.material import MaterialResponse
from app.schemas.question import QuestionResponse

class BookmarkToggleRequest(BaseModel):
    item_type: str  # "MATERIAL" or "QUESTION"
    item_id: str

class BookmarkResponse(BaseModel):
    id: str
    item_type: str
    item_id: str
    created_at: datetime
    material: Optional[MaterialResponse] = None
    question: Optional[QuestionResponse] = None

    class Config:
        from_attributes = True

class ProgressToggleRequest(BaseModel):
    material_id: str
    is_completed: bool = True

class SubjectProgressDetail(BaseModel):
    subject_id: str
    subject_name: str
    subject_code: str
    semester_id: int
    total_materials: int
    completed_materials: int
    percentage: float

class StudentProgressResponse(BaseModel):
    overall_percentage: float
    total_materials: int
    completed_materials: int
    subjects_progress: List[SubjectProgressDetail]

