import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Wraps content that requires authentication.
 * Redirects to /login if not authenticated.
 * Optional: allow only certain roles via allowedRoles prop.
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles?.length && user?.role && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-4 text-center">
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
