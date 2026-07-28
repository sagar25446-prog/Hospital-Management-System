/**
 * Reusable loading spinner with optional label.
 */
export default function LoadingSpinner({ label = 'Loading...', className = '' }) {
  return (
    <div
      className={`inline-flex flex-col items-center gap-2 ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span
        className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"
        aria-hidden
      />
      {label && (
        <span className="text-sm text-gray-600">{label}</span>
      )}
    </div>
  );
}
