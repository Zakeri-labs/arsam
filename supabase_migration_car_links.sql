-- Car rental links: missing columns + foreign keys so a reservation owns its contract and accounting rows.
-- Idempotent. Run after supabase_migration_car_rental_tables.sql and supabase_migration_car_contracts.sql.
-- Must be applied BEFORE deploying the code that reads/writes cars.title_en and car_contracts.car_id.

BEGIN;

-- 1. cars.title_en (English name printed on the bilingual contract)
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS title_en TEXT;

UPDATE public.cars c SET title_en = v.title_en
FROM (VALUES
    ('car-mg-gt-1', 'MG GT 2026 (#1)'),
    ('car-mg-gt-2', 'MG GT 2026 (#2)'),
    ('car-mg-gt-3', 'MG GT 2026 (#3)'),
    ('car-mg-5-1', 'MG 5 2023'),
    ('car-nissan-sunny-1', 'Nissan Sunny 2023 (#1)'),
    ('car-nissan-sunny-2', 'Nissan Sunny 2023 (#2)'),
    ('car-nissan-sunny-3', 'Nissan Sunny 2023 (#3)'),
    ('car-nissan-sunny-4', 'Nissan Sunny 2024 (#4)'),
    ('car-nissan-sunny-5', 'Nissan Sunny 2024 (#5)'),
    ('car-nissan-sunny-6', 'Nissan Sunny 2024 (#6)'),
    ('car-nissan-micra-1', 'Nissan Micra 2019'),
    ('car-renault-duster-1', 'Renault Duster 2016'),
    ('car-renault-duster-2', 'Renault Duster 2019')
) AS v(id, title_en)
WHERE c.id = v.id AND (c.title_en IS NULL OR c.title_en = '');

-- 2. car_contracts.car_id (contracts were linked to a car only by its title text)
ALTER TABLE public.car_contracts ADD COLUMN IF NOT EXISTS car_id TEXT;

-- 3. Empty-string links become NULL so the foreign keys below can be enforced
UPDATE public.car_contracts SET reservation_id = NULL WHERE reservation_id = '';
UPDATE public.car_transactions SET reservation_id = NULL WHERE reservation_id = '';
UPDATE public.car_transactions SET car_id = NULL WHERE car_id = '';

-- Rows pointing at reservations/cars that no longer exist are detached, not deleted
UPDATE public.car_contracts c SET reservation_id = NULL
WHERE reservation_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.car_reservations r WHERE r.id = c.reservation_id);
UPDATE public.car_transactions t SET reservation_id = NULL
WHERE reservation_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.car_reservations r WHERE r.id = t.reservation_id);
UPDATE public.car_transactions t SET car_id = NULL
WHERE car_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.cars c WHERE c.id = t.car_id);

-- Backfill car_contracts.car_id from the reservation, falling back to the plate number
UPDATE public.car_contracts c SET car_id = r.car_id
FROM public.car_reservations r
WHERE c.car_id IS NULL AND c.reservation_id = r.id;
UPDATE public.car_contracts c SET car_id = k.id
FROM public.cars k
WHERE c.car_id IS NULL AND c.plate_number IS NOT NULL AND c.plate_number <> '' AND k.plate_number = c.plate_number;

-- 4. Foreign keys: deleting a reservation removes its contract and accounting rows
ALTER TABLE public.car_contracts DROP CONSTRAINT IF EXISTS car_contracts_reservation_id_fkey;
ALTER TABLE public.car_contracts ADD CONSTRAINT car_contracts_reservation_id_fkey
    FOREIGN KEY (reservation_id) REFERENCES public.car_reservations(id) ON DELETE CASCADE;

ALTER TABLE public.car_contracts DROP CONSTRAINT IF EXISTS car_contracts_car_id_fkey;
ALTER TABLE public.car_contracts ADD CONSTRAINT car_contracts_car_id_fkey
    FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE SET NULL;

ALTER TABLE public.car_transactions DROP CONSTRAINT IF EXISTS car_transactions_reservation_id_fkey;
ALTER TABLE public.car_transactions ADD CONSTRAINT car_transactions_reservation_id_fkey
    FOREIGN KEY (reservation_id) REFERENCES public.car_reservations(id) ON DELETE CASCADE;

ALTER TABLE public.car_transactions DROP CONSTRAINT IF EXISTS car_transactions_car_id_fkey;
ALTER TABLE public.car_transactions ADD CONSTRAINT car_transactions_car_id_fkey
    FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_car_contracts_car ON public.car_contracts(car_id);
CREATE INDEX IF NOT EXISTS idx_car_transactions_reservation ON public.car_transactions(reservation_id);

-- One contract per reservation (handover updates the auto-issued contract instead of adding another)
CREATE UNIQUE INDEX IF NOT EXISTS uq_car_contracts_reservation ON public.car_contracts(reservation_id) WHERE reservation_id IS NOT NULL;

COMMIT;
