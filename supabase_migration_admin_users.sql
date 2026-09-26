-- ============================================================================
-- Access management: staff accounts created by the general manager in the
-- admin panel ("مدیریت دسترسی‌ها").
--
-- Only the server (service-role key) can read or write this table: RLS is on
-- with no policies and the public API roles get no privileges, in line with
-- supabase_migration_security_lockdown.sql. Passwords are stored as scrypt
-- hashes, never in plain text.
--
-- Safe to run more than once. Purely additive: creates one new, empty table.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL UNIQUE CHECK (email = lower(email)),
  name            text NOT NULL,
  allowed_screens text[] NOT NULL DEFAULT '{}',
  password_hash   text NOT NULL,
  -- Bumped on password reset so every existing session of the user is rejected.
  session_version integer NOT NULL DEFAULT 1,
  is_active       boolean NOT NULL DEFAULT true,
  created_by      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_users_screens_valid CHECK (
    allowed_screens <@ ARRAY['services', 'requests', 'qms', 'customers', 'cars']::text[]
  )
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_users FROM anon, authenticated;
GRANT ALL ON TABLE public.admin_users TO service_role;

COMMIT;
