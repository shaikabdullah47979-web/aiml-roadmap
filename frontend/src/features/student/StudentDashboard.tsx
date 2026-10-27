import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  StudentProgress, StudyMaterial, Subject
} from '../../types';
import {
  BookOpen, Bookmark, HelpCircle, CheckCircle2,
  Clock, ArrowRight, FileText, Sparkles, Layers,
  Compass, Eye
} from 'lucide-react';
import { Badge, CategoryBadge } from '../../components/Badge';
import { TiltCard } from '../../components/3d/TiltCard';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [recentMaterials, setRecentMaterials] = useState<StudyMaterial[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const studentSem = user?.semester_id || 1;

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [progRes, matRes, subjRes] = await Promise.all([
        api.get<StudentProgress>('/student/progress'),
        api.get<StudyMaterial[]>(`/materials?semester_id=${studentSem}`),
        api.get<Subject[]>(`/subjects?semester_id=${studentSem}`)
      ]);

      setProgress(progRes.data);
      setRecentMaterials(matRes.data.slice(0, 6));
      setSubjects(subjRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async (materialId: string) => {
    try {
      const res = await api.post<{ bookmarked: boolean }>('/student/bookmarks', {
        item_type: 'MATERIAL',
        item_id: materialId
      });
      setRecentMaterials(recentMaterials.map(m =>
        m.id === materialId ? { ...m, is_bookmarked: res.data.bookmarked } : m
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleProgress = async (materialId: string, currentStatus?: boolean) => {
    try {
      await api.post('/student/progress', {
        material_id: materialId,
        is_completed: !currentStatus
      });
      // Refresh progress
      const pRes = await api.get<StudentProgress>('/student/progress');
      setProgress(pRes.data);
      setRecentMaterials(recentMaterials.map(m =>
        m.id === materialId ? { ...m, is_completed: !currentStatus } : m
      ));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* 3D Glassmorphic Welcome Banner */}
      <div className="relative rounded-3xl p-8 sm:p-10 text-white shadow-2xl bg-gradient-to-r from-brand-950 via-brand-900 to-indigo-950 border border-white/10 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              Semester {studentSem} Learning Hub
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Welcome back, {user?.full_name}!
            </h1>
            <p className="text-sm text-brand-200/90 leading-relaxed font-normal">
              {user?.identifier && (
                <span className="font-mono bg-white/15 px-2.5 py-0.5 rounded-lg text-white font-bold mr-2 border border-white/10">
                  Roll: {user.identifier}
                </span>
              )}
              Explore curriculum notes, verify practice answers, and track your topic completion progress.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to={`/semesters/${studentSem}`}
              className="px-6 py-3 text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-brand-600" />
              Semester {studentSem} Notes
            </Link>
            <Link
              to="/questions"
              className="px-6 py-3 text-xs font-bold text-white bg-white/15 hover:bg-white/25 rounded-2xl backdrop-blur-md border border-white/15 transition-all flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              Question Bank
            </Link>
          </div>
        </div>
      </div>

      {/* 3D Progress Tracking Card */}
      <div className="glass-panel rounded-3xl p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Semester {studentSem} Completion Tracker
            </h2>
            <p className="text-xs text-slate-500 font-medium">Visual progress across authorized course materials</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-brand-600">{progress?.overall_percentage || 0}%</span>
            <span className="text-xs text-slate-400 block font-semibold">
              {progress?.completed_materials || 0} of {progress?.total_materials || 0} Topics Checked Off
            </span>
          </div>
        </div>

        {/* 3D Illuminated Progress Bar */}
        <div className="w-full bg-slate-200/60 rounded-full h-3.5 p-0.5 shadow-inner overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-600 via-indigo-500 to-purple-500 h-2.5 rounded-full shadow-md shadow-brand-500/30 transition-all duration-700 ease-out"
            style={{ width: `${progress?.overall_percentage || 0}%` }}
          />
        </div>

        {/* Per-Subject Breakdown with 3D Depth */}
        {progress?.subjects_progress && progress.subjects_progress.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {progress.subjects_progress.map((subj) => (
              <TiltCard key={subj.subject_id} maxTilt={6} scale={1.02}>
                <div className="p-4 rounded-2xl glass-panel glass-panel-hover space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200/50">
                      {subj.subject_code}
                    </span>
                    <span className="text-xs font-black text-brand-600">{subj.percentage}%</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm truncate">{subj.subject_name}</h4>
                  <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-brand-600 h-1.5 rounded-full"
                      style={{ width: `${subj.percentage}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 text-right font-medium">
                    {subj.completed_materials}/{subj.total_materials} completed
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        )}
      </div>

      {/* 3D Subjects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Subjects in Semester {studentSem}</h2>
          <Link to={`/semesters/${studentSem}`} className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
            View All Subjects <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((s) => (
            <TiltCard key={s.id} maxTilt={8} scale={1.02}>
              <Link
                to={`/semesters/${studentSem}`}
                className="block h-full p-6 rounded-3xl glass-panel glass-panel-hover space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-brand-50 text-brand-700 border border-brand-200/60">
                    {s.code}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{s.credits} Credits</span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-lg group-hover:text-brand-600 transition-colors">
                  {s.name}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {s.description || 'Comprehensive curriculum units & notes.'}
                </p>
                <div className="pt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 font-medium">
                  <span>{s.materials_count} Resources</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-brand-600" />
                </div>
              </Link>
            </TiltCard>
          ))}
        </div>
      </div>

      {/* Recently Published Notes for My Semester */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Recent Study Materials</h2>
          <span className="text-xs text-slate-500 font-medium">Verified by department faculty</span>
        </div>

        {recentMaterials.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-3xl text-slate-500 text-sm">
            No study materials have been published for Semester {studentSem} yet.
          </div>
        ) : (
          <div className="glass-panel rounded-3xl overflow-hidden divide-y divide-slate-100">
            {recentMaterials.map((m) => (
              <div key={m.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/80 transition-colors">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={m.category} />
                    <span className="text-xs font-bold text-slate-700">{m.subject_name}</span>
                    {m.topic_or_unit && <span className="text-xs text-slate-400 font-medium">({m.topic_or_unit})</span>}
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">{m.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>By {m.uploader_name}</span>
                    <span>Format: <strong className="uppercase">{m.file_type}</strong></span>
                    <span>{(m.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleProgress(m.id, m.is_completed)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                      m.is_completed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                    title={m.is_completed ? 'Mark Incomplete' : 'Mark Completed'}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${m.is_completed ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="hidden sm:inline">{m.is_completed ? 'Completed' : 'Mark Done'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleBookmark(m.id)}
                    className={`p-2.5 rounded-xl border transition-all ${
                      m.is_bookmarked
                        ? 'bg-amber-50 text-amber-600 border-amber-300 shadow-sm'
                        : 'bg-white text-slate-400 border-slate-200 hover:text-amber-500'
                    }`}
                    title="Bookmark Note"
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>

                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-800 hover:to-brand-700 rounded-xl shadow-md shadow-brand-600/25 transition-all flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Open Document
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
