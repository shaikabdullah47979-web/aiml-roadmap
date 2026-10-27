import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bookmark as BookmarkType } from '../../types';
import {
  Bookmark, Eye, Trash2, BookOpen, HelpCircle,
  FileText, ArrowRight
} from 'lucide-react';
import { CategoryBadge, Badge } from '../../components/Badge';

export const BookmarksPage: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const res = await api.get<BookmarkType[]>('/student/bookmarks');
      setBookmarks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (itemType: string, itemId: string) => {
    try {
      await api.post('/student/bookmarks', {
        item_type: itemType,
        item_id: itemId
      });
      setBookmarks(bookmarks.filter(b => b.item_id !== itemId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Bookmark className="w-7 h-7 text-amber-500 fill-current" />
          My Bookmarked Resources
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Quick access to your saved study materials, important questions, and revision notes.
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="bg-white p-16 text-center rounded-2xl border border-slate-200 space-y-3">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No Bookmarks Saved Yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Click the bookmark icon on any note, lecture slide, or question to save it here for fast revision.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bm) => {
            if (bm.item_type === 'MATERIAL' && bm.material) {
              const m = bm.material;
              return (
                <div key={bm.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={m.category} />
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {m.subject_name}
                      </span>
                      {m.topic_or_unit && <span className="text-xs text-slate-500 font-medium">{m.topic_or_unit}</span>}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{m.title}</h3>
                    {m.description && <p className="text-sm text-slate-600">{m.description}</p>}
                    <div className="text-xs text-slate-400">Saved on {new Date(bm.created_at).toLocaleDateString()}</div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Open Document
                    </a>
                    <button
                      onClick={() => handleRemoveBookmark('MATERIAL', m.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            } else if (bm.item_type === 'QUESTION' && bm.question) {
              const q = bm.question;
              return (
                <div key={bm.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="primary">{q.question_type} ({q.marks} Marks)</Badge>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">{q.difficulty}</span>
                      {q.unit_or_module && <span className="text-xs text-slate-500">Unit: {q.unit_or_module}</span>}
                    </div>
                    <button
                      onClick={() => handleRemoveBookmark('QUESTION', q.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">{q.question_text}</h4>
                  {q.answer_text && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                      <strong>Answer:</strong> {q.answer_text}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

