import { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Activity, CalendarPlus, FileText, 
  User, LogOut, Menu, X, ChevronRight, Building2, Search
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = user?.role;

  // Don't wrap if not authenticated
  if (!user) return <Outlet />;

  // Navigation Links based on role
  const getNavLinks = () => {
    if (role === 'patient') {
      return [
        { name: 'Find Hospitals', path: '/hospitals', icon: Search },
        { name: 'Medical Records', path: '/medical-records', icon: FileText },
      ];
    } else if (role === 'doctor') {
      return [
        { name: 'My Queue', path: '/doctor/queue', icon: Activity },
        { name: 'Profile', path: '/doctor/profile', icon: User },
      ];
    } else if (role === 'admin' || role === 'reception') {
      return [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Hospitals', path: '/hospitals', icon: Building2 },
        { name: 'Doctors', path: '/doctors', icon: User },
      ];
    }
    return [];
  };

  // CTA button for patients
  const ctaButton = (role === 'patient') ? { name: 'Book Appointment', path: '/hospitals', icon: CalendarPlus } : null;

  const navLinks = getNavLinks();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-premium relative overflow-hidden font-sans flex flex-col">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none fixed">
        <div className="premium-blur bg-indigo-300/30 w-[600px] h-[600px] top-[-10%] left-[-10%]" />
        <div className="premium-blur bg-teal-300/30 w-[500px] h-[500px] bottom-[-20%] right-[-10%]" style={{ animationDelay: '2s' }} />
      </div>

      {/* Global Navbar */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/60 mx-4 mt-4 mb-4 sm:mb-8 rounded-2xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-brand-600 to-medical-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                  <Activity className="h-6 w-6" />
                </div>
                <span className="font-display font-bold text-2xl text-dark tracking-tight hidden sm:block">Q-Care</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-2 lg:space-x-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname.startsWith(link.path) && link.path !== '/' || location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full transition-all ${
                      isActive 
                        ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.name}
                  </Link>
                );
              })}
              
              {/* Prominent CTA Button for Patients */}
              {ctaButton && (
                <Link
                  to={ctaButton.path}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold rounded-full bg-gradient-to-r from-medical-600 to-brand-600 text-white shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 transition-all hover:-translate-y-0.5"
                >
                  <ctaButton.icon className="h-4 w-4" />
                  {ctaButton.name}
                </Link>
              )}

              <div className="h-6 w-px bg-slate-200 mx-2" />
              
              {/* User account info */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user?.profile?.first_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs font-bold text-slate-700 leading-none">{user?.profile?.first_name || 'Account'}</p>
                    <p className="text-[10px] text-slate-400 font-medium capitalize">{role}</p>
                  </div>
                </div>
                {role === 'patient' && (
                  <Link to="/profile" className="text-xs font-medium text-slate-500 hover:text-brand-600 transition-colors">Profile</Link>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600 bg-white border border-slate-200 hover:border-red-100 px-3 py-2 rounded-full shadow-sm transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Sign out</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden border-t border-slate-100 bg-white/90 backdrop-blur-xl rounded-b-2xl"
            >
              <div className="px-4 pt-2 pb-4 space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname.startsWith(link.path) && link.path !== '/' || location.pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium ${
                        isActive 
                          ? 'bg-brand-50 text-brand-700' 
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {link.name}
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-base font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
