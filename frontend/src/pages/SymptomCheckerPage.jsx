import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Heart, Bone, Eye, Baby, Stethoscope, Activity,
  Shield, Pill, Wind, Droplets, ChevronRight, CheckCircle2,
  Sparkles, Search, ArrowRight
} from 'lucide-react';

const BODY_AREAS = [
  {
    id: 'head', label: 'Head & Brain', icon: Brain, color: 'from-purple-500 to-indigo-600',
    symptoms: ['Headache', 'Dizziness', 'Memory issues', 'Migraine', 'Fainting'],
    specialty: 'Neurology',
  },
  {
    id: 'chest', label: 'Heart & Chest', icon: Heart, color: 'from-red-500 to-rose-600',
    symptoms: ['Chest pain', 'Palpitations', 'Shortness of breath', 'High blood pressure'],
    specialty: 'Cardiology',
  },
  {
    id: 'stomach', label: 'Stomach & Digestion', icon: Activity, color: 'from-amber-500 to-orange-600',
    symptoms: ['Abdominal pain', 'Bloating', 'Acid reflux', 'Nausea', 'Constipation'],
    specialty: 'Gastroenterology',
  },
  {
    id: 'bones', label: 'Bones & Joints', icon: Bone, color: 'from-cyan-500 to-teal-600',
    symptoms: ['Joint pain', 'Back pain', 'Fractures', 'Stiffness', 'Swollen joints'],
    specialty: 'Orthopaedics',
  },
  {
    id: 'skin', label: 'Skin & Hair', icon: Shield, color: 'from-pink-500 to-fuchsia-600',
    symptoms: ['Rashes', 'Acne', 'Hair loss', 'Itching', 'Dry skin', 'Eczema'],
    specialty: 'Dermatology',
  },
  {
    id: 'eyes', label: 'Eyes & Vision', icon: Eye, color: 'from-sky-500 to-blue-600',
    symptoms: ['Blurred vision', 'Eye pain', 'Redness', 'Watery eyes', 'Night blindness'],
    specialty: 'Ophthalmology',
  },
  {
    id: 'mental', label: 'Mental Health', icon: Brain, color: 'from-violet-500 to-purple-600',
    symptoms: ['Anxiety', 'Depression', 'Insomnia', 'Stress', 'Panic attacks'],
    specialty: 'Psychiatry',
  },
  {
    id: 'children', label: 'Children', icon: Baby, color: 'from-green-500 to-emerald-600',
    symptoms: ['Fever in child', 'Growth concerns', 'Vaccination queries', 'Childhood infections'],
    specialty: 'Paediatrics',
  },
  {
    id: 'cancer', label: 'Cancer Signs', icon: Stethoscope, color: 'from-slate-600 to-slate-800',
    symptoms: ['Unexplained weight loss', 'Lumps', 'Persistent fatigue', 'Unusual bleeding'],
    specialty: 'Oncology',
  },
  {
    id: 'kidney', label: 'Kidney & Urinary', icon: Droplets, color: 'from-yellow-500 to-amber-600',
    symptoms: ['Painful urination', 'Blood in urine', 'Swelling in legs', 'Frequent urination'],
    specialty: 'Nephrology',
  },
  {
    id: 'women', label: "Women's Health", icon: Heart, color: 'from-rose-400 to-pink-600',
    symptoms: ['Irregular periods', 'Pregnancy care', 'PCOS', 'Menopause symptoms'],
    specialty: 'Obstetrics & Gynaecology',
  },
  {
    id: 'lungs', label: 'Lungs & Breathing', icon: Wind, color: 'from-teal-500 to-cyan-600',
    symptoms: ['Chronic cough', 'Wheezing', 'Breathing difficulty', 'Asthma', 'Snoring'],
    specialty: 'Pulmonology',
  },
];

