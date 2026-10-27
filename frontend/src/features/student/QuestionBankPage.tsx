import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Question, Subject } from '../../types';
import {
  HelpCircle, Search, Filter, Bookmark, Eye,
  EyeOff, CheckCircle2, BookOpen
} from 'lucide-react';
import { Badge } from '../../components/Badge';

export const QuestionBankPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedSubjectId, selectedType, selectedDifficulty]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subjRes, qRes] = await Promise.all([
        api.get<Subject[]>('/subjects'),
        api.get<Question[]>(`/questions?${selectedSubjectId ? `subject_id=${selectedSubjectId}&` : ''}${selectedType ? `question_type=${selectedType}&` : ''}${selectedDifficulty ? `difficulty=${selectedDifficulty}&` : ''}`)
      ]);
      setSubjects(subjRes.data);
      setQuestions(qRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleBookmark = async (id: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post<{ bookmarked: boolean }>('/student/bookmarks', {
        item_type: 'QUESTION',
        item_id: id
      });
      setQuestions(questions.map(q => q.id === id ? { ...q, is_bookmarked: res.data.bookmarked } : q));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return q.question_text.toLowerCase().includes(term) || (q.answer_text && q.answer_text.toLowerCase().includes(term)) || (q.topic && q.topic.toLowerCase().includes(term));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Important Questions & Verified Answers
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Faculty-curated exam question bank categorized by marks, difficulty, and unit modules.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search questions, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code}: {s.name}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Question Types</option>
            <option value="SHORT">Short Answer</option>
            <option value="LONG">Long Answer</option>
            <option value="MCQ">Multiple Choice</option>
            <option value="NUMERICAL">Numerical Problem</option>
            <option value="CODE">Programming</option>
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
            No questions found matching your filter criteria.
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary">{q.question_type} ({q.marks} Marks)</Badge>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    q.difficulty === 'HARD' ? 'bg-rose-50 text-rose-700' :
                    q.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {q.difficulty}
                  </span>
                  {q.unit_or_module && (
                    <span className="text-xs text-slate-500 font-medium">Unit: {q.unit_or_module}</span>
                  )}
                  {q.topic && (
                    <span className="text-xs text-slate-400">({q.topic})</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleBookmark(q.id)}
                    className={`p-2 rounded-xl border transition-colors ${
                      q.is_bookmarked
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-white text-slate-400 border-slate-200 hover:text-amber-500'
                    }`}
                    title="Bookmark Question"
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>

              <h3 className="text-slate-900 font-bold text-base leading-relaxed">
                {q.question_text}
              </h3>

              {q.answer_text && (
                <div className="pt-2">
                  <button
                    onClick={() => toggleReveal(q.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    {revealedAnswers[q.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {revealedAnswers[q.id] ? 'Hide Verified Answer' : 'Show Verified Answer'}
                  </button>

                  {revealedAnswers[q.id] && (
                    <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700 leading-relaxed space-y-2">
                      <strong className="text-xs uppercase tracking-wider text-slate-500 block">Verified Solution:</strong>
                      <p className="whitespace-pre-wrap">{q.answer_text}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

