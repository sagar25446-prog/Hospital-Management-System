/**
 * Reusable card container for content sections.
 */
export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
