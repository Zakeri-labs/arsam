-- Reservation payment flow: pending vs paid accounting rows, and "money received" confirmation.
--   payment_status  'pending' = the customer still owes this amount (issued with the reservation/contract)
--                   'paid'    = the customer paid it (to the account / person in payment_method)
--   recorded_by     who recorded the row or the payment (admin name)
--   received_at/by  who confirmed that Reza / Mohammadi actually received the money, and when
-- Existing rows become 'paid' so current totals do not change. Idempotent.
-- NOTE: not executed automatically — run only after owner sign-off, on the PRODUCTION project.
-- Must be applied BEFORE deploying the code that reads/writes these columns.

BEGIN;

ALTER TABLE public.car_transactions
    ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'paid',
    ADD COLUMN IF NOT EXISTS recorded_by TEXT,
    ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS received_by TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'car_transactions_payment_status_check') THEN
        ALTER TABLE public.car_transactions
            ADD CONSTRAINT car_transactions_payment_status_check CHECK (payment_status IN ('pending', 'paid'));
    END IF;
END $$;

COMMIT;
