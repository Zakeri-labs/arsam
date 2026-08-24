-- ====================================================================
-- Complete Database Setup & Migration Script for ABU ARSAM Project
-- Project: ftzmlowdyozcowsorcnp (https://ftzmlowdyozcowsorcnp.supabase.co)
-- Run this script ONCE in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ftzmlowdyozcowsorcnp/sql/new
-- ====================================================================

-- 1. Create services table
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    image_url TEXT,

    -- Multilingual Titles
    title_en TEXT,
    title_fa TEXT,
    title_ar TEXT,

    -- Multilingual Descriptions
    description_en TEXT,
    description_fa TEXT,
    description_ar TEXT,

    -- Multilingual Fees & Working Days
    service_fee_en TEXT,
    service_fee_fa TEXT,
    service_fee_ar TEXT,

    government_fees_en TEXT,
    government_fees_fa TEXT,
    government_fees_ar TEXT,

    working_days_en TEXT,
    working_days_fa TEXT,
    working_days_ar TEXT,

    -- Multilingual Requirements
    requirements_en JSONB DEFAULT '[]'::jsonb,
    requirements_fa JSONB DEFAULT '[]'::jsonb,
    requirements_ar JSONB DEFAULT '[]'::jsonb,

    -- Region Availability Flags
    is_uae BOOLEAN DEFAULT true,
    is_oman BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create requests table
CREATE TABLE IF NOT EXISTS public.requests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    description TEXT,
    service_title TEXT NOT NULL,
    files JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all QMS columns exist (adds them if table already existed)
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS queue_number INTEGER,
  ADD COLUMN IF NOT EXISTS source       TEXT DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS queue_name   TEXT,
  ADD COLUMN IF NOT EXISTS queue_status TEXT DEFAULT 'waiting',
  ADD COLUMN IF NOT EXISTS called_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS served_at    TIMESTAMPTZ;

-- Fill default source value if any null
UPDATE public.requests SET source = 'web' WHERE source IS NULL;

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_requests_source ON public.requests(source);
CREATE INDEX IF NOT EXISTS idx_requests_queue_name ON public.requests(queue_name);
CREATE INDEX IF NOT EXISTS idx_requests_queue_status ON public.requests(queue_status);
CREATE INDEX IF NOT EXISTS idx_requests_phone ON public.requests(phone);

-- 3. Enable RLS (Row Level Security) & Policies for public access
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all access on services" ON public.services;
DROP POLICY IF EXISTS "Allow public all access on requests" ON public.requests;

CREATE POLICY "Allow public all access on services" ON public.services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on requests" ON public.requests FOR ALL USING (true) WITH CHECK (true);

-- 4. Create Storage bucket for user file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public read on uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on uploads" ON storage.objects;

CREATE POLICY "Allow public read on uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Allow public upload to uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "Allow public update on uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads');
CREATE POLICY "Allow public delete on uploads" ON storage.objects FOR DELETE USING (bucket_id = 'uploads');

-- All set! Tables, policies, storage, and indexes are ready.
