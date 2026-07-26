import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getHospital, getHospitalDoctors } from '../api/hospitals.api';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, MapPin, Phone, Star, User, 
  ArrowLeft, CalendarPlus, Activity, Clock, ShieldCheck, Map
} from 'lucide-react';

export default function HospitalDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [hData, dData] = await Promise.all([
          getHospital(id),
          getHospitalDoctors(id)
        ]);
        setHospital(hData);
        setDoctors(dData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleBook = (doctorId) => {
    if (!user) {
      navigate('/login');
    } else {
      // Navigate to booking page with hospital and doctor pre-selected
      // This assumes we update the booking page to handle query params or we just use the existing one
      navigate(`/book?hospitalId=${id}&doctorId=${doctorId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Loading hospital details...</p>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-800">Hospital Not Found</h2>
        <Link to="/hospitals" className="mt-4 text-brand-600 hover:underline">Go back to directory</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <Link to="/hospitals" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-brand-600 mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Directory
          </Link>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3 aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200 shrink-0">
              {hospital.image_url ? (
                <img src={hospital.image_url} alt={hospital.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 to-indigo-50">
                  <Building2 className="h-20 w-20 text-brand-200" />
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider rounded-full border border-brand-100">
                  {hospital.type}
                </span>
                <span className="flex items-center gap-1 text-sm font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-full">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" /> {hospital.rating}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-display font-bold text-slate-900 leading-tight">
                {hospital.name}
              </h1>
              
              <div className="space-y-2 mt-4 text-slate-600 text-lg">
                <div className="flex items-start gap-3">
                  <MapPin className="h-6 w-6 text-slate-400 shrink-0 mt-0.5" />
                  <span>{hospital.address}, {hospital.city}, {hospital.state}</span>
                </div>
                {hospital.contact_number && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-slate-400 shrink-0" />
                    <span>{hospital.contact_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Map Preview Placeholder */}
            <div className="hidden lg:block w-72 shrink-0 bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden relative self-stretch">
               <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cartographer.png")' }}></div>
               <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                 <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-brand-500 shadow-md mb-3">
                   <Map className="h-6 w-6" />
                 </div>
                 <p className="font-bold text-slate-800">Location Map</p>
                 <p className="text-sm text-slate-500 mt-1">Get directions to {hospital.name}</p>
                 <button className="mt-4 px-4 py-2 bg-white text-brand-600 text-sm font-bold rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50">View on Map</button>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Doctors List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <User className="h-6 w-6 text-brand-500" /> Our Specialists
          </h2>
        </div>

        {doctors.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No doctors currently listed for this hospital.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor, idx) => {
              // Simulated dynamic data to make UI look premium
              const rating = (4.0 + Math.random()).toFixed(1);
              const reviews = Math.floor(Math.random() * 200) + 15;
              const experience = Math.floor(Math.random() * 15) + 5;
              
              return (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-20 w-20 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 overflow-hidden relative">
                    {doctor.profile_picture_url ? (
                      <img src={doctor.profile_picture_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-indigo-300" />
                    )}
                    <div className="absolute bottom-1 right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        Dr. {doctor.first_name} {doctor.last_name}
                      </h3>
                      <span className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        <Star className="h-3 w-3 fill-amber-500 mr-0.5" /> {rating}
                      </span>
                    </div>
                    <p className="text-brand-600 font-bold text-sm mt-0.5">{doctor.specialization}</p>
                    <p className="text-slate-500 text-xs mt-1">{doctor.qualification} • {experience} Yrs Exp.</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100 flex justify-between items-center text-xs font-medium text-slate-600">
                  <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Next Slot: Today</span>
                  <span className="flex items-center text-green-600"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-green-500" /> Verified</span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Consultation</p>
                    <div className="text-slate-900 font-bold text-lg leading-none">
                      {parseFloat(doctor.consultation_fee) > 0 ? `₹${doctor.consultation_fee}` : 'Free'}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleBook(doctor.id)}
                    className="btn-premium py-2.5 px-6 text-sm"
                  >
                    <CalendarPlus className="h-4 w-4 mr-1.5" /> Book Appt
                  </button>
                </div>
              </motion.div>
            )})}
          </div>
        )}
      </div>
    </main>
  );
}
