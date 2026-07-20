import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updatePatientProfile } from '../api/patients.api';
import { ErrorMessage } from '../components/common';
import { CheckCircle2, User, Phone, Droplet, Calendar as CalendarIcon, UserCircle } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function PatientProfilePage() {
  const { user, setUser, getMe } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const profile = user?.profile || {};
  
  const [formData, setFormData] = useState({
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    phone: profile.phone || '',
    date_of_birth: profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '',
    gender: profile.gender || '',
    blood_group: profile.blood_group || '',
  });

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        first_name: user.profile.first_name || '',
        last_name: user.profile.last_name || '',
        phone: user.profile.phone || '',
        date_of_birth: user.profile.date_of_birth ? user.profile.date_of_birth.split('T')[0] : '',
        gender: user.profile.gender || '',
        blood_group: user.profile.blood_group || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updatePatientProfile(profile.id, formData);
      setSuccess('Profile updated successfully!');
      
      // Refresh AuthContext user to reflect changes site-wide
      if (typeof getMe === 'function') {
        const updatedUser = await getMe();
        if (updatedUser) setUser(updatedUser);
      } else {
        // Optimistic update if getMe isn't easily accessible
        setUser({ ...user, profile: { ...profile, ...formData } });
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-premium py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-2">Manage your personal and medical details</p>
        </header>

        {error && <ErrorMessage message={error} />}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            <p className="font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9999999999"
                  className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircle className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors appearance-none"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Group</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Droplet className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                  className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors appearance-none"
                >
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="btn-premium flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PatientProfilePage;
