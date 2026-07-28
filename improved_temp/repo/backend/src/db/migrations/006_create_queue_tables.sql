-- Migration: Hospital queue management (doctor-wise, daily)
-- queue_tokens: one row per patient in queue; doctor_daily_queue: current + last token number per doctor per day

CREATE TABLE IF NOT EXISTS doctor_daily_queue (
  doctor_id            UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  queue_date           DATE NOT NULL,
  current_token_number INT NOT NULL DEFAULT 0,
  last_token_number    INT NOT NULL DEFAULT 0,
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (doctor_id, queue_date)
);

CREATE TABLE IF NOT EXISTS queue_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id    UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id   UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  token_number INT NOT NULL,
  queue_date   DATE NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'called', 'serving', 'completed', 'cancelled')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, queue_date, token_number),
  UNIQUE(doctor_id, queue_date, patient_id)
);

CREATE INDEX IF NOT EXISTS idx_queue_tokens_doctor_date ON queue_tokens(doctor_id, queue_date);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_status ON queue_tokens(doctor_id, queue_date, status);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_patient ON queue_tokens(patient_id);
