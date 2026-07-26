-- Add hospital_id to doctors table
ALTER TABLE doctors
ADD COLUMN hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_doctors_hospital_id ON doctors(hospital_id);
