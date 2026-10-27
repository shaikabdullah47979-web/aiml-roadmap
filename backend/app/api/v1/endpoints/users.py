from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.academic import StaffSubjectAssignment, Subject
from app.models.audit import AuditLog
from app.schemas.user import (
    StaffCreateRequest, StaffResponse,
    StudentCreateRequest, StudentBulkCreateRequest, StudentResponse, UserUpdateRequest
)
from app.permissions.dependencies import require_hod, require_staff

router = APIRouter()

# ----------------- STAFF MANAGEMENT (HOD Only) -----------------

@router.get("/staff", response_model=List[StaffResponse])
def list_staff_members(
    db: Session = Depends(get_db),
    current_hod: User = Depends(require_hod)
):
    """(HOD Only) Lists all registered faculty / staff members with assigned subjects."""
    staff_users = db.query(User).filter(User.role == UserRole.STAFF.value).all()
    results = []
    for s in staff_users:
        assignments = db.query(StaffSubjectAssignment).filter(StaffSubjectAssignment.staff_id == s.id).all()
        assigned_subj_list = []
        for a in assignments:
            subj = db.query(Subject).filter(Subject.id == a.subject_id).first()
            if subj:
                assigned_subj_list.append({"id": subj.id, "name": subj.name, "code": subj.code})

        results.append(StaffResponse(
            id=s.id,
            full_name=s.full_name,
            email=s.email,
            identifier=s.identifier,
            role=s.role,
            is_active=s.is_active,
            created_at=s.created_at,
            assigned_subjects=assigned_subj_list
        ))
    return results

@router.post("/staff", response_model=StaffResponse)
def create_staff_member(
    req: StaffCreateRequest,
    db: Session = Depends(get_db),
    current_hod: User = Depends(require_hod)
):
    """(HOD Only) Provisions a new faculty account with credentials and assigned subjects."""
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    new_staff = User(
        full_name=req.full_name.strip(),
        email=req.email.lower().strip(),
        hashed_password=get_password_hash(req.password),
        role=UserRole.STAFF.value,
        identifier=req.identifier,
        is_active=True
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)

    # Assign subjects if provided
    assigned_subj_list = []
    if req.assigned_subject_ids:
        for subj_id in req.assigned_subject_ids:
            subj = db.query(Subject).filter(Subject.id == subj_id).first()
            if subj:
                assignment = StaffSubjectAssignment(staff_id=new_staff.id, subject_id=subj.id)
                db.add(assignment)
                assigned_subj_list.append({"id": subj.id, "name": subj.name, "code": subj.code})
        db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_hod.id,
        action="PROVISION_STAFF",
        entity_type="USER",
        entity_id=new_staff.id,
        details=f"HOD created staff member '{new_staff.full_name}' ({new_staff.email})."
    )
    db.add(audit)
    db.commit()

    return StaffResponse(
        id=new_staff.id,
        full_name=new_staff.full_name,
        email=new_staff.email,
        identifier=new_staff.identifier,
        role=new_staff.role,
        is_active=new_staff.is_active,
        created_at=new_staff.created_at,
        assigned_subjects=assigned_subj_list
    )

@router.patch("/staff/{staff_id}", response_model=StaffResponse)
def update_staff_member(
    staff_id: str,
    req: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_hod: User = Depends(require_hod)
):
    """(HOD Only) Updates staff account status, full name, or password."""
    staff = db.query(User).filter(User.id == staff_id, User.role == UserRole.STAFF.value).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found.")

    if req.full_name is not None:
        staff.full_name = req.full_name.strip()
    if req.is_active is not None:
        staff.is_active = req.is_active
    if req.password:
        staff.hashed_password = get_password_hash(req.password)

    db.commit()
    db.refresh(staff)

    return StaffResponse(
        id=staff.id,
        full_name=staff.full_name,
        email=staff.email,
        identifier=staff.identifier,
        role=staff.role,
        is_active=staff.is_active,
        created_at=staff.created_at
    )

# ----------------- STUDENT MANAGEMENT (Staff & HOD) -----------------

@router.get("/students", response_model=List[StudentResponse])
def list_students(
    semester_id: Optional[int] = Query(None, ge=1, le=8),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """(Staff & HOD) Lists students, filterable by semester or search query."""
    query = db.query(User).filter(User.role == UserRole.STUDENT.value)
    if semester_id:
        query = query.filter(User.semester_id == semester_id)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter((User.full_name.ilike(search_filter)) | (User.identifier.ilike(search_filter)) | (User.email.ilike(search_filter)))

    students = query.order_by(User.semester_id.asc(), User.identifier.asc()).all()
    return students

@router.post("/students", response_model=StudentResponse)
def create_student(
    req: StudentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """(Staff & HOD) Provisions a student account with Roll No, semester, and credentials."""
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    student = User(
        full_name=req.full_name.strip(),
        email=req.email.lower().strip(),
        hashed_password=get_password_hash(req.password),
        role=UserRole.STUDENT.value,
        identifier=req.identifier.strip(),
        semester_id=req.semester_id,
        is_active=True
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="PROVISION_STUDENT",
        entity_type="USER",
        entity_id=student.id,
        details=f"{current_user.role} '{current_user.full_name}' created student '{student.full_name}' (Roll No: {student.identifier}, Sem {student.semester_id})."
    )
    db.add(audit)
    db.commit()

    return student

@router.post("/students/bulk", response_model=dict)
def bulk_create_students(
    req: StudentBulkCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """(Staff & HOD) Provisions multiple students in bulk."""
    created_count = 0
    skipped_count = 0

    for item in req.students:
        email = item.email.lower().strip()
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            skipped_count += 1
            continue

        student = User(
            full_name=item.full_name.strip(),
            email=email,
            hashed_password=get_password_hash(item.password),
            role=UserRole.STUDENT.value,
            identifier=item.identifier.strip(),
            semester_id=item.semester_id,
            is_active=True
        )
        db.add(student)
        created_count += 1

    db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        action="BULK_PROVISION_STUDENTS",
        entity_type="USER",
        details=f"Bulk provisioned {created_count} students (skipped {skipped_count} duplicates)."
    )
    db.add(audit)
    db.commit()

    return {"message": f"Successfully created {created_count} students.", "created_count": created_count, "skipped_count": skipped_count}

@router.patch("/students/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: str,
    req: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """(Staff & HOD) Updates student details, semester, password, or active status."""
    student = db.query(User).filter(User.id == student_id, User.role == UserRole.STUDENT.value).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    if req.full_name is not None:
        student.full_name = req.full_name.strip()
    if req.semester_id is not None:
        student.semester_id = req.semester_id
    if req.is_active is not None:
        student.is_active = req.is_active
    if req.password:
        student.hashed_password = get_password_hash(req.password)

    db.commit()
    db.refresh(student)
    return student

