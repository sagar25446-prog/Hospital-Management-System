import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getQueue } from '../api/queue.api';
import { usePolling } from '../hooks/usePolling';
import { motion, AnimatePresence } from 'framer-motion';

export default function DisplayQueuePage() {
  const { doctorId } = useParams();
  const [queue, setQueue] = useState(null);
  const [error, setError] = useState('');

  const fetchQueue = useCallback(async () => {
    if (!doctorId) return;
    try {
      setError('');
      const data = await getQueue(doctorId);
      setQueue(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load queue');
    }
  }, [doctorId]);

  usePolling(fetchQueue, 5000, { pauseWhenHidden: false });

  const currentToken = queue?.currentTokenNumber ?? 0;
  const tokens = queue?.tokens ?? [];
  const upcoming = tokens
    .filter((t) => t.token_number > currentToken)
    .sort((a, b) => a.token_number - b.token_number)
    .slice(0, 5);

  const doctor = queue?.doctor || null;
  const doctorName = doctor
    ? [doctor.first_name, doctor.last_name].filter(Boolean).join(' ') || 'Doctor'
    : 'Doctor';

  return (
    <main
      className="min-h-screen bg-gradient-premium text-gray-900 flex flex-col p-8 md:p-12 font-display overflow-hidden relative"
      aria-label="Queue display"
    >
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-500/10 mix-blend-multiply rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 mix-blend-multiply rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-end border-b border-gray-200 pb-8 mb-12 relative z-10 w-full">
         <div>
            <h2 className="text-2xl font-semibold text-gray-500 tracking-wide uppercase">Clinic Queue</h2>
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 mt-2 filter drop-shadow-sm">
              Dr. {doctorName}
            </h1>
         </div>
         <div className="flex items-center space-x-3 glass-card px-6 py-3">
             <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
             <span className="text-gray-700 font-medium tracking-widest uppercase">Live Sync</span>
         </div>
      </header>

      <div className="flex-grow flex flex-col lg:flex-row gap-16 w-full max-w-[1400px] mx-auto relative z-10">
        
        {/* Left Side: CURRENT TOKEN */}
        <section className="flex-1 flex flex-col justify-center items-center lg:border-r lg:border-gray-200 lg:pr-12 text-center relative" aria-label="Now serving">
          {error && (
            <div className="absolute top-0 text-xl text-red-600 font-mono bg-red-50/80 px-6 py-3 rounded-2xl border border-red-200/50 backdrop-blur-md" role="alert">
              {error}
            </div>
          )}
          
          <h2 className="text-3xl md:text-5xl font-bold tracking-[0.2em] text-gray-400 mb-12 w-full">
            NOW SERVING
          </h2>
          
          <div className="relative flex justify-center w-full min-h-[300px] items-center">
              {/* Pulsing ring for current token */}
              <div className="absolute inset-0 bg-brand-500/10 blur-3xl rounded-full scale-150 animate-pulse-slow pointer-events-none" />
              
              <AnimatePresence mode="popLayout">
                 <motion.div
                   key={currentToken}
                   initial={{ opacity: 0, scale: 0.5, y: -50 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 1.5, filter: 'blur(10px)' }}
                   transition={{ type: "spring", stiffness: 200, damping: 20 }}
                   className="text-[12rem] md:text-[18rem] lg:text-[22rem] font-extrabold leading-none tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-500 drop-shadow-[0_0_40px_rgba(0,0,0,0.1)] relative z-10"
                 >
                   {currentToken === 0 ? '—' : currentToken}
                 </motion.div>
              </AnimatePresence>
          </div>
        </section>

        {/* Right Side: UPCOMING TOKENS */}
        <section className="flex-1 flex flex-col justify-center" aria-label="Next tokens">
          <h2 className="text-2xl md:text-4xl font-semibold tracking-[0.1em] text-gray-500 mb-10 pl-4">
            UPCOMING PATIENTS
          </h2>
          
          <div className="h-[600px] overflow-hidden">
              <AnimatePresence>
                  {upcoming.length === 0 ? (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-3xl lg:text-4xl text-gray-600 font-medium h-full flex items-center pl-4"
                    >
                      Waiting for next patient...
                    </motion.div>
                  ) : (
                    <div className="flex flex-col gap-5">
                        {upcoming.map((t, index) => (
                          <motion.div
                            layout
                            key={t.id}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: -100 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`flex items-center p-6 md:p-8 glass-card shadow-xl ${
                              index === 0 
                                ? 'border-brand-500/40 shadow-[0_0_40px_rgba(20,184,166,0.15)] bg-white/90' 
                                : ''
                            }`}
                          >
                            <div className={`text-5xl lg:text-7xl font-bold tabular-nums w-40 text-center ${index === 0 ? 'text-brand-600 drop-shadow-[0_0_10px_rgba(20,184,166,0.2)]' : 'text-gray-400'}`}>
                              #{t.token_number}
                            </div>
                            <div className="w-px h-20 bg-gray-200 mx-8 hidden sm:block" />
                            <div className="text-3xl lg:text-5xl font-medium text-gray-700 truncate ml-4 sm:ml-0">
                              {[t.patient_first_name, t.patient_last_name].filter(Boolean).join(' ') || 'Anonymous'}
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  )}
              </AnimatePresence>
          </div>
        </section>
      </div>
    </main>
  );
}
