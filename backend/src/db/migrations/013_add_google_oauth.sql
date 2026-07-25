-- Migration: Google OAuth support
-- Allows users to sign in/register with Google instead of (or in addition to) a password.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'local'
    CHECK (auth_provider IN ('local', 'google'));

-- password_hash is no longer guaranteed (Google-only accounts have none)
ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL;

-- A row must still have *some* way to authenticate
ALTER TABLE users
  ADD CONSTRAINT chk_users_auth_method
    CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
