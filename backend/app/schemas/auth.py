from typing import Optional
from pydantic import BaseModel, EmailStr

class SetupStatusResponse(BaseModel):
    setup_needed: bool

class SetupHODRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    identifier: Optional[str] = None  # e.g., Employee ID

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    full_name: str
    email: str
    semester_id: Optional[int] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserMeResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    identifier: Optional[str] = None
    semester_id: Optional[int] = None
    is_active: bool

    class Config:
        from_attributes = True

