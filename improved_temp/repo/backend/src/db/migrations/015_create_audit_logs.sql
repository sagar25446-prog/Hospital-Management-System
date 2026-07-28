-- Migration: Audit log for sensitive data access (EMR / prescriptions).
-- Append-only by convention: the application never issues UPDATE/DELETE
-- against this table, only INSERT and SELECT.

CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  user_role     VARCHAR(20),
  action        VARCHAR(50) NOT NULL,      -- e.g. 'emr.prescription.create', 'emr.prescription.read'
  resource_type VARCHAR(50) NOT NULL,      -- e.g. 'prescription', 'patient_record'
  resource_id   UUID,
  method        VARCHAR(10),
  path          TEXT,
  ip_address    VARCHAR(64),
  status_code   INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
