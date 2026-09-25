-- Car handover / return protocols (صورتجلسه تحویل و عودت خودرو)
-- NOTE: not executed automatically — run only after owner sign-off.
CREATE TABLE IF NOT EXISTS public.car_contracts (
    id TEXT PRIMARY KEY,
    reservation_id TEXT,
    car_title TEXT,
    plate_number TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    initial_odometer NUMERIC NOT NULL DEFAULT 0,
    return_odometer NUMERIC,
    fuel_level TEXT NOT NULL DEFAULT 'full',
    deposit_amount NUMERIC NOT NULL DEFAULT 0,
    deposit_status TEXT NOT NULL DEFAULT 'held',
    handover_status TEXT NOT NULL DEFAULT 'delivered',
    checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.car_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all access on car_contracts" ON public.car_contracts;
-- DISABLED (see supabase_migration_security_lockdown.sql): CREATE POLICY "Allow public all access on car_contracts" ON public.car_contracts FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_car_contracts_reservation ON public.car_contracts(reservation_id);
