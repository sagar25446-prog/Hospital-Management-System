import { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMe } from '../api/auth.api';
import { getQueueHistory, getAppointmentHistory } from '../api/patients.api';
import { getEstimate } from '../api/queue.api';
import { getDashboard, getQueues, getDoctorsWorkload, createStaff, listStaff } from '../api/admin.api';
import { ErrorMessage } from '../components/common';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Activity, Clock, Calendar, ChevronRight, Users, LayoutDashboard, Search, FileText, LogOut, CalendarPlus, BellRing, UserCog, Stethoscope, Mail, Lock, UserPlus, Shield } from 'lucide-react';
import AdminStaffManager from './AdminStaffManager';
import { listDoctors } from '../api/doctors.api';

function getTodayDateStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function PatientDashboardContent() {
  const { user, setUser } = useAuth();
  const [patientId, setPatientId] = useState(null);
  const [queueHistory, setQueueHistory] = useState(null);
  const [appointmentHistory, setAppointmentHistory] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasNotified, setHasNotified] = useState(false);

  const fetchPatientId = useCallback(async () => {
    if (user?.role !== 'patient') return;
    if (user?.profile?.id) {
      setPatientId(user.profile.id);
      return;
    }
    try {
      const me = await getMe();
      setUser(me);
      if (me?.profile?.id) setPatientId(me.profile.id);
      else setError('Patient profile not found');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load your profile');
    } finally {
      setLoading(false);
    }
  }, [user?.role, user?.profile?.id, setUser]);

  useEffect(() => {
    fetchPatientId();
  }, [fetchPatientId]);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    (async () => {
      try {
        const today = getTodayDateStr();
        const [queueRes, appointmentRes] = await Promise.all([
          getQueueHistory(patientId, { limit: 10, offset: 0 }),
          getAppointmentHistory(patientId, { limit: 5, offset: 0 }),
        ]);
        if (cancelled) return;
        setQueueHistory(Array.isArray(queueRes) ? queueRes : []);
        setAppointmentHistory(Array.isArray(appointmentRes) ? appointmentRes : []);
        const queueList = Array.isArray(queueRes) ? queueRes : [];
        const latestQueue = queueList[0];
        const isCurrent =
          latestQueue &&
          latestQueue.queue_date === today &&
          ['waiting', 'called', 'serving'].includes(latestQueue.status);
        if (isCurrent && latestQueue.doctor_id) {
          try {
            const est = await getEstimate(latestQueue.doctor_id, {
              tokenNumber: latestQueue.token_number,
              date: latestQueue.queue_date,
            });
            if (!cancelled) setEstimate(est);
          } catch {
            if (!cancelled) setEstimate(null);
          }
        } else if (!cancelled) {
          setEstimate(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Failed to load your data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [patientId]);

  // Handle Smart Notification
  useEffect(() => {
    if (estimate && estimate.peopleAhead != null && estimate.peopleAhead <= 3 && !hasNotified) {
      setHasNotified(true);
      // Play a subtle notification chime
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio autoplay blocked', e));
      } catch (e) {
        // Ignore audio errors
      }
      // Request browser notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Q-Care Alert', {
          body: `It's almost your turn! There are only ${estimate.peopleAhead} people ahead of you.`,
          icon: '/vite.svg'
        });
      }
    }
  }, [estimate, hasNotified]);

  if (user?.role !== 'patient') return null;

  const patientName =
    user?.profile &&
    [user.profile.first_name, user.profile.last_name].filter(Boolean).join(' ');
  const today = getTodayDateStr();
  const latestQueue = queueHistory?.[0];
  const isCurrentQueue =
    latestQueue &&
    latestQueue.queue_date === today &&
    ['waiting', 'called', 'serving'].includes(latestQueue.status);
  const latestAppointment = appointmentHistory?.[0];
  const doctorName =
    latestQueue &&
    [latestQueue.doctor_first_name, latestQueue.doctor_last_name].filter(Boolean).join(' ');
  const doctorId = latestQueue?.doctor_id;

  if (loading && !queueHistory && !appointmentHistory) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Activity className="h-10 w-10 text-brand-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium tracking-wide">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <header className="mb-8 pt-4">
        <h1 className="text-3xl font-display font-bold text-dark">Patient Portal</h1>
        {patientName && (
          <p className="text-slate-500 mt-2 text-lg">
            Welcome back, <span className="font-bold text-brand-700">{patientName}</span>
          </p>
        )}
      </header>

      {error && <ErrorMessage message={error} />}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h2 className="flex items-center text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
          <Activity className="h-4 w-4 mr-2" /> Live Status
        </h2>

        {/* Smart Alert Banner */}
        <AnimatePresence>
          {estimate && estimate.peopleAhead != null && estimate.peopleAhead <= 3 && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start shadow-sm"
            >
              <div className="bg-amber-100 p-2 rounded-full mr-3 shrink-0 animate-pulse">
                <BellRing className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-amber-800 font-bold text-sm">Action Required</h3>
                <p className="text-amber-700 text-sm mt-0.5">
                  {estimate.peopleAhead === 0 
                    ? "You're next! Please proceed to the doctor's room immediately."
                    : `Please head to the waiting area. There are only ${estimate.peopleAhead} people ahead of you.`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-brand-500/10 border-2 border-transparent hover:border-brand-100">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
          
          {!latestQueue ? (
            <div className="text-center py-6">
               <div className="inline-flex items-center justify-center p-4 bg-gray-50 rounded-full mb-4">
                 <FileText className="h-6 w-6 text-gray-400" />
               </div>
               <p className="text-gray-500">You don't have any queue history.</p>
            </div>
          ) : isCurrentQueue ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              <div>
                <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider mb-2">Current Token</p>
                <div className="flex items-baseline space-x-2">
                   <p className="text-5xl font-display font-bold text-gray-900">#{latestQueue.token_number}</p>
                </div>
                {doctorName && (
                  <p className="text-gray-600 mt-3 font-medium flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" /> Dr. {doctorName}
                  </p>
                )}
                <div className="flex items-center mt-2 text-gray-500">
                   <Clock className="h-4 w-4 mr-2 text-blue-500" />
                   {estimate != null && estimate.estimatedMinutes != null
                     ? estimate.estimatedMinutes === 0
                       ? <span className="text-blue-600 font-bold">You're next! Please head to the room.</span>
                       : <span>Est. wait: <strong className="text-gray-800">~{estimate.estimatedMinutes} min</strong></span>
                     : <span>Est. wait: Calculating...</span>}
                </div>
              </div>
              
              {doctorId && (
                <Link to={`/queue/${doctorId}`} className="shrink-0">
                  <button className="w-full sm:w-auto btn-premium">
                    View Live Queue
                  </button>
                </Link>
              )}
            </div>
          ) : (
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
               <div>
                  <p className="text-gray-500 font-medium mb-1">No active queue token for today.</p>
                  {doctorName && (
                    <p className="text-sm text-gray-400">Last visited: Dr. {doctorName}</p>
                  )}
               </div>
               {doctorId && (
                 <Link to={`/queue/${doctorId}`} className="shrink-0">
                   <button className="w-full sm:w-auto px-5 py-2.5 bg-white border-2 border-gray-100 text-gray-700 font-semibold rounded-xl hover:border-brand-200 hover:text-brand-600 transition-colors">
                     View Doctor's Queue
                   </button>
                 </Link>
               )}
             </div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-10">
        <h2 className="flex items-center text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
          <Calendar className="h-4 w-4 mr-2" /> Recent Appointment
        </h2>
        
        <div className="glass-panel p-6 sm:p-8 transition-all hover:shadow-md">
          {!latestAppointment ? (
            <div className="text-center py-6">
               <p className="text-gray-500">No appointments scheduled.</p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                 <p className="font-display font-bold text-xl text-gray-900 mb-1">
                   Dr. {[latestAppointment.doctor_first_name, latestAppointment.doctor_last_name]
                     .filter(Boolean)
                     .join(' ') || 'Doctor'}
                 </p>
                 <div className="flex items-center text-sm text-gray-500 mb-3 font-medium">
                   <Calendar className="h-4 w-4 mr-1.5 text-gray-400" /> 
                   {latestAppointment.appointment_date}
                   {latestAppointment.start_time && <><span className="mx-2 text-gray-300">•</span><Clock className="h-4 w-4 mr-1.5 text-gray-400" />{latestAppointment.start_time}</>}
                 </div>
                 <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gray-50 text-gray-600 uppercase tracking-wider border border-gray-100">
                   {latestAppointment.status}
                 </span>
              </div>
              
              {latestAppointment.doctor_id && (
                <Link to={`/queue/${latestAppointment.doctor_id}`}>
                  <button className="h-12 w-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-100 transition-all shadow-sm">
                     <ChevronRight className="h-5 w-5 ml-0.5" />
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [workload, setWorkload] = useState(null);
  const [queues, setQueues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (activeTab !== 'overview') return;
    setLoading(true);
    setError('');

    (async () => {
      try {
        const [dashboardRes, workloadRes, queuesRes] = await Promise.all([
          getDashboard(),
          getDoctorsWorkload(),
          getQueues(),
        ]);
        if (cancelled) return;
        setDashboard(dashboardRes ?? null);
        setWorkload(Array.isArray(workloadRes) ? workloadRes : []);
        setQueues(Array.isArray(queuesRes) ? queuesRes : []);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Failed to load admin dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <header className="mb-6 pt-4">
        <h1 className="text-3xl font-display font-bold text-dark">Hospital Administration</h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">Manage hospital operations and view live statistics</p>
      </header>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200/60 mb-8 pb-px">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-[2px] flex items-center ${activeTab === 'overview' ? 'border-brand-600 text-brand-700 bg-white shadow-sm rounded-t-xl' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <Activity className="h-4 w-4 mr-2" /> Live Overview
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-[2px] flex items-center ${activeTab === 'staff' ? 'border-brand-600 text-brand-700 bg-white shadow-sm rounded-t-xl' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <UserCog className="h-4 w-4 mr-2" /> Manage Doctors
        </button>
        <button
          onClick={() => setActiveTab('reception')}
          className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-[2px] flex items-center ${activeTab === 'reception' ? 'border-brand-600 text-brand-600 bg-brand-50/50 rounded-t-xl' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Users className="h-4 w-4 mr-2" /> Reception Staff
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {activeTab === 'staff' && <AdminStaffManager />}

      {activeTab === 'reception' && <ReceptionStaffPanel />}

      {activeTab === 'overview' && (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Activity className="h-10 w-10 text-brand-500 animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Compiling hospital metrics...</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl transform translate-x-8 -translate-y-8" />
                  <div className="flex items-center space-x-3 mb-4">
                     <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-sm"><Users className="h-6 w-6" /></div>
                     <p className="font-bold text-slate-600">Total Patients</p>
                  </div>
                  <p className="text-5xl font-display font-bold text-dark tabular-nums">{dashboard?.totalPatientsToday ?? 0}</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl transform translate-x-8 -translate-y-8" />
                  <div className="flex items-center space-x-3 mb-4">
                     <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shadow-sm"><Calendar className="h-6 w-6" /></div>
                     <p className="font-bold text-slate-600">Appointments</p>
                  </div>
                  <p className="text-5xl font-display font-bold text-dark tabular-nums">{dashboard?.totalAppointmentsToday ?? 0}</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-xl transform translate-x-8 -translate-y-8" />
                  <div className="flex items-center space-x-3 mb-4">
                     <div className="p-3 bg-brand-50 text-brand-600 rounded-xl shadow-sm"><Clock className="h-6 w-6" /></div>
                     <p className="font-bold text-slate-600">Avg. Wait Time</p>
                  </div>
                  <p className="text-5xl font-display font-bold text-dark tabular-nums">
                    {(dashboard?.averageWaitingTimeMinutes ?? 0).toFixed(1)} <span className="text-2xl text-slate-400 font-medium">min</span>
                  </p>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="glass-panel overflow-hidden flex flex-col h-full !p-0">
                  <div className="px-6 py-5 border-b border-slate-100/50 bg-white/40 flex justify-between items-center">
                     <h2 className="font-bold text-dark flex items-center"><Activity className="h-5 w-5 mr-2 text-brand-600" /> Live Queues</h2>
                  </div>
                  <div className="overflow-x-auto flex-grow">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 tracking-wider">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Doctor</th>
                          <th className="px-6 py-3 font-semibold text-center">Current</th>
                          <th className="px-6 py-3 font-semibold text-center">Waiting</th>
                        </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(!queues || queues.length === 0) ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No active queues</td></tr>
                ) : (
                  queues.map((row) => (
                    <tr key={row.doctorId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/queue/${row.doctorId}`} className="text-gray-900 font-medium hover:text-brand-600 transition-colors">
                          Dr. {row.doctorName || '—'}
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">{row.specialization ?? '—'}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-brand-50 text-brand-600 font-bold tabular-nums">
                          {row.currentTokenNumber ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-600 tabular-nums">{row.activeCount ?? 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="glass-panel overflow-hidden flex flex-col h-full !p-0">
          <div className="px-6 py-5 border-b border-slate-100/50 bg-white/40 flex justify-between items-center">
             <h2 className="font-bold text-dark flex items-center"><User className="h-5 w-5 mr-2 text-medical-600" /> Doctor Workload today</h2>
          </div>
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">Doctor</th>
                  <th className="px-6 py-3 font-semibold text-right">Patients Today</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(!workload || workload.length === 0) ? (
                  <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-500">No data today</td></tr>
                ) : (
                  workload.map((row) => (
                    <tr key={row.doctorId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">Dr. {[row.firstName, row.lastName].filter(Boolean).join(' ') || '—'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{row.specialization ?? '—'}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="font-semibold text-gray-700 tabular-nums bg-gray-100 px-3 py-1 rounded-full">{row.patientCountToday ?? 0}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReceptionDashboardContent() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await listDoctors({ limit: 100 });
        setDoctors(data.results || data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load doctors');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Activity className="h-10 w-10 text-brand-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading hospital doctors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <header className="mb-8 pt-4">
        <h1 className="text-3xl font-display font-bold text-dark">Reception Desk</h1>
        <p className="text-slate-500 mt-2 text-lg">Manage hybrid queue tokens and walk-in appointments</p>
      </header>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {doctors.map(doc => (
           <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card flex items-center justify-between hover:shadow-lg transition-all group">
             <div className="flex items-center">
               <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-600 to-medical-500 text-white flex items-center justify-center font-bold mr-4 shadow-sm group-hover:scale-105 transition-transform">
                 {doc.first_name?.[0]}{doc.last_name?.[0]}
               </div>
               <div>
                 <p className="font-bold text-dark text-lg">Dr. {doc.first_name} {doc.last_name}</p>
                 <p className="text-sm font-medium text-brand-600 flex items-center mt-1">
                   <Stethoscope className="h-4 w-4 mr-1.5" /> {doc.specialization}
                 </p>
               </div>
             </div>
             <Link to={`/doctor/queue/${doc.id}`} className="bg-brand-50 text-brand-700 border border-brand-100 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-600 hover:text-white transition-all shadow-sm">
               Manage Queue
             </Link>
           </motion.div>
        ))}
        {doctors.length === 0 && (
           <div className="col-span-full text-center py-12 text-slate-500 font-medium">No doctors registered yet.</div>
        )}
      </div>
    </div>
  );
}

function ReceptionStaffPanel() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', first_name: '', last_name: '', role: 'reception' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await listStaff();
        setStaffList(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setCreating(true);
    try {
      const result = await createStaff(formData);
      setStaffList(prev => [result, ...prev]);
      setSuccessMsg(`${result.role} account created for ${formData.email}`);
      setFormData({ email: '', password: '', first_name: '', last_name: '', role: 'reception' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create staff');
    } finally { setCreating(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold text-dark">Reception & Admin Staff</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-premium py-2 px-5 text-sm"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Staff
        </button>
      </div>

      {error && <ErrorMessage message={error} />}
      {successMsg && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 text-sm font-bold shadow-sm">
          ✓ {successMsg}
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="glass-panel overflow-hidden space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">First Name *</label>
                <input type="text" required value={formData.first_name} onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))} className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name *</label>
                <input type="text" required value={formData.last_name} onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))} className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="email" required value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="password" required minLength={8} value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="Min 8 characters" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Role *</label>
              <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors">
                <option value="reception">Reception</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" disabled={creating} className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Activity className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Shield className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p>No reception or admin staff created yet.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden !p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/50 text-xs uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Email</th>
                <th className="px-6 py-4 font-bold">Role</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {staffList.map(s => (
                <tr key={s.id} className="hover:bg-white/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-dark">{s.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm border ${s.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-medical-50 text-medical-700 border-medical-100'}`}>
                      {s.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${s.is_active ? 'text-green-600' : 'text-red-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${s.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const { user, loading, logout } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <Activity className="h-10 w-10 text-brand-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading your profile...</p>
      </div>
    );
  }

  const role = user?.role;

  return (
    <div className="min-h-screen bg-surface relative overflow-hidden font-sans">
      {/* Decorative gradient header background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-premium opacity-60 pointer-events-none z-0"></div>
      
      <header className="relative z-10 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between glass-panel mx-4 mt-4 mb-8">
        <div className="flex items-center space-x-3">
           <div className="h-10 w-10 bg-gradient-to-br from-brand-600 to-medical-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
             <Activity className="h-6 w-6" />
           </div>
           <span className="font-display font-bold text-2xl text-dark tracking-tight">Q-Care</span>
        </div>
        <div className="flex items-center gap-3">
          {role === 'patient' && (
            <>
              <Link
                to="/medical-records"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-5 py-2 rounded-full transition-all shadow-sm"
              >
                <FileText className="h-4 w-4 text-brand-500" />
                Medical Records
              </Link>
              <Link
                to="/book"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-medical-500 hover:from-brand-500 hover:to-medical-400 px-5 py-2 rounded-full transition-all shadow-md shadow-brand-500/20"
              >
                <CalendarPlus className="h-4 w-4" />
                Book Appointment
              </Link>
            </>
          )}
          <div className="flex items-center space-x-3 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
             <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
             <span className="text-sm font-semibold text-dark capitalize">{role} Account</span>
             {role === 'patient' && (
               <Link to="/profile" className="text-xs ml-2 text-brand-600 hover:text-brand-800 font-medium border-l border-slate-200 pl-3">
                 Profile
               </Link>
             )}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600 bg-white border border-slate-200 hover:border-red-100 px-4 py-2 rounded-full shadow-sm transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>
      
      <main className="px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl mx-auto">
        {role === 'patient' && <PatientDashboardContent />}
        {role === 'admin' && <AdminDashboardContent />}
        {role === 'reception' && <ReceptionDashboardContent />}
        {role === 'doctor' && <Navigate to="/doctor/queue" replace />}
        {!role && (
          <div className="flex flex-col items-center justify-center py-20 text-center glass-card max-w-md mx-auto">
             <Activity className="h-16 w-16 text-brand-300 mb-6" />
             <p className="text-slate-800 font-bold text-xl mb-2">Account Unrecognized</p>
             <p className="text-slate-500">Please try logging in again to access the portal.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
