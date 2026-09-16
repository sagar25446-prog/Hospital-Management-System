-- Migration 019: Add priority flag and no_show status to queue_tokens

-- 1. Add is_priority column
ALTER TABLE queue_tokens ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT FALSE;

-- 2. Add 'no_show' to status check constraint
DO $$ 
DECLARE
  const_name TEXT;
BEGIN
  -- Find the check constraint on the status column
  SELECT c.conname INTO const_name
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.conrelid = 'queue_tokens'::regclass 
    AND c.contype = 'c' 
    AND a.attname = 'status'
  LIMIT 1;
    
  -- Drop it if it exists
  IF const_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE queue_tokens DROP CONSTRAINT ' || const_name;
  END IF;
END $$;

-- Add the new named constraint
ALTER TABLE queue_tokens 
  ADD CONSTRAINT queue_tokens_status_check 
  CHECK (status IN ('waiting', 'called', 'serving', 'completed', 'cancelled', 'no_show'));
