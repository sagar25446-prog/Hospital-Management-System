import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Activity, Clock, ShieldCheck, Star } from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-medical-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Activity className="text-white w-6 h-6" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight text-dark">
                Q-Care <span className="text-brand-500">Hospital</span>
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Services</a>
              <a href="#specialists" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Specialists</a>
              <a href="#reviews" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Testimonials</a>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-premium">
                  Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="hidden md:inline-flex text-brand-700 font-medium hover:text-brand-800 transition-colors">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-premium">
                    Book Appointment
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-300/20 blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-40 -left-20 w-72 h-72 rounded-full bg-medical-300/20 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="max-w-2xl animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-sm font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-medical-500 animate-pulse"></span>
                Voted #1 Healthcare Platform 2026
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
                Premium Healthcare, <br />
                <span className="text-gradient">Zero Waiting Time.</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-600 mb-8 leading-relaxed max-w-xl">
                Experience world-class medical care with our advanced digital queue system. Book top specialists, track your turn live, and access your digital medical records instantly.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="btn-premium py-4 px-8 text-lg w-full sm:w-auto">
                  Book an Appointment <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link to="/doctors" className="btn-secondary py-4 px-8 text-lg w-full sm:w-auto">
                  View Specialists
                </Link>
              </div>
              
              <div className="mt-10 flex items-center gap-6 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-medical-500 w-5 h-5" /> Highly Secure EMR
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="text-brand-500 w-5 h-5" /> Live Queue Tracking
                </div>
              </div>
            </div>

            {/* Right Image/Mockup */}
            <div className="relative lg:ml-auto animate-fade-in-right">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-brand-900/20 border-8 border-white/50 bg-white transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="/hero-image.png" 
                  alt="Modern Hospital Building" 
                  className="w-full h-auto object-cover"
                />
                
                {/* Floating Glass UI Elements */}
                <div className="absolute -left-6 bottom-12 glass-panel p-4 flex items-center gap-4 animate-float">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Star className="text-green-600 w-6 h-6 fill-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-dark">4.9/5 Rating</p>
                    <p className="text-xs text-slate-500">From 10,000+ Patients</p>
                  </div>
                </div>
                
                <div className="absolute -right-8 top-12 glass-panel p-4 flex items-center gap-4 animate-float" style={{ animationDelay: '1.5s' }}>
                  <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                    <Activity className="text-brand-600 w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-dark">Dr. Sarah Jenkins</p>
                    <p className="text-xs text-brand-600 font-medium">Available Now</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Services Section */}
      <section id="services" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">World-Class Medical <span className="text-brand-600">Services</span></h2>
            <p className="text-lg text-slate-600">From preventive care to complex surgeries, our state-of-the-art facility is equipped to handle all your healthcare needs.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Cardiology', desc: 'Advanced heart care with top-tier specialists.', icon: '🫀', color: 'bg-red-50 text-red-600' },
              { title: 'Neurology', desc: 'Comprehensive brain and nervous system treatments.', icon: '🧠', color: 'bg-indigo-50 text-indigo-600' },
              { title: 'Pediatrics', desc: 'Gentle, expert care for infants, children, and teens.', icon: '👶', color: 'bg-teal-50 text-teal-600' },
              { title: 'Orthopedics', desc: 'Specialized bone, joint, and muscle care.', icon: '🦴', color: 'bg-orange-50 text-orange-600' },
              { title: 'Dermatology', desc: 'Advanced skin, hair, and nail treatments.', icon: '✨', color: 'bg-pink-50 text-pink-600' },
              { title: 'General Medicine', desc: 'Primary care for overall health and wellness.', icon: '🩺', color: 'bg-blue-50 text-blue-600' }
            ].map((service, i) => (
              <div key={i} className="glass-card p-8 group hover:-translate-y-2 cursor-pointer">
                <div className={`w-16 h-16 rounded-2xl ${service.color} flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-slate-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-dark text-slate-300 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="text-brand-500 w-8 h-8" />
              <span className="font-display font-bold text-2xl text-white">Q-Care Hospital</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              A premium, intelligent healthcare platform designed to minimize wait times and maximize patient care. Providing world-class medical services since 2026.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/doctors" className="hover:text-brand-400 transition-colors">Find a Doctor</Link></li>
              <li><Link to="/book" className="hover:text-brand-400 transition-colors">Book Appointment</Link></li>
              <li><Link to="/login" className="hover:text-brand-400 transition-colors">Patient Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              <li>Emergency: 911</li>
              <li>Support: 1-800-QCARE</li>
              <li>hello@qcarehospital.com</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Q-Care Hospital Management System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
