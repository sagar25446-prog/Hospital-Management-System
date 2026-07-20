import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listDoctors } from '../api/doctors.api';
import { ErrorMessage } from '../components/common';
import { motion } from 'framer-motion';
import { UserPlus, Activity, Users, ArrowRight, ShieldCheck, Search } from 'lucide-react';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    listDoctors()
      .then((data) => {
        if (!cancelled) setDoctors(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Failed to load doctors');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filteredDoctors = doctors?.filter(d => {
    if (!searchQuery) return true;
    const name = [d.first_name, d.last_name].join(' ').toLowerCase();
    const spec = (d.specialization || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || spec.includes(q);
  }) || [];

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col items-center">
           <Activity className="h-12 w-12 text-brand-600 mb-4 animate-spin" />
           <p className="text-gray-500 font-medium">Finding available doctors...</p>
        </div>
      </main>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <main className="min-h-screen bg-slate-50 relative">
      {/* Background decorations */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-brand-900 via-brand-800 to-slate-50 z-0" />
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
         <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-6 shadow-xl border border-white/20">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 tracking-tight">
            Our Medical Specialists
          </h1>
          <p className="text-brand-100/90 text-lg max-w-2xl mx-auto">
            Find the right doctor for your needs and join the virtual queue to minimize your waiting time.
          </p>
        </motion.header>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 max-w-2xl mx-auto">
            <ErrorMessage message={error} />
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex justify-center mb-12"
        >
            <div className="relative w-full max-w-xl">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <Search className="h-5 w-5 text-gray-400" />
               </div>
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="block w-full pl-11 pr-4 py-4 bg-white/80 backdrop-blur-xl border border-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none rounded-2xl shadow-xl shadow-slate-200/50 transition-all font-medium text-gray-800 placeholder-gray-400"
                 placeholder="Search by name or specialization..."
               />
            </div>
        </motion.div>

        {filteredDoctors.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card p-12 text-center rounded-3xl max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center justify-center p-4 bg-slate-100 rounded-full mb-4">
              <UserPlus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-display font-semibold text-gray-800 mb-2">No doctors found</h3>
            <p className="text-gray-500">We couldn't find any doctors matching your search criteria.</p>
          </motion.div>
        ) : (
          <motion.ul 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" 
            role="list"
          >
            {filteredDoctors.map((d) => {
              const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || 'Doctor';
              return (
                <motion.li key={d.id} variants={itemVariants}>
                  <Link to={`/queue/${d.id}`} className="block group h-full focus:outline-none">
                    <div className="glass-card rounded-3xl p-6 sm:p-8 h-full flex flex-col transition-all duration-300 transform group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-brand-500/20 group-hover:bg-white group-focus:ring-2 group-focus:ring-brand-500 relative overflow-hidden border-2 border-transparent group-hover:border-brand-100">
                      
                      {/* Decorative top corner gradient */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-100/60 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="flex items-start justify-between mb-6 relative z-10">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 text-2xl font-bold font-display">
                          {d.first_name ? d.first_name.charAt(0).toUpperCase() : 'D'}
                        </div>
                        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-50 rounded-full border border-green-200/60">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-green-700 tracking-wider uppercase">Active</span>
                        </div>
                      </div>

                      <div className="relative z-10 flex-grow">
                        <h2 className="text-xl font-display font-bold text-gray-900 group-hover:text-brand-600 transition-colors">Dr. {name}</h2>
                        <p className="text-brand-600 font-medium text-sm mt-1 mb-2">{d.specialization || 'General Practitioner'}</p>
                        {d.consultation_fee > 0 && (
                          <p className="text-sm text-gray-500 font-semibold">Consultation: <span className="text-gray-900">${d.consultation_fee}</span></p>
                        )}
                        {d.qualification && (
                          <p className="text-xs text-gray-400 mt-1">{d.qualification}</p>
                        )}
                      </div>

                      <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
                        <div className="flex items-center text-sm font-semibold text-gray-500 group-hover:text-brand-600 transition-colors">
                          <Users className="h-4 w-4 mr-2" />
                          View live queue
                        </div>
                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors transform group-hover:translate-x-1">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </div>
    </main>
  );
}
