import React from 'react';
import { Compass, ShieldCheck, Database, BookOpen, Layers } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-white tracking-tight text-lg">
                AI/ML<span className="text-brand-400">Roadmap</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Academic learning and resource management portal for Artificial Intelligence & Machine Learning engineering students. Organized semester-wise from Semester 1 through Semester 8.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Server-Enforced RBAC
              </span>
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-indigo-400" /> PostgreSQL & SQLAlchemy
              </span>
            </div>
          </div>

          {/* Quick Academic Links */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Academic Structure
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/semesters" className="hover:text-white transition-colors">
                  Semesters 1 to 8
                </a>
              </li>
              <li>
                <a href="/questions" className="hover:text-white transition-colors">
                  Important Questions Bank
                </a>
              </li>
              <li>
                <span className="text-slate-500">Class Notes & Lab Manuals</span>
              </li>
              <li>
                <span className="text-slate-500">Textbook References</span>
              </li>
            </ul>
          </div>

          {/* Portal Roles */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Authorized Roles
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Head of Department (HOD)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Department Staff / Faculty</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>AI/ML Engineering Students</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AI/ML Academic Resource Management System. All academic data preserved.</p>
          <p className="mt-2 sm:mt-0">Built with React, TypeScript, Tailwind CSS & FastAPI.</p>
        </div>
      </div>
    </footer>
  );
};

