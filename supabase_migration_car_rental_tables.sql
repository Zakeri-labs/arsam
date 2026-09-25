-- Car rental tables (cars, car_reservations, car_transactions)
-- Extracted from supabase_full_setup.sql section 5 (added 2026-09-07). Idempotent (IF NOT EXISTS).
-- NOTE: not executed automatically — run only after owner sign-off, on the PRODUCTION project.
-- Run this before or together with supabase_migration_car_contracts.sql.

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

-- DISABLED (see supabase_migration_security_lockdown.sql): CREATE POLICY "Allow public all access on cars" ON public.cars FOR ALL USING (true) WITH CHECK (true);
-- DISABLED (see supabase_migration_security_lockdown.sql): CREATE POLICY "Allow public all access on car_reservations" ON public.car_reservations FOR ALL USING (true) WITH CHECK (true);
-- DISABLED (see supabase_migration_security_lockdown.sql): CREATE POLICY "Allow public all access on car_transactions" ON public.car_transactions FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_car_reservations_dates ON public.car_reservations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_car_reservations_car ON public.car_reservations(car_id);
CREATE INDEX IF NOT EXISTS idx_car_transactions_payment ON public.car_transactions(payment_method);

