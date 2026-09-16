import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Eager: landing + auth (first things a visitor sees)
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import OnboardingPage from '../pages/OnboardingPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';

// Lazy: everything else loads on demand
const Dashboard = lazy(() => import('../pages/Dashboard'));
const QueuePage = lazy(() => import('../pages/QueuePage'));
const DoctorQueuePage = lazy(() => import('../pages/DoctorQueuePage'));
const DoctorsPage = lazy(() => import('../pages/DoctorsPage'));
const DisplayQueuePage = lazy(() => import('../pages/DisplayQueuePage'));
const BookAppointmentPage = lazy(() => import('../pages/BookAppointmentPage'));
const DoctorProfilePage = lazy(() => import('../pages/DoctorProfilePage'));
const PatientProfilePage = lazy(() => import('../pages/PatientProfilePage'));
const MedicalRecordsPage = lazy(() => import('../pages/MedicalRecordsPage'));
const HospitalsPage = lazy(() => import('../pages/HospitalsPage'));
const HospitalDetailsPage = lazy(() => import('../pages/HospitalDetailsPage'));
const SymptomCheckerPage = lazy(() => import('../pages/SymptomCheckerPage'));
const EmergencyPage = lazy(() => import('../pages/EmergencyPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

import AppLayout from '../components/layout/AppLayout';

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mx-auto mb-3"></div>
        <p className="text-slate-500 text-sm font-medium">Loading...</p>
      </div>
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

  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* Public Landing Page & Auth */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />} />
      <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />} />
      <Route path="/onboarding" element={isAuthenticated ? <OnboardingPage /> : <Navigate to="/login" replace />} />

      {/* Public: anyone can view doctors list and individual queues */}
      <Route path="/doctors" element={<DoctorsPage />} />
      <Route path="/queue/:doctorId" element={<QueuePage />} />
      <Route path="/display/:doctorId" element={<DisplayQueuePage />} />

      {/* Public: Symptom Checker & Emergency */}
      <Route path="/symptom-checker" element={<SymptomCheckerPage />} />
      <Route path="/emergency" element={<EmergencyPage />} />

      {/* ── All authenticated routes go through AppLayout (shared nav + footer) ── */}
      <Route element={<AppLayout />}>
        
        {/* Dashboard — the main authenticated home */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['patient', 'admin', 'reception', 'doctor']}>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Hospitals Directory */}
        <Route path="/hospitals" element={<HospitalsPage />} />
        <Route path="/hospital/:id" element={<HospitalDetailsPage />} />

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
      </Route>

      {/* 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}

export default AppRouter;
