-- Migration: Add Telemedicine features (Video Consults)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS consultation_type VARCHAR(20) NOT NULL DEFAULT 'in_person' CHECK (consultation_type IN ('in_person', 'video')),
  ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(255);

COMMENT ON COLUMN appointments.consultation_type IS 'Whether this is an in-person or video consultation';
COMMENT ON COLUMN appointments.meeting_link IS 'Jitsi or other video meeting room link ID for Telemedicine';
