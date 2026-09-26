-- ============================================================================
-- Move the fleet manager (Mohammadi) from a hard-coded built-in account into
-- public.admin_users, so the general manager can grant or revoke his sections
-- from the access management screen like any other staff account.
--
-- Nothing changes for him: `env:CAR_ADMIN_PASSWORD` tells the server to keep
-- checking his password against that Vercel variable. When the general manager
-- sets a new password for him in the panel, it is replaced by a real hash and
-- the variable is no longer needed.
--
-- Requires supabase_migration_admin_users.sql. Safe to run more than once:
-- an existing row for this email is left untouched.
-- ============================================================================

BEGIN;

INSERT INTO public.admin_users (email, name, allowed_screens, password_hash, created_by)
VALUES (
  'b.mohammadi.d@gmail.com',
  'محمدی (مدیر ناوگان خودروها)',
  ARRAY['cars']::text[],
  'env:CAR_ADMIN_PASSWORD',
  'migration'
)
ON CONFLICT (email) DO NOTHING;

COMMIT;
