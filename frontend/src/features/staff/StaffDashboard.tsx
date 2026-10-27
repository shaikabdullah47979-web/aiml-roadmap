import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  StudyMaterial, Subject, Question, Textbook,
  HODTransferPendingInvitation
} from '../../types';
import {
  UploadCloud, Plus, FileText, HelpCircle, Users,
  BookOpen, Trash2, CheckCircle2, AlertCircle, Eye,
  Sparkles, Key, AlertTriangle, ArrowRight
} from 'lucide-react';
import { Badge, StatusBadge, CategoryBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const StaffDashboard: React.FC = () => {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'materials' | 'questions' | 'students' | 'textbooks'>('materials');

  // HOD Transfer Invitation Check
  const [transferInvitation, setTransferInvitation] = useState<HODTransferPendingInvitation>({ has_invitation: false });
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [staffPasswordConfirm, setStaffPasswordConfirm] = useState('');
  const [acceptError, setAcceptError] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);

  // Materials State
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    subject_id: '',
    title: '',
    category: 'CLASS_NOTES',
    description: '',
    topic_or_unit: '',
    is_draft: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    subject_id: '',
    unit_or_module: '',
    topic: '',
    question_type: 'SHORT',
    question_text: '',
    answer_text: '',
    marks: 5,
    difficulty: 'MEDIUM',
  });

  // Students State
  const [students, setStudents] = useState<any[]>([]);
  const [studentSemesterFilter, setStudentSemesterFilter] = useState<number>(1);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    full_name: '',
    email: '',
    password: '',
    identifier: '',
    semester_id: 1,
  });

  // Textbooks State
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [textbookModalOpen, setTextbookModalOpen] = useState(false);
  const [newTextbook, setNewTextbook] = useState({
    subject_id: '',
    title: '',
    author: '',
    edition: '',
    publisher: '',
    isbn: '',
    external_url: '',
    description: '',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const [transRes, matRes, subjRes, qRes, tbRes, stuRes] = await Promise.all([
        api.get<HODTransferPendingInvitation>('/hod/transfer/pending'),
        api.get<StudyMaterial[]>('/materials'),
        api.get<Subject[]>('/subjects'),
        api.get<Question[]>('/questions'),
        api.get<Textbook[]>('/textbooks'),
        api.get<any[]>(`/users/students?semester_id=${studentSemesterFilter}`)
      ]);

      setTransferInvitation(transRes.data);
      setMaterials(matRes.data);
      setSubjects(subjRes.data);
      setQuestions(qRes.data);
      setTextbooks(tbRes.data);
      setStudents(stuRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSemesterStudentChange = async (semId: number) => {
    setStudentSemesterFilter(semId);
    try {
      const res = await api.get<any[]>(`/users/students?semester_id=${semId}`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Material upload handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to upload (Max 50MB).');
      return;
    }
    setUploadError('');
    setIsUploading(true);

    const formData = new FormData();
    formData.append('subject_id', uploadData.subject_id);
    formData.append('title', uploadData.title);
    formData.append('category', uploadData.category);
    if (uploadData.description) formData.append('description', uploadData.description);
    if (uploadData.topic_or_unit) formData.append('topic_or_unit', uploadData.topic_or_unit);
    formData.append('is_draft', uploadData.is_draft ? 'true' : 'false');
    formData.append('file', selectedFile);

    try {
      await api.post('/materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadModalOpen(false);
      setSelectedFile(null);
      setUploadData({ subject_id: '', title: '', category: 'CLASS_NOTES', description: '', topic_or_unit: '', is_draft: false });
      const matRes = await api.get<StudyMaterial[]>('/materials');
      setMaterials(matRes.data);
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this study material?')) return;
    try {
      await api.delete(`/materials/${id}`);
      setMaterials(materials.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Delete failed.');
    }
  };

  // Question create handler
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/questions', newQuestion);
      setQuestionModalOpen(false);
      setNewQuestion({ subject_id: '', unit_or_module: '', topic: '', question_type: 'SHORT', question_text: '', answer_text: '', marks: 5, difficulty: 'MEDIUM' });
      const qRes = await api.get<Question[]>('/questions');
      setQuestions(qRes.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save question.');
    }
  };

  // Student create handler
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users/students', newStudent);
      setStudentModalOpen(false);
      setNewStudent({ full_name: '', email: '', password: '', identifier: '', semester_id: studentSemesterFilter });
      handleSemesterStudentChange(studentSemesterFilter);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create student.');
    }
  };

  // Textbook create handler
  const handleCreateTextbook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/textbooks', newTextbook);
      setTextbookModalOpen(false);
      setNewTextbook({ subject_id: '', title: '', author: '', edition: '', publisher: '', isbn: '', external_url: '', description: '' });
      const tbRes = await api.get<Textbook[]>('/textbooks');
      setTextbooks(tbRes.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add textbook.');
    }
  };

  // HOD Transfer Accept Handler
  const handleAcceptHOD = async () => {
    if (!transferInvitation.invitation) return;
    setAcceptError('');
    setIsAccepting(true);

    try {
      const res = await api.post(`/hod/transfer/${transferInvitation.invitation.id}/accept`, {
        staff_password: staffPasswordConfirm,
      });

      // Update tokens and role in AuthContext
      login(res.data);
      window.location.href = '/hod';
    } catch (err: any) {
      setAcceptError(err.response?.data?.detail || 'Failed to accept HOD role.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectHOD = async () => {
    if (!transferInvitation.invitation) return;
    if (!confirm('Are you sure you want to decline the HOD role invitation?')) return;
    try {
      await api.post(`/hod/transfer/${transferInvitation.invitation.id}/reject`);
      setTransferInvitation({ has_invitation: false });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Action failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HOD Transfer Pending Banner */}
      {transferInvitation.has_invitation && transferInvitation.invitation && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-purple-500/30 animate-pulse">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-700/60 text-purple-200 text-xs font-semibold">
              <Key className="w-3.5 h-3.5" />
              Leadership Transition Request
            </div>
            <h3 className="text-xl font-black tracking-tight">
              Invitation to Assume Head of Department (HOD) Role
            </h3>
            <p className="text-sm text-purple-200 leading-relaxed max-w-2xl">
              Current HOD <strong>{transferInvitation.invitation.current_hod_name}</strong> has nominated you as the new Department HOD.
              {transferInvitation.invitation.reason && ` Note: "${transferInvitation.invitation.reason}"`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRejectHOD}
              className="px-4 py-2 text-xs font-semibold text-purple-200 hover:text-white bg-purple-800/40 hover:bg-purple-800/80 rounded-xl transition-colors"
            >
              Decline
            </button>
            <button
              onClick={() => {
                setStaffPasswordConfirm('');
                setAcceptError('');
                setAcceptModalOpen(true);
              }}
              className="px-5 py-2.5 text-xs font-bold text-purple-950 bg-white hover:bg-purple-50 rounded-xl shadow-lg transition-all"
            >
              Accept Leadership Handover
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Resource Workspace</h1>
            <Badge variant="info">Faculty Role</Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Upload study materials, manage important question sets, and provision accounts for your enrolled students.
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/30 transition-all self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Study Material
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'materials'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          My Uploaded Notes ({materials.length})
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'questions'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Question Bank ({questions.length})
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'students'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Provision Student Logins
        </button>

        <button
          onClick={() => setActiveTab('textbooks')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'textbooks'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Textbook References
        </button>
      </div>

      {/* TAB 1: STUDY MATERIALS */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">My Study Materials</h2>
            <span className="text-xs text-slate-500">Supports PDF, DOCX, PPTX, TXT, Images, ZIP up to 50MB</span>
          </div>

          {materials.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
              <UploadCloud className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No Materials Uploaded Yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Share lecture notes, lab manuals, or syllabus guides with students.
              </p>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-brand-600 hover:underline"
              >
                Upload your first resource
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
              {materials.map((m) => (
                <div key={m.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryBadge category={m.category} />
                      <StatusBadge status={m.status} />
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                        {m.subject_name}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{m.title}</h3>
                    {m.description && <p className="text-sm text-slate-600">{m.description}</p>}

                    {m.status === 'REJECTED' && m.rejection_reason && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                        <strong>HOD Feedback:</strong> {m.rejection_reason}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Format: <strong className="uppercase">{m.file_type}</strong></span>
                      <span>Size: {(m.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>Added: {new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </a>
                    <button
                      onClick={() => handleDeleteMaterial(m.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUESTION BANK */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Subject Question Bank</h2>
            <button
              onClick={() => setQuestionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Question & Answer
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
            {questions.map((q) => (
              <div key={q.id} className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {q.question_type} ({q.marks} Marks)
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {q.difficulty}
                    </span>
                    {q.unit_or_module && (
                      <span className="text-xs text-slate-500 font-medium">Unit: {q.unit_or_module}</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">By {q.author_name}</span>
                </div>

                <h4 className="font-bold text-slate-900 text-base">{q.question_text}</h4>
                {q.answer_text && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700 leading-relaxed">
                    <strong className="text-xs uppercase tracking-wider text-slate-500 block mb-1">Verified Answer:</strong>
                    {q.answer_text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT PROVISIONING */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((semId) => (
                <button
                  key={semId}
                  onClick={() => handleSemesterStudentChange(semId)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    studentSemesterFilter === semId
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Sem {semId} Students
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setNewStudent({ ...newStudent, semester_id: studentSemesterFilter });
                setStudentModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Provision Student for Sem {studentSemesterFilter}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
            <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>Student Roll No & Name</span>
              <span>Semester & Account Status</span>
            </div>

            {students.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No students enrolled in Semester {studentSemesterFilter} yet.
              </div>
            ) : (
              students.map((stu) => (
                <div key={stu.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                        {stu.identifier}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base">{stu.full_name}</h4>
                    </div>
                    <p className="text-xs text-slate-500">{stu.email}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="neutral">Semester {stu.semester_id}</Badge>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${stu.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {stu.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: TEXTBOOKS */}
      {activeTab === 'textbooks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recommended Textbooks</h2>
            <button
              onClick={() => setTextbookModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Textbook Reference
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {textbooks.map((tb) => (
              <div key={tb.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-slate-900 text-base">{tb.title}</h4>
                  {tb.isbn && <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{tb.isbn}</span>}
                </div>
                <p className="text-xs text-slate-600">Author: <strong>{tb.author}</strong> {tb.edition && `(${tb.edition})`}</p>
                {tb.publisher && <p className="text-xs text-slate-500">Publisher: {tb.publisher}</p>}
                {tb.description && <p className="text-xs text-slate-600 leading-relaxed">{tb.description}</p>}
                {tb.external_url && (
                  <a
                    href={tb.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline pt-2"
                  >
                    Library / Publisher Link <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Upload Study Material */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Educational Resource"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {uploadError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Subject *
            </label>
            <select
              required
              value={uploadData.subject_id}
              onChange={(e) => setUploadData({ ...uploadData, subject_id: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}: {s.name} (Sem {s.semester_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Resource Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Unit 3 Deep Learning Backpropagation Notes"
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Material Category *
            </label>
            <select
              required
              value={uploadData.category}
              onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="CLASS_NOTES">Class Notes</option>
              <option value="DETAILED_NOTES">Detailed Subject Notes</option>
              <option value="IMPORTANT_QUESTIONS">Important Questions</option>
              <option value="QUESTION_BANK">Question Bank</option>
              <option value="PREVIOUS_YEAR_PAPERS">Previous Year Papers</option>
              <option value="MODEL_PAPERS">Model Question Papers</option>
              <option value="LAB_MANUAL">Lab Manual</option>
              <option value="PRACTICAL_FILES">Practical Files & Assignments</option>
              <option value="SYLLABUS">Syllabus Document</option>
              <option value="OTHER">Other Learning Resource</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Unit / Module (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Unit 2: Artificial Neural Networks"
              value={uploadData.topic_or_unit}
              onChange={(e) => setUploadData({ ...uploadData, topic_or_unit: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Brief summary of what this document covers"
              value={uploadData.description}
              onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Attach File (PDF, DOCX, PPTX, TXT, Images, ZIP up to 50MB) *
            </label>
            <input
              type="file"
              required
              accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg,.zip"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm disabled:opacity-50"
            >
              {isUploading ? 'Uploading to Storage...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Accept HOD Role Handover */}
      <Modal
        isOpen={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        title="Confirm HOD Role Acceptance"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-2">
            <p className="font-semibold">Important Security Notice:</p>
            <p>
              By entering your password, you confirm acceptance of the Head of Department (HOD) role.
              The outgoing HOD's privileges will be revoked immediately and their account will be safely archived. All historical academic data remains intact.
            </p>
          </div>

          {acceptError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {acceptError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Enter Your Faculty Password to Verify *
            </label>
            <input
              type="password"
              required
              placeholder="Enter your current password"
              value={staffPasswordConfirm}
              onChange={(e) => setStaffPasswordConfirm(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setAcceptModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleAcceptHOD}
              disabled={isAccepting || !staffPasswordConfirm}
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-sm disabled:opacity-50"
            >
              {isAccepting ? 'Verifying & Promoting...' : 'Confirm & Accept Role'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Add Question */}
      <Modal
        isOpen={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        title="Add Question to Question Bank"
      >
        <form onSubmit={handleCreateQuestion} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Subject *
            </label>
            <select
              required
              value={newQuestion.subject_id}
              onChange={(e) => setNewQuestion({ ...newQuestion, subject_id: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Type
              </label>
              <select
                value={newQuestion.question_type}
                onChange={(e) => setNewQuestion({ ...newQuestion, question_type: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="SHORT">Short Answer</option>
                <option value="LONG">Long Answer</option>
                <option value="MCQ">Multiple Choice</option>
                <option value="NUMERICAL">Numerical Problem</option>
                <option value="CODE">Programming / Code</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Marks
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={newQuestion.marks}
                onChange={(e) => setNewQuestion({ ...newQuestion, marks: parseInt(e.target.value) || 5 })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Unit / Module (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Unit 3"
              value={newQuestion.unit_or_module}
              onChange={(e) => setNewQuestion({ ...newQuestion, unit_or_module: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Question Text *
            </label>
            <textarea
              required
              rows={3}
              placeholder="State the mathematical formulation of backpropagation..."
              value={newQuestion.question_text}
              onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Verified Model Answer
            </label>
            <textarea
              rows={4}
              placeholder="Provide complete solution and key steps..."
              value={newQuestion.answer_text}
              onChange={(e) => setNewQuestion({ ...newQuestion, answer_text: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setQuestionModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
            >
              Save Question
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Provision Student */}
      <Modal
        isOpen={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        title={`Provision Student Login for Semester ${studentSemesterFilter}`}
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Student USN / Roll Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 1MS21AI045"
              value={newStudent.identifier}
              onChange={(e) => setNewStudent({ ...newStudent, identifier: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Student Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Aarav Patel"
              value={newStudent.full_name}
              onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="aarav.patel@student.edu"
              value={newStudent.email}
              onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Login Password *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={newStudent.password}
              onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStudentModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
            >
              Create Student Account
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Add Textbook */}
      <Modal
        isOpen={textbookModalOpen}
        onClose={() => setTextbookModalOpen(false)}
        title="Add Recommended Textbook"
      >
        <form onSubmit={handleCreateTextbook} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Subject *
            </label>
            <select
              required
              value={newTextbook.subject_id}
              onChange={(e) => setNewTextbook({ ...newTextbook, subject_id: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Book Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pattern Recognition and Machine Learning"
              value={newTextbook.title}
              onChange={(e) => setNewTextbook({ ...newTextbook, title: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Author(s) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Christopher M. Bishop"
              value={newTextbook.author}
              onChange={(e) => setNewTextbook({ ...newTextbook, author: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Publisher
              </label>
              <input
                type="text"
                placeholder="e.g. Springer"
                value={newTextbook.publisher}
                onChange={(e) => setNewTextbook({ ...newTextbook, publisher: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ISBN
              </label>
              <input
                type="text"
                placeholder="e.g. 978-0387310732"
                value={newTextbook.isbn}
                onChange={(e) => setNewTextbook({ ...newTextbook, isbn: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Library / Publisher Link
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={newTextbook.external_url}
              onChange={(e) => setNewTextbook({ ...newTextbook, external_url: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setTextbookModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
            >
              Save Textbook
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

