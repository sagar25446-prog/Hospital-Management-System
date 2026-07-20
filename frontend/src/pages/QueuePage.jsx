import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQueue, getEstimate } from '../api/queue.api';
import { usePolling } from '../hooks/usePolling';
import { ErrorMessage } from '../components/common';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, Users, Activity, Bell, Plus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function QueuePage() {
  const { doctorId } = useParams();
  const [queue, setQueue] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(null);
  const { user, isAuthenticated } = useAuth();

  const fetchQueue = useCallback(async () => {
    if (!doctorId) return;
    try {
      setError('');
      const data = await getQueue(doctorId);
      setQueue(data);
      setLastUpdated(new Date());
      const current = data.currentTokenNumber ?? 0;
      const nextToken = current + 1;
      const hasSomeoneAhead = data.tokens?.some((t) => t.token_number > current);
      if (hasSomeoneAhead) {
        try {
          const est = await getEstimate(doctorId, { tokenNumber: nextToken });
          setEstimate(est);
        } catch {
          setEstimate(null);
        }
      } else {
        setEstimate(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  const handleJoinQueue = async () => {
    if (!doctorId || joining) return;
    setJoining(true);
    setError('');
    try {
      const { generateToken } = await import('../api/queue.api');
      const res = await generateToken({ doctorId });
      setJoinSuccess(res.token_number || res.tokenNumber);
      fetchQueue();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to join queue.');
    } finally {
      setJoining(false);
    }
  };

  usePolling(fetchQueue, 5000, { pauseWhenHidden: true });

  if (loading && !queue) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center">
            <Activity className="h-10 w-10 text-brand-500 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading live queue...</p>
        </div>
      </main>
    );
  }

  if (error && !queue) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="glass-card max-w-md w-full p-8 rounded-3xl text-center">
          <ErrorMessage message={error} />
          <Link to="/doctors" className="mt-6 inline-flex items-center text-brand-600 font-medium hover:text-brand-700 transition-colors">
             <ChevronLeft className="h-4 w-4 mr-1" />
             Back to doctors
          </Link>
        </div>
      </main>
    );
  }

  const doctor = queue?.doctor || null;
  const doctorName = doctor
    ? [doctor.first_name, doctor.last_name].filter(Boolean).join(' ') || 'Doctor'
    : 'Doctor';
  const currentToken = queue?.currentTokenNumber ?? 0;
  const tokens = queue?.tokens ?? [];
  const upcoming = tokens.filter((t) => t.token_number > currentToken);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 relative overflow-hidden" aria-label="Queue">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg mx-auto relative z-10">
        <header className="flex items-center justify-between mb-8">
          <Link to="/doctors" className="inline-flex items-center justify-center p-2.5 bg-white text-gray-500 hover:text-brand-600 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md outline-none focus:ring-2 focus:ring-brand-500">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          {lastUpdated && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-xs font-medium text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span>Live sync</span>
            </div>
          )}
        </header>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden"
        >
          <div className="text-center mb-8 relative z-10">
            <h1 className="text-2xl font-display font-bold text-gray-900">Dr. {doctorName}</h1>
            {doctor?.specialization && (
              <p className="text-brand-600 font-medium mt-1">{doctor.specialization}</p>
            )}
            {error && queue && <ErrorMessage message={error} className="mt-4" />}
            
            {/* Join Queue Success Banner */}
            <AnimatePresence>
              {joinSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="font-semibold text-green-800">
                    Joined successfully! Your token is <strong className="text-lg text-green-900">#{joinSuccess}</strong>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Current Serving Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl shadow-gray-900/20 mb-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
             
             <p className="text-gray-400 text-sm font-medium tracking-widest uppercase mb-2 flex items-center justify-center">
                <Bell className="h-4 w-4 mr-2 text-brand-400" />
                Now Serving
             </p>
             
             <div className="h-24 sm:h-32 flex items-center justify-center">
                 <AnimatePresence mode="popLayout">
                    <motion.p
                      key={currentToken}
                      initial={{ opacity: 0, y: -40, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 40, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="text-6xl sm:text-7xl font-display font-bold tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400"
                    >
                      {currentToken === 0 ? '—' : `#${currentToken}`}
                    </motion.p>
                 </AnimatePresence>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <Clock className="h-5 w-5 text-blue-500 mb-2" />
                <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Est. Wait</p>
                <p className="text-lg font-bold text-gray-900">
                  {estimate != null && estimate.estimatedMinutes != null
                    ? `~${estimate.estimatedMinutes} min`
                    : upcoming.length === 0 ? 'No wait' : '—'}
                </p>
             </div>
             <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <Users className="h-5 w-5 text-brand-500 mb-2" />
                <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">In Line</p>
                <p className="text-lg font-bold text-gray-900 tabular-nums">
                  {upcoming.length} patient{upcoming.length !== 1 && 's'}
                </p>
             </div>
         </div>

          {/* Join Queue Action for Patients */}
          {isAuthenticated && user?.role === 'patient' && !joinSuccess && (
            <div className="mb-8">
              <button
                onClick={handleJoinQueue}
                disabled={joining}
                className="w-full relative z-10 group overflow-hidden bg-brand-600 hover:bg-brand-500 disabled:bg-gray-400 text-white font-semibold text-lg py-4 rounded-2xl shadow-xl shadow-brand-500/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                {joining ? (
                   <Activity className="h-6 w-6 animate-spin text-white" />
                ) : (
                   <>
                     <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                     <span>Join Queue Now</span>
                   </>
                )}
              </button>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
              Up Next
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-500 tabular-nums">{upcoming.length}</span>
            </h3>
            
            <div className="space-y-3">
               <AnimatePresence initial={false}>
                  {upcoming.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-gray-50 rounded-2xl p-6 text-center text-gray-500 border border-transparent"
                    >
                      No one else is waiting.
                    </motion.div>
                  ) : (
                    upcoming.map((t, index) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        key={t.id}
                        className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                      >
                        <div className="flex items-center space-x-4">
                           <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center border border-gray-100 shadow-inner">
                             <span className="font-bold text-gray-900 tabular-nums">{t.token_number}</span>
                           </div>
                           <span className="font-medium text-gray-700">
                             {[t.patient_first_name, t.patient_last_name].filter(Boolean).join(' ') || 'Anonymous'}
                           </span>
                        </div>
                        {index === 0 && (
                          <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-brand-100/50">Next</span>
                        )}
                      </motion.div>
                    ))
                  )}
               </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
