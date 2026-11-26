-- WhatsApp Desktop sync (Hossein, 25-26 Nov 2026): a small agent on the office
-- Windows PC reads new messages from the installed WhatsApp app (its local
-- database + media folder) and posts them here. One row per message; the
-- customer's whole conversation is the set of rows with the same chat_key
-- (phone normalised like phone_blacklist.phone_key), so a customer has one
-- continuing file instead of one file per message.
--
-- Run this BEFORE deploying the code (idempotent; safe to re-run).
-- Server-only like every other table: RLS on, no policies, service role only.

BEGIN;

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id           text PRIMARY KEY,              -- WhatsApp message id (stable per message)
  chat_key     text NOT NULL,                 -- normalised phone of the customer
  chat_phone   text NOT NULL,                 -- phone as WhatsApp shows it
  contact_name text,                          -- saved contact or WhatsApp profile name
  from_me      boolean NOT NULL DEFAULT false,
  sent_at      timestamptz NOT NULL,
  kind         text NOT NULL DEFAULT 'text',  -- text | voice | image | video | document | sticker | other
  body         text,
  media_path   text,                          -- object path in the private whatsapp-media bucket
  media_mime   text,
  media_name   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_messages_chat_idx ON public.whatsapp_messages (chat_key, sent_at DESC);
CREATE INDEX IF NOT EXISTS whatsapp_messages_sent_idx ON public.whatsapp_messages (sent_at DESC);

-- One row: the agent's access token (only its SHA-256 is kept) and its last check-in.
CREATE TABLE IF NOT EXISTS public.whatsapp_sync (
  id            int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  token_hash    text,
  token_created timestamptz,
  last_seen_at  timestamptz,
  last_batch    int,
  agent_info    text
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sync ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.whatsapp_messages, public.whatsapp_sync FROM anon, authenticated;
GRANT ALL ON public.whatsapp_messages, public.whatsapp_sync TO service_role;

-- Private bucket for voices, photos and documents (read through short signed URLs).
-- allowed_mime_types keeps out active content (text/html, image/svg+xml) that would
-- run script if a staffer opened it in a browser tab.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'whatsapp-media', 'whatsapp-media', false, 52428800,
  ARRAY[
    'audio/ogg', 'audio/opus', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/amr', 'audio/wav', 'audio/x-wav',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
    'video/mp4', 'video/quicktime', 'video/3gpp', 'video/webm',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMIT;
