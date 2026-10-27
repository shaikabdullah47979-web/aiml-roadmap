from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.textbook import Textbook
from app.models.academic import Subject
from app.models.user import User, UserRole
from app.schemas.textbook import TextbookCreateRequest, TextbookResponse
from app.permissions.dependencies import require_staff

router = APIRouter()

@router.get("", response_model=List[TextbookResponse])
def list_textbooks(
    subject_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lists textbook references, filterable by subject."""
    query = db.query(Textbook)
    if subject_id:
        query = query.filter(Textbook.subject_id == subject_id)
    return query.order_by(Textbook.created_at.desc()).all()

@router.post("", response_model=TextbookResponse)
def create_textbook(
    req: TextbookCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """(Staff & HOD) Adds a verified textbook reference."""
    subj = db.query(Subject).filter(Subject.id == req.subject_id).first()
    if not subj:
        raise HTTPException(status_code=400, detail="Invalid subject ID.")

    tb = Textbook(
        subject_id=req.subject_id,
        added_by=current_user.id,
        title=req.title.strip(),
        author=req.author.strip(),
        edition=req.edition.strip() if req.edition else None,
        publisher=req.publisher.strip() if req.publisher else None,
        isbn=req.isbn.strip() if req.isbn else None,
        external_url=req.external_url.strip() if req.external_url else None,
        description=req.description.strip() if req.description else None
    )
    db.add(tb)
    db.commit()
    db.refresh(tb)
    return tb

@router.delete("/{textbook_id}", response_model=dict)
def delete_textbook(
    textbook_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """(Staff & HOD) Removes a textbook reference."""
    tb = db.query(Textbook).filter(Textbook.id == textbook_id).first()
    if not tb:
        raise HTTPException(status_code=404, detail="Textbook reference not found.")

    if current_user.role != UserRole.HOD.value and tb.added_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only remove textbooks you added.")

    db.delete(tb)
    db.commit()
    return {"message": "Textbook reference removed."}

