# AI/ML Roadmap & Academic Resource Management System
## Local Windows Setup & Execution Manual

This beginner-friendly guide explains step-by-step how to start and use the web application on a Windows computer using PowerShell.

---

## 1. Prerequisites (Already Installed & Verified)

- **Python 3.14+** (Verified with virtual environment at `backend\venv`)
- **Node.js LTS (v24.x)** & **npm (11.x)** (Installed at `C:\Program Files\nodejs`)

---

## 2. Quick Start: Running the Application Locally

You will need **two PowerShell terminal windows** open in the project root directory (`c:\Users\lenovo\Desktop\aiml roadmap`).

### Terminal 1: Start the Backend (FastAPI Server)

```powershell
# Navigate to project root
cd "c:\Users\lenovo\Desktop\aiml roadmap"

# Start FastAPI server using the Python virtual environment
backend\venv\Scripts\uvicorn app.main:app --reload --port 8000 --app-dir backend
```

> **Backend URL**: [http://127.0.0.1:8000](http://127.0.0.1:8000)  
> **Interactive OpenAPI Documentation (Swagger)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### Terminal 2: Start the Frontend (React + Vite)

```powershell
# Navigate to frontend folder
cd "c:\Users\lenovo\Desktop\aiml roadmap\frontend"

# Ensure Node is in PATH and start development server
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
& "C:\Program Files\nodejs\npm.cmd" run dev
```

> **Frontend Application URL**: [http://localhost:5173](http://localhost:5173)

---

## 3. First-Time Setup Workflow

When you open [http://localhost:5173](http://localhost:5173) for the first time:

1. **Setup Banner**: A *"Setup HOD"* badge will appear on the navigation bar.
2. **Setup Wizard URL**: Visit [http://localhost:5173/setup](http://localhost:5173/setup).
3. **Create Department HOD**:
   - Enter HOD Full Name (e.g., `Dr. Rajesh Sharma`)
   - Institutional Email (e.g., `hod.aiml@college.edu`)
   - Employee ID (e.g., `HOD-01`)
   - Create a secure password
4. **Permanent Lock**: Once created, the `/setup` wizard permanently locks and cannot be re-run.

---

## 4. Academic Role Hierarchy & Day-to-Day Operations

### A. Head of Department (HOD)
- **Dashboard**: `/hod`
- **Actions**:
  - **Subjects & Semesters**: Create subjects for Semesters 1 to 8 (Course Code, Name, Credits, Description).
  - **Staff Management**: Provision new faculty accounts (Full Name, Email, Temporary Password, Subject Assignments).
  - **Approval Queue**: Review uploaded notes from teachers. Approve to publish immediately to students, or reject with feedback.
  - **HOD Transfer Protocol**: Hand over the HOD role to an active faculty member with two-way password verification.

### B. Staff (Faculty / Teachers)
- **Dashboard**: `/staff`
- **Actions**:
  - **Study Materials**: Upload lecture notes, syllabus documents, lab manuals, or question papers (PDF, DOCX, PPTX, TXT, Images, ZIP up to 50MB).
  - **Student Logins**: Provision accounts for enrolled students (Student Name, Roll Number/USN, Enrolled Semester, Initial Password).
  - **Question Bank**: Add important exam questions with verified answers, marks, and difficulty levels.
  - **HOD Transfer Banner**: If nominated for HOD by the current head, a banner will appear allowing you to verify your password and accept the promotion.

### C. Students
- **Dashboard**: `/student`
- **Actions**:
  - Browse Semester 1 through 8 roadmaps.
  - Access approved notes and open documents in-browser.
  - Study from the Important Question Bank with revealable verified answers.
  - Bookmark favorite notes and questions for rapid revision.
  - Check off completed topics to see their visual subject completion percentage.

---

## 5. Database Switching: SQLite vs. PostgreSQL

The system uses a **Dual-Database Architecture** via SQLAlchemy:

- **Current Default (SQLite)**:
  - Database file stored at: `database/aiml_roadmap.db`
  - Zero background service, zero passwords, instant execution.

- **Switching to PostgreSQL**:
  1. Open `backend/.env`.
  2. Comment out the SQLite line and uncomment the PostgreSQL line:
     ```env
     # DATABASE_URL="sqlite:///./database/aiml_roadmap.db"
     DATABASE_URL="postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/aiml_roadmap"
     ```
  3. Restart the backend server. The backend automatically creates all tables and the 8 semester containers. No code changes required!

---

## 6. Running Automated Tests

To run the complete automated test suite covering all authentication, approval, student progress, and HOD transfer flows:

```powershell
cd "c:\Users\lenovo\Desktop\aiml roadmap"
backend\venv\Scripts\python.exe -m pytest backend\tests\test_api.py -v -o pythonpath=backend
```

