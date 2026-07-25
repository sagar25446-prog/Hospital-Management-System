import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../api/auth.api';
import { ErrorMessage } from '../components/common';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';
import { Activity, Mail, Lock, HeartPulse } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginApi({ email, password });
      if (data.user) setUser(data.user);
      // Role-based redirect
      const role = data.user?.role;
      navigate(role === 'doctor' ? '/doctor/queue' : '/', { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSuccess(data) {
    setError('');
    if (data.user) setUser(data.user);
    const role = data.user?.role;
    navigate(role === 'doctor' ? '/doctor/queue' : '/', { replace: true });
  }

  return (
    <main className="min-h-screen flex" aria-label="Login">
      {/* Left side: branding/gradient */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-brand-600 via-brand-500 to-blue-600 p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-400 opacity-20 blur-3xl"></div>
        
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
            Smart queue management <br/><span className="text-brand-100">for modern hospitals.</span>
          </h1>
          <p className="text-lg text-brand-50 max-w-md">
            Streamline patient flow, reduce wait times, and enhance the healthcare experience for everyone.
          </p>
        </motion.div>
        
        <div className="relative z-10 flex items-center space-x-4 text-sm text-brand-100/80">
          <HeartPulse className="h-5 w-5" />
          <span>Care begins with efficiency</span>
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-premium relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none lg:hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-brand-500/10 via-transparent to-blue-500/10 blur-3xl"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="glass-panel p-8 sm:p-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-brand-50 text-brand-600 mb-6 lg:hidden">
                <Activity className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-500">Please enter your details to sign in.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
                  <ErrorMessage message={error} />
                </motion.div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors sm:text-sm"
                      placeholder="doctor@hospital.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors sm:text-sm"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 btn-premium"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign in securely'
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-400 font-medium tracking-wider">Or</span>
                </div>
              </div>

              <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={setError} />

              <p className="mt-6 text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                  Create one
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
