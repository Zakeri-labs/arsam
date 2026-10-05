-- Photos taken when the car is returned, kept on the reservation file (not in the contract).
-- NOTE: not executed automatically — run only after owner sign-off. Idempotent.
-- Until it runs, reservations still save; only saving return photos fails.

BEGIN;

-- Each item: {"kind": "car_photo", "path": "contracts/....jpg", "name": "...", "size": 123}
-- The files live in the private contract-media bucket, same as contract photos.
ALTER TABLE public.car_reservations
    ADD COLUMN IF NOT EXISTS return_photos JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMIT;
