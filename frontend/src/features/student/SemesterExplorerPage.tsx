import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Semester, Subject, StudyMaterial } from '../../types';
import {
  Compass, BookOpen, Search, Filter, Eye,
  Bookmark, CheckCircle2, ArrowRight, Layers, FileText
} from 'lucide-react';
import { Badge, CategoryBadge } from '../../components/Badge';

export const SemesterExplorerPage: React.FC = () => {
  const { semesterId } = useParams<{ semesterId?: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const currentSem = parseInt(semesterId || '1') || 1;

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSemesterData();
  }, [currentSem, selectedSubjectId, selectedCategory]);

  const fetchSemesterData = async () => {
    setLoading(true);
    try {
      const [semListRes, subjRes] = await Promise.all([
        api.get<Semester[]>('/semesters'),
        api.get<Subject[]>(`/subjects?semester_id=${currentSem}`)
      ]);

      setSemesters(semListRes.data);
      setSubjects(subjRes.data);

      let matUrl = `/materials?semester_id=${currentSem}`;
      if (selectedSubjectId) matUrl += `&subject_id=${selectedSubjectId}`;
      if (selectedCategory) matUrl += `&category=${selectedCategory}`;

      const matRes = await api.get<StudyMaterial[]>(matUrl);
      setMaterials(matRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async (id: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post<{ bookmarked: boolean }>('/student/bookmarks', {
        item_type: 'MATERIAL',
        item_id: id
      });
      setMaterials(materials.map(m => m.id === id ? { ...m, is_bookmarked: res.data.bookmarked } : m));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleProgress = async (id: string, currentStatus?: boolean) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/student/progress', {
        material_id: id,
        is_completed: !currentStatus
      });
      setMaterials(materials.map(m => m.id === id ? { ...m, is_completed: !currentStatus } : m));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMaterials = materials.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.title.toLowerCase().includes(q) || (m.description && m.description.toLowerCase().includes(q)) || (m.topic_or_unit && m.topic_or_unit.toLowerCase().includes(q));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Semester Selector Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Semester {currentSem} Academic Roadmap
            </h1>
            <p className="text-sm text-slate-600">
              Browse syllabus subjects, faculty lecture notes, lab manuals, and previous year papers.
            </p>
          </div>
        </div>

        {/* 8 Semester Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sNum) => (
            <button
              key={sNum}
              onClick={() => {
                setSelectedSubjectId('');
                setSelectedCategory('');
                navigate(`/semesters/${sNum}`);
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                currentSem === sNum
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>Semester {sNum}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subjects in this Semester */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-600" />
          Subjects Configured for Semester {currentSem} ({subjects.length})
        </h2>

        {subjects.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-sm text-slate-500">
            No subjects have been defined for Semester {currentSem} yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setSelectedSubjectId('')}
              className={`p-4 rounded-xl text-left border transition-all ${
                selectedSubjectId === ''
                  ? 'bg-brand-50 border-brand-300 text-brand-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-sm">All Subjects</div>
              <div className="text-xs text-slate-500 mt-1">{materials.length} total resources</div>
            </button>

            {subjects.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id === selectedSubjectId ? '' : sub.id)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  selectedSubjectId === sub.id
                    ? 'bg-brand-50 border-brand-300 text-brand-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    {sub.code}
                  </span>
                  <span className="text-[11px] text-slate-400">{sub.credits} cr</span>
                </div>
                <h4 className="font-bold text-sm mt-1 truncate">{sub.name}</h4>
                <div className="text-xs text-slate-500 mt-1">{sub.materials_count} materials</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search notes, topics, units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 mr-1" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Resource Categories</option>
            <option value="CLASS_NOTES">Class Notes</option>
            <option value="DETAILED_NOTES">Detailed Notes</option>
            <option value="IMPORTANT_QUESTIONS">Important Questions</option>
            <option value="QUESTION_BANK">Question Bank</option>
            <option value="PREVIOUS_YEAR_PAPERS">Previous Year Papers</option>
            <option value="LAB_MANUAL">Lab Manual</option>
            <option value="SYLLABUS">Syllabus</option>
          </select>
        </div>
      </div>

      {/* Study Materials List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Available Study Materials ({filteredMaterials.length})
          </h2>
          <span className="text-xs text-slate-500">Official Department Repository</span>
        </div>

        {filteredMaterials.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p>No study materials match the selected filters for Semester {currentSem}.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
            {filteredMaterials.map((m) => (
              <div key={m.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge category={m.category} />
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {m.subject_name}
                    </span>
                    {m.topic_or_unit && (
                      <span className="text-xs text-slate-500 font-medium">{m.topic_or_unit}</span>
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

                <div className="flex items-center gap-2 shrink-0">
                  {isAuthenticated && role === 'STUDENT' && (
                    <>
                      <button
                        onClick={() => handleToggleProgress(m.id, m.is_completed)}
                        className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          m.is_completed
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        title={m.is_completed ? 'Mark Incomplete' : 'Mark Completed'}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${m.is_completed ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="hidden sm:inline">{m.is_completed ? 'Completed' : 'Mark Done'}</span>
                      </button>

                      <button
                        onClick={() => handleToggleBookmark(m.id)}
                        className={`p-2 rounded-xl border transition-colors ${
                          m.is_bookmarked
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-white text-slate-400 border-slate-200 hover:text-amber-500'
                        }`}
                        title="Bookmark"
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </>
                  )}

                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
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

