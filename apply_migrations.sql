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

-- Migration: Electronic Medical Records (EMR)
-- 1. Medical Records (General patient history)
CREATE TABLE IF NOT EXISTS medical_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  record_type       VARCHAR(50) NOT NULL,
  description       TEXT NOT NULL,
  diagnosed_date    DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);

-- 2. Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id    UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id         UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  diagnosis         TEXT,
  instructions      TEXT,
  issued_at         TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment_id ON prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);

-- 3. Prescription Items (Medications)
CREATE TABLE IF NOT EXISTS prescription_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id   UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_name     VARCHAR(100) NOT NULL,
  dosage            VARCHAR(50) NOT NULL,
  frequency         VARCHAR(50) NOT NULL,
  duration          VARCHAR(50) NOT NULL,
  instructions      TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id ON prescription_items(prescription_id);

-- Mark migrations as applied
INSERT INTO schema_migrations (name) VALUES ('011_create_payments_table.sql') ON CONFLICT DO NOTHING;
INSERT INTO schema_migrations (name) VALUES ('012_create_emr_tables.sql') ON CONFLICT DO NOTHING;
