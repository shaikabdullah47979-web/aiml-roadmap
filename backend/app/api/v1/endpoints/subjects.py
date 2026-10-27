from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.academic import Subject, Semester, StaffSubjectAssignment
from app.models.material import StudyMaterial, MaterialStatus
from app.models.question import Question
from app.models.textbook import Textbook
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.academic import SubjectCreateRequest, SubjectUpdateRequest, SubjectResponse, AssignedStaffBrief
from app.permissions.dependencies import require_hod

router = APIRouter()

@router.get("", response_model=List[SubjectResponse])
def list_subjects(
    semester_id: Optional[int] = Query(None, ge=1, le=8),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lists subjects filtered by semester or search query."""
    query = db.query(Subject)
    if semester_id:
        query = query.filter(Subject.semester_id == semester_id)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter((Subject.name.ilike(search_filter)) | (Subject.code.ilike(search_filter)))

    subjects = query.order_by(Subject.semester_id.asc(), Subject.code.asc()).all()
    results = []

    for s in subjects:
        mats_count = db.query(StudyMaterial).filter(
            StudyMaterial.subject_id == s.id,
            StudyMaterial.status == MaterialStatus.PUBLISHED.value
        ).count()
        q_count = db.query(Question).filter(Question.subject_id == s.id).count()
        tb_count = db.query(Textbook).filter(Textbook.subject_id == s.id).count()

        # Assigned staff
        assignments = db.query(StaffSubjectAssignment).filter(StaffSubjectAssignment.subject_id == s.id).all()
        assigned_staff_list = []
        for a in assignments:
            staff = db.query(User).filter(User.id == a.staff_id).first()
            if staff:
                assigned_staff_list.append(AssignedStaffBrief(id=staff.id, full_name=staff.full_name, email=staff.email))

        results.append(SubjectResponse(
            id=s.id,
            semester_id=s.semester_id,
            code=s.code,
            name=s.name,
            description=s.description,
            credits=s.credits,
            created_at=s.created_at,
            materials_count=mats_count,
            questions_count=q_count,
            textbooks_count=tb_count,
            assigned_staff=assigned_staff_list
        ))

    return results

@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject_detail(subject_id: str, db: Session = Depends(get_db)):
    """Gets single subject details with resource counts and assigned faculty."""
    s = db.query(Subject).filter(Subject.id == subject_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Subject not found.")

    mats_count = db.query(StudyMaterial).filter(
        StudyMaterial.subject_id == s.id,
        StudyMaterial.status == MaterialStatus.PUBLISHED.value
    ).count()
    q_count = db.query(Question).filter(Question.subject_id == s.id).count()
    tb_count = db.query(Textbook).filter(Textbook.subject_id == s.id).count()

    assignments = db.query(StaffSubjectAssignment).filter(StaffSubjectAssignment.subject_id == s.id).all()
    assigned_staff_list = []
    for a in assignments:
        staff = db.query(User).filter(User.id == a.staff_id).first()
        if staff:
            assigned_staff_list.append(AssignedStaffBrief(id=staff.id, full_name=staff.full_name, email=staff.email))

    return SubjectResponse(
        id=s.id,
        semester_id=s.semester_id,
        code=s.code,
        name=s.name,
        description=s.description,
        credits=s.credits,
        created_at=s.created_at,
        materials_count=mats_count,
        questions_count=q_count,
        textbooks_count=tb_count,
        assigned_staff=assigned_staff_list
    )

@router.post("", response_model=SubjectResponse)
def create_subject(
    req: SubjectCreateRequest,
    db: Session = Depends(get_db),
    current_hod: User = Depends(require_hod)
):
    """(HOD Only) Creates a new Subject under a Semester."""
    sem = db.query(Semester).filter(Semester.id == req.semester_id).first()
    if not sem:
        raise HTTPException(status_code=400, detail="Invalid semester ID.")

    subject = Subject(
        semester_id=req.semester_id,
        code=req.code.strip().upper(),
        name=req.name.strip(),
        description=req.description,
        credits=req.credits
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)

    # Assign staff if provided
    assigned_staff_list = []
    if req.assigned_staff_ids:
        for staff_id in req.assigned_staff_ids:
            staff = db.query(User).filter(User.id == staff_id).first()
            if staff:
                assignment = StaffSubjectAssignment(staff_id=staff.id, subject_id=subject.id)
                db.add(assignment)
                assigned_staff_list.append(AssignedStaffBrief(id=staff.id, full_name=staff.full_name, email=staff.email))
        db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_hod.id,
        action="CREATE_SUBJECT",
        entity_type="SUBJECT",
        entity_id=subject.id,
        details=f"HOD created subject '{subject.code}: {subject.name}' in Semester {subject.semester_id}."
    )
    db.add(audit)
    db.commit()

    return SubjectResponse(
        id=subject.id,
        semester_id=subject.semester_id,
        code=subject.code,
        name=subject.name,
        description=subject.description,
        credits=subject.credits,
        created_at=subject.created_at,
        assigned_staff=assigned_staff_list
    )

@router.patch("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: str,
    req: SubjectUpdateRequest,
    db: Session = Depends(get_db),
    current_hod: User = Depends(require_hod)
):
    """(HOD Only) Updates subject details, credits, or assigned staff."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")

    if req.name is not None:
        subject.name = req.name.strip()
    if req.code is not None:
        subject.code = req.code.strip().upper()
    if req.description is not None:
        subject.description = req.description
    if req.credits is not None:
        subject.credits = req.credits
    if req.semester_id is not None:
        subject.semester_id = req.semester_id

    # Update assigned staff if list provided
    if req.assigned_staff_ids is not None:
        db.query(StaffSubjectAssignment).filter(StaffSubjectAssignment.subject_id == subject.id).delete()
        for staff_id in req.assigned_staff_ids:
            assignment = StaffSubjectAssignment(staff_id=staff_id, subject_id=subject.id)
            db.add(assignment)

    db.commit()
    db.refresh(subject)
    return get_subject_detail(subject_id=subject.id, db=db)

@router.delete("/{subject_id}", response_model=dict)
def delete_subject(
    subject_id: str,
    db: Session = Depends(get_db),
    current_hod: User = Depends(require_hod)
):
    """(HOD Only) Deletes a subject and its associated resources."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")

    subject_info = f"{subject.code}: {subject.name}"
    db.delete(subject)
    db.commit()

    audit = AuditLog(
        user_id=current_hod.id,
        action="DELETE_SUBJECT",
        entity_type="SUBJECT",
        entity_id=subject_id,
        details=f"HOD deleted subject '{subject_info}'."
    )
    db.add(audit)
    db.commit()

    return {"message": f"Subject '{subject_info}' deleted successfully."}

