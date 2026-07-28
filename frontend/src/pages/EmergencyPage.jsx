import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, AlertTriangle, Flame, Shield, Siren, Heart,
  ChevronDown, ChevronUp, Activity, Droplets, Bone, Zap, Baby
} from 'lucide-react';

const EMERGENCY_NUMBERS = [
  { label: 'Ambulance', number: '108', icon: Siren, color: 'bg-red-600', desc: 'National Ambulance Service' },
  { label: 'Police', number: '100', icon: Shield, color: 'bg-blue-700', desc: 'Police Emergency' },
  { label: 'Fire', number: '101', icon: Flame, color: 'bg-orange-600', desc: 'Fire Brigade' },
  { label: 'Women Helpline', number: '1091', icon: Phone, color: 'bg-pink-600', desc: 'Women in Distress' },
  { label: 'Child Helpline', number: '1098', icon: Baby, color: 'bg-green-600', desc: 'Child Abuse / Missing' },
  { label: 'Mental Health', number: '08046110007', icon: Heart, color: 'bg-purple-600', desc: 'iCall Helpline' },
];

const FIRST_AID = [
  {
    title: '🫀 Heart Attack',
    symptoms: 'Crushing chest pain, pain radiating to left arm/jaw, sweating, nausea.',
    steps: [
      'Call 108 (ambulance) immediately.',
      'Have the person sit down and rest in a comfortable position.',
      'If they have prescribed nitroglycerin, help them take it.',
      'Give aspirin (325mg) if they are not allergic and conscious.',
      'If the person becomes unconscious and stops breathing, begin CPR.',
    ],
  },
  {
    title: '🫁 Choking',
    symptoms: 'Cannot speak, cough, or breathe. May clutch throat.',
    steps: [
      'Ask "Are you choking?" — if they nod, act immediately.',
      'Stand behind the person, wrap your arms around their waist.',
      'Place your fist just above their navel, thumb side in.',
      'Grasp your fist with the other hand and press hard with quick upward thrusts.',
      'Repeat until the object is expelled or the person can breathe.',
    ],
  },
  {
    title: '🔥 Burns',
    symptoms: 'Red, blistered, or charred skin. Intense pain.',
    steps: [
      'Cool the burn under cool (not ice-cold) running water for at least 10 minutes.',
      'Remove jewelry or tight clothing near the burned area before swelling starts.',
      'Do NOT pop blisters — they protect against infection.',
      'Cover loosely with a sterile non-stick bandage.',
      'Take an over-the-counter pain reliever if needed.',
      'Seek medical help for burns larger than 3 inches or on the face/hands/joints.',
    ],
  },
  {
    title: '🦴 Fractures',
    symptoms: 'Intense pain, swelling, deformity, inability to move the limb.',
    steps: [
      'Do NOT try to straighten or realign the bone.',
      'Immobilize the injured area — use a splint or padded boards.',
      'Apply ice packs wrapped in cloth to reduce swelling (never directly on skin).',
      'If bleeding, apply gentle pressure with a clean cloth.',
      'Keep the person still and call for emergency medical help.',
    ],
  },
  {
    title: '🩸 Severe Bleeding',
    symptoms: 'Blood spurting or flowing steadily from a wound.',
    steps: [
      'Apply firm, direct pressure on the wound with a clean cloth.',
      'Do NOT remove the cloth — add more layers on top if blood soaks through.',
      'If possible, elevate the injured limb above the heart.',
      'Call 108 immediately for heavy bleeding.',
      'Keep applying pressure until help arrives.',
    ],
  },
  {
    title: '⚡ Seizure',
    symptoms: 'Sudden uncontrolled shaking, loss of consciousness, stiffness.',
    steps: [
      'Clear the area of anything hard or sharp.',
      'Ease the person onto the floor and turn them on their side.',
      'Do NOT hold them down or put anything in their mouth.',
      'Time the seizure — call 108 if it lasts more than 5 minutes.',
      'Stay with them until they are fully conscious and oriented.',
    ],
  },
  {
    title: '🫀 CPR Instructions',
    symptoms: 'Person is unresponsive and not breathing normally.',
    steps: [
      'Call 108 immediately (or ask someone nearby to call).',
      'Place the heel of one hand on the center of the chest, between the nipples.',
      'Place your other hand on top and interlock fingers.',
      'Push hard and fast — at least 2 inches deep, at 100-120 compressions per minute.',
      'After 30 compressions, tilt head back, lift chin, give 2 rescue breaths.',
      'Continue the cycle (30:2) until help arrives or the person starts breathing.',
    ],
  },
];

export default function EmergencyPage() {
  const [openSection, setOpenSection] = useState(null);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Emergency Banner */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white py-6 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center gap-3 mb-2"
          >
            <AlertTriangle className="h-8 w-8 animate-pulse" />
            <h1 className="text-3xl md:text-4xl font-display font-bold">Emergency Services</h1>
            <AlertTriangle className="h-8 w-8 animate-pulse" />
          </motion.div>
          <p className="text-red-100 text-lg">
            If you are in immediate danger, call <strong>112</strong> (National Emergency Number)
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Quick Call Buttons */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5 text-red-600" /> One-Tap Emergency Calls
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {EMERGENCY_NUMBERS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.a
                  key={item.number}
                  href={`tel:${item.number}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`${item.color} text-white rounded-2xl p-5 text-center hover:opacity-90 transition-opacity shadow-lg`}
                >
                  <Icon className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-bold text-lg">{item.label}</p>
                  <p className="text-2xl font-display font-black mt-1">{item.number}</p>
                  <p className="text-xs opacity-80 mt-1">{item.desc}</p>
                </motion.a>
              );
            })}
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-600" /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/hospitals"
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg transition-shadow text-center"
            >
              <Siren className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="font-bold text-slate-900">Find Nearest Hospital</p>
              <p className="text-sm text-slate-500 mt-1">Browse hospitals by city</p>
            </Link>
            <Link
              to="/symptom-checker"
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg transition-shadow text-center"
            >
              <Heart className="h-8 w-8 text-brand-500 mx-auto mb-2" />
              <p className="font-bold text-slate-900">Symptom Checker</p>
              <p className="text-sm text-slate-500 mt-1">Find the right specialist</p>
            </Link>
            <Link
              to="/book"
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg transition-shadow text-center"
            >
              <Zap className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="font-bold text-slate-900">Book Urgent Appointment</p>
              <p className="text-sm text-slate-500 mt-1">Get seen today</p>
            </Link>
          </div>
        </section>

        {/* First Aid Guide */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" /> First Aid Guide
          </h2>
          <div className="space-y-3">
            {FIRST_AID.map((item, idx) => {
              const isOpen = openSection === idx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenSection(isOpen ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-bold text-slate-900 text-lg">{item.title}</span>
                    {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 space-y-3">
                          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                            <p className="text-sm text-amber-800"><strong>Signs:</strong> {item.symptoms}</p>
                          </div>
                          <ol className="space-y-2">
                            {item.steps.map((step, i) => (
                              <li key={i} className="flex gap-3 items-start">
                                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="text-slate-700 text-sm">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>

        <div className="text-center text-sm text-slate-400 py-4">
          ⚠️ This information is for educational purposes only. In a real emergency, always call 112 or 108 first.
        </div>
      </div>
    </main>
  );
}
