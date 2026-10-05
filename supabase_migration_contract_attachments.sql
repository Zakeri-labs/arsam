-- Handover wizard: photos / videos attached to a contract (licence, passport, car photos, car videos).
-- NOTE: not executed automatically — run only after owner sign-off. Idempotent.
-- Until it runs, contracts still save; only saving attachments (and uploading videos) fails.

BEGIN;

-- Each item: {"kind": "licence|passport|car_photo|car_video", "url": "...", "name": "...", "size": 123, "posterUrl": "..."}
-- The files themselves live in the `uploads` storage bucket under contracts/.
ALTER TABLE public.car_contracts
    ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Car videos (compressed in the browser, max 30 MB each) must be accepted by the uploads bucket.
-- Same list as supabase_migration_security_lockdown.sql plus the three video types.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
WHERE id = 'uploads';

COMMIT;
