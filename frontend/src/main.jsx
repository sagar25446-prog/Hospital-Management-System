import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';

import * as Sentry from "@sentry/react";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN, // Automatically skips if undefined
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^\/api/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

function Root() {
  // Render the app either way; GoogleLoginButton itself hides/disables
  // gracefully if no client ID is configured, instead of crashing the app.
  if (!googleClientId) {
    return <App />;
  }
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
