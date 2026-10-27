# Import all the models, so that Base has them before being
# imported by Alembic or database initialization
from app.db.session import Base
from app.models.user import User, RefreshToken, UserRole
from app.models.academic import Semester, Subject, StaffSubjectAssignment
from app.models.material import StudyMaterial, MaterialApproval, MaterialCategory, MaterialStatus
from app.models.question import Question, QuestionType, QuestionDifficulty
from app.models.textbook import Textbook
from app.models.student_tools import Bookmark, LearningProgress
from app.models.audit import AuditLog
from app.models.hod_transfer import HODTransferRequest, HODTransferStatus

