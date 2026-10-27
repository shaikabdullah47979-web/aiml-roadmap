from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.student_tools import Bookmark, LearningProgress
from app.models.material import StudyMaterial, MaterialStatus
from app.models.question import Question
from app.models.academic import Subject
from app.models.user import User, UserRole
from app.schemas.student_tools import (
    BookmarkToggleRequest, BookmarkResponse,
    ProgressToggleRequest, StudentProgressResponse, SubjectProgressDetail
)
from app.schemas.material import MaterialResponse
from app.schemas.question import QuestionResponse
from app.permissions.dependencies import get_current_user

router = APIRouter()

@router.get("/bookmarks", response_model=List[BookmarkResponse])
def get_student_bookmarks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all bookmarked study materials and questions for the authenticated student."""
    bookmarks = db.query(Bookmark).filter(Bookmark.user_id == current_user.id).order_by(Bookmark.created_at.desc()).all()
    results = []

    for b in bookmarks:
        mat_resp = None
        q_resp = None

        if b.item_type == "MATERIAL":
            m = db.query(StudyMaterial).filter(StudyMaterial.id == b.item_id).first()
            if m:
                subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
                uploader = db.query(User).filter(User.id == m.uploaded_by).first() if m.uploaded_by else None
                mat_resp = MaterialResponse(
                    id=m.id,
                    subject_id=m.subject_id,
                    uploaded_by=m.uploaded_by,
                    uploader_name=uploader.full_name if uploader else "Faculty",
                    subject_name=subj.name if subj else "Unknown",
                    semester_id=subj.semester_id if subj else None,
                    title=m.title,
                    description=m.description,
                    category=m.category,
                    topic_or_unit=m.topic_or_unit,
                    file_name=m.file_name,
                    file_url=m.file_url,
                    file_type=m.file_type,
                    file_size_bytes=m.file_size_bytes,
                    status=m.status,
                    is_bookmarked=True,
                    created_at=m.created_at,
                    updated_at=m.updated_at
                )

        elif b.item_type == "QUESTION":
            q = db.query(Question).filter(Question.id == b.item_id).first()
            if q:
                author = db.query(User).filter(User.id == q.created_by).first() if q.created_by else None
                q_resp = QuestionResponse(
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
                    is_bookmarked=True,
                    created_at=q.created_at,
                    updated_at=q.updated_at
                )

        results.append(BookmarkResponse(
            id=b.id,
            item_type=b.item_type,
            item_id=b.item_id,
            created_at=b.created_at,
            material=mat_resp,
            question=q_resp
        ))

    return results

@router.post("/bookmarks", response_model=dict)
def toggle_bookmark(
    req: BookmarkToggleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggles bookmark status on a study material or question."""
    existing = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.item_type == req.item_type.upper(),
        Bookmark.item_id == req.item_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"bookmarked": False, "message": "Bookmark removed."}
    else:
        new_bm = Bookmark(
            user_id=current_user.id,
            item_type=req.item_type.upper(),
            item_id=req.item_id
        )
        db.add(new_bm)
        db.commit()
        return {"bookmarked": True, "message": "Bookmarked successfully."}

@router.get("/progress", response_model=StudentProgressResponse)
def get_student_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculates completion progress (overall and per subject) for the student's enrolled semester."""
    sem_id = current_user.semester_id or 1
    subjects = db.query(Subject).filter(Subject.semester_id == sem_id).all()

    total_all_materials = 0
    completed_all_materials = 0
    subjects_details = []

    for subj in subjects:
        # Total published materials in this subject
        total_in_subj = db.query(StudyMaterial).filter(
            StudyMaterial.subject_id == subj.id,
            StudyMaterial.status == MaterialStatus.PUBLISHED.value
        ).count()

        # Count completed
        completed_in_subj = 0
        if total_in_subj > 0:
            completed_in_subj = db.query(LearningProgress).join(StudyMaterial).filter(
                LearningProgress.user_id == current_user.id,
                LearningProgress.is_completed == True,
                StudyMaterial.subject_id == subj.id,
                StudyMaterial.status == MaterialStatus.PUBLISHED.value
            ).count()

        pct = (completed_in_subj / total_in_subj * 100.0) if total_in_subj > 0 else 0.0

        total_all_materials += total_in_subj
        completed_all_materials += completed_in_subj

        subjects_details.append(SubjectProgressDetail(
            subject_id=subj.id,
            subject_name=subj.name,
            subject_code=subj.code,
            semester_id=subj.semester_id,
            total_materials=total_in_subj,
            completed_materials=completed_in_subj,
            percentage=round(pct, 1)
        ))

    overall_pct = (completed_all_materials / total_all_materials * 100.0) if total_all_materials > 0 else 0.0

    return StudentProgressResponse(
        overall_percentage=round(overall_pct, 1),
        total_materials=total_all_materials,
        completed_materials=completed_all_materials,
        subjects_progress=subjects_details
    )

@router.post("/progress", response_model=dict)
def toggle_material_completion(
    req: ProgressToggleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marks a topic / study material as completed or incomplete."""
    progress = db.query(LearningProgress).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.material_id == req.material_id
    ).first()

    if progress:
        progress.is_completed = req.is_completed
        progress.completed_at = datetime.now(timezone.utc)
    else:
        progress = LearningProgress(
            user_id=current_user.id,
            material_id=req.material_id,
            is_completed=req.is_completed,
            completed_at=datetime.now(timezone.utc)
        )
        db.add(progress)

    db.commit()
    return {"is_completed": progress.is_completed, "material_id": req.material_id}

