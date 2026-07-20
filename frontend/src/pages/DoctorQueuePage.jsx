import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getQueue, updateCurrentToken, resetQueue } from '../api/queue.api';
import { getMe } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import { usePolling } from '../hooks/usePolling';
import { ErrorMessage, QRCodeDisplay } from '../components/common';
import WritePrescriptionModal from '../components/common/WritePrescriptionModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Bell, Users, RefreshCw, ChevronRight, CheckCircle2, ShieldAlert, LogOut, Settings, FileText } from 'lucide-react';

export default function DoctorQueuePage() {
  const { doctorId: urlDoctorId } = useParams();
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [doctorId, setDoctorId] = useState(urlDoctorId || null);
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [nextLoading, setNextLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [prescriptionModal, setPrescriptionModal] = useState({ open: false, patientId: null, patientName: '', appointmentId: null });

  const fetchDoctorId = useCallback(async () => {
    if (urlDoctorId) {
      setDoctorId(urlDoctorId);
      return;
    }
    if (user?.role !== 'doctor') return;
    if (user?.profile?.id) {
      setDoctorId(user.profile.id);
      return;
    }
    try {
      const me = await getMe();
      setUser(me);
      if (me?.profile?.id) setDoctorId(me.profile.id);
      else {
        setError('Doctor profile not found');
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load your profile');
      setLoading(false);
    }
  }, [user?.role, user?.profile?.id, setUser, urlDoctorId]);

  const fetchQueue = useCallback(async () => {
    if (!doctorId) return;
    try {
      setError('');
      const data = await getQueue(doctorId);
      setQueue(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchDoctorId();
  }, [fetchDoctorId]);

  useEffect(() => {
    if (doctorId) {
      setLoading(true);
      fetchQueue();
    }
  }, [doctorId, fetchQueue]);

  usePolling(fetchQueue, 3000, { pauseWhenHidden: true }); // Faster polling for doctor side

  const handleNextPatient = async () => {
    if (!doctorId || queue == null) return;
    const next = (queue.currentTokenNumber ?? 0) + 1;
    setActionError('');
    setNextLoading(true);
    try {
      await updateCurrentToken(doctorId, next);
      setActionError('');
      await fetchQueue();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Could not advance queue. Try again.');
    } finally {
      setNextLoading(false);
    }
  };

  const handleResetQueue = async () => {
    if (!doctorId) return;
    if (!window.confirm('Reset the queue to zero? This cannot be undone for today.')) return;
    setActionError('');
    setResetLoading(true);
    try {
      await resetQueue(doctorId);
      setActionError('');
      await fetchQueue();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Could not reset queue. Try again.');
    } finally {
      setResetLoading(false);
    }
  };

  if (user === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Activity className="animate-spin h-10 w-10 text-brand-500" />
      </main>
    );
  }

  if (user?.role !== 'doctor') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center p-8 bg-white rounded-3xl shadow-lg border border-red-100 max-w-sm">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 font-medium">Restricted Access</p>
          <p className="text-sm text-gray-500 mt-2">You must be logged in as a doctor to view this control panel.</p>
        </div>
      </main>
    );
  }

  if (loading && !queue) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
         <div className="flex flex-col items-center">
            <Activity className="h-10 w-10 text-brand-500 animate-spin mb-4" />
            <p className="text-gray-500 font-medium tracking-wide">Connecting to control panel...</p>
         </div>
      </main>
    );
  }

  if ((error && !queue) || (!doctorId && !loading)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-red-100">
          <ErrorMessage message={error || 'Unable to load your queue.'} />
        </div>
      </main>
    );
  }

  const doctorName = user?.profile
    ? [user.profile.first_name, user.profile.last_name].filter(Boolean).join(' ') || 'Doctor'
    : 'Doctor';
  const currentToken = queue?.currentTokenNumber ?? 0;
  const tokens = queue?.tokens ?? [];
  const upcoming = tokens.filter((t) => t.token_number > currentToken);
  const anyActionLoading = nextLoading || resetLoading;

  return (
    <main className="min-h-screen bg-gradient-premium p-4 md:p-8" aria-label="Queue control">
      <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Primary Control Panel */}
        <div className="flex-1 flex flex-col space-y-8">
          <header className="flex justify-between items-end pb-4 border-b border-gray-200">
             <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Queue Control</h1>
                <p className="text-gray-500 font-medium mt-1 tracking-wide">Dr. {doctorName}</p>
             </div>
             <div className="flex items-center gap-3">
               <div className="hidden sm:flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active</span>
               </div>
               {(user?.role === 'reception' || user?.role === 'admin') && (
                 <button
                   onClick={() => navigate('/')}
                   className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-brand-600 px-4 py-2 rounded-xl border border-gray-200 bg-white shadow-sm transition-colors"
                 >
                   <ChevronRight className="h-4 w-4 rotate-180" />
                   <span>Back to Dashboard</span>
                 </button>
               )}
               {user?.role === 'doctor' && (
                 <>
                   <Link to="/doctor/profile" className="flex items-center justify-center p-2 text-gray-500 hover:text-brand-600 bg-white border border-gray-200 rounded-xl shadow-sm transition-colors" title="Settings">
                     <Settings className="h-5 w-5" />
                   </Link>
                   <button
                     onClick={logout}
                     className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-red-600 px-4 py-2 rounded-xl border border-gray-200 bg-white shadow-sm transition-colors"
                   >
                     <LogOut className="h-4 w-4" />
                     <span className="hidden sm:inline">Sign out</span>
                   </button>
                 </>
               )}
             </div>
          </header>

          {(error || actionError) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <ErrorMessage message={actionError || error} />
            </motion.div>
          )}
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 md:p-12 flex flex-col items-center text-center relative overflow-hidden group"
          >
             {/* Background pulse effect for active queue */}
             <div className="absolute inset-0 bg-brand-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
             
             <p className="text-xs font-bold text-brand-600 tracking-[0.2em] uppercase mb-4 flex items-center relative z-10">
                <Bell className="h-4 w-4 mr-2 text-brand-500" /> Serving Token
             </p>
             
             <AnimatePresence mode="popLayout">
                <motion.p
                  key={currentToken}
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="text-[6rem] md:text-[8rem] font-display font-black text-gray-900 leading-none tracking-tighter tabular-nums mb-8 relative z-10"
                >
                  {currentToken === 0 ? '—' : currentToken}
                </motion.p>
             </AnimatePresence>

             <button
               onClick={handleNextPatient}
               disabled={anyActionLoading}
               className="w-full relative z-10 group overflow-hidden bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold text-lg py-5 rounded-2xl shadow-xl shadow-gray-900/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 outline-none focus:ring-4 focus:ring-gray-300"
             >
                {nextLoading ? (
                   <Activity className="h-6 w-6 animate-spin text-brand-400" />
                ) : (
                   <>
                     <span>Call Next Patient</span>
                     <ChevronRight className="h-6 w-6 group-hover:translate-x-1 border border-transparent rounded-full transition-transform" />
                   </>
                )}
             </button>
          </motion.div>

          {/* Secondary Actions */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center text-gray-500 text-sm font-medium">
                <Users className="h-4 w-4 mr-2" />
                {upcoming.length} patient{upcoming.length !== 1 && 's'} remaining
             </div>
             
             <button
               onClick={handleResetQueue}
               disabled={anyActionLoading}
               className="flex items-center text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
             >
                <RefreshCw className={`h-4 w-4 mr-2 ${resetLoading ? 'animate-spin' : ''}`} />
                Reset Queue
             </button>
          </div>

          {/* Write Prescription Button */}
          {currentToken > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <button
                onClick={() => {
                  const servingPatient = tokens.find(t => t.token_number === currentToken);
                  if (servingPatient) {
                    setPrescriptionModal({
                      open: true,
                      patientId: servingPatient.patient_id,
                      patientName: [servingPatient.patient_first_name, servingPatient.patient_last_name].filter(Boolean).join(' '),
                      appointmentId: servingPatient.appointment_id || null,
                    });
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm shadow-blue-600/20"
              >
                <FileText className="h-5 w-5" /> Write Prescription
              </button>
            </motion.div>
          )}
        </div>

        {/* Right Column: Upcoming & Tools */}
        <div className="lg:w-[350px] shrink-0 flex flex-col space-y-6">
           <div className="glass-panel p-6 flex-grow flex flex-col min-h-[400px]">
              <h2 className="text-lg font-bold text-gray-900 flex items-center mb-6">
                 Queue List 
                 <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs tabular-nums">{upcoming.length}</span>
              </h2>

              <div className="flex-grow flex flex-col">
                 <AnimatePresence initial={false}>
                    {upcoming.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-grow flex flex-col justify-center items-center text-gray-400 p-6 text-center">
                         <CheckCircle2 className="h-12 w-12 text-gray-200 mb-4" />
                         <p className="font-medium">Queue is empty</p>
                         <p className="text-sm mt-1 text-gray-400">You're all caught up!</p>
                      </motion.div>
                    ) : (
                      <div className="space-y-3">
                         {upcoming.map((t, index) => (
                           <motion.div
                             layout
                             initial={{ opacity: 0, x: -20 }}
                             animate={{ opacity: 1, x: 0 }}
                             exit={{ opacity: 0, x: 20 }}
                             key={t.id}
                             transition={{ duration: 0.2 }}
                             className={`flex items-center p-4 rounded-2xl transition-all ${index === 0 ? 'bg-brand-50 border border-brand-100 shadow-sm' : 'bg-gray-50 border border-transparent'}`}
                           >
                             <div className={`h-10 w-10 flex shrink-0 items-center justify-center rounded-xl font-bold tabular-nums text-lg ${index === 0 ? 'bg-white text-brand-600 shadow-sm' : 'bg-gray-200 text-gray-600'}`}>
                               {t.token_number}
                             </div>
                             <div className="ml-4 truncate">
                                <p className={`font-semibold truncate ${index === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {[t.patient_first_name, t.patient_last_name].filter(Boolean).join(' ') || 'Anonymous'}
                                </p>
                                {index === 0 && <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mt-1">Up Next</p>}
                             </div>
                           </motion.div>
                         ))}
                      </div>
                    )}
                 </AnimatePresence>
              </div>
           </div>
           
           {doctorId && (
             <div className="glass-panel p-6 flex flex-col items-center text-center">
                <p className="text-sm font-semibold text-gray-600 mb-4">Patient Check-in QR</p>
                <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm inline-block">
                  <QRCodeDisplay doctorId={doctorId} showUrl />
                </div>
                <p className="text-xs text-gray-400 mt-4 leading-relaxed px-4">Patients can scan this code using their phone to easily join your queue.</p>
             </div>
           )}
        </div>
      </div>

      <WritePrescriptionModal
        isOpen={prescriptionModal.open}
        appointmentId={prescriptionModal.appointmentId}
        patientId={prescriptionModal.patientId}
        patientName={prescriptionModal.patientName}
        onClose={() => setPrescriptionModal({ open: false, patientId: null, patientName: '', appointmentId: null })}
        onSuccess={() => { /* Could show a toast here */ }}
      />
    </main>
  );
}
