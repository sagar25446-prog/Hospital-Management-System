import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, CreditCard, Lock } from 'lucide-react';
import { processPayment } from '../../api/payment.api';
import ErrorMessage from './ErrorMessage';

export default function RazorpayMockModal({ isOpen, intent, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !intent) return null;

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const result = await processPayment(intent.appointmentId, intent.transactionId);
      if (result.success) {
        onSuccess(result.invoice);
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        >
          {/* Header mimicking Razorpay */}
          <div className="bg-[#02042b] p-6 text-white relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white p-1.5 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-[#02042b]" />
              </div>
              <h2 className="text-lg font-bold">Q-Care Payments</h2>
            </div>
            <p className="text-gray-300 text-sm">Consultation Fee</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-xl">₹</span>
              <span className="text-4xl font-bold">{intent.total.toFixed(2)}</span>
            </div>
          </div>

          <form onSubmit={handlePay} className="p-6 space-y-5">
            {error && <ErrorMessage message={error} />}
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Card Information</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="text" required placeholder="4111 1111 1111 1111" defaultValue="4111 1111 1111 1111" className="pl-10 w-full rounded-t-xl border-gray-200 focus:z-10 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                </div>
                <div className="flex -mt-px relative">
                  <div className="w-1/2">
                    <input type="text" required placeholder="MM / YY" defaultValue="12/28" className="w-full rounded-bl-xl border-gray-200 focus:z-10 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                  </div>
                  <div className="w-1/2 -ml-px">
                    <input type="text" required placeholder="CVC" defaultValue="123" className="w-full rounded-br-xl border-gray-200 focus:z-10 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name on Card</label>
                <input type="text" required placeholder="Sagar Jain" defaultValue="Test User" className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#3399cc] hover:bg-[#2b86b5] text-white rounded-xl font-bold shadow-lg shadow-[#3399cc]/30 transition-all flex justify-center items-center gap-2 disabled:opacity-75"
            >
              {loading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Pay ₹{intent.total.toFixed(2)}
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 font-medium">
              Secured by MockPay Verification
            </p>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
