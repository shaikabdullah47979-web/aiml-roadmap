from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.academic import Semester, Subject
from app.models.material import StudyMaterial, MaterialStatus
from app.schemas.academic import SemesterResponse, SubjectResponse

router = APIRouter()

@router.get("", response_model=List[SemesterResponse])
def list_semesters(db: Session = Depends(get_db)):
    """Lists all Semesters (1 through 8) with their total subjects and published study materials counts."""
    semesters = db.query(Semester).order_by(Semester.id.asc()).all()
    results = []

    for sem in semesters:
        subjects = db.query(Subject).filter(Subject.semester_id == sem.id).all()
        subj_count = len(subjects)
        
        # Count published materials across all subjects in this semester
        subj_ids = [s.id for s in subjects]
        mat_count = 0
        if subj_ids:
            mat_count = db.query(StudyMaterial).filter(
                StudyMaterial.subject_id.in_(subj_ids),
                StudyMaterial.status == MaterialStatus.PUBLISHED.value
            ).count()

        results.append(SemesterResponse(
            id=sem.id,
            title=sem.title,
            academic_year=sem.academic_year,
            is_active=sem.is_active,
            subjects_count=subj_count,
            materials_count=mat_count
        ))
    return results

@router.get("/{semester_id}", response_model=SemesterResponse)
def get_semester_detail(semester_id: int, db: Session = Depends(get_db)):
    """Gets details of a single semester including all its subjects."""
    sem = db.query(Semester).filter(Semester.id == semester_id).first()
    if not sem:
        raise HTTPException(status_code=404, detail="Semester not found.")

    subjects = db.query(Subject).filter(Subject.semester_id == sem.id).all()
    subj_responses = []

    for subj in subjects:
        mats_count = db.query(StudyMaterial).filter(
            StudyMaterial.subject_id == subj.id,
            StudyMaterial.status == MaterialStatus.PUBLISHED.value
        ).count()
        subj_responses.append(SubjectResponse(
            id=subj.id,
            semester_id=subj.semester_id,
            code=subj.code,
            name=subj.name,
            description=subj.description,
            credits=subj.credits,
            created_at=subj.created_at,
            materials_count=mats_count
        ))

    return SemesterResponse(
        id=sem.id,
        title=sem.title,
        academic_year=sem.academic_year,
        is_active=sem.is_active,
        subjects_count=len(subjects),
        materials_count=sum(s.materials_count for s in subj_responses),
        subjects=subj_responses
    )

