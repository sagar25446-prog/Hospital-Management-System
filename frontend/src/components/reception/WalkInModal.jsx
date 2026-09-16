import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Activity, UserPlus, Clock } from 'lucide-react';
import { generateToken } from '../../api/queue.api';
import { listPatients } from '../../api/patients.api';
import { listDoctors } from '../../api/doctors.api';
import { ErrorMessage } from '../common';

export default function WalkInModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSelectedPatient('');
      setSelectedDoctor('');
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setInitLoading(true);
    try {
      const [ptData, docData] = await Promise.all([
        listPatients({ limit: 100 }),
        listDoctors({ limit: 100 })
      ]);
      setPatients(ptData.results || ptData || []);
      setDoctors(docData.results || docData || []);
    } catch (err) {
      setError('Failed to load initial data');
    } finally {
      setInitLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !selectedDoctor) {
      setError('Please select both a patient and a doctor.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await generateToken({ 
        doctorId: selectedDoctor, 
        patientId: selectedPatient 
      });
      onSuccess(result?.data || result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" 
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative z-10 border border-slate-100"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-brand-600" />
              Add Walk-In Patient
            </h2>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-200 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {error && <ErrorMessage message={error} />}
            
            {initLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-500">
                <Activity className="h-8 w-8 animate-spin mb-3 text-brand-500" />
                <p className="font-medium">Loading data...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Patient</label>
                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium text-slate-800"
                  >
                    <option value="" disabled>-- Choose a registered patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name} ({p.phone})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Doctor</label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium text-slate-800"
                  >
                    <option value="" disabled>-- Assign to doctor's queue --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.first_name} {d.last_name} - {d.specialization}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedPatient || !selectedDoctor}
                    className="flex-1 py-3 px-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <Activity className="h-5 w-5 animate-spin" />
                    ) : (
                      'Generate Token'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
