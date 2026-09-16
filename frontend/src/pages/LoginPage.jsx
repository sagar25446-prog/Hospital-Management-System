import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';
import { ErrorMessage } from '../components/common';
import { Activity, HeartPulse, Shield, Clock, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: Clock, title: 'Live Queue Tracking', desc: 'Know your position in real-time' },
  { icon: Users, title: 'Smart Scheduling', desc: 'AI-powered appointment slots' },
  { icon: Shield, title: 'Secure Records', desc: 'HIPAA-grade data protection' },
  { icon: Zap, title: 'Instant Payments', desc: 'Pay consultations via Razorpay' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState('');

  function handleGoogleSuccess(data) {
    setError('');
    if (data.user) setUser(data.user);

    // Check if user needs onboarding (no phone number means incomplete profile)
    const profile = data.user?.profile;
    const needsOnboarding = data.user?.role === 'patient' && (!profile || !profile.phone);

    if (needsOnboarding) {
      navigate('/onboarding', { replace: true });
    } else {
      const role = data.user?.role;
      navigate(role === 'doctor' ? '/doctor/queue' : '/', { replace: true });
    }
  }

  return (
    <main className="min-h-screen flex" aria-label="Login">
      {/* Left side: Premium branding */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-white/10 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-teal-400/15 blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center space-x-3"
          >
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20">
              <img src="/logo.jpg" alt="Q-Care" className="h-8 w-8 rounded-lg" />
            </div>
            <span className="text-2xl font-display font-bold tracking-tight text-white">Q-Care</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h1 className="text-5xl font-display font-bold leading-tight mb-6 text-white">
              Healthcare,<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-cyan-200">reimagined.</span>
            </h1>
            <p className="text-lg text-indigo-100/80 max-w-md mb-10">
              Book appointments, track your queue in real-time, and manage your health journey — all from one beautiful platform.
            </p>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                  className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/15 transition-all duration-300"
                >
                  <f.icon className="h-5 w-5 text-teal-300 mb-2" />
                  <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                  <p className="text-xs text-indigo-200/70 mt-0.5">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="flex items-center space-x-4 text-sm text-indigo-200/60">
            <HeartPulse className="h-5 w-5" />
            <span>Trusted by 50+ hospitals across India</span>
          </div>
        </div>
      </div>

      {/* Right side: Google sign-in */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-100/40 to-transparent rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-teal-100/30 to-transparent rounded-full blur-3xl -ml-40 -mb-40" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 mb-4">
              <img src="/logo.jpg" alt="Q-Care" className="h-10 w-10 rounded-lg" />
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Q-Care</h1>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl border border-white/70 shadow-xl shadow-slate-200/50 rounded-3xl p-8 sm:p-10">
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 mb-6"
              >
                <Activity className="h-10 w-10 text-indigo-600" />
              </motion.div>
              <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">Welcome to Q-Care</h2>
              <p className="text-gray-500">Sign in with your Google account to continue</p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
                <ErrorMessage message={error} />
              </motion.div>
            )}

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setError('');
                const email = e.target.email.value;
                const password = e.target.password.value;
                try {
                  const res = await fetch(import.meta.env.VITE_API_URL + '/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || 'Login failed');
                  handleGoogleSuccess({ user: data.user });
                } catch (err) {
                  setError(err.message);
                }
              }}
              className="space-y-4 mb-6"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input type="email" name="email" required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <input type="password" name="password" required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">Forgot Password?</button>
              </div>
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                Sign In
              </button>
            </form>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <div className="space-y-6">
              <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={setError} />

              <div className="text-center">
                <p className="text-xs text-gray-400 leading-relaxed">
                  By signing in, you agree to our{' '}
                  <span className="text-indigo-500 hover:text-indigo-600 cursor-pointer">Terms of Service</span>
                  {' '}and{' '}
                  <span className="text-indigo-500 hover:text-indigo-600 cursor-pointer">Privacy Policy</span>
                </p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center space-x-6 text-xs text-gray-400">
                <div className="flex items-center space-x-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  <span>256-bit SSL</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  <span>HIPAA Ready</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <HeartPulse className="h-3.5 w-3.5" />
                  <span>99.9% Uptime</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
