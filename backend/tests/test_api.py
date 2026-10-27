import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configure test environment
os.environ["DATABASE_URL"] = "sqlite:///./database/test_aiml_roadmap.db"

from app.main import app
from app.db.session import Base, get_db
from app.db.init_db import init_db

test_engine = create_engine("sqlite:///./database/test_aiml_roadmap.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    init_db(db)
    db.close()
    yield
    test_engine.dispose()
    try:
        if os.path.exists("./database/test_aiml_roadmap.db"):
            os.remove("./database/test_aiml_roadmap.db")
    except Exception:
        pass

client = TestClient(app)

def test_full_academic_lifecycle_and_hod_transfer():
    # 1. Setup Status Check (Initially True)
    res = client.get("/api/v1/auth/setup-status")
    assert res.status_code == 200
    assert res.json()["setup_needed"] is True

    # 2. Setup First HOD
    hod_payload = {
        "full_name": "Dr. Vikram Seth",
        "email": "hod.vikram@college.edu",
        "password": "HodPassword123!",
        "identifier": "HOD-01"
    }
    res = client.post("/api/v1/auth/setup-hod", json=hod_payload)
    assert res.status_code == 200
    hod_tokens = res.json()
    assert hod_tokens["role"] == "HOD"
    hod_headers = {"Authorization": f"Bearer {hod_tokens['access_token']}"}

    # 3. Setup Status Check (Now False & Permanently Locked)
    res = client.get("/api/v1/auth/setup-status")
    assert res.status_code == 200
    assert res.json()["setup_needed"] is False

    res_locked = client.post("/api/v1/auth/setup-hod", json=hod_payload)
    assert res_locked.status_code == 403

    # 4. Verify Semesters 1 to 8 Exist
    res = client.get("/api/v1/semesters")
    assert res.status_code == 200
    semesters = res.json()
    assert len(semesters) == 8
    assert semesters[0]["id"] == 1
    assert semesters[7]["id"] == 8

    # 5. HOD Creates a Subject in Semester 5
    subj_payload = {
        "semester_id": 5,
        "code": "AI501",
        "name": "Machine Learning Foundations",
        "description": "Supervised, unsupervised and reinforcement learning algorithms.",
        "credits": 4
    }
    res = client.post("/api/v1/subjects", json=subj_payload, headers=hod_headers)
    assert res.status_code == 200
    subject = res.json()
    assert subject["code"] == "AI501"
    subj_id = subject["id"]

    # 6. HOD Provisions a Staff Member
    staff_payload = {
        "full_name": "Prof. Sneha Verma",
        "email": "sneha.verma@college.edu",
        "password": "StaffPassword123!",
        "identifier": "FAC-102",
        "assigned_subject_ids": [subj_id]
    }
    res = client.post("/api/v1/users/staff", json=staff_payload, headers=hod_headers)
    assert res.status_code == 200
    staff = res.json()
    assert staff["role"] == "STAFF"
    staff_id = staff["id"]

    # 7. Staff Logs In
    login_res = client.post("/api/v1/auth/login", json={
        "email": "sneha.verma@college.edu",
        "password": "StaffPassword123!"
    })
    assert login_res.status_code == 200
    staff_tokens = login_res.json()
    assert staff_tokens["role"] == "STAFF"
    staff_headers = {"Authorization": f"Bearer {staff_tokens['access_token']}"}

    # 8. Staff Provisions a Student
    student_payload = {
        "full_name": "Rohan Gupta",
        "email": "rohan.gupta@student.edu",
        "password": "StudentPassword123!",
        "identifier": "1MS21AI032",
        "semester_id": 5
    }
    res = client.post("/api/v1/users/students", json=student_payload, headers=staff_headers)
    assert res.status_code == 200
    student = res.json()
    assert student["role"] == "STUDENT"

    # 9. Student Logs In
    stu_login_res = client.post("/api/v1/auth/login", json={
        "email": "rohan.gupta@student.edu",
        "password": "StudentPassword123!"
    })
    assert stu_login_res.status_code == 200
    stu_tokens = stu_login_res.json()
    assert stu_tokens["role"] == "STUDENT"
    stu_headers = {"Authorization": f"Bearer {stu_tokens['access_token']}"}

    # 10. Staff Uploads Study Material (PDF)
    dummy_file_content = b"%PDF-1.4 dummy pdf document for machine learning notes"
    res = client.post(
        "/api/v1/materials",
        data={
            "subject_id": subj_id,
            "title": "Unit 1: Linear Regression & Gradient Descent",
            "category": "CLASS_NOTES",
            "topic_or_unit": "Unit 1",
            "is_draft": False
        },
        files={"file": ("unit1_ml_notes.pdf", dummy_file_content, "application/pdf")},
        headers=staff_headers
    )
    assert res.status_code == 200
    material = res.json()
    assert material["status"] == "SUBMITTED"
    material_id = material["id"]

    # Student cannot see it yet (unapproved)
    res = client.get(f"/api/v1/materials?semester_id=5", headers=stu_headers)
    assert len(res.json()) == 0

    # 11. HOD Approves the Material
    res = client.post(f"/api/v1/materials/{material_id}/review", json={"action": "APPROVED"}, headers=hod_headers)
    assert res.status_code == 200

    # Student can now see and bookmark it
    res = client.get(f"/api/v1/materials?semester_id=5", headers=stu_headers)
    assert len(res.json()) == 1
    assert res.json()[0]["id"] == material_id

    # Student bookmarks material
    bm_res = client.post("/api/v1/student/bookmarks", json={"item_type": "MATERIAL", "item_id": material_id}, headers=stu_headers)
    assert bm_res.status_code == 200
    assert bm_res.json()["bookmarked"] is True

    # Student marks topic completed
    prog_res = client.post("/api/v1/student/progress", json={"material_id": material_id, "is_completed": True}, headers=stu_headers)
    assert prog_res.status_code == 200

    # 12. HOD Initiates Role Transfer to Staff Member
    transfer_payload = {
        "target_staff_id": staff_id,
        "hod_password": "HodPassword123!",
        "reason": "Department rotation."
    }
    res = client.post("/api/v1/hod/transfer/initiate", json=transfer_payload, headers=hod_headers)
    assert res.status_code == 200
    transfer_data = res.json()
    assert transfer_data["status"] == "PENDING"
    request_id = transfer_data["id"]

    # 13. Staff checks pending invitation
    res = client.get("/api/v1/hod/transfer/pending", headers=staff_headers)
    assert res.status_code == 200
    assert res.json()["has_invitation"] is True

    # 14. Staff Accepts Transfer with their own password
    accept_payload = {"staff_password": "StaffPassword123!"}
    res = client.post(f"/api/v1/hod/transfer/{request_id}/accept", json=accept_payload, headers=staff_headers)
    assert res.status_code == 200
    new_hod_tokens = res.json()
    assert new_hod_tokens["role"] == "HOD"

    # 15. Verify Outgoing HOD is Deactivated
    old_hod_login = client.post("/api/v1/auth/login", json={
        "email": "hod.vikram@college.edu",
        "password": "HodPassword123!"
    })
    assert old_hod_login.status_code == 403  # Account deactivated!

    # 16. Verify New HOD has full HOD permissions
    new_hod_headers = {"Authorization": f"Bearer {new_hod_tokens['access_token']}"}
    res = client.get("/api/v1/users/staff", headers=new_hod_headers)
    assert res.status_code == 200

