import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateDoctor } from '../api/doctors.api';
import { ErrorMessage } from '../components/common';
import { LayoutDashboard, CheckCircle2, User, Phone, Stethoscope, GraduationCap, DollarSign } from 'lucide-react';

function DoctorProfilePage() {
  const { user, setUser, getMe } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const profile = user?.profile || {};
  
  const [formData, setFormData] = useState({
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    phone: profile.phone || '',
    specialization: profile.specialization || '',
    qualification: profile.qualification || '',
    consultation_fee: profile.consultation_fee || 0,
    is_available: profile.is_available ?? true,
  });

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        first_name: user.profile.first_name || '',
        last_name: user.profile.last_name || '',
        phone: user.profile.phone || '',
        specialization: user.profile.specialization || '',
        qualification: user.profile.qualification || '',
        consultation_fee: user.profile.consultation_fee || 0,
        is_available: user.profile.is_available ?? true,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        consultation_fee: Number(formData.consultation_fee),
      };
      await updateDoctor(profile.id, payload);
      setSuccess('Profile updated successfully!');
      
      // Refresh AuthContext user to reflect changes site-wide
      if (typeof getMe === 'function') {
        const updatedUser = await getMe();
        if (updatedUser) setUser(updatedUser);
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
          <p className="text-gray-500 mt-2">Manage your public profile and availability</p>
        </header>

        {error && <ErrorMessage message={error} />}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            <p className="font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 space-y-8">
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-900">Available Today</h3>
              <p className="text-sm text-gray-500">Toggle this off if you are not taking new patients.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer transform scale-110">
              <input
                type="checkbox"
                name="is_available"
                checked={formData.is_available}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
            </label>
          </div>

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
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Consultation Fee ($)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="consultation_fee"
                  min="0"
                  step="0.01"
                  value={formData.consultation_fee}
                  onChange={handleChange}
                  className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Stethoscope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Qualification</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GraduationCap className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  className="pl-10 w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
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

export default DoctorProfilePage;
