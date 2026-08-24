-- =====================================================
-- QMS Migration: Add missing columns to requests table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Add missing QMS columns
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS queue_number   INTEGER,
  ADD COLUMN IF NOT EXISTS source         TEXT DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS queue_name     TEXT,
  ADD COLUMN IF NOT EXISTS queue_status   TEXT DEFAULT 'waiting',
  ADD COLUMN IF NOT EXISTS called_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS served_at      TIMESTAMPTZ;

-- Step 2: Set default source for existing rows that don't have it
UPDATE public.requests SET source = 'web' WHERE source IS NULL;

-- Step 3: Add index for faster QMS queries
CREATE INDEX IF NOT EXISTS idx_requests_source ON public.requests(source);
CREATE INDEX IF NOT EXISTS idx_requests_queue_name ON public.requests(queue_name);
CREATE INDEX IF NOT EXISTS idx_requests_queue_status ON public.requests(queue_status);
CREATE INDEX IF NOT EXISTS idx_requests_phone ON public.requests(phone);

-- Done! Now the QMS system can store queue data properly.
