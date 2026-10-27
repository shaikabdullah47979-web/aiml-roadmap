from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.user import User
from app.permissions.dependencies import require_hod

router = APIRouter()

@router.get("", response_model=List[dict])
def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    current_hod: User = Depends(require_hod)
):
    """(HOD Only) Returns chronological audit trail of all administrative and academic actions."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    results = []
    for log in logs:
        actor = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
        results.append({
            "id": log.id,
            "user_id": log.user_id,
            "actor_name": actor.full_name if actor else "System",
            "actor_role": actor.role if actor else "SYSTEM",
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
    return results