export default function SymptomCheckerPage() {
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [recommendation, setRecommendation] = useState(null);

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const analyzeSymptoms = () => {
    // Count matches per specialty
    const counts = {};
    for (const symptom of selectedSymptoms) {
      for (const area of BODY_AREAS) {
        if (area.symptoms.includes(symptom)) {
          counts[area.specialty] = (counts[area.specialty] || 0) + 1;
        }
      }
    }
    // Pick the top specialty
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      setRecommendation({
        specialty: sorted[0][0],
        confidence: Math.min(95, 60 + sorted[0][1] * 10),
        all: sorted.map(([s]) => s),
      });
    }
  };

  const reset = () => {
    setSelectedArea(null);
    setSelectedSymptoms([]);
    setRecommendation(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100/60 text-brand-700 font-medium text-sm border border-brand-200"
          >
            <Sparkles className="h-4 w-4" /> Smart Symptom Checker
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-display font-bold text-slate-900"
          >
            What's Bothering You?
          </motion.h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Select your symptoms and we'll recommend the right specialist for you. 
            This is for guidance only — always consult a qualified doctor.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {recommendation ? (
            /* ── Result Screen ── */
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8 md:p-12 text-center space-y-6 max-w-2xl mx-auto"
            >
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                We Recommend: <span className="text-brand-600">{recommendation.specialty}</span>
              </h2>
              <p className="text-slate-500">
                Based on your {selectedSymptoms.length} symptom(s), a <strong>{recommendation.specialty}</strong> specialist 
                is the best fit for your concerns.
              </p>

              {recommendation.all.length > 1 && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-sm font-medium text-slate-600 mb-2">You might also consider:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {recommendation.all.slice(1).map(s => (
                      <span key={s} className="px-3 py-1 bg-white rounded-full text-sm text-slate-700 border border-slate-200">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Link
                  to={`/hospitals?specialty=${encodeURIComponent(recommendation.specialty)}`}
                  className="btn-premium py-3 px-8 text-base"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Find {recommendation.specialty} Specialists
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
                <button onClick={reset} className="btn-secondary py-3 px-6 text-base">
                  Start Over
                </button>
              </div>

              <p className="text-xs text-slate-400 pt-4">
                ⚠️ This tool is for informational purposes only and does not constitute medical advice.
              </p>
            </motion.div>
          ) : (
            /* ── Selection Screen ── */
            <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Body area grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {BODY_AREAS.map((area, idx) => {
                  const Icon = area.icon;
                  const isSelected = selectedArea === area.id;
                  const hasSymptoms = area.symptoms.some(s => selectedSymptoms.includes(s));
                  return (
                    <motion.button
                      key={area.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => setSelectedArea(isSelected ? null : area.id)}
                      className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50 shadow-lg shadow-brand-500/10'
                          : hasSymptoms
                          ? 'border-green-300 bg-green-50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${area.color} flex items-center justify-center mb-3`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{area.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{area.symptoms.length} symptoms</p>
                      {hasSymptoms && (
                        <div className="absolute top-2 right-2 h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Symptom selector (expands when a body area is clicked) */}
              <AnimatePresence>
                {selectedArea && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
                      <h3 className="font-bold text-slate-900 mb-4">
                        Select your symptoms:
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {BODY_AREAS.find(a => a.id === selectedArea)?.symptoms.map(symptom => (
                          <button
                            key={symptom}
                            onClick={() => toggleSymptom(symptom)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              selectedSymptoms.includes(symptom)
                                ? 'bg-brand-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {selectedSymptoms.includes(symptom) && <CheckCircle2 className="inline h-4 w-4 mr-1.5 -mt-0.5" />}
                            {symptom}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Selected symptoms summary + analyze button */}
              {selectedSymptoms.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-sm font-bold text-slate-700">Your symptoms ({selectedSymptoms.length}):</span>
                    {selectedSymptoms.map(s => (
                      <span key={s} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium border border-brand-100">
                        {s}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={analyzeSymptoms}
                    className="btn-premium py-3 px-8 text-base w-full sm:w-auto"
                  >
                    <Stethoscope className="h-5 w-5 mr-2" />
                    Find the Right Specialist
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
