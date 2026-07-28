/**
 * Reusable button with variants and loading state.
 */
export default function Button({
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  children,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';
  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary:
      'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  const styles = `${base} ${variants[variant] || variants.primary} ${className}`.trim();

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={styles}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
