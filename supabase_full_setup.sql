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

-- ====================================================================
-- 5. CAR RENTAL MODULE TABLES (cars, car_reservations, car_transactions)
-- ====================================================================

-- 5.1 Create cars table
CREATE TABLE IF NOT EXISTS public.cars (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    brand TEXT,
    model_year TEXT,
    plate_number TEXT,
    color TEXT,
    daily_rate NUMERIC DEFAULT 0,
    deposit_amount NUMERIC DEFAULT 0,
    transmission TEXT DEFAULT 'automatic',
    fuel_type TEXT DEFAULT 'بنزین',
    capacity INTEGER DEFAULT 5,
    status TEXT DEFAULT 'available',
    image_url TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.2 Create car_reservations table
CREATE TABLE IF NOT EXISTS public.car_reservations (
    id TEXT PRIMARY KEY,
    car_id TEXT NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
    car_title TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_national_id TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price NUMERIC DEFAULT 0,
    deposit_paid NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.3 Create car_transactions table (Accounting & Payments)
CREATE TABLE IF NOT EXISTS public.car_transactions (
    id TEXT PRIMARY KEY,
    reservation_id TEXT,
    car_id TEXT,
    customer_name TEXT,
    amount NUMERIC NOT NULL DEFAULT 0,
    type TEXT DEFAULT 'rent_fee', -- 'rent_fee', 'deposit_in', 'deposit_refund', 'maintenance_expense', 'other_income'
    payment_method TEXT DEFAULT 'bank_reza', -- 'bank_reza', 'bank_mohammadi', 'cash_reza', 'cash_mohammadi'
    description TEXT,
    receipt_file_url TEXT,
    receipt_file_name TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Public Policies
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all access on cars" ON public.cars;
DROP POLICY IF EXISTS "Allow public all access on car_reservations" ON public.car_reservations;
DROP POLICY IF EXISTS "Allow public all access on car_transactions" ON public.car_transactions;

CREATE POLICY "Allow public all access on cars" ON public.cars FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on car_reservations" ON public.car_reservations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on car_transactions" ON public.car_transactions FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_car_reservations_dates ON public.car_reservations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_car_reservations_car ON public.car_reservations(car_id);
CREATE INDEX IF NOT EXISTS idx_car_transactions_payment ON public.car_transactions(payment_method);

