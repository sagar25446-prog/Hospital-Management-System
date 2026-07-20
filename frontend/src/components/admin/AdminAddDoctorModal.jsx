import { useState } from 'react';
import { createDoctor } from '../../api/doctors.api';
import { X, UserPlus, Stethoscope, Mail, Lock, DollarSign, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorMessage } from '../common';

export default function AdminAddDoctorModal({ isOpen, onClose, onDoctorAdded }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    specialization: '',
    qualification: '',
    consultation_fee: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        consultation_fee: Number(formData.consultation_fee)
      };
      const result = await createDoctor(payload);
      if (onDoctorAdded) onDoctorAdded(result.data || result);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="bg-brand-50 p-6 flex items-center justify-between border-b border-brand-100">
            <div className="flex items-center text-brand-900">
              <div className="bg-brand-100 p-2 rounded-xl mr-3">
                <UserPlus className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="font-bold text-xl font-display">Register New Doctor</h3>
            </div>
            <button 
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-2 rounded-full shadow-sm hover:shadow"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto">
            {error && <ErrorMessage message={error} className="mb-6" />}
            
            <form id="add-doctor-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Specialization *</label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Cardiologist"
                    className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Qualification</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      placeholder="e.g. MD, MBBS"
                      className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fee ($) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="consultation_fee"
                      value={formData.consultation_fee}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
          
          <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-doctor-form"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Doctor'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
