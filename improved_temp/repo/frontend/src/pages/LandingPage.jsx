import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight, Activity, Clock, ShieldCheck, Users, ClipboardList,
  Brain, HeartPulse, Sparkles, Bone, Stethoscope, Pill,
} from 'lucide-react';
import { getSpecialistVisual } from '../utils/specialistIcons';

const ICONS = { Brain, HeartPulse, Sparkles, Bone, Stethoscope, Pill };

const FEATURED_SERVICES = [
  { specialist: 'Cardiologist', desc: 'Heart & cardiovascular care, from routine checks to complex cases.' },
  { specialist: 'Neurologist', desc: 'Brain, spine & nervous system diagnosis and treatment.' },
  { specialist: 'Pediatrician', desc: 'Gentle, specialist care for infants, children & teens.' },
  { specialist: 'Orthopedic', desc: 'Bone, joint & muscle care, including sports injuries.' },
  { specialist: 'Dermatologist', desc: 'Skin, hair & nail conditions, diagnosed and treated.' },
  { specialist: 'General Medicine', desc: 'Primary care for everyday health and wellness.' },
];

const STEPS = [
  { n: '01', title: 'Create an account', desc: 'Sign up as a patient in under a minute, or continue with Google.' },
  { n: '02', title: 'Book or walk in', desc: 'Choose a specialist and time slot, or get a same-day walk-in ticket.' },
  { n: '03', title: 'Get your ticket', desc: 'A queue number is issued the moment your visit is confirmed.' },
  { n: '04', title: 'Tracked live', desc: 'Watch your position update in real time — no guessing, no sitting blind.' },
];

/**
 * The hero's centerpiece: a "now serving" ticket stub. This is deliberately
 * the literal thing a patient waits for in a real clinic, standing in for
 * a generic hero photo — it's the one thing this product actually does.
 */
