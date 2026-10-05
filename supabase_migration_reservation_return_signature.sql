-- Customer signature confirming the return photos/videos on a reservation.
-- NOTE: not executed automatically — run only after owner sign-off. Idempotent.
-- Until it runs, return photos/videos still save; only saving the signature fails.

BEGIN;

-- {"path": "contracts/....png", "signedAt": "...", "fingerprint": "<media paths it was signed for>"}
ALTER TABLE public.car_reservations
    ADD COLUMN IF NOT EXISTS return_signature JSONB;

COMMIT;
