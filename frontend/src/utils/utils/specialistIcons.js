/**
 * Single source of truth for how a specialization is represented visually
 * (icon + accent) across the app: landing page services grid, the symptom
 * checker widget, and the doctors directory. Keeping this in one place is
 * what stops the app from drifting into "emoji here, icon there" territory.
 */

export const SPECIALIST_ICON_MAP = {
  Neurologist: { icon: 'Brain', label: 'Neurology', accent: 'text-indigo-600 bg-indigo-50' },
  Cardiologist: { icon: 'HeartPulse', label: 'Cardiology', accent: 'text-urgent bg-red-50' },
  Dermatologist: { icon: 'Sparkles', label: 'Dermatology', accent: 'text-pink-600 bg-pink-50' },
  Orthopedic: { icon: 'Bone', label: 'Orthopedics', accent: 'text-amber-700 bg-amber-50' },
  'General Medicine': { icon: 'Stethoscope', label: 'General Medicine', accent: 'text-signal-600 bg-signal-50' },
  Gastroenterologist: { icon: 'Pill', label: 'Gastroenterology', accent: 'text-teal-600 bg-teal-50' },
  Pediatrician: { icon: 'Baby', label: 'Pediatrics', accent: 'text-sky-600 bg-sky-50' },
  Ophthalmologist: { icon: 'Eye', label: 'Ophthalmology', accent: 'text-cyan-600 bg-cyan-50' },
  'ENT Specialist': { icon: 'Ear', label: 'ENT', accent: 'text-violet-600 bg-violet-50' },
  Psychiatrist: { icon: 'MessageCircle', label: 'Psychiatry', accent: 'text-purple-600 bg-purple-50' },
  Dentist: { icon: 'Smile', label: 'Dental', accent: 'text-blue-600 bg-blue-50' },
  Gynecologist: { icon: 'HeartHandshake', label: 'Gynecology', accent: 'text-rose-600 bg-rose-50' },
  Urologist: { icon: 'Droplet', label: 'Urology', accent: 'text-blue-700 bg-blue-50' },
  Pulmonologist: { icon: 'Wind', label: 'Pulmonology', accent: 'text-slate-600 bg-slate-100' },
};

export function getSpecialistVisual(specialist) {
  return (
    SPECIALIST_ICON_MAP[specialist] || {
      icon: 'Stethoscope',
      label: specialist || 'General Medicine',
      accent: 'text-ink-400 bg-ink-50',
    }
  );
}
