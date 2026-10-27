import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.storage import storage_service
from app.models.material import StudyMaterial, MaterialApproval, MaterialCategory, MaterialStatus
from app.models.academic import Subject
from app.models.user import User, UserRole
from app.models.student_tools import Bookmark, LearningProgress
from app.models.audit import AuditLog
from app.schemas.material import MaterialResponse, MaterialUpdateRequest, MaterialApprovalRequest
from app.permissions.dependencies import get_current_user, require_staff, require_hod

router = APIRouter()

@router.get("", response_model=List[MaterialResponse])
def list_materials(
    semester_id: Optional[int] = Query(None, ge=1, le=8),
    subject_id: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Lists study materials.
    - Students only see PUBLISHED materials.
    - Staff / HOD can filter by status (SUBMITTED, DRAFT, PUBLISHED, REJECTED).
    """
    query = db.query(StudyMaterial)

    # Restrict students to PUBLISHED only
    if not current_user or current_user.role == UserRole.STUDENT.value:
        query = query.filter(StudyMaterial.status == MaterialStatus.PUBLISHED.value)
    else:
        if status_filter:
            query = query.filter(StudyMaterial.status == status_filter)

    if subject_id:
        query = query.filter(StudyMaterial.subject_id == subject_id)
    elif semester_id:
        # Join with subject to filter by semester
        query = query.join(Subject).filter(Subject.semester_id == semester_id)

    if category:
        query = query.filter(StudyMaterial.category == category)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (StudyMaterial.title.ilike(search_filter)) |
            (StudyMaterial.description.ilike(search_filter)) |
            (StudyMaterial.topic_or_unit.ilike(search_filter))
        )

    materials = query.order_by(StudyMaterial.created_at.desc()).all()
    results = []

    # Check bookmarks and progress if user is a student
    bookmarked_ids = set()
    completed_ids = set()
    if current_user and current_user.role == UserRole.STUDENT.value:
        bms = db.query(Bookmark).filter(Bookmark.user_id == current_user.id, Bookmark.item_type == "MATERIAL").all()
        bookmarked_ids = {b.item_id for b in bms}
        progs = db.query(LearningProgress).filter(LearningProgress.user_id == current_user.id, LearningProgress.is_completed == True).all()
        completed_ids = {p.material_id for p in progs}

    for m in materials:
        subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
        uploader = db.query(User).filter(User.id == m.uploaded_by).first() if m.uploaded_by else None

        results.append(MaterialResponse(
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
            rejection_reason=m.rejection_reason,
            is_bookmarked=(m.id in bookmarked_ids),
            is_completed=(m.id in completed_ids),
            created_at=m.created_at,
            updated_at=m.updated_at
        ))

    return results

@router.get("/{material_id}", response_model=MaterialResponse)
def get_material(
    material_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Gets single study material details."""
    m = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material not found.")

    if current_user.role == UserRole.STUDENT.value and m.status != MaterialStatus.PUBLISHED.value:
        raise HTTPException(status_code=403, detail="Material is pending department review.")

    subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
    uploader = db.query(User).filter(User.id == m.uploaded_by).first() if m.uploaded_by else None

    is_bm = False
    is_comp = False
    if current_user.role == UserRole.STUDENT.value:
        is_bm = db.query(Bookmark).filter(Bookmark.user_id == current_user.id, Bookmark.item_id == m.id).first() is not None
        is_comp = db.query(LearningProgress).filter(LearningProgress.user_id == current_user.id, LearningProgress.material_id == m.id, LearningProgress.is_completed == True).first() is not None

    return MaterialResponse(
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
        rejection_reason=m.rejection_reason,
        is_bookmarked=is_bm,
        is_completed=is_comp,
        created_at=m.created_at,
        updated_at=m.updated_at
    )

@router.post("", response_model=MaterialResponse)
async def upload_material(
    subject_id: str = Form(...),
    title: str = Form(...),
    category: str = Form(...),
    description: Optional[str] = Form(None),
    topic_or_unit: Optional[str] = Form(None),
    is_draft: bool = Form(False),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """
    (Staff & HOD) Uploads study material up to 50MB.
    - If uploaded by HOD, automatically set to PUBLISHED.
    - If uploaded by Staff and not draft, set to SUBMITTED for HOD review.
    """
    subj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subj:
        raise HTTPException(status_code=400, detail="Invalid subject ID.")

    # Save file securely to Firebase Storage or local uploads
    file_url, safe_filename, file_size = await storage_service.save_file(file)
    _, ext = os.path.splitext(file.filename or "")
    clean_type = ext.replace(".", "").lower()

    # Determine status
    if current_user.role == UserRole.HOD.value:
        status_value = MaterialStatus.PUBLISHED.value
    else:
        status_value = MaterialStatus.DRAFT.value if is_draft else MaterialStatus.SUBMITTED.value

    material = StudyMaterial(
        subject_id=subject_id,
        uploaded_by=current_user.id,
        title=title.strip(),
        description=description.strip() if description else None,
        category=category,
        topic_or_unit=topic_or_unit.strip() if topic_or_unit else None,
        file_name=safe_filename,
        file_url=file_url,
        file_type=clean_type,
        file_size_bytes=file_size,
        status=status_value
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="UPLOAD_MATERIAL",
        entity_type="MATERIAL",
        entity_id=material.id,
        details=f"Uploaded '{material.title}' for {subj.code} (Status: {material.status})."
    )
    db.add(audit)
    db.commit()

    return MaterialResponse(
        id=material.id,
        subject_id=material.subject_id,
        uploaded_by=material.uploaded_by,
        uploader_name=current_user.full_name,
        subject_name=subj.name,
        semester_id=subj.semester_id,
        title=material.title,
        description=material.description,
        category=material.category,
        topic_or_unit=material.topic_or_unit,
        file_name=material.file_name,
        file_url=material.file_url,
        file_type=material.file_type,
        file_size_bytes=material.file_size_bytes,
        status=material.status,
        created_at=material.created_at,
        updated_at=material.updated_at
    )

@router.patch("/{material_id}", response_model=MaterialResponse)
def update_material(
    material_id: str,
    req: MaterialUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """(Staff & HOD) Updates material title, description, category, or unit."""
    m = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material not found.")

    if current_user.role != UserRole.HOD.value and m.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own materials.")

    if req.title is not None:
        m.title = req.title.strip()
    if req.description is not None:
        m.description = req.description.strip()
    if req.category is not None:
        m.category = req.category
    if req.topic_or_unit is not None:
        m.topic_or_unit = req.topic_or_unit.strip()

    db.commit()
    db.refresh(m)
    return get_material(material_id=m.id, db=db, current_user=current_user)

@router.delete("/{material_id}", response_model=dict)
def delete_material(
    material_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """(Staff & HOD) Deletes material and removes the file from disk/cloud storage."""
    m = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material not found.")

    if current_user.role != UserRole.HOD.value and m.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own materials.")

    file_to_delete = m.file_name
    title = m.title
    db.delete(m)
    db.commit()

    # Clean up physical storage
    storage_service.delete_file(file_to_delete)

    audit = AuditLog(
        user_id=current_user.id,
        action="DELETE_MATERIAL",
        entity_type="MATERIAL",
        entity_id=material_id,
        details=f"Deleted material '{title}'."
    )
    db.add(audit)
    db.commit()

    return {"message": f"Material '{title}' deleted successfully."}

@router.post("/{material_id}/submit", response_model=dict)
def submit_material_for_review(
    material_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """(Staff) Submits a draft material to the HOD for review."""
    m = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material not found.")
    if m.uploaded_by != current_user.id and current_user.role != UserRole.HOD.value:
        raise HTTPException(status_code=403, detail="You can only submit your own materials.")

    m.status = MaterialStatus.SUBMITTED.value
    m.rejection_reason = None
    db.commit()
    return {"message": "Material submitted to HOD for review.", "status": m.status}

@router.post("/{material_id}/review", response_model=dict)
def review_material(
    material_id: str,
    req: MaterialApprovalRequest,
    db: Session = Depends(get_db),
    current_hod: User = Depends(require_hod)
):
    """(HOD Only) Approves (moves to PUBLISHED) or Rejects (with reason) a submitted material."""
    m = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material not found.")

    action_upper = req.action.strip().upper()
    if action_upper == "APPROVED":
        m.status = MaterialStatus.PUBLISHED.value
        m.rejection_reason = None
    elif action_upper == "REJECTED":
        if not req.feedback:
            raise HTTPException(status_code=400, detail="Rejection reason / feedback is required.")
        m.status = MaterialStatus.REJECTED.value
        m.rejection_reason = req.feedback
    else:
        raise HTTPException(status_code=400, detail="Action must be 'APPROVED' or 'REJECTED'.")

    # Record approval record
    approval = MaterialApproval(
        material_id=m.id,
        reviewed_by=current_hod.id,
        action=action_upper,
        feedback=req.feedback
    )
    db.add(approval)
    db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_hod.id,
        action=f"MATERIAL_{action_upper}",
        entity_type="MATERIAL",
        entity_id=m.id,
        details=f"HOD {action_upper.lower()} material '{m.title}' (Feedback: {req.feedback or 'None'})."
    )
    db.add(audit)
    db.commit()

    return {"message": f"Material has been {action_upper.lower()}.", "status": m.status}

