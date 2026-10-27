export type UserRole = 'HOD' | 'STAFF' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  identifier?: string;
  semester_id?: number;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: UserRole;
  user_id: string;
  full_name: string;
  email: string;
  semester_id?: number;
}

export interface AssignedStaff {
  id: string;
  full_name: string;
  email: string;
}

export interface Subject {
  id: string;
  semester_id: number;
  code: string;
  name: string;
  description?: string;
  credits: number;
  created_at: string;
  materials_count: number;
  questions_count?: number;
  textbooks_count?: number;
  assigned_staff?: AssignedStaff[];
}

export interface Semester {
  id: number;
  title: string;
  academic_year: string;
  is_active: number;
  subjects_count: number;
  materials_count: number;
  subjects?: Subject[];
}

export type MaterialCategory =
  | 'CLASS_NOTES'
  | 'DETAILED_NOTES'
  | 'IMPORTANT_QUESTIONS'
  | 'QUESTION_BANK'
  | 'PREVIOUS_YEAR_PAPERS'
  | 'MODEL_PAPERS'
  | 'TEXTBOOK_REFERENCES'
  | 'LAB_MANUAL'
  | 'PRACTICAL_FILES'
  | 'SYLLABUS'
  | 'OTHER';

export type MaterialStatus = 'DRAFT' | 'SUBMITTED' | 'PUBLISHED' | 'REJECTED';

export interface StudyMaterial {
  id: string;
  subject_id: string;
  uploaded_by?: string;
  uploader_name?: string;
  subject_name?: string;
  semester_id?: number;
  title: string;
  description?: string;
  category: MaterialCategory;
  topic_or_unit?: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number;
  status: MaterialStatus;
  rejection_reason?: string;
  is_bookmarked?: boolean;
  is_completed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  subject_id: string;
  created_by?: string;
  author_name?: string;
  unit_or_module?: string;
  topic?: string;
  question_type: 'SHORT' | 'LONG' | 'MCQ' | 'NUMERICAL' | 'CODE';
  question_text: string;
  answer_text?: string;
  marks: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status: string;
  is_bookmarked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Textbook {
  id: string;
  subject_id: string;
  added_by?: string;
  title: string;
  author: string;
  edition?: string;
  publisher?: string;
  isbn?: string;
  external_url?: string;
  description?: string;
  created_at: string;
}

export interface SubjectProgressDetail {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  semester_id: number;
  total_materials: number;
  completed_materials: number;
  percentage: number;
}

export interface StudentProgress {
  overall_percentage: number;
  total_materials: number;
  completed_materials: number;
  subjects_progress: SubjectProgressDetail[];
}

export interface Bookmark {
  id: string;
  item_type: 'MATERIAL' | 'QUESTION';
  item_id: string;
  created_at: string;
  material?: StudyMaterial;
  question?: Question;
}

export interface HODTransferPendingInvitation {
  has_invitation: boolean;
  invitation?: {
    id: string;
    current_hod_name: string;
    current_hod_email: string;
    initiated_at: string;
    expires_at: string;
    reason?: string;
  };
}

export interface CurrentHODTransferStatus {
  has_pending: boolean;
  request?: {
    id: string;
    target_staff_name: string;
    target_staff_email: string;
    initiated_at: string;
    expires_at: string;
    reason?: string;
  };
}

