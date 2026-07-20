/**
 * Reusable text input with label and error support.
 */
export default function Input({
  id,
  label,
  type = 'text',
  error,
  className = '',
  labelClassName = '',
  ...props
}) {
  const inputId = id || props.name;
  const errorId = inputId ? `${inputId}-error` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`.trim()}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `.trim()}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
