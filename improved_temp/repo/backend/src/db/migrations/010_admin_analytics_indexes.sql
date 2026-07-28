-- Migration: Indexes for admin analytics (date-scoped dashboard and queue stats)
-- Speeds up: "tokens today", "distinct patients today", "active queues today"

CREATE INDEX IF NOT EXISTS idx_queue_tokens_queue_date ON queue_tokens(queue_date);
