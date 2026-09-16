-- Migration: Add GSTIN field to hospitals

ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS gstin VARCHAR(15);
