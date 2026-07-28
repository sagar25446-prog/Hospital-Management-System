import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, X, Send, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { analyzeSymptoms } from '../../api/symptomChecker.api';
import { analyzeSymptoms as analyzeSymptomsOffline } from '../../utils/symptomEngine';

const URGENCY_STYLES = {
  emergency: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  low: 'bg-signal-50 text-signal-600 border-signal-100',
};

/**
 * Floating "find a specialist" widget. Honest about what it is: it tells
 * the patient whether the answer came from a real model call or the
 * deterministic keyword matcher (via `result.source`), rather than
 * implying every answer is "AI" regardless of how it was produced.
 */
export default function SymptomCheckerWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await analyzeSymptoms(text.trim());
      setResult(data);
    } catch (err) {
      // Network/server unreachable — fall back to the local keyword engine
      // rather than leaving the patient with nothing.
      const offline = analyzeSymptomsOffline(text.trim());
      if (offline) {
        setResult({ ...offline, source: 'keyword-offline' });
      } else {
        setError('Could not analyze that right now — please try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setText('');
    setResult(null);
    setError('');
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-ink text-white px-5 py-3.5 rounded-full shadow-stub-lg hover:bg-ink-600 transition-colors"
        aria-label="Find the right specialist"
      >
        <Stethoscope className="w-5 h-5" />
        <span className="text-sm font-semibold hidden sm:inline">Find a specialist</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[min(380px,calc(100vw-3rem))] bg-white rounded-2xl shadow-stub-lg border border-ink-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-ink text-white">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4" />
          <span className="font-display font-semibold text-sm">Find a specialist</span>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5">
        {!result ? (
          <form onSubmit={handleSubmit}>
            <p className="text-xs text-ink-400 mb-3">
              Describe what you're feeling in your own words. This suggests which specialist to
              book with — it isn't a diagnosis, and it doesn't replace seeing a doctor.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. I've had a sharp headache and blurry vision since this morning…"
              rows={3}
              className="w-full text-sm rounded-lg border-ink-100 focus:border-signal-500 focus:ring-signal-500 resize-none"
              maxLength={2000}
            />
            {error && <p className="text-xs text-urgent mt-2">{error}</p>}
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="mt-3 w-full btn-primary !py-2.5 text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Thinking…' : 'Check symptoms'}
            </button>
          </form>
        ) : (
          <div>
            <div className={`flex items-start gap-2 text-xs font-medium px-3 py-2 rounded-lg border mb-3 ${URGENCY_STYLES[result.urgency] || URGENCY_STYLES.low}`}>
              {result.urgency === 'emergency' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span className="capitalize">{result.urgency} urgency</span>
            </div>

            <p className="text-sm text-ink leading-relaxed mb-4">{result.message}</p>

            <Link
              to={`/doctors?specialization=${encodeURIComponent(result.specialist)}`}
              onClick={() => setOpen(false)}
              className="btn-primary !py-2.5 text-sm w-full mb-2"
            >
              Book with a {result.specialist} <ArrowRight className="w-4 h-4" />
            </Link>
            <button onClick={reset} className="w-full text-xs text-ink-400 hover:text-ink py-1.5">
              Ask about something else
            </button>

            <p className="text-[10px] text-ink-400 mt-3 pt-3 border-t border-ink-100">
              {result.source === 'ai'
                ? 'Answered by an AI model.'
                : 'Answered by keyword matching (no AI configured for this deployment).'}
              {' '}Not a medical diagnosis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
