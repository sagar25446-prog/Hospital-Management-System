import { Link } from 'react-router-dom';
import { Activity, Phone, Mail, MapPin, Heart, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                <Activity className="h-5 w-5" />
              </div>
              <span className="font-display font-bold text-xl text-white">Q-Care</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              India's smart hospital queue management and appointment booking platform. 
              Skip the wait, not the care.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/hospitals" className="text-sm hover:text-white transition-colors">Find Hospitals</Link></li>
              <li><Link to="/doctors" className="text-sm hover:text-white transition-colors">Find Doctors</Link></li>
              <li><Link to="/symptom-checker" className="text-sm hover:text-white transition-colors">Symptom Checker</Link></li>
              <li><Link to="/emergency" className="text-sm hover:text-white transition-colors">Emergency Services</Link></li>
            </ul>
          </div>

          {/* For Patients */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4">For Patients</h3>
            <ul className="space-y-2">
              <li><Link to="/book" className="text-sm hover:text-white transition-colors">Book Appointment</Link></li>
              <li><Link to="/medical-records" className="text-sm hover:text-white transition-colors">Medical Records</Link></li>
              <li><Link to="/profile" className="text-sm hover:text-white transition-colors">My Profile</Link></li>
              <li><Link to="/login" className="text-sm hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4">Contact & Support</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-brand-400" />
                <span>Emergency: <strong className="text-white">112</strong></span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-brand-400" />
                <span>support@qcare.health</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-brand-400" />
                <span>Pan-India Service</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Q-Care Health Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> HIPAA-aware Design</span>
            <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-red-400" /> Made in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
