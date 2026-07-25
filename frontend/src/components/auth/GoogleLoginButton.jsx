import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { googleLogin } from '../../api/auth.api';

/**
 * "Continue with Google" button. Renders Google's own official button
 * (required by Google's branding guidelines) and exchanges the resulting
 * ID token for our own httpOnly-cookie session via POST /auth/google.
 *
 * Silently renders nothing if VITE_GOOGLE_CLIENT_ID isn't configured, so the
 * rest of the login/register page still works without it.
 */
export default function GoogleLoginButton({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) return null;

  return (
    <div className={`w-full flex justify-center ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          setLoading(true);
          try {
            const data = await googleLogin(credentialResponse.credential);
            onSuccess?.(data);
          } catch (err) {
            const message =
              err.response?.data?.message || err.message || 'Google sign-in failed. Please try again.';
            onError?.(message);
          } finally {
            setLoading(false);
          }
        }}
        onError={() => onError?.('Google sign-in was cancelled or failed.')}
        theme="outline"
        size="large"
        shape="pill"
        width="100%"
        text="continue_with"
      />
    </div>
  );
}
