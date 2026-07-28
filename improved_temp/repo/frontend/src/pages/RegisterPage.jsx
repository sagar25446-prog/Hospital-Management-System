import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as registerApi } from '../api/auth.api';
import { ErrorMessage } from '../components/common';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';
import { Activity, Mail, Lock, User, Phone, HeartPulse, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';

const SPECIALIZATIONS = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Dermatology',
  'Pediatrics', 'Gynecology', 'Ophthalmology', 'ENT',
  'Gastroenterology', 'Oncology', 'Psychiatry', 'General Medicine',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [role, setRole] = useState('patient');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [fee, setFee] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    const payload = {
      role,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      password,
    };

    if (role === 'patient') {
      if (phone) payload.phone = phone.trim();
      if (dob) payload.date_of_birth = dob;
      if (gender) payload.gender = gender;
      if (bloodGroup) payload.blood_group = bloodGroup;
    } else if (role === 'doctor') {
      if (!specialization) { setError('Please select a specialization.'); return; }
      payload.specialization = specialization;
      if (qualification) payload.qualification = qualification.trim();
      if (fee) payload.consultation_fee = parseFloat(fee);
    }

    setLoading(true);
    try {
      const data = await registerApi(payload);
      if (data.user) setUser(data.user);
      // Role-based redirect
      const userRole = data.user?.role || role;
      navigate(userRole === 'doctor' ? '/doctor/queue' : '/', { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSuccess(data) {
    setError('');
    if (data.user) setUser(data.user);
    const userRole = data.user?.role || 'patient';
    navigate(userRole === 'doctor' ? '/doctor/queue' : '/', { replace: true });
  }

  return (
    <main className="min-h-screen flex" aria-label="Register">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-brand-600 via-brand-500 to-blue-600 p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white opacity-10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-400 opacity-20 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex items-center space-x-3"
        >
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tight">Q-Care</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative z-10"
        >
          <h1 className="text-5xl font-display font-bold leading-tight mb-6">
            Join the future of <br /><span className="text-brand-100">patient care.</span>
          </h1>
          <p className="text-lg text-brand-50 max-w-md">
            Create your account to get started with smart, efficient hospital queue management.
          </p>
        </motion.div>

        <div className="relative z-10 flex items-center space-x-4 text-sm text-brand-100/80">
          <HeartPulse className="h-5 w-5" />
          <span>Care begins with efficiency</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-premium relative overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10 py-8"
        >
          <div className="glass-panel p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-brand-50 text-brand-600 mb-4 lg:hidden">
                <Activity className="h-7 w-7" />
              </div>
              <h2 className="text-3xl font-display font-bold text-gray-900 mb-1">Create account</h2>
              <p className="text-gray-500">Register as patient or doctor</p>
            </div>

            {/* Role selector */}
            <div className="flex rounded-2xl bg-gray-100 p-1 mb-6">
              {[
                { value: 'patient', icon: User, label: 'Patient' },
                { value: 'doctor', icon: Stethoscope, label: 'Doctor' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    role === value
                      ? 'bg-white text-brand-600 shadow-sm border border-gray-200'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
                  <ErrorMessage message={error} />
                </motion.div>
              )}

              <div className="space-y-4">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="first-name">First Name</label>
                    <input
                      id="first-name"
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Raj"
                      className="block w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors sm:text-sm"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="last-name">Last Name</label>
                    <input
                      id="last-name"
                      type="text"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Sharma"
                      className="block w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors sm:text-sm"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="reg-email">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@hospital.com"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors sm:text-sm"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="reg-pass">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="reg-pass"
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors sm:text-sm"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Patient-specific fields */}
                {role === 'patient' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="reg-phone">Phone</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <Phone className="h-5 w-5" />
                        </div>
                        <input
                          id="reg-phone"
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="+91 9999999999"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors sm:text-sm"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="reg-dob">Date of Birth</label>
                        <input
                          id="reg-dob"
                          type="date"
                          value={dob}
                          onChange={e => setDob(e.target.value)}
                          className="block w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors sm:text-sm"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="reg-gender">Gender</label>
                        <select
                          id="reg-gender"
                          value={gender}
                          onChange={e => setGender(e.target.value)}
                          className="block w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors sm:text-sm bg-white"
                          disabled={loading}
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="reg-bg">Blood Group</label>
                      <select
                        id="reg-bg"
                        value={bloodGroup}
                        onChange={e => setBloodGroup(e.target.value)}
                        className="block w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors sm:text-sm bg-white"
                        disabled={loading}
                      >
                        <option value="">Select blood group</option>
                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* Doctor-specific fields */}
                {role === 'doctor' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="reg-spec">Specialization *</label>
                      <select
                        id="reg-spec"
                        value={specialization}
                        onChange={e => setSpecialization(e.target.value)}
                        required
                        className="block w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors sm:text-sm bg-white"
                        disabled={loading}
                      >
                        <option value="">Select specialization</option>
                        {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="reg-qual">Qualification</label>
                      <input
                        id="reg-qual"
                        type="text"
                        value={qualification}
                        onChange={e => setQualification(e.target.value)}
                        placeholder="MBBS, MD"
                        className="block w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors sm:text-sm"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="reg-fee">Consultation Fee (₹)</label>
                      <input
                        id="reg-fee"
                        type="number"
                        min="0"
                        value={fee}
                        onChange={e => setFee(e.target.value)}
                        placeholder="500"
                        className="block w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors sm:text-sm"
                        disabled={loading}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !firstName || !lastName || !email || !password}
                className="w-full mt-8 btn-premium"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>

              {role === 'patient' && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-gray-400 font-medium tracking-wider">Or</span>
                    </div>
                  </div>
                  <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={setError} />
                </>
              )}

              <p className="mt-6 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
