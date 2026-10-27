import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Compass,
  BookOpen,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  Sparkles,
  Menu,
  X,
  Bookmark,
} from 'lucide-react';
import { Badge } from './Badge';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [setupNeeded, setSetupNeeded] = useState(false);

  useEffect(() => {
    // Check if initial HOD setup is needed
    api.get<{ setup_needed: boolean }>('/auth/setup-status')
      .then((res) => setSetupNeeded(res.data.setup_needed))
      .catch(() => {});
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (role === 'HOD') return '/hod';
    if (role === 'STAFF') return '/staff';
    return '/student';
  };

  const getRoleBadgeVariant = () => {
    if (role === 'HOD') return 'primary';
    if (role === 'STAFF') return 'info';
    return 'success';
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/60 shadow-sm shadow-slate-900/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and Brand Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 group-hover:scale-105 group-hover:shadow-brand-500/40 transition-all">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-slate-900 tracking-tight text-lg">
                AI/ML<span className="text-brand-600">Roadmap</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200/60 rounded-full">
                Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/semesters"
              className={`text-sm font-semibold transition-colors ${
                location.pathname.startsWith('/semesters')
                  ? 'text-brand-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semesters 1–8
            </Link>
            <Link
              to="/questions"
              className={`text-sm font-semibold transition-colors ${
                location.pathname.startsWith('/questions')
                  ? 'text-brand-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Question Bank
            </Link>
            {isAuthenticated && role === 'STUDENT' && (
              <Link
                to="/bookmarks"
                className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/bookmarks'
                    ? 'text-brand-600 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                Bookmarks
              </Link>
            )}
          </div>

          {/* Action / Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {setupNeeded && !isAuthenticated && (
              <Link
                to="/setup"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-800 bg-amber-50/90 border border-amber-300 rounded-xl hover:bg-amber-100 shadow-sm transition-all animate-pulse"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Setup HOD
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/90 border border-slate-200 shadow-sm hover:border-brand-300 hover:shadow text-slate-800 transition-all"
                >
                  <LayoutDashboard className="w-4 h-4 text-brand-600" />
                  <span className="text-sm font-bold">{user?.full_name}</span>
                  <Badge variant={getRoleBadgeVariant()}>{role}</Badge>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-800 hover:to-brand-700 rounded-xl shadow-md shadow-brand-600/25 hover:shadow-lg transition-all"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-3">
          <Link
            to="/semesters"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
          >
            Semesters 1–8
          </Link>
          <Link
            to="/questions"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
          >
            Question Bank
          </Link>
          {isAuthenticated && (
            <Link
              to={getDashboardPath()}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-bold text-brand-600 bg-brand-50 rounded-xl"
            >
              My Dashboard ({role})
            </Link>
          )}
          {setupNeeded && !isAuthenticated && (
            <Link
              to="/setup"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-amber-700 bg-amber-50 rounded-xl"
            >
              First-Time HOD Setup
            </Link>
          )}
          <div className="pt-2 border-t border-slate-100">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-base font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2.5 text-base font-bold text-white bg-brand-600 rounded-xl shadow-md"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
