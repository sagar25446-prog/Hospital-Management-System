import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listDoctors } from '../api/doctors.api';
import { bookAppointment, getPatientAppointments, cancelAppointment } from '../api/appointments.api';
import { getMe } from '../api/auth.api';
import { listPatients } from '../api/patients.api';
import { createOrder } from '../api/payment.api';
import { ErrorMessage, RazorpayCheckout } from '../components/common';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, User, ChevronLeft, CheckCircle2,
  X, Activity, Stethoscope, FileText, CreditCard, ShieldCheck, Search,
} from 'lucide-react';

function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hh = parseInt(h, 10);
  return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
}

const STATUS_STYLE = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-100',
  completed: 'bg-green-50 text-green-700 border-green-100',
  cancelled: 'bg-red-50 text-red-700 border-red-100',
  no_show:   'bg-yellow-50 text-yellow-700 border-yellow-100',
};

export default function BookAppointmentPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const isStaff = ['reception', 'admin'].includes(user?.role);

  const [patientId, setPatientId] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [date, setDate] = useState(today());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  // Resolve patient profile (for patient role only)
  useEffect(() => {
    if (isStaff) { setLoading(false); return; }
    (async () => {
      let pid = user?.profile?.id;
      if (!pid) {
        try {
          const me = await getMe();
          setUser(me);
          pid = me?.profile?.id;
        } catch { /* handled in auth intercept */ }
      }
      if (pid) {
        setPatientId(pid);
        setPatientName([user?.profile?.first_name, user?.profile?.last_name].filter(Boolean).join(' '));
      }
    })();
  }, [user, setUser, isStaff]);

  // Search patients for staff
  useEffect(() => {
    if (!isStaff || patientSearch.length < 2) { setPatientResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await listPatients({ search: patientSearch, limit: 8 });
        setPatientResults(Array.isArray(res) ? res : []);
      } catch { setPatientResults([]); }
      finally { setSearchingPatients(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [patientSearch, isStaff]);

  // Load doctors + existing appointments
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [docs, appts] = await Promise.all([
          listDoctors({ is_available: true }),
          patientId ? getPatientAppointments(patientId) : Promise.resolve([]),
        ]);
        setDoctors(Array.isArray(docs) ? docs : []);
        setAppointments(Array.isArray(appts) ? appts : []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId]);

  async function triggerPayment(e) {
    e.preventDefault();
    setError('');

    if (!selectedDoctor) { setError('Please select a doctor first.'); return; }
    if (!date || !startTime || !endTime) { setError('Please fill all date and time fields.'); return; }
    if (startTime >= endTime) { setError('End time must be after start time.'); return; }

    // Proceed to booking and then payment
    await processBooking();
  }

  async function processBooking() {
    setBookingLoading(true);
    setError('');
    try {
      const payload = {
        doctor_id: selectedDoctor.id,
        appointment_date: date,
        start_time: startTime,
        end_time: endTime,
      };
      if (patientId) payload.patient_id = patientId;
      if (notes.trim()) payload.notes = notes.trim();

      // 1. Create Appointment
      const result = await bookAppointment(payload);
      const appt = result?.data ?? result;

      // 2. Determine if payment needed
      const fee = parseFloat(selectedDoctor.consultation_fee) || 0;
      if (fee > 0) {
        // Create a real Razorpay order for this appointment
        const order = await createOrder(appt.id);
        setPaymentIntent(order);
        setPaymentModalOpen(true);
      } else {
        handlePaymentSuccess(null, appt);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  }

  const handlePaymentSuccess = async (invoice, apptInfo) => {
    setPaymentModalOpen(false);
    const doctorName = [selectedDoctor.first_name, selectedDoctor.last_name].join(' ');
    
    // In a real app we might refetch the appointment to get the real token number,
    // but we can just show success here.
    setSuccess({ tokenNumber: apptInfo?.queue_token_number || apptInfo?.token_number || 'Pending', doctorName });

    // Refresh appointment list
    if (patientId) {
      const updated = await getPatientAppointments(patientId).catch(() => appointments);
      setAppointments(Array.isArray(updated) ? updated : []);
    }

    // Reset form
    setNotes('');
    setDate(today());
    setStartTime('09:00');
    setEndTime('09:30');
  };

  async function handleCancel(appointmentId) {
    if (!window.confirm('Cancel this appointment?')) return;
    setCancellingId(appointmentId);
    try {
      await cancelAppointment(appointmentId);
      setAppointments(prev => prev.map(a =>
        a.id === appointmentId ? { ...a, status: 'cancelled' } : a
      ));
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Could not cancel appointment.');
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Activity className="h-10 w-10 text-brand-500 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface pb-16 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-premium opacity-70 z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        <header className="flex items-center justify-between mb-10 glass-panel p-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-slate-600 hover:text-brand-600 font-medium text-sm transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-display font-bold text-dark tracking-tight">Book Appointment</h1>
          <div className="w-24" /> {/* Spacer */}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Booking form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success banner */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-medical-50 border border-medical-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm"
                >
                  <CheckCircle2 className="h-8 w-8 text-medical-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg text-medical-900 mb-1">Appointment Confirmed!</h3>
                    <p className="text-medical-800">
                      Dr. <strong>{success.doctorName}</strong> — Queue Token{' '}
                      <strong className="text-medical-900 text-xl font-display px-2 py-1 bg-medical-100 rounded-lg ml-1">#{success.tokenNumber ?? '—'}</strong>
                    </p>
                  </div>
                  <button onClick={() => setSuccess(null)} className="ml-auto text-medical-500 hover:text-medical-700 bg-white p-2 rounded-full shadow-sm">
                    <X className="h-5 w-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Staff-only: Select Patient */}
            {isStaff && (
              <div className="glass-card">
                <div className="px-8 py-5 border-b border-slate-100/50">
                  <h2 className="font-semibold text-dark flex items-center text-lg">
                    <User className="h-6 w-6 mr-3 text-brand-500 bg-brand-50 p-1 rounded-lg" />
                    Step 0 — Select Patient
                  </h2>
                </div>
                <div className="p-8">
                  {patientId ? (
                    <div className="flex items-center justify-between bg-medical-50/50 border border-medical-100 rounded-2xl p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-medical-400 to-medical-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                          {patientName?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <p className="font-bold text-medical-900 text-lg">{patientName}</p>
                          <p className="text-sm text-medical-700 font-medium">Patient verified — proceed to choose doctor</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setPatientId(null); setPatientName(''); setPatientSearch(''); }}
                        className="text-medical-600 hover:text-medical-800 text-sm font-bold bg-white px-4 py-2 rounded-lg shadow-sm border border-medical-100 transition-all"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          type="text"
                          value={patientSearch}
                          onChange={e => setPatientSearch(e.target.value)}
                          placeholder="Search patient by name or phone number..."
                          className="pl-12 w-full rounded-2xl border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all py-4 text-slate-800 placeholder-slate-400 shadow-sm"
                        />
                      </div>
                      {searchingPatients && (
                        <p className="text-sm text-brand-600 font-medium px-2 flex items-center gap-2">
                          <Activity className="w-4 h-4 animate-spin" /> Searching database...
                        </p>
                      )}
                      {patientResults.length > 0 && (
                         <div className="border border-slate-100 rounded-2xl divide-y divide-slate-50 max-h-[300px] overflow-y-auto bg-white/80 backdrop-blur-sm shadow-inner">
                           {patientResults.map(p => (
                             <button
                               key={p.id}
                               onClick={() => {
                                 setPatientId(p.id);
                                 setPatientName([p.first_name, p.last_name].filter(Boolean).join(' '));
                                 setPatientSearch('');
                                 setPatientResults([]);
                               }}
                               className="w-full text-left px-6 py-4 hover:bg-brand-50 transition-colors flex items-center gap-4 group"
                             >
                               <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-brand-100 group-hover:text-brand-600 flex items-center justify-center font-bold transition-colors">
                                 {p.first_name?.charAt(0)}
                               </div>
                               <div>
                                 <p className="font-bold text-dark">{p.first_name} {p.last_name}</p>
                                 <p className="text-sm text-slate-500 font-medium">{p.phone || 'No phone number on record'}</p>
                               </div>
                               <ChevronLeft className="w-5 h-5 ml-auto text-slate-300 group-hover:text-brand-500 transform rotate-180 transition-colors" />
                             </button>
                           ))}
                         </div>
                       )}
                       {patientSearch.length >= 2 && patientResults.length === 0 && !searchingPatients && (
                         <p className="text-sm text-amber-600 font-medium px-2">No patients found. Make sure they are registered first.</p>
                       )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Choose Doctor */}
            <div className="glass-card">
              <div className="px-8 py-5 border-b border-slate-100/50 flex justify-between items-center">
                <h2 className="font-semibold text-dark flex items-center text-lg">
                  <Stethoscope className="h-6 w-6 mr-3 text-brand-500 bg-brand-50 p-1 rounded-lg" />
                  Step {isStaff ? '1' : '1'} — Select Specialist
                </h2>
                {selectedDoctor && <span className="bg-medical-100 text-medical-700 text-xs font-bold px-3 py-1 rounded-full">Doctor Selected</span>}
              </div>
              <div className="p-8">
                {doctors.length === 0 ? (
                  <div className="text-center py-10">
                    <User className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 font-medium text-lg">No specialists available at the moment.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {doctors.map(doc => {
                      const name = [doc.first_name, doc.last_name].filter(Boolean).join(' ');
                      const isSelected = selectedDoctor?.id === doc.id;
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setSelectedDoctor(isSelected ? null : doc)}
                          className={`text-left p-5 rounded-2xl border-2 transition-all duration-300 group ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50/50 shadow-md transform -translate-y-1'
                              : 'border-slate-100 bg-white/60 hover:border-brand-300 hover:bg-white hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white text-xl font-bold font-display shadow-sm shrink-0 transition-colors ${isSelected ? 'bg-gradient-to-br from-brand-600 to-brand-400' : 'bg-slate-300 group-hover:bg-brand-400'}`}>
                              {doc.first_name?.charAt(0).toUpperCase() || 'D'}
                            </div>
                            <div className="min-w-0">
                              <p className={`font-bold truncate text-lg ${isSelected ? 'text-brand-900' : 'text-dark'}`}>
                                Dr. {name}
                              </p>
                              <p className="text-sm font-medium text-brand-600 mt-0.5">{doc.specialization}</p>
                              {doc.consultation_fee > 0 && (
                                <p className="text-xs font-semibold text-slate-500 mt-2 bg-slate-100 inline-block px-2 py-0.5 rounded-md">Consultation: ${doc.consultation_fee}</p>
                              )}
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="h-6 w-6 text-brand-500 shrink-0 ml-auto" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Schedule */}
            <AnimatePresence>
              {selectedDoctor && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  className="glass-card overflow-hidden"
                >
                  <div className="px-8 py-5 border-b border-slate-100/50">
                    <h2 className="font-semibold text-dark flex items-center text-lg">
                      <Calendar className="h-6 w-6 mr-3 text-brand-500 bg-brand-50 p-1 rounded-lg" />
                      Step 2 — Schedule & Confirm
                    </h2>
                  </div>
                  <div className="p-8">
                    <form onSubmit={triggerPayment} className="space-y-6">
                      {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <ErrorMessage message={error} />
                        </motion.div>
                      )}

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="appt-date">
                              Select Date
                            </label>
                            <input
                              id="appt-date"
                              type="date"
                              required
                              min={today()}
                              value={date}
                              onChange={e => setDate(e.target.value)}
                              className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-white/50 text-dark font-medium shadow-sm"
                              disabled={bookingLoading}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="appt-start">
                                Start Time
                              </label>
                              <input
                                id="appt-start"
                                type="time"
                                required
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-white/50 text-dark font-medium shadow-sm"
                                disabled={bookingLoading}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="appt-end">
                                End Time
                              </label>
                              <input
                                id="appt-end"
                                type="time"
                                required
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-white/50 text-dark font-medium shadow-sm"
                                disabled={bookingLoading}
                              />
                            </div>
                          </div>
                          {startTime && endTime && startTime >= endTime && (
                            <p className="text-sm text-red-500 font-medium">⚠ End time must be after start time.</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="appt-notes">
                            Clinical Notes (optional)
                          </label>
                          <textarea
                            id="appt-notes"
                            rows={5}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Briefly describe your symptoms or reason for visit..."
                            className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-white/50 text-dark font-medium shadow-sm resize-none"
                            disabled={bookingLoading}
                          />
                        </div>
                      </div>

                      <div className="pt-4 mt-6 border-t border-slate-100/50">
                        <button
                          type="submit"
                          disabled={bookingLoading || !selectedDoctor || (startTime >= endTime)}
                          className="w-full btn-premium py-4 text-lg mt-2"
                        >
                          {bookingLoading ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Processing Securely...</span>
                            </div>
                          ) : (
                            selectedDoctor.consultation_fee > 0 ? `Pay $${selectedDoctor.consultation_fee} & Confirm Booking` : 'Confirm Booking & Get Queue Token'
                          )}
                        </button>
                        <p className="text-center text-slate-400 text-sm mt-4 font-medium flex items-center justify-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" /> 100% Secure & Encrypted
                        </p>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: My Appointments */}
          <div className="glass-panel overflow-hidden h-fit sticky top-24">
            <div className="px-6 py-5 border-b border-slate-100/50 flex items-center justify-between bg-white/40">
              <h2 className="font-bold text-dark flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-brand-600" />
                History
              </h2>
              <span className="text-xs font-bold text-brand-700 bg-brand-100 px-3 py-1 rounded-full shadow-sm">
                {appointments.length} Total
              </span>
            </div>
            <div className="divide-y divide-slate-100/50 max-h-[600px] overflow-y-auto">
              {appointments.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Calendar className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">No past appointments found.</p>
                </div>
              ) : (
                appointments.map(appt => {
                  const docName = [appt.doctor_first_name, appt.doctor_last_name].filter(Boolean).join(' ');
                  const statusClass = STATUS_STYLE[appt.status] || 'bg-slate-100 text-slate-700 border-slate-200';
                  return (
                    <div key={appt.id} className="px-6 py-5 hover:bg-white/40 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-dark truncate">
                            Dr. {docName || 'Unknown'}
                          </p>
                          <div className="flex flex-wrap items-center text-xs text-slate-500 font-medium mt-1.5 gap-2">
                            <span className="flex items-center bg-slate-100 px-2 py-1 rounded-md">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(appt.appointment_date)}
                            </span>
                            {appt.start_time && (
                              <span className="flex items-center bg-slate-100 px-2 py-1 rounded-md">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(appt.start_time)}
                              </span>
                            )}
                          </div>
                          {appt.queue_token_number && (
                            <p className="text-sm text-brand-700 font-bold mt-2">
                              Queue Token <span className="px-2 py-0.5 bg-brand-50 rounded border border-brand-100 ml-1">#{appt.queue_token_number}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border shadow-sm ${statusClass}`}>
                            {appt.status}
                          </span>
                          {appt.status === 'scheduled' && (
                            <button
                              onClick={() => handleCancel(appt.id)}
                              disabled={cancellingId === appt.id}
                              className="text-xs text-red-500 hover:text-white hover:bg-red-500 px-3 py-1.5 rounded-lg font-bold border border-red-200 hover:border-red-500 transition-all disabled:opacity-50"
                            >
                              {cancellingId === appt.id ? 'Wait...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      <RazorpayCheckout
        isOpen={paymentModalOpen}
        intent={paymentIntent}
        onSuccess={(invoice) => handlePaymentSuccess(invoice, null)}
        onClose={() => setPaymentModalOpen(false)}
        onError={(message) => { setPaymentModalOpen(false); setError(message); }}
      />
    </main>
  );
}
