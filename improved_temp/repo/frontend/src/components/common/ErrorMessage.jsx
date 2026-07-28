/**
 * Reusable error message block for form or API errors.
 */
export default function ErrorMessage({ message, className = '' }) {
  if (!message) return null;

  return (
    <div
      className={`rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 ${className}`.trim()}
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
  );
}
