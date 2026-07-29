import { Link } from 'react-router-dom';
import { Activity, Calendar, Clock, HeartPulse, Shield, Smartphone, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../components/layout/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-200 selection:text-indigo-900 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/60 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/30">
              <img src="/logo.jpg" alt="Q-Care" className="h-7 w-7 rounded-md" />
            </div>
            <span className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500">
              Q-Care
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/doctors" className="hidden md:block text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              Find Doctors
            </Link>
            <Link to="/login" className="btn-premium">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative pt-24 pb-32 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 z-0">
             <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
             <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-teal-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }} />
             <div className="absolute -bottom-32 left-1/2 w-[600px] h-[600px] bg-violet-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '4s' }} />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-display font-extrabold text-slate-900 tracking-tight leading-tight mb-8">
                Healthcare management, <br className="hidden md:block" />
                <span className="text-gradient">reimagined.</span>
              </h1>
              <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Skip the waiting room. Book appointments, pay instantly, and track your queue position in real-time from your phone.
              </p>
              
              <div className="mt-12 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Link to="/login" className="btn-premium text-lg px-8 py-4 w-full sm:w-auto">
                  Get Started Now
                </Link>
                <Link to="/doctors" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto">
                  View Our Doctors
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-4">Why choose Q-Care?</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">Experience a hospital visit where everything is transparent, efficient, and built around your convenience.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Clock, title: "Live Queue Tracking", desc: "Never ask 'how much longer?' again. See your exact position in real-time." },
                { icon: Zap, title: "Instant Payments", desc: "Pay your consultation fees securely online via Razorpay before you arrive." },
                { icon: Smartphone, title: "100% Mobile Ready", desc: "Access all features from your phone without downloading any app." },
                { icon: Shield, title: "Secure Records", desc: "Your medical history and prescriptions are stored with military-grade encryption." },
                { icon: Calendar, title: "Smart Scheduling", desc: "Our AI prevents overbooking, ensuring doctors spend quality time with you." },
                { icon: HeartPulse, title: "Better Care", desc: "By removing administrative friction, doctors can focus entirely on your health." }
              ].map((feature, i) => (
                <motion.div 
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="glass-card p-8 group"
                >
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-7 w-7 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-indigo-900 via-violet-900 to-indigo-900 py-24 relative overflow-hidden">
           <div className="absolute inset-0">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-3xl" />
           </div>
           
           <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
              <h2 className="text-4xl font-display font-bold text-white mb-6">Ready to transform your healthcare experience?</h2>
              <p className="text-xl text-indigo-200 mb-10">Join thousands of patients who have already switched to the smarter way of visiting hospitals.</p>
              <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 rounded-full font-bold text-indigo-900 bg-white hover:bg-indigo-50 shadow-xl shadow-white/10 transition-all duration-300 transform hover:scale-105">
                Sign in with Google
              </Link>
           </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
