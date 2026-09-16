import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHospitals, getHospital, getHospitalDoctors } from '../api/hospitals.api';
import { bookAppointment, getBookedSlots } from '../api/appointments.api';
import { getMe } from '../api/auth.api';
import { listPatients } from '../api/patients.api';
import { createOrder } from '../api/payment.api';
import { ErrorMessage, RazorpayCheckout } from '../components/common';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfToday } from 'date-fns';
import {
  Calendar as CalendarIcon, Clock, User, ChevronLeft, CheckCircle2,
  X, Activity, Stethoscope, ShieldCheck, MapPin, Building2, ChevronRight
} from 'lucide-react';

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hh = parseInt(h, 10);
  return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
}

export default function BookAppointmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuth();

  const isStaff = ['reception', 'admin'].includes(user?.role);
  const [patientId, setPatientId] = useState(null);

  // Wizard State
  const [step, setStep] = useState(1);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [selectedTime, setSelectedTime] = useState(null);
  const [notes, setNotes] = useState('');

  // UI State
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [consultationType, setConsultationType] = useState('in_person');
  const [pendingAppt, setPendingAppt] = useState(null);

  const [patients, setPatients] = useState([]);

  // Initialization & URL Params Handling
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Resolve patient ID
        if (!isStaff) {
          let pid = user?.profile?.id;
          if (!pid) {
            const me = await getMe().catch(() => null);
            if (me) setUser(me);
            pid = me?.profile?.id;
          }
          if (pid) setPatientId(pid);
        } else {
          const ptData = await listPatients({ limit: 100 }).catch(() => []);
          setPatients(ptData.results || ptData || []);
        }

        // Fetch Hospitals
        const hosps = await getHospitals();
        setHospitals(hosps);

        const urlHospId = searchParams.get('hospitalId');
        const urlDocId = searchParams.get('doctorId');

        if (urlHospId) {
          const hosp = hosps.find(h => h.id === urlHospId) || await getHospital(urlHospId).catch(() => null);
          if (hosp) {
            setSelectedHospital(hosp);
            const docs = await getHospitalDoctors(urlHospId);
            setDoctors(docs);
            setStep(2);
            
            if (urlDocId) {
              const doc = docs.find(d => d.id === urlDocId);
              if (doc) {
                setSelectedDoctor(doc);
                setStep(3);
              }
            }
          }
        }
      } catch (err) {
        setError('Failed to initialize booking flow.');
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams, user, isStaff, setUser]);

  // Generate 7 days for the calendar
  const next7Days = Array.from({ length: 7 }).map((_, i) => addDays(startOfToday(), i));
  
  // Generate mock time slots (9 AM to 5 PM, 30 min intervals)
  const timeSlots = [];
  for (let i = 9; i <= 16; i++) {
    timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${i.toString().padStart(2, '0')}:30`);
  }

  const handleHospitalSelect = async (hosp) => {
    setSelectedHospital(hosp);
    setSelectedDoctor(null);
    setDoctors([]);
    setStep(2);
    try {
      const docs = await getHospitalDoctors(hosp.id);
      setDoctors(docs);
    } catch (err) {
      setError('Failed to load doctors for this hospital.');
    }
  };

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      getBookedSlots(selectedDoctor.id, format(selectedDate, 'yyyy-MM-dd'))
        .then(slots => setBookedSlots(slots || []))
        .catch(() => setBookedSlots([]));
    }
  }, [selectedDoctor, selectedDate]);

  const handleDoctorSelect = (doc) => {
    setSelectedDoctor(doc);
    setStep(3);
  };

  const processBooking = async () => {
    setBookingLoading(true);
    setError('');
    try {
      const [h, m] = selectedTime.split(':');
      const endTime = new Date(selectedDate);
      endTime.setHours(parseInt(h), parseInt(m) + 30);
      const formattedEndTime = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

      const payload = {
        doctor_id: selectedDoctor.id,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedTime,
        end_time: formattedEndTime,
        consultation_type: consultationType,
      };
      if (patientId) payload.patient_id = patientId;
      if (notes.trim()) payload.notes = notes.trim();

      const result = await bookAppointment(payload);
      const appt = result?.data ?? result;
      setPendingAppt(appt);

      const fee = parseFloat(selectedDoctor.consultation_fee) || 0;
      if (fee > 0) {
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
  };

  const handlePaymentSuccess = async (invoice, apptInfo) => {
    setPaymentModalOpen(false);
    setSuccess({ 
      tokenNumber: apptInfo?.queue_token_number || apptInfo?.token_number || 'Pending', 
      doctorName: [selectedDoctor.first_name, selectedDoctor.last_name].join(' '),
      time: selectedTime,
      date: format(selectedDate, 'MMM d, yyyy')
    });
    setStep(5); // Success step
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Activity className="h-10 w-10 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20 pt-8 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header & Progress Bar */}
        {step < 5 && (
          <div className="mb-8">
            <button
              onClick={() => {
                if (step > 1) setStep(step - 1);
                else navigate(-1);
              }}
              className="inline-flex items-center text-slate-500 hover:text-brand-600 font-medium text-sm transition-colors mb-6"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              {step > 1 ? 'Back to previous step' : 'Cancel Booking'}
            </button>
            <h1 className="text-3xl font-display font-bold text-slate-900">Book an Appointment</h1>
            
            {/* Stepper */}
            <div className="flex items-center mt-8 space-x-2">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className="flex-1">
                  <div className={`h-2 rounded-full transition-colors ${s <= step ? 'bg-brand-500' : 'bg-slate-200'}`} />
                  <p className={`text-xs font-bold mt-2 uppercase tracking-widest ${s <= step ? 'text-brand-700' : 'text-slate-400'}`}>
                    {s === 1 && 'Location'}
                    {s === 2 && 'Doctor'}
                    {s === 3 && 'Schedule'}
                    {s === 4 && 'Confirm'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <ErrorMessage message={error} />
          </motion.div>
        )}

        {/* Wizard Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-6">Select a Hospital or Clinic</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hospitals.map(hosp => (
                  <button
                    key={hosp.id}
                    onClick={() => handleHospitalSelect(hosp)}
                    className="text-left bg-white p-5 rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-lg transition-all group flex items-start gap-4"
                  >
                    <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-brand-700 transition-colors">{hosp.name}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" /> {hosp.city}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                         <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{hosp.type}</span>
                         <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-md">⭐ {hosp.rating}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Select a Specialist</h2>
                  <p className="text-sm font-medium text-slate-500">at {selectedHospital?.name}</p>
                </div>
              </div>

              {doctors.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                  <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No doctors currently listed for this location.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {doctors.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => handleDoctorSelect(doc)}
                      className="text-left bg-white p-5 rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-lg transition-all group flex items-start gap-4"
                    >
                       <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 overflow-hidden">
                        {doc.profile_picture_url ? (
                          <img src={doc.profile_picture_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-7 w-7 text-indigo-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-lg group-hover:text-brand-700 transition-colors truncate">
                          Dr. {doc.first_name} {doc.last_name}
                        </h3>
                        <p className="text-sm font-bold text-brand-600">{doc.specialization}</p>
                        <p className="text-xs text-slate-500 mt-1">{doc.qualification}</p>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-700">
                            {parseFloat(doc.consultation_fee) > 0 ? `₹${doc.consultation_fee}` : 'Free'}
                          </p>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                            Available Today
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold text-slate-800 mb-6">Choose Date & Time</h2>
              
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                {/* Date Selection Strip */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 overflow-x-auto hide-scrollbar">
                  <div className="flex gap-3 min-w-max">
                    {next7Days.map((d, i) => {
                      const isSelected = format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                      return (
                        <button
                          key={i}
                          onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
                          className={`flex flex-col items-center justify-center w-16 h-20 rounded-2xl border-2 transition-all ${
                            isSelected 
                              ? 'border-brand-500 bg-brand-500 text-white shadow-md transform -translate-y-1' 
                              : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50'
                          }`}
                        >
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-brand-100' : 'text-slate-400'}`}>
                            {format(d, 'EEE')}
                          </span>
                          <span className="text-xl font-display font-bold mt-1">
                            {format(d, 'dd')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                <div className="p-6">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                    <Clock className="w-4 h-4 mr-2" /> Available Slots
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {timeSlots.map(time => {
                      // Real availability check against the backend data
                      // Backend returns slots like '09:00:00' or '09:00'. Normalizing here.
                      const timeWithSeconds = time.length === 5 ? `${time}:00` : time;
                      const isDisabled = bookedSlots.includes(time) || bookedSlots.includes(timeWithSeconds);
                      const isSelected = selectedTime === time;

                      // Format time (e.g. 14:00 to 02:00 PM)
                      const [h, m] = time.split(':');
                      const ampm = h >= 12 ? 'PM' : 'AM';
                      const h12 = h % 12 || 12;
                      const displayTime = `${h12}:${m} ${ampm}`;

                      if (isDisabled) {
                        return (
                          <div key={time} className="py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-300 text-center text-sm font-medium cursor-not-allowed line-through">
                            {displayTime}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2.5 rounded-xl border-2 transition-all text-sm font-bold ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50'
                          }`}
                        >
                          {displayTime}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Consultation Type */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Consultation Type</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => setConsultationType('in_person')}
                    className={`flex-1 py-4 rounded-xl border-2 transition-all font-bold ${
                      consultationType === 'in_person'
                        ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
                    }`}
                  >
                    In-Person Clinic Visit
                  </button>
                  <button
                    onClick={() => setConsultationType('video')}
                    className={`flex-1 py-4 rounded-xl border-2 transition-all font-bold ${
                      consultationType === 'video'
                        ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
                    }`}
                  >
                    Online Video Consult
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(4)}
                  disabled={!selectedTime}
                  className="btn-premium py-4 px-8 text-lg flex items-center"
                >
                  Continue to Summary <ChevronRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold text-slate-800 mb-6">Review & Confirm</h2>
              
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8 p-1">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 overflow-hidden">
                      {selectedDoctor?.profile_picture_url ? (
                        <img src={selectedDoctor.profile_picture_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-indigo-300" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xl">
                        Dr. {selectedDoctor?.first_name} {selectedDoctor?.last_name}
                      </h3>
                      <p className="text-sm font-bold text-brand-600 mt-1">{selectedDoctor?.specialization}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Building2 className="w-3 h-3" /> {selectedHospital?.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-center min-w-[150px]">
                    <p className="text-[10px] font-bold text-brand-700 uppercase tracking-widest mb-1">Appointment</p>
                    <p className="font-display font-bold text-brand-900 text-lg">{format(selectedDate, 'MMM d, yyyy')}</p>
                    <p className="font-bold text-brand-600">{formatTime(selectedTime)}</p>
                    <div className="mt-2 text-xs font-bold px-2 py-1 bg-white rounded text-brand-800 border border-brand-200">
                      {consultationType === 'video' ? '📹 Video Consult' : '🏥 Clinic Visit'}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-slate-50">
                  <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="appt-notes">
                    Clinical Notes (optional)
                  </label>
                  <textarea
                    id="appt-notes"
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Briefly describe your symptoms or reason for visit..."
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-white text-dark font-medium shadow-sm resize-none"
                    disabled={bookingLoading}
                  />
                </div>
                {isStaff && (
                  <div className="p-6 bg-slate-50 border-t border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Select Patient (Required for Staff Booking)
                    </label>
                    <select
                      value={patientId || ''}
                      onChange={e => setPatientId(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-white text-dark font-medium shadow-sm"
                      disabled={bookingLoading}
                    >
                      <option value="" disabled>-- Select a Patient --</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.first_name} {p.last_name} ({p.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" /> 100% Secure & Encrypted
                </p>
                <button
                  onClick={processBooking}
                  disabled={bookingLoading || (isStaff && !patientId)}
                  className="w-full sm:w-auto btn-premium py-4 px-10 text-lg flex items-center justify-center"
                >
                  {bookingLoading ? (
                    <Activity className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    parseFloat(selectedDoctor?.consultation_fee) > 0 ? `Pay ₹${selectedDoctor.consultation_fee} & Confirm` : 'Confirm Booking'
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && success && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-center"
            >
              <div className="bg-gradient-to-br from-green-400 to-green-600 py-12 px-6">
                <div className="h-24 w-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                  <CheckCircle2 className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">Booking Confirmed!</h1>
                <p className="text-green-50 font-medium text-lg">Your appointment has been successfully scheduled.</p>
              </div>
              
              <div className="p-8 md:p-12">
                <div className="max-w-xs mx-auto bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8 shadow-inner">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Queue Token</p>
                  <p className="text-5xl font-display font-bold text-brand-600">#{success.tokenNumber}</p>
                </div>
                
                <div className="space-y-3 mb-10 text-left max-w-sm mx-auto">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <User className="w-5 h-5 text-slate-400" />
                    <span className="font-medium text-slate-700">Dr. {success.doctorName}</span>
                  </div>
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <CalendarIcon className="w-5 h-5 text-slate-400" />
                    <span className="font-medium text-slate-700">{success.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span className="font-medium text-slate-700">{formatTime(success.time)}</span>
                  </div>
                </div>
                
                <Link to="/dashboard" className="btn-secondary py-3 px-8 w-full sm:w-auto inline-block">
                  Return to Dashboard
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <RazorpayCheckout
        isOpen={paymentModalOpen}
        intent={paymentIntent}
        onSuccess={(invoice) => handlePaymentSuccess(invoice, pendingAppt)}
        onClose={() => setPaymentModalOpen(false)}
        onError={(message) => { setPaymentModalOpen(false); setError(message); }}
      />
    </main>
  );
}
