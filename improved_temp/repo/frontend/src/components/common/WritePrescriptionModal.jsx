import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Pill, FileText, Send } from 'lucide-react';
import { addPrescription } from '../../api/emr.api';

export default function WritePrescriptionModal({ isOpen, appointmentId, patientId, patientName, onClose, onSuccess }) {
  const [diagnosis, setDiagnosis] = useState('');
  const [instructions, setInstructions] = useState('');
  const [items, setItems] = useState([{ medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const addItem = () => {
    setItems(prev => [...prev, { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeItem = (idx) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate at least one medicine
    const validItems = items.filter(i => i.medicine_name.trim());
    if (validItems.length === 0) {
      setError('Please add at least one medication.');
      return;
    }

    setLoading(true);
    try {
      const result = await addPrescription({
        appointmentId,
        patientId,
        diagnosis: diagnosis.trim(),
        instructions: instructions.trim(),
        items: validItems,
      });
      onSuccess?.(result);
      // Reset form
      setDiagnosis('');
      setInstructions('');
      setItems([{ medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col mb-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-brand-600 p-5 text-white relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Write Prescription</h2>
                {patientName && <p className="text-white/80 text-sm">Patient: {patientName}</p>}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded-xl text-sm">{error}</div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Diagnosis</label>
              <textarea
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                placeholder="e.g., Upper respiratory tract infection"
                rows={2}
                className="w-full rounded-xl border-gray-200 focus:ring-brand-500 focus:border-brand-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">General Instructions</label>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="e.g., Rest for 3 days. Drink warm water."
                rows={2}
                className="w-full rounded-xl border-gray-200 focus:ring-brand-500 focus:border-brand-500 transition-colors text-sm"
              />
            </div>

            {/* Medications */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5" /> Medications
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Medicine
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-3.5 relative group">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Medicine Name *"
                        required
                        value={item.medicine_name}
                        onChange={e => updateItem(idx, 'medicine_name', e.target.value)}
                        className="col-span-2 rounded-lg border-gray-200 text-sm font-medium focus:ring-brand-500 focus:border-brand-500"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g., 500mg)"
                        required
                        value={item.dosage}
                        onChange={e => updateItem(idx, 'dosage', e.target.value)}
                        className="rounded-lg border-gray-200 text-sm focus:ring-brand-500 focus:border-brand-500"
                      />
                      <input
                        type="text"
                        placeholder="Frequency (e.g., Twice daily)"
                        required
                        value={item.frequency}
                        onChange={e => updateItem(idx, 'frequency', e.target.value)}
                        className="rounded-lg border-gray-200 text-sm focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Duration (e.g., 5 days)"
                        required
                        value={item.duration}
                        onChange={e => updateItem(idx, 'duration', e.target.value)}
                        className="rounded-lg border-gray-200 text-sm focus:ring-brand-500 focus:border-brand-500"
                      />
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={item.instructions}
                        onChange={e => updateItem(idx, 'instructions', e.target.value)}
                        className="rounded-lg border-gray-200 text-sm focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>

          <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors shadow-sm shadow-brand-600/20 flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <><Send className="h-4 w-4" /> Save Prescription</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
