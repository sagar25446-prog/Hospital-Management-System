import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Activity, CalendarPlus, FileText, 
  User, LogOut, Menu, X, ChevronDown, Building2, Search,
  Stethoscope, AlertTriangle, Settings, ChevronRight
} from 'lucide-react';
import Footer from './Footer';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const role = user?.role;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Don't wrap if not authenticated
  if (!user) return <Outlet />;

  const firstName = user?.profile?.first_name || user?.email?.split('@')[0] || 'User';
  const initial = firstName.charAt(0).toUpperCase();

  // Navigation Links based on role
  const getNavLinks = () => {
    if (role === 'patient') {
      return [
        { name: 'Find Hospitals', path: '/hospitals', icon: Search },
        { name: 'Symptom Checker', path: '/symptom-checker', icon: Stethoscope },
        { name: 'Medical Records', path: '/medical-records', icon: FileText },
        { name: 'Emergency', path: '/emergency', icon: AlertTriangle },
      ];
    } else if (role === 'doctor') {
      return [
        { name: 'My Queue', path: '/doctor/queue', icon: Activity },
      ];
    } else if (role === 'admin' || role === 'reception') {
      return [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Hospitals', path: '/hospitals', icon: Building2 },
        { name: 'Doctors', path: '/doctors', icon: User },
        { name: 'Symptom Checker', path: '/symptom-checker', icon: Stethoscope },
      ];
    }
    return [];
  };

  const ctaButton = (role === 'patient') ? { name: 'Book Appointment', path: '/hospitals', icon: CalendarPlus } : null;
  const navLinks = getNavLinks();

  // Profile dropdown links based on role
  const profileLinks = [];
  if (role === 'patient') {
    profileLinks.push({ name: 'My Profile', path: '/profile', icon: User });
    profileLinks.push({ name: 'Medical Records', path: '/medical-records', icon: FileText });
  } else if (role === 'doctor') {
    profileLinks.push({ name: 'My Profile', path: '/doctor/profile', icon: User });
  }

  const handleLogout = async () => {
    setProfileOpen(false);
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
            <div className="hidden md:flex md:items-center md:space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname.startsWith(link.path) && link.path !== '/' || location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-full transition-all ${
                      isActive 
                        ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{link.name}</span>
                  </Link>
                );
              })}
              
              {/* CTA Button */}
              {ctaButton && (
                <Link
                  to={ctaButton.path}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-full bg-gradient-to-r from-medical-600 to-brand-600 text-white shadow-md shadow-brand-500/20 hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  <ctaButton.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{ctaButton.name}</span>
                </Link>
              )}

              <div className="h-6 w-px bg-slate-200 mx-1" />
              
              {/* ── Apollo-style Profile Avatar with Dropdown ── */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-slate-50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      initial
                    )}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50"
                    >
                      {/* User Info Header */}
                      <div className="px-4 py-3 bg-gradient-to-br from-brand-50 to-indigo-50 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-base font-bold shadow-sm">
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{firstName} {user?.profile?.last_name || ''}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            <span className="inline-block mt-0.5 px-2 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-bold rounded-full uppercase">{role}</span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Links */}
                      <div className="py-1">
                        {profileLinks.map((link) => {
                          const Icon = link.icon;
                          return (
                            <Link
                              key={link.path}
                              to={link.path}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Icon className="h-4 w-4 text-slate-400" />
                              {link.name}
                              <ChevronRight className="h-4 w-4 text-slate-300 ml-auto" />
                            </Link>
                          );
                        })}
                        
                        {role === 'patient' && (
                          <Link
                            to="/book"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <CalendarPlus className="h-4 w-4 text-slate-400" />
                            Book Appointment
                            <ChevronRight className="h-4 w-4 text-slate-300 ml-auto" />
                          </Link>
                        )}
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-slate-100 py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-3 md:hidden">
              {/* Mobile avatar */}
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {initial}
              </div>
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
                {/* User info in mobile */}
                <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-50 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                    {initial}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{firstName}</p>
                    <p className="text-xs text-slate-500 capitalize">{role}</p>
                  </div>
                </div>

                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname.startsWith(link.path) && link.path !== '/' || location.pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
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

                {/* Profile link in mobile */}
                {profileLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50"
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
                  Sign Out
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

      <Footer />
    </div>
  );
}
