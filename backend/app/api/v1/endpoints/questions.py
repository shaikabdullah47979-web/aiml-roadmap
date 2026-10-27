from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.question import Question
from app.models.academic import Subject
from app.models.user import User, UserRole
from app.models.student_tools import Bookmark
from app.schemas.question import QuestionCreateRequest, QuestionUpdateRequest, QuestionResponse
from app.permissions.dependencies import get_current_user, require_staff

router = APIRouter()

@router.get("", response_model=List[QuestionResponse])
def list_questions(
    subject_id: Optional[str] = None,
    unit_or_module: Optional[str] = None,
    question_type: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Lists questions with answers, filtered by subject, unit, type, and difficulty."""
    query = db.query(Question)

    if subject_id:
        query = query.filter(Question.subject_id == subject_id)
    if unit_or_module:
        query = query.filter(Question.unit_or_module.ilike(f"%{unit_or_module.strip()}%"))
    if question_type:
        query = query.filter(Question.question_type == question_type)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (Question.question_text.ilike(search_filter)) |
            (Question.answer_text.ilike(search_filter)) |
            (Question.topic.ilike(search_filter))
        )

    questions = query.order_by(Question.created_at.desc()).all()
    results = []

    bookmarked_ids = set()
    if current_user and current_user.role == UserRole.STUDENT.value:
        bms = db.query(Bookmark).filter(Bookmark.user_id == current_user.id, Bookmark.item_type == "QUESTION").all()
        bookmarked_ids = {b.item_id for b in bms}

    for q in questions:
        author = db.query(User).filter(User.id == q.created_by).first() if q.created_by else None
        results.append(QuestionResponse(
            id=q.id,
            subject_id=q.subject_id,
            created_by=q.created_by,
            author_name=author.full_name if author else "Faculty",
            unit_or_module=q.unit_or_module,
            topic=q.topic,
            question_type=q.question_type,
            question_text=q.question_text,
            answer_text=q.answer_text,
            marks=q.marks,
            difficulty=q.difficulty,
            status=q.status,
            is_bookmarked=(q.id in bookmarked_ids),
            created_at=q.created_at,
            updated_at=q.updated_at
        ))

    return results

@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Gets details and verified answer for a single question."""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")

    author = db.query(User).filter(User.id == q.created_by).first() if q.created_by else None
    is_bm = False
    if current_user and current_user.role == UserRole.STUDENT.value:
        is_bm = db.query(Bookmark).filter(Bookmark.user_id == current_user.id, Bookmark.item_id == q.id).first() is not None

    return QuestionResponse(
        id=q.id,
        subject_id=q.subject_id,
        created_by=q.created_by,
        author_name=author.full_name if author else "Faculty",
        unit_or_module=q.unit_or_module,
        topic=q.topic,
        question_type=q.question_type,
        question_text=q.question_text,
        answer_text=q.answer_text,
        marks=q.marks,
        difficulty=q.difficulty,
        status=q.status,
        is_bookmarked=is_bm,
        created_at=q.created_at,
        updated_at=q.updated_at
    )

@router.post("", response_model=QuestionResponse)
def create_question(
    req: QuestionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """(Staff & HOD) Adds a question and answer to the question bank."""
    subj = db.query(Subject).filter(Subject.id == req.subject_id).first()
    if not subj:
        raise HTTPException(status_code=400, detail="Invalid subject ID.")

    question = Question(
        subject_id=req.subject_id,
        created_by=current_user.id,
        unit_or_module=req.unit_or_module.strip() if req.unit_or_module else None,
        topic=req.topic.strip() if req.topic else None,
        question_type=req.question_type,
        question_text=req.question_text.strip(),
        answer_text=req.answer_text.strip() if req.answer_text else None,
        marks=req.marks,
        difficulty=req.difficulty,
        status="PUBLISHED"
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    return QuestionResponse(
        id=question.id,
        subject_id=question.subject_id,
        created_by=question.created_by,
        author_name=current_user.full_name,
        unit_or_module=question.unit_or_module,
        topic=question.topic,
        question_type=question.question_type,
        question_text=question.question_text,
        answer_text=question.answer_text,
        marks=question.marks,
        difficulty=question.difficulty,
        status=question.status,
        created_at=question.created_at,
        updated_at=question.updated_at
    )

@router.patch("/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: str,
    req: QuestionUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """(Staff & HOD) Updates question or answer content."""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")

    if current_user.role != UserRole.HOD.value and q.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own questions.")

    if req.question_text is not None:
        q.question_text = req.question_text.strip()
    if req.answer_text is not None:
        q.answer_text = req.answer_text.strip()
    if req.unit_or_module is not None:
        q.unit_or_module = req.unit_or_module.strip()
    if req.topic is not None:
        q.topic = req.topic.strip()
    if req.question_type is not None:
        q.question_type = req.question_type
    if req.marks is not None:
        q.marks = req.marks
    if req.difficulty is not None:
        q.difficulty = req.difficulty

    db.commit()
    db.refresh(q)
    return get_question(question_id=q.id, db=db, current_user=current_user)

@router.delete("/{question_id}", response_model=dict)
def delete_question(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """(Staff & HOD) Deletes a question from the question bank."""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")

    if current_user.role != UserRole.HOD.value and q.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own questions.")

    db.delete(q)
    db.commit()
    return {"message": "Question deleted successfully."}

