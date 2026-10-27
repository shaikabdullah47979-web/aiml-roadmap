from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.models.user import User, UserRole, RefreshToken
from app.models.hod_transfer import HODTransferRequest, HODTransferStatus
from app.models.audit import AuditLog
from app.schemas.hod_transfer import (
    HODTransferInitiateRequest, HODTransferAcceptRequest, HODTransferResponse
)
from app.schemas.auth import TokenResponse
from app.permissions.dependencies import require_hod, get_current_user

router = APIRouter()

def is_expired(expires_at: datetime) -> bool:
    """Timezone-safe expiration comparison for SQLite and PostgreSQL."""
    if not expires_at:
        return False
    now = datetime.now(timezone.utc)
    if expires_at.tzinfo is None:
        return expires_at < now.replace(tzinfo=None)
    return expires_at < now

@router.post("/transfer/initiate", response_model=HODTransferResponse)
def initiate_hod_transfer(
    req: HODTransferInitiateRequest,
    db: Session = Depends(get_db),
    current_hod: User = Depends(require_hod)
):
    """
    (HOD Only) Initiates an HOD transfer request to an active faculty member.
    Requires the current HOD to verify their password.
    """
    # 1. Verify current HOD's password
    if not verify_password(req.hod_password, current_hod.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect HOD password confirmation.")

    # 2. Verify target staff member
    target_staff = db.query(User).filter(
        User.id == req.target_staff_id,
        User.role == UserRole.STAFF.value,
        User.is_active == True
    ).first()
    if not target_staff:
        raise HTTPException(
            status_code=400,
            detail="Selected faculty member not found, inactive, or not eligible."
        )

    # 3. Check if there's already an active pending request
    existing_pending = db.query(HODTransferRequest).filter(
        HODTransferRequest.current_hod_id == current_hod.id,
        HODTransferRequest.status == HODTransferStatus.PENDING.value
    ).first()
    if existing_pending:
        # Check if expired
        if is_expired(existing_pending.expires_at):
            existing_pending.status = HODTransferStatus.EXPIRED.value
            db.commit()
        else:
            raise HTTPException(
                status_code=400,
                detail="There is already an active HOD transfer request pending. Please cancel it before creating a new one."
            )

    # 4. Create Transfer Request (Expires in 48 hours)
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    transfer_req = HODTransferRequest(
        current_hod_id=current_hod.id,
        target_staff_id=target_staff.id,
        status=HODTransferStatus.PENDING.value,
        initiated_at=now_utc,
        expires_at=now_utc + timedelta(hours=48),
        reason=req.reason.strip() if req.reason else None
    )
    db.add(transfer_req)
    db.commit()
    db.refresh(transfer_req)

    # 5. Audit Log
    audit = AuditLog(
        user_id=current_hod.id,
        action="INITIATE_HOD_TRANSFER",
        entity_type="USER",
        entity_id=target_staff.id,
        details=f"Current HOD '{current_hod.full_name}' initiated HOD transfer to Prof. '{target_staff.full_name}'."
    )
    db.add(audit)
    db.commit()

    return HODTransferResponse(
        id=transfer_req.id,
        current_hod_id=current_hod.id,
        current_hod_name=current_hod.full_name,
        target_staff_id=target_staff.id,
        target_staff_name=target_staff.full_name,
        status=transfer_req.status,
        reason=transfer_req.reason,
        initiated_at=transfer_req.initiated_at,
        expires_at=transfer_req.expires_at
    )

@router.get("/transfer/current", response_model=dict)
def get_current_transfer_status(
    db: Session = Depends(get_db),
    current_hod: User = Depends(require_hod)
):
    """(HOD Only) Returns the currently active pending transfer request, if any."""
    req = db.query(HODTransferRequest).filter(
        HODTransferRequest.current_hod_id == current_hod.id,
        HODTransferRequest.status == HODTransferStatus.PENDING.value
    ).order_by(HODTransferRequest.initiated_at.desc()).first()

    if not req:
        return {"has_pending": False, "request": None}

    # Check expiration
    if is_expired(req.expires_at):
        req.status = HODTransferStatus.EXPIRED.value
        db.commit()
        return {"has_pending": False, "request": None}

    target = db.query(User).filter(User.id == req.target_staff_id).first()
    return {
        "has_pending": True,
        "request": {
            "id": req.id,
            "target_staff_name": target.full_name if target else "Unknown",
            "target_staff_email": target.email if target else "",
            "initiated_at": req.initiated_at,
            "expires_at": req.expires_at,
            "reason": req.reason
        }
    }

@router.post("/transfer/cancel", response_model=dict)
def cancel_hod_transfer(
    db: Session = Depends(get_db),
    current_hod: User = Depends(require_hod)
):
    """(HOD Only) Cancels an active pending transfer request."""
    req = db.query(HODTransferRequest).filter(
        HODTransferRequest.current_hod_id == current_hod.id,
        HODTransferRequest.status == HODTransferStatus.PENDING.value
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="No active transfer request found to cancel.")

    req.status = HODTransferStatus.CANCELLED.value
    req.responded_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()

    audit = AuditLog(
        user_id=current_hod.id,
        action="CANCEL_HOD_TRANSFER",
        entity_type="USER",
        entity_id=req.target_staff_id,
        details="HOD cancelled the pending transfer request."
    )
    db.add(audit)
    db.commit()

    return {"message": "Pending HOD transfer request cancelled."}

@router.get("/transfer/pending", response_model=dict)
def check_staff_pending_invitation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """(Staff) Checks if there is an HOD transfer invitation waiting for the logged-in faculty member."""
    if current_user.role != UserRole.STAFF.value:
        return {"has_invitation": False, "invitation": None}

    req = db.query(HODTransferRequest).filter(
        HODTransferRequest.target_staff_id == current_user.id,
        HODTransferRequest.status == HODTransferStatus.PENDING.value
    ).order_by(HODTransferRequest.initiated_at.desc()).first()

    if not req:
        return {"has_invitation": False, "invitation": None}

    if is_expired(req.expires_at):
        req.status = HODTransferStatus.EXPIRED.value
        db.commit()
        return {"has_invitation": False, "invitation": None}

    current_hod = db.query(User).filter(User.id == req.current_hod_id).first()
    return {
        "has_invitation": True,
        "invitation": {
            "id": req.id,
            "current_hod_name": current_hod.full_name if current_hod else "Current HOD",
            "current_hod_email": current_hod.email if current_hod else "",
            "initiated_at": req.initiated_at,
            "expires_at": req.expires_at,
            "reason": req.reason
        }
    }

@router.post("/transfer/{request_id}/accept", response_model=TokenResponse)
def accept_hod_transfer(
    request_id: str,
    payload: HODTransferAcceptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    (Selected Staff Member) Accepts the HOD role transfer.
    - Requires faculty member to verify with their OWN password.
    - Executes atomic database transaction:
        1. Promotes Staff -> HOD
        2. Deactivates outgoing HOD (is_active = False)
        3. Revokes all active refresh tokens of outgoing HOD
        4. Updates transfer request status to ACCEPTED
        5. Writes immutable Audit Log
    - Issues fresh HOD JWT tokens to the new HOD.
    """
    if current_user.role != UserRole.STAFF.value:
        raise HTTPException(status_code=403, detail="Only the targeted staff member can accept.")

    # 1. Verify staff's own password
    if not verify_password(payload.staff_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect password. Identity verification failed.")

    # 2. Retrieve transfer request
    transfer_req = db.query(HODTransferRequest).filter(
        HODTransferRequest.id == request_id,
        HODTransferRequest.target_staff_id == current_user.id,
        HODTransferRequest.status == HODTransferStatus.PENDING.value
    ).first()

    if not transfer_req:
        raise HTTPException(status_code=404, detail="No active transfer request found for this ID.")

    if is_expired(transfer_req.expires_at):
        transfer_req.status = HODTransferStatus.EXPIRED.value
        db.commit()
        raise HTTPException(status_code=400, detail="This transfer request has expired.")

    outgoing_hod = db.query(User).filter(User.id == transfer_req.current_hod_id).first()
    if not outgoing_hod:
        raise HTTPException(status_code=400, detail="Outgoing HOD account not found.")

    # 3. ATOMIC TRANSACTION
    try:
        # A. Promote staff to HOD
        current_user.role = UserRole.HOD.value
        
        # B. Deactivate outgoing HOD as approved
        outgoing_hod.is_active = False
        
        # C. Revoke all refresh tokens of outgoing HOD
        db.query(RefreshToken).filter(RefreshToken.user_id == outgoing_hod.id).update({"is_revoked": True})
        
        # D. Mark transfer request as accepted
        transfer_req.status = HODTransferStatus.ACCEPTED.value
        transfer_req.responded_at = datetime.now(timezone.utc).replace(tzinfo=None)

        # E. Audit Log
        audit = AuditLog(
            user_id=current_user.id,
            action="HOD_TRANSFER_ACCEPTED",
            entity_type="USER",
            entity_id=current_user.id,
            details=f"Prof. '{current_user.full_name}' accepted HOD role. Outgoing HOD '{outgoing_hod.full_name}' deactivated."
        )
        db.add(audit)

        db.commit()
        db.refresh(current_user)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Transfer transaction failed: {str(e)}")

    # 4. Issue fresh tokens with HOD role
    access_token = create_access_token(subject=current_user.id, role=current_user.role)
    refresh_token = create_refresh_token(subject=current_user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=current_user.role,
        user_id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email
    )

@router.post("/transfer/{request_id}/reject", response_model=dict)
def reject_hod_transfer(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """(Selected Staff Member) Declines the HOD transfer request."""
    transfer_req = db.query(HODTransferRequest).filter(
        HODTransferRequest.id == request_id,
        HODTransferRequest.target_staff_id == current_user.id,
        HODTransferRequest.status == HODTransferStatus.PENDING.value
    ).first()

    if not transfer_req:
        raise HTTPException(status_code=404, detail="Pending request not found.")

    transfer_req.status = HODTransferStatus.REJECTED.value
    transfer_req.responded_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        action="HOD_TRANSFER_REJECTED",
        entity_type="USER",
        entity_id=transfer_req.current_hod_id,
        details=f"Prof. '{current_user.full_name}' declined the HOD transfer invitation."
    )
    db.add(audit)
    db.commit()

    return {"message": "You have declined the HOD role transfer invitation."}

