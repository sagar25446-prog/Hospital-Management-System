import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Landing + auth pages are what an anonymous visitor sees first, so they
// stay eager. Everything else (dashboards, PDF generation, video calls) is
// lazy-loaded per-route so a first-time visitor isn't downloading jsPDF or
// html2canvas before they've even logged in.
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const QueuePage = lazy(() => import('../pages/QueuePage'));
const DoctorQueuePage = lazy(() => import('../pages/DoctorQueuePage'));
const DoctorsPage = lazy(() => import('../pages/DoctorsPage'));
const DisplayQueuePage = lazy(() => import('../pages/DisplayQueuePage'));
const BookAppointmentPage = lazy(() => import('../pages/BookAppointmentPage'));
const DoctorProfilePage = lazy(() => import('../pages/DoctorProfilePage'));
const PatientProfilePage = lazy(() => import('../pages/PatientProfilePage'));
const MedicalRecordsPage = lazy(() => import('../pages/MedicalRecordsPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="w-8 h-8 border-2 border-ink-100 border-t-signal-500 rounded-full animate-spin" />
    </div>
  );
}

function AppRouter() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm font-medium">Loading Q-Care...</p>
        </div>
      </div>
    );
  }

  // Role-based home redirect for authenticated users
  function RoleHome() {
    const role = user?.role;
    if (role === 'doctor') return <Navigate to="/doctor/queue" replace />;
    return <Dashboard />;
  }

  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* Public Landing Page & Auth */}
      <Route path="/" element={isAuthenticated ? <RoleHome /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />

      <Route path="/dashboard" element={<Navigate to="/" replace />} />

      {/* Public: anyone can view doctors list and individual queues */}
      <Route path="/doctors" element={<DoctorsPage />} />
      <Route path="/queue/:doctorId" element={<QueuePage />} />
      <Route path="/display/:doctorId" element={<DisplayQueuePage />} />

      {/* Protected: doctor/reception queue control */}
      <Route
        path="/doctor/queue/:doctorId?"
        element={
          <ProtectedRoute allowedRoles={['doctor', 'reception', 'admin']}>
            <DoctorQueuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/profile"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Protected: patient appointment booking */}
      <Route
        path="/book"
        element={
          <ProtectedRoute allowedRoles={['patient', 'reception', 'admin']}>
            <BookAppointmentPage />
          </ProtectedRoute>
        }
      />
      
      {/* Protected: patient profile */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Protected: patient medical records */}
      <Route
        path="/medical-records"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <MedicalRecordsPage />
          </ProtectedRoute>
        }
      />

      {/* 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}

export default AppRouter;
