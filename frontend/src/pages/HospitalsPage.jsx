import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getHospitals, getCities, getSpecialties } from '../api/hospitals.api';
import { Search, MapPin, Building2, Star, ChevronRight, Activity, Stethoscope } from 'lucide-react';

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState([]);
  const [cities, setCities] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, s] = await Promise.all([getCities(), getSpecialties()]);
        setCities(c);
        setSpecialties(s);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  useEffect(() => {
    const fetchHospitals = async () => {
      setLoading(true);
      try {
        const data = await getHospitals({ search, city: selectedCity, specialty: selectedSpecialty });
        setHospitals(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    const timeoutId = setTimeout(fetchHospitals, 300);
    return () => clearTimeout(timeoutId);
  }, [search, selectedCity, selectedSpecialty]);

  const topSpecialties = ['Cardiology', 'Neurology', 'Orthopaedics', 'Oncology', 'Gastroenterology', 'Paediatrics'];

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100/50 text-brand-700 font-medium text-sm border border-brand-200"
          >
            <Activity className="h-4 w-4" />
            National Health Aggregator
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight"
          >
            Find the Best Hospitals in India
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600"
          >
            Book appointments and join queues at top-rated medical facilities across the country.
          </motion.p>
        </div>

        {/* Search & Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search hospitals by name (e.g. Apollo, AIIMS)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white rounded-xl text-slate-900 focus:ring-2 focus:ring-brand-500 transition-all"
              />
            </div>
            <div className="sm:w-56 relative shrink-0">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white rounded-xl text-slate-900 focus:ring-2 focus:ring-brand-500 transition-all appearance-none"
              >
                <option value="">All Cities</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="sm:w-64 relative shrink-0">
              <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white rounded-xl text-slate-900 focus:ring-2 focus:ring-brand-500 transition-all appearance-none"
              >
                <option value="">All Specialties</option>
                {specialties.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-sm font-medium text-slate-500 mr-2">Top Specialties:</span>
            {topSpecialties.map(spec => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(selectedSpecialty === spec ? '' : spec)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedSpecialty === spec 
                    ? 'bg-brand-600 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
            <p className="text-slate-500 mt-4 font-medium">Searching hospitals...</p>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto px-6">
            <div className="bg-slate-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">No hospitals found</h3>
            <p className="text-slate-500 mt-2 text-base max-w-md mx-auto">
              {search ? (
                <>We couldn't find "<strong>{search}</strong>". Try a shorter name or check the spelling.</>
              ) : (
                'Try adjusting your filters to see more results.'
              )}
            </p>
            <div className="mt-4 text-sm text-slate-400">
              <p>💡 Try searching: <button onClick={() => setSearch('Apollo')} className="text-brand-600 hover:underline font-medium">Apollo</button>, <button onClick={() => setSearch('AIIMS')} className="text-brand-600 hover:underline font-medium">AIIMS</button>, <button onClick={() => setSearch('Fortis')} className="text-brand-600 hover:underline font-medium">Fortis</button>, <button onClick={() => setSearch('Max')} className="text-brand-600 hover:underline font-medium">Max</button>, or <button onClick={() => setSearch('Tata')} className="text-brand-600 hover:underline font-medium">Tata Memorial</button></p>
            </div>
            <div className="mt-6 flex items-center justify-center gap-4">
              <button onClick={() => { setSearch(''); setSelectedCity(''); setSelectedSpecialty(''); }} className="btn-secondary py-2 px-6">
                Clear All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hospital, idx) => (
              <motion.div
                key={hospital.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link 
                  to={`/hospital/${hospital.id}`}
                  className="block bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-brand-500/5 transition-all group h-full flex flex-col"
                >
                  <div className="h-48 bg-slate-100 relative overflow-hidden">
                    {hospital.image_url ? (
                      <img 
                        src={hospital.image_url} 
                        alt={hospital.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-brand-50">
                        <Building2 className="h-12 w-12 text-brand-200" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-slate-700">{hospital.rating}</span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-brand-600 transition-colors">
                        {hospital.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-4">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{hospital.city}, {hospital.state}</span>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        {hospital.type}
                      </span>
                      <span className="flex items-center text-brand-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                        View Doctors <ChevronRight className="h-4 w-4 ml-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
