import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Subject, Semester, StudyMaterial,
  CurrentHODTransferStatus
} from '../../types';
import {
  Layers, Users, CheckCircle, Clock, BookOpen,
  Plus, Trash2, Edit3, ShieldAlert, AlertCircle,
  FileText, ExternalLink, Key, Search, Eye
} from 'lucide-react';
import { Badge, StatusBadge, CategoryBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const HODDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'approvals' | 'subjects' | 'staff' | 'transfer' | 'audit'>('approvals');

  // Approvals State
  const [pendingMaterials, setPendingMaterials] = useState<StudyMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  // Subjects State
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ code: '', name: '', description: '', credits: 4, assigned_staff_ids: [] as string[] });

  // Staff State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ full_name: '', email: '', password: '', identifier: '', assigned_subject_ids: [] as string[] });

  // HOD Transfer State
  const [transferStatus, setTransferStatus] = useState<CurrentHODTransferStatus>({ has_pending: false });
  const [targetStaffId, setTargetStaffId] = useState('');
  const [hodPassword, setHodPassword] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferMsg, setTransferMsg] = useState({ text: '', isError: false });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [matRes, semRes, staffRes, transRes] = await Promise.all([
        api.get<StudyMaterial[]>('/materials?status_filter=SUBMITTED'),
        api.get<Semester[]>('/semesters'),
        api.get<any[]>('/users/staff'),
        api.get<CurrentHODTransferStatus>('/hod/transfer/current')
      ]);

      setPendingMaterials(matRes.data);
      setSemesters(semRes.data);
      setStaffList(staffRes.data);
      setTransferStatus(transRes.data);

      // Load subjects for selected semester
      const subjRes = await api.get<Subject[]>(`/subjects?semester_id=${selectedSemester}`);
      setSubjects(subjRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSemesterChange = async (semId: number) => {
    setSelectedSemester(semId);
    try {
      const res = await api.get<Subject[]>(`/subjects?semester_id=${semId}`);
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Approval actions
  const handleApproveMaterial = async (id: string) => {
    try {
      await api.post(`/materials/${id}/review`, { action: 'APPROVED' });
      setPendingMaterials(pendingMaterials.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Approval failed.');
    }
  };

  const handleOpenReject = (m: StudyMaterial) => {
    setSelectedMaterial(m);
    setRejectionFeedback('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedMaterial || !rejectionFeedback.trim()) return;
    try {
      await api.post(`/materials/${selectedMaterial.id}/review`, {
        action: 'REJECTED',
        feedback: rejectionFeedback.trim()
      });
      setPendingMaterials(pendingMaterials.filter((m) => m.id !== selectedMaterial.id));
      setRejectModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Rejection failed.');
    }
  };

  // Subject actions
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/subjects', {
        semester_id: selectedSemester,
        code: newSubject.code,
        name: newSubject.name,
        description: newSubject.description,
        credits: newSubject.credits,
        assigned_staff_ids: newSubject.assigned_staff_ids
      });
      setSubjectModalOpen(false);
      setNewSubject({ code: '', name: '', description: '', credits: 4, assigned_staff_ids: [] });
      handleSemesterChange(selectedSemester);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create subject.');
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete '${name}'? This cannot be undone.`)) return;
    try {
      await api.delete(`/subjects/${id}`);
      handleSemesterChange(selectedSemester);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete subject.');
    }
  };

  // Staff actions
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users/staff', newStaff);
      setStaffModalOpen(false);
      setNewStaff({ full_name: '', email: '', password: '', identifier: '', assigned_subject_ids: [] });
      const staffRes = await api.get<any[]>('/users/staff');
      setStaffList(staffRes.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create staff member.');
    }
  };

  // HOD Transfer actions
  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferMsg({ text: '', isError: false });
    try {
      const res = await api.post('/hod/transfer/initiate', {
        target_staff_id: targetStaffId,
        hod_password: hodPassword,
        reason: transferReason
      });
      setTransferStatus({
        has_pending: true,
        request: {
          id: res.data.id,
          target_staff_name: res.data.target_staff_name,
          target_staff_email: '',
          initiated_at: res.data.initiated_at,
          expires_at: res.data.expires_at,
          reason: res.data.reason
        }
      });
      setHodPassword('');
      setTransferReason('');
      setTransferMsg({ text: 'HOD transfer request sent successfully! The faculty member must log in to accept.', isError: false });
    } catch (err: any) {
      setTransferMsg({ text: err.response?.data?.detail || 'Transfer initiation failed.', isError: true });
    }
  };

  const handleCancelTransfer = async () => {
    if (!confirm('Are you sure you want to cancel the pending HOD transfer request?')) return;
    try {
      await api.post('/hod/transfer/cancel');
      setTransferStatus({ has_pending: false });
      setTransferMsg({ text: 'Pending HOD transfer request was cancelled.', isError: false });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel transfer.');
    }
  };

  // Load audit logs on tab click
  const loadAuditLogs = async () => {
    try {
      const res = await api.get<any[]>('/audit');
      setAuditLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">HOD Academic Administration</h1>
            <Badge variant="primary">HOD Role</Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Department oversight, curriculum management, faculty provisioning, and material approval queues.
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{pendingMaterials.length}</div>
            <div className="text-xs text-slate-500 font-medium">Pending Approvals</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{staffList.length}</div>
            <div className="text-xs text-slate-500 font-medium">Faculty Members</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">8</div>
            <div className="text-xs text-slate-500 font-medium">Semesters Active</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {transferStatus.has_pending ? '1 Pending' : 'Stable'}
            </div>
            <div className="text-xs text-slate-500 font-medium">Leadership Status</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'approvals'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Approval Queue ({pendingMaterials.length})
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'subjects'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Subjects & Semesters
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'staff'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Staff Directory ({staffList.length})
        </button>

        <button
          onClick={() => setActiveTab('transfer')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'transfer'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Key className="w-4 h-4" />
          Transfer HOD Role
        </button>

        <button
          onClick={() => {
            setActiveTab('audit');
            loadAuditLogs();
          }}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Audit Trail
        </button>
      </div>

      {/* TAB 1: APPROVAL QUEUE */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Study Materials Awaiting Review</h2>
            <span className="text-xs text-slate-500">Materials approved here become instantly visible to students.</span>
          </div>

          {pendingMaterials.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">Approval Queue is Clear</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                No study materials or question papers currently awaiting review.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
              {pendingMaterials.map((m) => (
                <div key={m.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryBadge category={m.category} />
                      <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                        {m.subject_name} (Sem {m.semester_id})
                      </span>
                      {m.topic_or_unit && (
                        <span className="text-xs text-slate-500">Topic: {m.topic_or_unit}</span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{m.title}</h3>
                    {m.description && <p className="text-sm text-slate-600 leading-relaxed">{m.description}</p>}

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>Uploaded by: <strong className="text-slate-700">{m.uploader_name}</strong></span>
                      <span>Format: <strong className="uppercase">{m.file_type}</strong></span>
                      <span>Size: {(m.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center gap-1.5 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview File
                    </a>
                    <button
                      onClick={() => handleOpenReject(m)}
                      className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => handleApproveMaterial(m.id)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
                    >
                      Approve & Publish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUBJECTS & SEMESTERS */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Semester selector pill buttons */}
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((semId) => (
                <button
                  key={semId}
                  onClick={() => handleSemesterChange(semId)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    selectedSemester === semId
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Sem {semId}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSubjectModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add Subject to Sem {selectedSemester}
            </button>
          </div>

          {/* Subjects Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base">Semester {selectedSemester} Subjects</h3>
              <span className="text-xs text-slate-500">{subjects.length} Subjects Defined</span>
            </div>

            {subjects.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm">No subjects created for Semester {selectedSemester} yet.</p>
                <button
                  onClick={() => setSubjectModalOpen(true)}
                  className="text-xs font-semibold text-brand-600 hover:underline"
                >
                  Create the first subject now
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {subjects.map((s) => (
                  <div key={s.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                          {s.code}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base">{s.name}</h4>
                        <span className="text-xs text-slate-400">({s.credits} Credits)</span>
                      </div>
                      {s.description && <p className="text-xs text-slate-500 max-w-xl">{s.description}</p>}
                      <div className="text-xs text-slate-500 pt-1">
                        Assigned Faculty: {s.assigned_staff?.length ? s.assigned_staff.map(a => a.full_name).join(', ') : 'Unassigned'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteSubject(s.id, s.name)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STAFF DIRECTORY */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Department Faculty Members</h2>
            <button
              onClick={() => setStaffModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Provision New Faculty Account
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
            {staffList.map((s) => (
              <div key={s.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-base">{s.full_name}</h4>
                    {s.identifier && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        {s.identifier}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{s.email}</p>
                  {s.assigned_subjects?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {s.assigned_subjects.map((sub: any) => (
                        <span key={sub.id} className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                          {sub.code}: {sub.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-400">
                  Joined {new Date(s.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HOD ROLE TRANSFER */}
      {activeTab === 'transfer' && (
        <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="inline-flex p-2.5 rounded-xl bg-purple-50 text-purple-700 mb-1">
              <Key className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Transfer Head of Department (HOD) Role</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Initiate a verified role handover to an active faculty member without an Admin Panel. The chosen faculty member must log in with their credentials to accept the position.
            </p>
          </div>

          {transferMsg.text && (
            <div className={`p-4 rounded-xl text-sm flex items-start gap-2.5 ${transferMsg.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{transferMsg.text}</span>
            </div>
          )}

          {transferStatus.has_pending ? (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Transfer Request Pending Acceptance</span>
                <Badge variant="warning">Awaiting Faculty</Badge>
              </div>
              <p className="text-sm text-amber-900 leading-relaxed">
                An invitation was sent to <strong>{transferStatus.request?.target_staff_name}</strong>. Upon their acceptance, your HOD role will transition and your previous account will be archived.
              </p>
              <div className="text-xs text-amber-700">
                Expires: {new Date(transferStatus.request?.expires_at || '').toLocaleString()}
              </div>
              <button
                onClick={handleCancelTransfer}
                className="px-4 py-2 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-300 rounded-xl transition-colors"
              >
                Cancel Pending Transfer
              </button>
            </div>
          ) : (
            <form onSubmit={handleInitiateTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select Eligible Faculty Member
                </label>
                <select
                  required
                  value={targetStaffId}
                  onChange={(e) => setTargetStaffId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">-- Choose Staff Member --</option>
                  {staffList.filter(s => s.is_active).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.email}) {s.identifier ? `- ID: ${s.identifier}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Reason or Transition Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. End of 3-year term rotation."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Current HOD Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your current password to authorize"
                  value={hodPassword}
                  onChange={(e) => setHodPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 text-sm font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md transition-all"
                >
                  Send HOD Transfer Request
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Departmental Audit Trail</h3>
            <span className="text-xs text-slate-500">Immutable security log</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between text-xs hover:bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 uppercase px-1.5 py-0.5 bg-slate-100 rounded">
                      {log.action}
                    </span>
                    <span className="text-slate-600 font-medium">{log.actor_name} ({log.actor_role})</span>
                  </div>
                  <p className="text-slate-600">{log.details}</p>
                </div>
                <span className="text-slate-400 shrink-0 ml-4">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Reject Material with Feedback */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Request Changes / Reject Material"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Provide actionable feedback for <strong>{selectedMaterial?.uploader_name}</strong> to revise '{selectedMaterial?.title}'.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Feedback / Reason for Rejection *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Please update Unit 2 diagrams or include correct question numbers."
              value={rejectionFeedback}
              onChange={(e) => setRejectionFeedback(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={!rejectionFeedback.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Add Subject */}
      <Modal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        title={`Add Subject to Semester ${selectedSemester}`}
      >
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Subject Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CS501 / AI302"
              value={newSubject.code}
              onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Deep Learning & Neural Networks"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Credits
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={newSubject.credits}
              onChange={(e) => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) || 4 })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Course overview and unit outline"
              value={newSubject.description}
              onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSubjectModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
            >
              Save Subject
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Provision Staff */}
      <Modal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        title="Provision Faculty / Staff Account"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Faculty Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Prof. Ananya Iyer"
              value={newStaff.full_name}
              onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Faculty Email *
            </label>
            <input
              type="email"
              required
              placeholder="ananya.iyer@college.edu"
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Employee ID
            </label>
            <input
              type="text"
              placeholder="e.g. FAC-204"
              value={newStaff.identifier}
              onChange={(e) => setNewStaff({ ...newStaff, identifier: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Password *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={newStaff.password}
              onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStaffModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
            >
              Create Faculty Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

