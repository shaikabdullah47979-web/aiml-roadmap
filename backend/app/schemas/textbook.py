from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class TextbookCreateRequest(BaseModel):
    subject_id: str
    title: str
    author: str
    edition: Optional[str] = None
    publisher: Optional[str] = None
    isbn: Optional[str] = None
    external_url: Optional[str] = None
    description: Optional[str] = None

class TextbookResponse(BaseModel):
    id: str
    subject_id: str
    added_by: Optional[str] = None
    title: str
    author: str
    edition: Optional[str] = None
    publisher: Optional[str] = None
    isbn: Optional[str] = None
    external_url: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

