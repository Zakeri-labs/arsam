-- Phone blacklist (Mr Zakeri, 21 Nov 2026): numbers the office never wants
-- surfaced again (family, personal contacts). A blacklisted number is left out
-- of the requests list, the customers list and every customer picker; future
-- WhatsApp analysis must skip it too. Unblocking is done from Settings.
--
-- phone_key is the normalised number (digits only, country code removed for
-- Oman/Iran), so "+968 9123 4567", "0096891234567" and "91234567" match.
-- Run this BEFORE deploying the code (idempotent; safe to re-run). Without it
-- the lists still load, but the Blacklist button fails.
-- Server-only like every other table: RLS on, no policies, service role only.

BEGIN;

CREATE TABLE IF NOT EXISTS public.phone_blacklist (
  phone_key  text PRIMARY KEY,
  phone      text NOT NULL,
  name       text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.phone_blacklist ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.phone_blacklist FROM anon, authenticated;
GRANT ALL ON public.phone_blacklist TO service_role;

COMMIT;
