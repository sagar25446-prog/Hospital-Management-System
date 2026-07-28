/**
 * Auth context: manages user state.
 * Tokens are now managed securely via httpOnly cookies.
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { setAuthHelpers } from '../api/client';
import { getMe, logout as logoutApi } from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    try { await logoutApi(); } catch (_) { /* ignore */ }
    clearAuth();
    setLoading(false);
  }, [clearAuth]);

  // Register auth helpers for the axios interceptor
  useEffect(() => {
    setAuthHelpers({
      onAuthFailure: clearAuth,
    });
  }, [clearAuth]);

  // On mount: try to load the user (cookies are sent automatically)
  useEffect(() => {
    let isMounted = true;
    getMe()
      .then((me) => {
        if (me && isMounted) setUser(me);
      })
      .catch(() => {
        if (isMounted) clearAuth();
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
      return () => { isMounted = false; };
  }, [clearAuth]);

  const isAdmin = user?.role === 'admin';
  const isDoctor = user?.role === 'doctor';
  const isPatient = user?.role === 'patient';

  const value = {
    user,
    loading,
    setUser,
    clearAuth,
    logout,
    setLoading,
    isAuthenticated: !!user,
    isAdmin,
    isDoctor,
    isPatient,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
