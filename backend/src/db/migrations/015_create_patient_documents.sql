-- Migration: Patient Document Uploads
-- Stores uploaded medical documents (reports, prescriptions, scans) as Base64 in DB

CREATE TABLE IF NOT EXISTS patient_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  file_name     VARCHAR(255) NOT NULL,
  file_type     VARCHAR(100) NOT NULL,  -- e.g. 'application/pdf', 'image/jpeg'
  file_size     INTEGER NOT NULL DEFAULT 0,
  category      VARCHAR(50) NOT NULL DEFAULT 'general', -- 'lab_report', 'prescription', 'scan', 'insurance', 'general'
  notes         TEXT,
  file_data     TEXT NOT NULL,  -- Base64 encoded file content
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_category ON patient_documents(category);
