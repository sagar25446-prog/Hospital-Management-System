import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMe } from '../api/auth.api';
import { getMyPrescriptions } from '../api/emr.api';
import { generatePrescriptionPDF } from '../utils/generatePrescriptionPDF';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, ChevronLeft, FileText, Pill, Calendar, User,
  Stethoscope, Clock, Download, AlertCircle,
} from 'lucide-react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function MedicalRecordsPage() {
  const { user, setUser } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        let pid = user?.profile?.id;
        if (!pid) {
          const me = await getMe();
          setUser(me);
          pid = me?.profile?.id;
        }
        if (pid) {
          const data = await getMyPrescriptions(pid);
          setPrescriptions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load medical records');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, setUser]);

  const patientName = user?.profile
    ? [user.profile.first_name, user.profile.last_name].filter(Boolean).join(' ')
    : 'Patient';

  const handleDownloadPDF = (prescription) => {
    try {
      generatePrescriptionPDF(prescription, patientName);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Activity className="h-10 w-10 text-brand-500 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading medical records...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-premium relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-slate-200/50 to-slate-50 pointer-events-none z-0" />
      
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-brand-600 font-medium mb-6 transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
            Medical Records
          </h1>
          <p className="text-gray-500 mt-2">View your prescriptions and medical history</p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}

        {prescriptions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-12 text-center"
          >
            <div className="inline-flex items-center justify-center p-4 bg-gray-50 rounded-full mb-4">
              <FileText className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No Records Yet</h3>
            <p className="text-gray-400">Your prescriptions will appear here after your doctor consultations.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Dr. {p.doc_first} {p.doc_last}
                      </p>
                      <p className="text-sm text-gray-500">{p.specialization}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {formatDate(p.issued_at)}
                    </span>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border transition-all ${expandedId === p.id ? 'bg-brand-50 border-brand-200 rotate-180' : 'bg-gray-50 border-gray-100'}`}>
                      <ChevronLeft className="h-4 w-4 -rotate-90" />
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedId === p.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-gray-100">
                        {p.diagnosis && (
                          <div className="mt-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Diagnosis</p>
                            <p className="text-gray-800 font-medium">{p.diagnosis}</p>
                          </div>
                        )}

                        {p.instructions && (
                          <div className="mt-3 text-sm text-gray-600">
                            <span className="font-semibold text-gray-700">Instructions: </span>{p.instructions}
                          </div>
                        )}

                        {/* Medications */}
                        {p.items && p.items.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Pill className="h-3.5 w-3.5" /> Medications ({p.items.length})
                            </p>
                            <div className="space-y-2">
                              {p.items.map((item, i) => (
                                <div key={item.id || i} className="bg-gray-50 rounded-xl p-3 flex items-start gap-3">
                                  <div className="h-7 w-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                                    {i + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm">{item.medicine_name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {item.dosage} · {item.frequency} · {item.duration}
                                    </p>
                                    {item.instructions && (
                                      <p className="text-xs text-gray-400 mt-1 italic">{item.instructions}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => handleDownloadPDF(p)}
                          className="mt-4 w-full btn-premium"
                        >
                          <Download className="h-4 w-4 mr-2" /> Download PDF Prescription
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
