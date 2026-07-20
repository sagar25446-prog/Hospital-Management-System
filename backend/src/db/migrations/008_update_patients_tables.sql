-- Migration: Indexes for patient list and search (by name, phone)

CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_last_first ON patients(last_name, first_name);
