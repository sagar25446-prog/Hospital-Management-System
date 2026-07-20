import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import Dashboard from '../pages/Dashboard';
import QueuePage from '../pages/QueuePage';
import DoctorQueuePage from '../pages/DoctorQueuePage';
import DoctorsPage from '../pages/DoctorsPage';
import DisplayQueuePage from '../pages/DisplayQueuePage';
import BookAppointmentPage from '../pages/BookAppointmentPage';
import DoctorProfilePage from '../pages/DoctorProfilePage';
import PatientProfilePage from '../pages/PatientProfilePage';
import MedicalRecordsPage from '../pages/MedicalRecordsPage';
import NotFoundPage from '../pages/NotFoundPage';

import LandingPage from '../pages/LandingPage';

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
  );
}

export default AppRouter;
