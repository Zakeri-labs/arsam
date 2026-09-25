-- Contract details entered in the contract window (return date, amounts, extra km, customer details).
-- Previously these lived only in the browser and were lost when the window closed. Idempotent.
-- Must be applied BEFORE deploying the code that reads/writes these columns.

BEGIN;

ALTER TABLE public.car_contracts
    -- Customer details from the paper form
    ADD COLUMN IF NOT EXISTS customer_name_en TEXT,
    ADD COLUMN IF NOT EXISTS customer_national_id TEXT,
    ADD COLUMN IF NOT EXISTS customer_nationality TEXT,
    ADD COLUMN IF NOT EXISTS customer_address TEXT,
    ADD COLUMN IF NOT EXISTS work_address TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp TEXT,
    ADD COLUMN IF NOT EXISTS licence_type TEXT,
    ADD COLUMN IF NOT EXISTS licence_no TEXT,
    -- Vehicle condition
    ADD COLUMN IF NOT EXISTS car_title_en TEXT,
    ADD COLUMN IF NOT EXISTS color TEXT,
    ADD COLUMN IF NOT EXISTS clean_inside TEXT,
    ADD COLUMN IF NOT EXISTS clean_outside TEXT,
    -- Dates and times
    ADD COLUMN IF NOT EXISTS contract_date DATE,
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS departure_time TEXT,
    ADD COLUMN IF NOT EXISTS end_date DATE,
    ADD COLUMN IF NOT EXISTS return_time TEXT,
    -- Amounts (OMR)
    ADD COLUMN IF NOT EXISTS rental_days NUMERIC,
    ADD COLUMN IF NOT EXISTS daily_rate NUMERIC,
    ADD COLUMN IF NOT EXISTS total_price NUMERIC,
    ADD COLUMN IF NOT EXISTS extra_km TEXT,
    ADD COLUMN IF NOT EXISTS extra_km_amount NUMERIC,
    ADD COLUMN IF NOT EXISTS deductions_amount NUMERIC;

-- Existing contracts start from their reservation's dates and price
UPDATE public.car_contracts c SET
    start_date = COALESCE(c.start_date, r.start_date),
    end_date = COALESCE(c.end_date, r.end_date),
    total_price = COALESCE(c.total_price, r.total_price),
    customer_national_id = COALESCE(NULLIF(c.customer_national_id, ''), NULLIF(r.customer_national_id, ''))
FROM public.car_reservations r
WHERE c.reservation_id = r.id;

COMMIT;
