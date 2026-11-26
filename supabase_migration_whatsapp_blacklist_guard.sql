-- WhatsApp sync, blacklist guard (review of PR #43, 26 Nov 2026).
-- Runs AFTER supabase_migration_whatsapp_sync.sql and BEFORE deploying the code
-- that calls these functions. Idempotent; safe to re-run.
--
-- 1. The blacklist rule lives in the database, so it holds even when a number is
--    blocked while an agent batch is in flight:
--    - a message for a blacklisted chat_key is never inserted;
--    - blacklisting a number deletes its stored messages in the same transaction;
--    - both triggers take a per-number advisory lock, so an insert and a blacklisting
--      of the same number cannot slip past each other (write skew under READ COMMITTED);
--    - whatsapp_enforce_blacklist() deletes anything that still got through (self-heal).
--    Media files of deleted rows are removed by the panel via whatsapp_orphan_media().
-- 2. whatsapp_conversations(): one row per customer (latest message + count),
--    blacklisted numbers excluded inside the query, with search and paging.
-- 3. whatsapp_orphan_media(): files in the whatsapp-media bucket that no message
--    points to any more, so the panel can delete them through the Storage API.
-- The callable functions run as the caller (service role, which bypasses RLS and can
-- read storage.objects); only the service role may call them.

BEGIN;

CREATE INDEX IF NOT EXISTS whatsapp_messages_media_idx
  ON public.whatsapp_messages (media_path) WHERE media_path IS NOT NULL;

-- when the panel last cleaned orphan media (the sweep runs at most every 30 minutes)
ALTER TABLE public.whatsapp_sync ADD COLUMN IF NOT EXISTS last_sweep_at timestamptz;

-- 1a. Never store a message for a blacklisted number.
CREATE OR REPLACE FUNCTION public.whatsapp_skip_blacklisted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- shared lock: many inserts for one number run together, a blacklisting waits for them
  PERFORM pg_advisory_xact_lock_shared(hashtext('wa:' || NEW.chat_key));
  IF EXISTS (SELECT 1 FROM public.phone_blacklist b WHERE b.phone_key = NEW.chat_key) THEN
    RETURN NULL; -- silently skip the row
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS whatsapp_messages_skip_blacklisted ON public.whatsapp_messages;
CREATE TRIGGER whatsapp_messages_skip_blacklisted
  BEFORE INSERT OR UPDATE OF chat_key ON public.whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION public.whatsapp_skip_blacklisted();

-- 1b. Blacklisting a number deletes what was already stored for it.
CREATE OR REPLACE FUNCTION public.whatsapp_purge_on_blacklist()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- exclusive lock: waits for in-flight inserts of this number to commit; the DELETE
  -- below takes a fresh snapshot, so it sees and removes them
  PERFORM pg_advisory_xact_lock(hashtext('wa:' || NEW.phone_key));
  DELETE FROM public.whatsapp_messages WHERE chat_key = NEW.phone_key;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS phone_blacklist_purge_whatsapp ON public.phone_blacklist;
CREATE TRIGGER phone_blacklist_purge_whatsapp
  AFTER INSERT OR UPDATE OF phone_key ON public.phone_blacklist
  FOR EACH ROW EXECUTE FUNCTION public.whatsapp_purge_on_blacklist();

-- 1c. Self-heal: delete any stored message of a blacklisted number. Returns how many.
CREATE OR REPLACE FUNCTION public.whatsapp_enforce_blacklist()
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.whatsapp_messages m
    USING public.phone_blacklist b
    WHERE b.phone_key = m.chat_key;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Anything stored before this migration for a number that is already blacklisted.
SELECT public.whatsapp_enforce_blacklist();

-- 2. Conversation list: newest message per customer, newest first, in one pass.
--    q: free text matched against name and phone; qdigits: the ASCII digits of the
--    search, matched against the phone's digits and the stored key.
DROP FUNCTION IF EXISTS public.whatsapp_conversations(text, int, int);
CREATE OR REPLACE FUNCTION public.whatsapp_conversations(q text DEFAULT '', qdigits text DEFAULT '', lim int DEFAULT 30, off int DEFAULT 0)
RETURNS TABLE (
  chat_key text, chat_phone text, contact_name text, last_at timestamptz,
  last_body text, last_kind text, last_from_me boolean, msg_count bigint, total bigint
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH ranked AS (
    SELECT m.chat_key, m.chat_phone, m.sent_at, m.body, m.kind, m.from_me,
           row_number() OVER w AS rn,
           count(*) OVER (PARTITION BY m.chat_key) AS n,
           first_value(m.contact_name) OVER (
             PARTITION BY m.chat_key ORDER BY (m.contact_name IS NULL), m.sent_at DESC
           ) AS name
    FROM public.whatsapp_messages m
    WHERE NOT EXISTS (SELECT 1 FROM public.phone_blacklist b WHERE b.phone_key = m.chat_key)
    WINDOW w AS (PARTITION BY m.chat_key ORDER BY m.sent_at DESC, m.id DESC)
  ),
  filtered AS (
    SELECT * FROM ranked r
    WHERE r.rn = 1
      AND (
        coalesce(q, '') = ''
        OR r.name ILIKE '%' || q || '%'
        OR r.chat_phone ILIKE '%' || q || '%'
        OR (length(coalesce(qdigits, '')) >= 3 AND (
              regexp_replace(r.chat_phone, '[^0-9]', '', 'g') LIKE '%' || qdigits || '%'
              -- a local form such as 0912... matches the key, which has no leading 0
              OR (length(ltrim(qdigits, '0')) >= 3 AND r.chat_key LIKE '%' || ltrim(qdigits, '0') || '%')
            ))
      )
  )
  SELECT f.chat_key, f.chat_phone, f.name, f.sent_at, f.body, f.kind, f.from_me, f.n,
         count(*) OVER () AS total
  FROM filtered f
  ORDER BY f.sent_at DESC, f.chat_key
  LIMIT greatest(1, least(lim, 100)) OFFSET greatest(off, 0);
$$;

-- 3. Media files no message points to, older than a day. An upload is signed before
--    its message is posted, and on a slow line a whole batch can take a long time,
--    so files younger than that are left alone. storage.objects.name is COLLATE "C";
--    it is compared in the default collation so the media_path index is used.
CREATE OR REPLACE FUNCTION public.whatsapp_orphan_media(lim int DEFAULT 500)
RETURNS TABLE (name text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, storage AS $$
  SELECT o.name
  FROM storage.objects o
  WHERE o.bucket_id = 'whatsapp-media'
    AND o.created_at < now() - interval '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.whatsapp_messages m
      WHERE m.media_path = (o.name COLLATE "default")
    )
  ORDER BY o.created_at
  LIMIT greatest(1, least(lim, 1000));
$$;

REVOKE ALL ON FUNCTION public.whatsapp_skip_blacklisted() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.whatsapp_purge_on_blacklist() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.whatsapp_enforce_blacklist() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.whatsapp_conversations(text, text, int, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.whatsapp_orphan_media(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.whatsapp_enforce_blacklist() TO service_role;
GRANT EXECUTE ON FUNCTION public.whatsapp_conversations(text, text, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.whatsapp_orphan_media(int) TO service_role;

COMMIT;
