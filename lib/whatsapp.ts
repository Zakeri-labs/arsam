import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { supabase } from './supabase';
import { phoneKey } from './phone-key';
import { getBlacklistKeys } from './blacklist';

// Server side of the office WhatsApp sync (see supabase_migration_whatsapp_sync.sql
// and windows-agent/). The agent authenticates with a bearer token the general
// manager generates in Settings; only its SHA-256 is stored.

export const MEDIA_BUCKET = 'whatsapp-media';
export const MAX_BATCH = 500;
const KINDS = new Set(['text', 'voice', 'image', 'video', 'document', 'sticker', 'other']);

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export async function createAgentToken(): Promise<string> {
  const token = `wa_${randomBytes(24).toString('base64url')}`;
  const { error } = await supabase
    .from('whatsapp_sync')
    .upsert({ id: 1, token_hash: sha256(token), token_created: new Date().toISOString() });
  if (error) throw error;
  return token;
}

export async function getSyncStatus() {
  const { data, error } = await supabase
    .from('whatsapp_sync')
    .select('token_hash, token_created, last_seen_at, last_batch, agent_info')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return {
    connected: !!data?.token_hash,
    tokenCreated: data?.token_created ?? null,
    lastSeenAt: data?.last_seen_at ?? null,
    lastBatch: data?.last_batch ?? null,
    agentInfo: data?.agent_info ?? null,
  };
}