function TicketPreview() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="ticket-stub p-8 pt-10 w-full max-w-sm mx-auto lg:mx-0">
      <div className="flex items-center justify-between mb-6">
        <span className="eyebrow">
          <span className="w-1.5 h-1.5 rounded-full bg-signal-500 animate-pulse" />
          Now serving
        </span>
        <span className="text-xs font-mono text-ink-400">Dr. R. Nair · Cardiology</span>
      </div>

      <div
        className={`font-mono text-7xl font-bold text-ink tracking-tight ${mounted ? 'animate-flip-in' : 'opacity-0'}`}
        style={{ transformOrigin: 'center' }}
      >
        B-042
      </div>

      <div className="mt-6 pt-6 border-t border-dashed border-ink-100 flex items-center justify-between text-sm">
        <div>
          <p className="text-ink-400 font-mono text-xs uppercase tracking-wide">Your ticket</p>
          <p className="font-mono text-lg font-semibold text-ink">B-045</p>
        </div>
        <div className="text-right">
          <p className="text-ink-400 font-mono text-xs uppercase tracking-wide">Estimated wait</p>
          <p className="font-mono text-lg font-semibold text-signal-600">~12 min</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-ink-400">3 people ahead of you · updates automatically</p>
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-paper/90 backdrop-blur-md border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18 py-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-ink flex items-center justify-center">
                <Activity className="text-white w-5 h-5" />
              </div>
              <span className="font-display font-semibold text-xl tracking-tight text-ink">
                Q-Care
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#how-it-works" className="text-ink-400 hover:text-ink font-medium text-sm transition-colors">How it works</a>
              <a href="#services" className="text-ink-400 hover:text-ink font-medium text-sm transition-colors">Specialists</a>
              <Link to="/doctors" className="text-ink-400 hover:text-ink font-medium text-sm transition-colors">Find a doctor</Link>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary !py-2 !px-4 text-sm">
                  Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="hidden md:inline-flex text-ink font-medium text-sm hover:text-signal-600 transition-colors">
                    Sign in
                  </Link>
                  <Link to="/register" className="btn-primary !py-2 !px-4 text-sm">
                    Book appointment
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative pt-32 pb-20 lg:pt-44 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-xl animate-rise">
              <span className="eyebrow mb-5">
                <ClipboardList className="w-3.5 h-3.5" /> Queue &amp; appointment platform
              </span>
              <h1 className="text-5xl lg:text-6xl font-display font-semibold leading-[1.05] mb-6 text-ink">
                Skip the waiting room.
                <br />
                Not the care.
              </h1>
              <p className="text-lg text-ink-400 mb-8 leading-relaxed max-w-lg">
                Book with a specialist, get a live queue ticket, and see exactly how many
                people are ahead of you — from your phone, not a plastic chair.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/register" className="btn-primary py-3.5 px-7 text-base">
                  Book an appointment <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/doctors" className="btn-secondary py-3.5 px-7 text-base">
                  View specialists
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-signal-600 w-4 h-4" /> JWT-secured accounts
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="text-ticket-500 w-4 h-4" /> Live queue position
                </div>
                <div className="flex items-center gap-2">
                  <Users className="text-ink-600 w-4 h-4" /> Patient, doctor &amp; front-desk views
                </div>
              </div>
            </div>

            <TicketPreview />
          </div>
        </div>
      </div>

      {/* How it works — a real sequence, so numbering carries information */}
      <section id="how-it-works" className="py-20 bg-white border-y border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-14">
            <span className="eyebrow mb-4">How it works</span>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-ink">
              Four steps between you and being seen.
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.n} className="relative pl-0">
                <div className="font-mono text-sm text-ticket-500 font-semibold mb-3">{step.n}</div>
                <h3 className="font-display text-lg font-semibold text-ink mb-2">{step.title}</h3>
                <p className="text-sm text-ink-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 bg-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-14">
            <span className="eyebrow mb-4">Specialists</span>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-ink mb-4">
              Care across the specialties you'd expect
            </h2>
            <p className="text-ink-400">
              Every doctor on the platform sets their own schedule — you book into real, current availability.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURED_SERVICES.map((service) => {
              const visual = getSpecialistVisual(service.specialist);
              const Icon = ICONS[visual.icon] || Stethoscope;
              return (
                <Link
                  to={`/doctors?specialization=${encodeURIComponent(service.specialist)}`}
                  key={service.specialist}
                  className="card p-7 group"
                >
                  <div className={`w-12 h-12 rounded-xl ${visual.accent} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-ink mb-2">{visual.label}</h3>
                  <p className="text-sm text-ink-400 leading-relaxed">{service.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Built for every role — honest substitute for fabricated trust badges:
          this describes real RBAC roles that exist in the product. */}
      <section className="py-24 bg-ink text-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-14">
            <span className="eyebrow !text-ink-100 mb-4">Built for the whole visit</span>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-white">
              One system, four roles, no double-entry.
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-px bg-ink-600 rounded-2xl overflow-hidden">
            {[
              { role: 'Patients', desc: 'Book, join telehealth calls, and download prescriptions as PDFs.' },
              { role: 'Doctors', desc: 'Run a live queue, review history, and write digital prescriptions.' },
              { role: 'Front desk', desc: 'Register walk-ins and manage queues across every doctor at once.' },
              { role: 'Admins', desc: 'See patient volume, wait times and workload across the clinic.' },
            ].map((r) => (
              <div key={r.role} className="bg-ink p-7">
                <h3 className="font-display font-semibold text-white mb-2">{r.role}</h3>
                <p className="text-sm text-ink-100/70 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-ink-400 py-14 mt-auto border-t border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <Activity className="text-ink w-6 h-6" />
              <span className="font-display font-semibold text-xl text-ink">Q-Care</span>
            </div>
            <p className="text-sm max-w-md leading-relaxed">
              A queue and appointment platform for clinics: live tickets instead of a crowded
              waiting room, and one dashboard per role.
            </p>
          </div>
          <div>
            <h4 className="text-ink font-semibold mb-4 text-sm">Quick links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/doctors" className="hover:text-signal-600 transition-colors">Find a doctor</Link></li>
              <li><Link to="/book" className="hover:text-signal-600 transition-colors">Book appointment</Link></li>
              <li><Link to="/login" className="hover:text-signal-600 transition-colors">Patient login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-ink font-semibold mb-4 text-sm">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>Medical emergency? Call your local emergency number.</li>
              <li>Support: hello@qcarehospital.com</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-ink-100 text-xs">
          &copy; {new Date().getFullYear()} Q-Care. Built as a demo hospital queue platform.
        </div>
      </footer>
    </div>
  );
}
