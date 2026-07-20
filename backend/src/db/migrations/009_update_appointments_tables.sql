-- Migration: Link appointments to queue tokens (auto-generated on book)
-- Adds queue_token_id so we can show token number on the appointment and cancel token when appointment is cancelled.

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS queue_token_id UUID REFERENCES queue_tokens(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_queue_token_id ON appointments(queue_token_id);

COMMENT ON COLUMN appointments.queue_token_id IS 'Queue token auto-created when appointment was booked; used for same-day queue display and cancel propagation';
