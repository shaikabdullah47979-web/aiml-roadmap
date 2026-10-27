from sqlalchemy.orm import Session
from app.db.base import Base
from app.db.session import engine
from app.models.academic import Semester

def init_db(db: Session) -> None:
    """Initializes tables and populates the 8 core Semester containers."""
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)

    # Initialize Semesters 1 through 8 if not already present
    existing_semesters = db.query(Semester).count()
    if existing_semesters < 8:
        for sem_num in range(1, 9):
            sem = db.query(Semester).filter(Semester.id == sem_num).first()
            if not sem:
                new_sem = Semester(
                    id=sem_num,
                    title=f"Semester {sem_num}",
                    academic_year="2024-2028",
                    is_active=1
                )
                db.add(new_sem)
        db.commit()
        print("Initialized 8 Semester containers (Blank Slate).")

