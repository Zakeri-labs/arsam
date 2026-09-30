-- Private contract media + revocable customer links.
-- NOTE: not executed automatically — run only after owner sign-off. Idempotent.
-- Order: 1) run this file  2) deploy the code  3) run scripts/migrate-contract-media.mjs (moves the old files).

BEGIN;

-- Passports, licences and car photos/videos go to a PRIVATE bucket: no public URL exists; the server
-- hands out short-lived signed URLs. (The old public `uploads` bucket keeps serving everything else.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contract-media', 'contract-media', false, 31457280,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Version number carried inside each customer link; "revoke link" bumps it so older links stop working.
ALTER TABLE public.car_contracts
    ADD COLUMN IF NOT EXISTS share_version INTEGER NOT NULL DEFAULT 1;

COMMIT;
