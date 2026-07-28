-- Migration: Payments and Invoices Integration

-- 1. Add payment tracking to appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);

-- 2. Create invoices table for billing details
CREATE TABLE IF NOT EXISTS invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id    UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  amount            DECIMAL(10, 2) NOT NULL,
  tax_amount        DECIMAL(10, 2) DEFAULT 0,
  total_amount      DECIMAL(10, 2) NOT NULL,
  status            VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'cancelled')),
  issued_at         TIMESTAMPTZ DEFAULT NOW(),
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_appointment_id ON invoices(appointment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
