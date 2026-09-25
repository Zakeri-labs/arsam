-- ============================================================================
-- Security lockdown: close the public (anon key) door to the database.
--
-- Before this, every table had a policy `FOR ALL USING (true) WITH CHECK (true)`,
-- so anyone holding the public anon/publishable key (it ships to every browser)
-- could read, change or delete cars, reservations, contracts, accounting rows,
-- customer requests and services directly through the Supabase REST API.
--
-- After this:
--   * every table in `public` has RLS enabled and NO policies, and the anon /
--     authenticated roles have no table privileges at all;
--   * the app keeps working because all access now goes through the Next.js
--     API routes using the service-role key, which bypasses RLS;
--   * the `uploads` bucket stays public for downloading existing file links,
--     but nobody can list, upload, overwrite or delete files with the anon key,
--     and only document/image MIME types up to 50 MB are accepted.
--
-- ORDER MATTERS: deploy the application code that uses SUPABASE_SERVICE_ROLE_KEY
-- first, confirm the site works, and only then run this script. Running it
-- against the old code breaks the site until the new code is deployed.
--
-- Idempotent: safe to run more than once.
-- ============================================================================

BEGIN;

-- 1. Drop every existing policy on tables in the public schema.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 2. Enable RLS on every table in public and revoke direct access from the
--    API roles. RLS with no policies = deny all for anon/authenticated.
DO $$
DECLARE
  tbl record;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', tbl.tablename);
  END LOOP;
END $$;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, PUBLIC;

-- Tables/functions created later must not silently become public either.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated, PUBLIC;

-- The service role must keep full access (it normally has it already).
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 3. Storage: remove the anon read/list/upload/update/delete policies.
DROP POLICY IF EXISTS "Allow public read on uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on uploads" ON storage.objects;

-- Files remain downloadable via their public URL (bucket stays public), but
-- only these types are accepted and nothing larger than 50 MB.
UPDATE storage.buckets
SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
WHERE id = 'uploads';

COMMIT;

-- Verification (should return zero rows):
--   SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
--   SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND policyname LIKE 'Allow public%';
