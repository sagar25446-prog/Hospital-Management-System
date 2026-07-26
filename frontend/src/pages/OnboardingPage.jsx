import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updatePatientProfile } from '../api/patients.api';
import { ErrorMessage } from '../components/common';
import { HeartPulse, Calendar, Phone, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  
  const [formData, setFormData] = useState({
    phone: '',
    date_of_birth: '',
    gender: 'male',
    blood_group: 'O+',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If they aren't a patient or already have a phone, they don't need to be here
  if (!user || user.role !== 'patient' || (user.profile && user.profile.phone)) {
    navigate('/', { replace: true });
    return null;
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user.profile?.id) throw new Error("Profile not found");
      
      const updatedProfile = await updatePatientProfile(user.profile.id, formData);
      
      // Update local user state
      setUser({ ...user, profile: updatedProfile });
      
      // Redirect to home
      navigate('/', { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to save profile. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-200/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-teal-200/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-2xl border border-white/70 shadow-2xl shadow-indigo-500/10 rounded-3xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-white opacity-10 blur-2xl"></div>
             
             <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 shadow-lg mb-4">
              <HeartPulse className="h-8 w-8 text-white" />
            </div>
            
            <h1 className="text-3xl font-display font-bold mb-2">Complete Your Profile</h1>
            <p className="text-indigo-100 max-w-md mx-auto">
              Welcome to Q-Care, {user?.profile?.first_name}! We just need a few more details to set up your account for booking appointments.
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && <ErrorMessage message={error} />}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="phone">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Phone className="h-5 w-5" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="date_of_birth">Date of Birth</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      required
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors appearance-none bg-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="blood_group">Blood Group</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Activity className="h-5 w-5" />
                    </div>
                    <select
                      id="blood_group"
                      name="blood_group"
                      required
                      value={formData.blood_group}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors appearance-none bg-white"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 btn-premium"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Profile...</span>
                  </div>
                ) : (
                  'Complete Setup'
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
