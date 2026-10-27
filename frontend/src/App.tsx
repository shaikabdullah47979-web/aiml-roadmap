import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SetupWizardPage } from './pages/SetupWizardPage';
import { SemesterExplorerPage } from './features/student/SemesterExplorerPage';
import { QuestionBankPage } from './features/student/QuestionBankPage';
import { BookmarksPage } from './features/student/BookmarksPage';

// Role Dashboards
import { HODDashboard } from './features/hod/HODDashboard';
import { StaffDashboard } from './features/staff/StaffDashboard';
import { StudentDashboard } from './features/student/StudentDashboard';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/setup" element={<SetupWizardPage />} />
              <Route path="/semesters" element={<SemesterExplorerPage />} />
              <Route path="/semesters/:semesterId" element={<SemesterExplorerPage />} />
              <Route path="/questions" element={<QuestionBankPage />} />

              {/* Protected Role-Specific Dashboards */}
              <Route
                path="/hod/*"
                element={
                  <ProtectedRoute allowedRoles={['HOD']}>
                    <HODDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/staff/*"
                element={
                  <ProtectedRoute allowedRoles={['STAFF', 'HOD']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/student/*"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'HOD']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bookmarks"
                element={
                  <ProtectedRoute>
                    <BookmarksPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

