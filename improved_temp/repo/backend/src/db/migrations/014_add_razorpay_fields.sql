-- Migration: Real Razorpay integration fields
-- Replaces the mock transaction_id flow with real Razorpay order/payment tracking.

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100);

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255);

-- A given Razorpay payment must only ever back one invoice (idempotency guard
-- against the checkout "verify" call and the async webhook both racing to
-- create a record for the same payment).
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_razorpay_payment_id
  ON invoices(razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_razorpay_order_id ON appointments(razorpay_order_id);
