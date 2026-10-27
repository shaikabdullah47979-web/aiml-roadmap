from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, users, semesters, subjects, materials, questions, textbooks, student, hod_transfer, audit
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Setup"])
api_router.include_router(users.router, prefix="/users", tags=["User Management"])
api_router.include_router(semesters.router, prefix="/semesters", tags=["Semesters"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["Subjects"])
api_router.include_router(materials.router, prefix="/materials", tags=["Study Materials"])
api_router.include_router(questions.router, prefix="/questions", tags=["Important Questions"])
api_router.include_router(textbooks.router, prefix="/textbooks", tags=["Textbooks"])
api_router.include_router(student.router, prefix="/student", tags=["Student Tools"])
api_router.include_router(hod_transfer.router, prefix="/hod", tags=["HOD Role Transfer"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit Trail"])