/** True when the request carries the current agent token. */
export async function verifyAgent(request: Request): Promise<boolean> {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token.startsWith('wa_')) return false;
  const { data } = await supabase.from('whatsapp_sync').select('token_hash').eq('id', 1).maybeSingle();
  if (!data?.token_hash) return false;
  const a = Buffer.from(sha256(token));
  const b = Buffer.from(data.token_hash);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function touchAgent(batch: number, info: string) {
  await supabase
    .from('whatsapp_sync')
    .update({ last_seen_at: new Date().toISOString(), last_batch: batch, agent_info: info.slice(0, 200) })
    .eq('id', 1);
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export interface IncomingMessage {
  id: string;
  chat_key: string;
  chat_phone: string;
  contact_name: string | null;
  from_me: boolean;
  sent_at: string;
  kind: string;
  body: string | null;
  media_path: string | null;
  media_mime: string | null;
  media_name: string | null;
}

/** Validates one message from the agent; null when it is unusable. */
const MAX_FUTURE_MS = 24 * 60 * 60 * 1000;

export function cleanMessage(raw: any): IncomingMessage | null {
  const id = str(raw?.id, 200);
  const phone = str(raw?.phone, 40);
  const key = phoneKey(phone);
  const sent = new Date(raw?.sent_at);
  // A real phone only: reject WhatsApp @lid-style ids with no number behind them,
  // so they can never slip past the blacklist (which matches on phone digits).
  const isPhone = /^\+?[\d\s()-]{8,20}$/.test(phone) && key.length >= 8 && key.length <= 15;
  if (!id || !isPhone || Number.isNaN(sent.getTime())) return null;
  // A message dated far in the future would sit forever at the top of the inbox.
  if (sent.getTime() > Date.now() + MAX_FUTURE_MS) return null;
  const kind = KINDS.has(raw?.kind) ? raw.kind : 'other';
  const mediaPath = str(raw?.media_path, 300);
  return {
    id,
    chat_key: key,
    chat_phone: phone,
    contact_name: str(raw?.contact_name, 120) || null,
    from_me: raw?.from_me === true,
    sent_at: sent.toISOString(),
    kind,
    body: str(raw?.body, 20000) || null,
    // only paths the agent got a signed upload for (see uploadPathFor)
    media_path: /^wa\/\d{4}-\d{2}\/[A-Za-z0-9_-]+\.[a-z0-9]{1,8}$/.test(mediaPath) ? mediaPath : null,
    media_mime: str(raw?.media_mime, 100) || null,
    media_name: str(raw?.media_name, 200) || null,
  };
}

/** Stores a batch; blacklisted numbers are dropped. Returns how many were kept. */
export async function ingest(rawMessages: unknown[]): Promise<{ stored: number; skipped: number }> {
  const blocked = await getBlacklistKeys({ strict: true }); // never ingest when the blacklist can't be read
  const rows = rawMessages.slice(0, MAX_BATCH).map(cleanMessage).filter((m): m is IncomingMessage => !!m && !blocked.has(m.chat_key));
  if (rows.length) {
    // ignoreDuplicates: the agent only moves forward, so an existing message id is never
    // re-sent legitimately; refusing to overwrite stops a stolen token rewriting history.
    const { error } = await supabase.from('whatsapp_messages').upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
  }
  return { stored: rows.length, skipped: Math.min(rawMessages.length, MAX_BATCH) - rows.length };
}

/** SHA-256 of each blacklisted key, so the agent can match numbers without the panel handing out the private list. */
export async function blacklistHashes(): Promise<string[]> {
  const keys = await getBlacklistKeys({ strict: true });
  return [...keys].map(k => createHash('sha256').update(k).digest('hex'));
}

// Only media types WhatsApp actually sends; anything else (e.g. .html, .svg that
// would run script when a staffer opens it in a new tab) is stored as .bin.
const SAFE_EXT = new Set([
  'opus', 'ogg', 'mp3', 'm4a', 'aac', 'wav', 'amr',
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif',
  'mp4', 'mov', '3gp', 'webm',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt',
]);

export function uploadPathFor(fileName: string): string {
  const raw = (fileName.match(/\.([A-Za-z0-9]{1,8})$/)?.[1] || '').toLowerCase();
  const ext = SAFE_EXT.has(raw) ? raw : 'bin';
  const month = new Date().toISOString().slice(0, 7);
  return `wa/${month}/${randomBytes(12).toString('base64url')}.${ext}`;
}

/**
 * Deletes a customer's whole WhatsApp conversation and its media. Called when a
 * number is blacklisted, so blacklisting also removes what was already stored
 * (hiding it in the UI is not enough for a privacy guard).
 */
export async function purgeConversation(chatKey: string): Promise<void> {
  const { data } = await supabase.from('whatsapp_messages').select('media_path').eq('chat_key', chatKey);
  const paths = (data || []).map(r => r.media_path).filter((p): p is string => !!p);
  if (paths.length) await supabase.storage.from(MEDIA_BUCKET).remove(paths);
  await supabase.from('whatsapp_messages').delete().eq('chat_key', chatKey);
}

export interface Conversation {
  chatKey: string;
  phone: string;
  name: string | null;
  lastAt: string;
  lastBody: string | null;
  lastKind: string;
  lastFromMe: boolean;
  count: number;
}

// ponytail: groups the newest 2000 messages in memory; move to a SQL view once the inbox outgrows that.
export async function listConversations(): Promise<Conversation[]> {
  const [{ data, error }, blocked] = await Promise.all([
    supabase
      .from('whatsapp_messages')
      .select('chat_key, chat_phone, contact_name, sent_at, body, kind, from_me')
      .order('sent_at', { ascending: false })
      .limit(2000),
    getBlacklistKeys(),
  ]);
  if (error) throw error;
  const byKey = new Map<string, Conversation>();
  for (const m of data || []) {
    if (blocked.has(m.chat_key)) continue;
    const c = byKey.get(m.chat_key);
    if (!c) {
      byKey.set(m.chat_key, {
        chatKey: m.chat_key, phone: m.chat_phone, name: m.contact_name, lastAt: m.sent_at,
        lastBody: m.body, lastKind: m.kind, lastFromMe: m.from_me, count: 1,
      });
    } else {
      c.count++;
      if (!c.name && m.contact_name) c.name = m.contact_name;
    }
  }
  return [...byKey.values()];
}

export async function getThread(chatKey: string) {
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('id, from_me, sent_at, kind, body, media_path, media_mime, media_name')
    .eq('chat_key', chatKey)
    .order('sent_at', { ascending: true })
    .limit(1000);
  if (error) throw error;
  const rows = data || [];
  const paths = rows.map(r => r.media_path).filter((p): p is string => !!p);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrls(paths, 60 * 60);
    for (const s of signed || []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }
  return rows.map(r => ({
    id: r.id, fromMe: r.from_me, sentAt: r.sent_at, kind: r.kind, body: r.body,
    mediaUrl: r.media_path ? urls.get(r.media_path) ?? null : null, mediaMime: r.media_mime, mediaName: r.media_name,
  }));
}
