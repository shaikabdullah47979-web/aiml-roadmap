from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class QuestionCreateRequest(BaseModel):
    subject_id: str
    unit_or_module: Optional[str] = None
    topic: Optional[str] = None
    question_type: str = "SHORT"
    question_text: str
    answer_text: Optional[str] = None
    marks: int = 5
    difficulty: str = "MEDIUM"

class QuestionUpdateRequest(BaseModel):
    unit_or_module: Optional[str] = None
    topic: Optional[str] = None
    question_type: Optional[str] = None
    question_text: Optional[str] = None
    answer_text: Optional[str] = None
    marks: Optional[int] = None
    difficulty: Optional[str] = None

class QuestionResponse(BaseModel):
    id: str
    subject_id: str
    created_by: Optional[str] = None
    author_name: Optional[str] = None
    unit_or_module: Optional[str] = None
    topic: Optional[str] = None
    question_type: str
    question_text: str
    answer_text: Optional[str] = None
    marks: int
    difficulty: str
    status: str
    is_bookmarked: Optional[bool] = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

