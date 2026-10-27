from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.models.user import User, UserRole, RefreshToken
from app.models.audit import AuditLog
from app.schemas.auth import (
    SetupStatusResponse, SetupHODRequest, LoginRequest,
    TokenResponse, RefreshTokenRequest, UserMeResponse
)
from app.permissions.dependencies import get_current_user
from jose import jwt, JWTError
from app.core.config import settings

router = APIRouter()

@router.get("/setup-status", response_model=SetupStatusResponse)
def get_setup_status(db: Session = Depends(get_db)):
    """Checks whether an active HOD exists. If 0, the first-time setup wizard is required."""
    hod_count = db.query(User).filter(User.role == UserRole.HOD.value, User.is_active == True).count()
    return SetupStatusResponse(setup_needed=(hod_count == 0))

@router.post("/setup-hod", response_model=TokenResponse)
def setup_first_hod(req: SetupHODRequest, db: Session = Depends(get_db)):
    """
    One-time bootstrap endpoint to create the primary Department HOD.
    Permanently locked if an active HOD already exists in the database.
    """
    hod_count = db.query(User).filter(User.role == UserRole.HOD.value, User.is_active == True).count()
    if hod_count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="First-time setup is already complete and permanently locked. An active HOD exists."
        )

    # Check if email is already taken
    existing_user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Create HOD
    hod_user = User(
        full_name=req.full_name.strip(),
        email=req.email.lower().strip(),
        hashed_password=get_password_hash(req.password),
        role=UserRole.HOD.value,
        identifier=req.identifier,
        is_active=True
    )
    db.add(hod_user)
    db.commit()
    db.refresh(hod_user)

    # Record Audit Log
    audit = AuditLog(
        user_id=hod_user.id,
        action="FIRST_TIME_HOD_SETUP",
        entity_type="USER",
        entity_id=hod_user.id,
        details=f"Primary HOD '{hod_user.full_name}' initialized via setup wizard."
    )
    db.add(audit)
    db.commit()

    # Generate tokens
    access_token = create_access_token(subject=hod_user.id, role=hod_user.role)
    refresh_token = create_refresh_token(subject=hod_user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=hod_user.role,
        user_id=hod_user.id,
        full_name=hod_user.full_name,
        email=hod_user.email
    )

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates HOD, Staff, or Student and returns JWT access + refresh tokens."""
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact your department head."
        )

    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        semester_id=user.semester_id
    )

@router.post("/refresh", response_model=dict)
def refresh_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Generates a new access token using a valid refresh token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token or token expired."
    )
    try:
        payload = jwt.decode(req.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise credentials_exception

    new_access_token = create_access_token(subject=user.id, role=user.role)
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserMeResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile and active role."""
    return current_user

