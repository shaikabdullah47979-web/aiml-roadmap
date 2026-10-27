# AI/ML Roadmap – Academic Learning & Resource Management System

A centralized, responsive, role-based academic portal designed for AI & Machine Learning engineering departments to manage semester-wise roadmaps, lecture notes, textbook references, lab manuals, and question banks across Semesters 1 to 8.

---

## 🌟 Key Architecture Highlights

- **3-Tier Hierarchy (Zero Admin Panel)**: Strictly enforces academic workflows between **HOD**, **Staff (Faculty)**, and **Students**.
- **First-Time Web Setup Wizard (`/setup`)**: Initial creation of the Department HOD when the database is empty, permanently locking itself down after creation.
- **HOD Role Handover Feature**: The current HOD can nominate an active faculty member and send a transfer request. The chosen faculty member must verify their password to accept the role, promoting them to HOD and deactivating the previous HOD account with zero data loss.
- **Dynamic Semesters 1 to 8 (Blank Slate)**: All 8 semesters are initialized as containers; course codes, subjects, and credits are created dynamically via UI.
- **Study Material Approval Lifecycle**: Staff uploads study materials (up to 50MB; PDF, DOCX, PPTX, TXT, Images, ZIP) $\rightarrow$ HOD reviews in an approval queue $\rightarrow$ Published materials become visible to Students.
- **Dual-Database Support**: SQLAlchemy pre-configured for instant zero-setup local SQLite execution (`database/aiml_roadmap.db`) with one-line toggle to PostgreSQL in `.env`.
- **Student Productivity Tools**: Bookmarks, question bank with verified answers, and topic progress tracking with visual percentage bars per subject.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Axios, React Router v6 |
| **Backend** | Python 3.14, FastAPI, SQLAlchemy 2.0, Pydantic v2, native bcrypt, python-jose (JWT) |
| **Database** | SQLite (default local) / PostgreSQL (production-ready via `.env`) |
| **Storage** | Hybrid (Local authenticated streaming + optional Google Firebase Storage adapter) |

---

## 🚀 Getting Started

Read the beginner-friendly setup manual at **[`docs/setup-guide.md`](file:///docs/setup-guide.md)**.

### 1. Start Backend Server
```powershell
backend\venv\Scripts\uvicorn app.main:app --reload --port 8000 --app-dir backend
```
Open Swagger API Docs at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Start Frontend Server
```powershell
cd frontend
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
& "C:\Program Files\nodejs\npm.cmd" run dev
```
Open Web App at: [http://localhost:5173](http://localhost:5173)

### 3. Run Automated Tests
```powershell
backend\venv\Scripts\python.exe -m pytest backend\tests\test_api.py -v -o pythonpath=backend
```

