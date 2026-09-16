-- Migration: Create doctor_schedule_exceptions table for blocking specific dates

CREATE TABLE IF NOT EXISTS doctor_schedule_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT false, -- If true, it might mean "working on a day off", but mostly used as false (blocked)
  notes VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, exception_date)
);

CREATE INDEX IF NOT EXISTS idx_doc_exceptions_doc_date ON doctor_schedule_exceptions(doctor_id, exception_date);
