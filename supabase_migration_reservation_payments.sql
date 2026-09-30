-- Reservation payment flow: pending vs paid accounting rows, and "money received" confirmation.
--   payment_status  'pending' = the customer still owes this amount (issued with the reservation/contract)
--                   'paid'    = the customer paid it (to the account / person in payment_method)
--   recorded_by     who recorded the row or the payment (admin name)
--   received_at/by  who confirmed that Reza / Mohammadi actually received the money, and when
-- Existing rows become 'paid' so current totals do not change, and existing incoming rows count as already
-- received (they predate the confirmation step), so the "not yet confirmed" list starts empty. Idempotent:
-- that backfill runs only on the run that adds received_at, never on later re-runs.
-- NOTE: not executed automatically — run only after owner sign-off, on the PRODUCTION project.
-- Must be applied BEFORE deploying the code that reads/writes these columns.

BEGIN;

ALTER TABLE public.car_transactions
    ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'paid',
    ADD COLUMN IF NOT EXISTS recorded_by TEXT,
    ADD COLUMN IF NOT EXISTS received_by TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'car_transactions' AND column_name = 'received_at'
    ) THEN
        ALTER TABLE public.car_transactions ADD COLUMN received_at TIMESTAMPTZ;
        UPDATE public.car_transactions
        SET received_at = COALESCE(created_at, now()),
            received_by = 'سوابق قبل از تأیید دریافت'
        WHERE payment_status = 'paid'
          AND type IN ('rent_fee', 'deposit_in', 'other_income');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'car_transactions_payment_status_check') THEN
        ALTER TABLE public.car_transactions
            ADD CONSTRAINT car_transactions_payment_status_check CHECK (payment_status IN ('pending', 'paid'));
    END IF;
END $$;

COMMIT;
