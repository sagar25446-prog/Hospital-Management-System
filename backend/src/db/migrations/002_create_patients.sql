-- Migration: Create patients table (links to users)

CREATE TABLE IF NOT EXISTS patients (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  date_of_birth     DATE,
  gender            VARCHAR(20),
  phone             VARCHAR(30),
  address           TEXT,
  blood_group       VARCHAR(10),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
