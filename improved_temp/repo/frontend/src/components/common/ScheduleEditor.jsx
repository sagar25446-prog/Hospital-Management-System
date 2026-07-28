import { useEffect, useState } from 'react';
import { Clock, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { getDoctorSchedule, setDoctorSchedule } from '../../api/doctors.api';
import ErrorMessage from './ErrorMessage';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toHHMM(value) {
  // Backend returns HH:MM:SS — trim to HH:MM for <input type="time">
  return typeof value === 'string' ? value.slice(0, 5) : value;
}

/**
 * Weekly recurring availability editor. One row per slot; a doctor can add
 * multiple slots per day (e.g. a morning and an evening block).
 */
export default function ScheduleEditor({ doctorId }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!doctorId) return;
    let cancelled = false;
    setLoading(true);
    getDoctorSchedule(doctorId)
      .then((data) => {
        if (cancelled) return;
        const existing = (data?.schedule || data || []).map((s) => ({
          day_of_week: s.day_of_week,
          start_time: toHHMM(s.start_time),
          end_time: toHHMM(s.end_time),
          is_available: s.is_available ?? true,
        }));
        setSlots(existing);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load schedule');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [doctorId]);

  function addSlot() {
    setSlots((prev) => [...prev, { day_of_week: 1, start_time: '09:00', end_time: '13:00', is_available: true }]);
  }

  function updateSlot(index, field, value) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function removeSlot(index) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // Basic client-side sanity check before hitting the API
      for (const s of slots) {
        if (s.start_time >= s.end_time) {
          throw new Error(`On ${DAYS[s.day_of_week]}, start time must be before end time`);
        }
      }
      await setDoctorSchedule(doctorId, slots);
      setSuccess('Schedule saved. Patients will only be able to book within these hours.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm py-6">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading schedule…
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-500" /> Weekly availability
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Recurring hours patients can book into each week. Add one row per block of time.
          </p>
        </div>
        <button
          type="button"
          onClick={addSlot}
          className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add slot
        </button>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
          {success}
        </div>
      )}

      {slots.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-4">
          No availability set yet — patients won't be able to book you until you add at least one slot.
        </p>
      ) : (
        <div className="space-y-3">
          {slots.map((slot, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <select
                value={slot.day_of_week}
                onChange={(e) => updateSlot(i, 'day_of_week', Number(e.target.value))}
                className="rounded-lg border-gray-200 text-sm font-medium min-w-[120px]"
              >
                {DAYS.map((d, idx) => (
                  <option key={d} value={idx}>{d}</option>
                ))}
              </select>
              <input
                type="time"
                value={slot.start_time}
                onChange={(e) => updateSlot(i, 'start_time', e.target.value)}
                className="rounded-lg border-gray-200 text-sm"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="time"
                value={slot.end_time}
                onChange={(e) => updateSlot(i, 'end_time', e.target.value)}
                className="rounded-lg border-gray-200 text-sm"
              />
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 ml-auto">
                <input
                  type="checkbox"
                  checked={slot.is_available}
                  onChange={(e) => updateSlot(i, 'is_available', e.target.checked)}
                  className="rounded border-gray-300"
                />
                Bookable
              </label>
              <button
                type="button"
                onClick={() => removeSlot(i)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                aria-label="Remove slot"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-premium flex items-center gap-2 !py-2.5"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save schedule'}
        </button>
      </div>
    </div>
  );
}
