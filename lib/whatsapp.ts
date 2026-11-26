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
  // '"', '\\' and ',' would break the quoted PostgREST cursor filter in getThread
  const id = str(raw?.id, 200).replace(/["\\,()]/g, '_');
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
  let stored = 0;
  if (rows.length) {
    // ignoreDuplicates: the agent only moves forward, so an existing message id is never
    // re-sent legitimately; refusing to overwrite stops a stolen token rewriting history.
    // The database trigger also drops rows for a number blacklisted after the read above,
    // so `stored` counts only the rows actually inserted.
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
      .select('id');
    if (error) throw error;
    stored = (data || []).length;
  }
  return { stored, skipped: Math.min(rawMessages.length, MAX_BATCH) - stored };
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

const PAGE_ROWS = 1000; // PostgREST returns at most this many rows per request

async function removeMedia(paths: string[]): Promise<void> {
  for (let i = 0; i < paths.length; i += PAGE_ROWS) {
    const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(paths.slice(i, i + PAGE_ROWS));
    if (error) throw error;
  }
}

/** Media paths stored for one customer (paged past PostgREST's 1000-row cap). */
export async function conversationMedia(chatKey: string): Promise<string[]> {
  const paths: string[] = [];
  if (!chatKey) return paths;
  for (let from = 0; ; from += PAGE_ROWS) {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('id, media_path')
      .eq('chat_key', chatKey)
      .not('media_path', 'is', null)
      .order('id')
      .range(from, from + PAGE_ROWS - 1);
    if (error) throw error;
    for (const r of data || []) if (r.media_path) paths.push(r.media_path);
    if ((data || []).length < PAGE_ROWS) break;
  }
  return paths;
}

/**
 * Deletes a customer's whole WhatsApp conversation and its media (hiding it in the
 * UI is not enough for a privacy guard). `paths` are the media paths read before the
 * number was blacklisted, since the blacklist trigger deletes the rows themselves.
 * Throws on any failure; leftover files are also caught by sweepOrphanMedia.
 */
export async function purgeConversation(chatKey: string, paths: string[]): Promise<void> {
  if (!chatKey) return;
  await removeMedia(paths);
  // the database trigger already did this; kept so the purge does not depend on it
  const { error } = await supabase.from('whatsapp_messages').delete().eq('chat_key', chatKey);
  if (error) throw error;
}

/**
 * Deletes media files that no message points to any more: files of rows the
 * blacklist trigger removed, and uploads whose message was refused. Files younger
 * than a day (24h) are left alone (see whatsapp_orphan_media in the migration).
 */
export async function sweepOrphanMedia(limit = 500): Promise<number> {
  // self-heal first: rows of a blacklisted number that slipped past the triggers
  const { error: healError } = await supabase.rpc('whatsapp_enforce_blacklist');
  if (healError) throw healError;
  const { data, error } = await supabase.rpc('whatsapp_orphan_media', { lim: limit });
  if (error) throw error;
  const names = ((data || []) as { name: string }[]).map(r => r.name).filter(Boolean);
  await removeMedia(names);
  return names.length;
}

const SWEEP_EVERY_MS = 30 * 60 * 1000;

/**
 * The sweep for agent check-ins: at most every 30 minutes, so a run of 25 batches
 * does not scan the bucket 25 times. The slot is claimed with a conditional update,
 * so two check-ins at the same moment do not both sweep.
 */
export async function maybeSweepOrphanMedia(): Promise<void> {
  const now = new Date();
  const due = new Date(now.getTime() - SWEEP_EVERY_MS).toISOString();
  const { data, error } = await supabase
    .from('whatsapp_sync')
    .update({ last_sweep_at: now.toISOString() })
    .eq('id', 1)
    .or(`last_sweep_at.is.null,last_sweep_at.lt.${due}`)
    .select('id');
  if (error) throw error;
  if ((data || []).length) await sweepOrphanMedia();
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

export const CONVERSATIONS_PAGE = 30;

/**
 * One page of conversations, newest first. Grouping, search and the blacklist
 * filter all run in the database (whatsapp_conversations), so a read error fails
 * the request instead of showing a blocked number.
 */
export async function listConversations(query: string, page: number): Promise<{ items: Conversation[]; total: number }> {
  // LIKE wildcards are stripped so a search is always a plain "contains"
  const q = query.replace(/[%_\\]/g, '').trim().slice(0, 60);
  // the digits of the search (Persian/Arabic digits folded), matched in SQL against the
  // phone's own digits and the stored key, so 09.., +968 9.. and ۰۹.. all find a number
  const qdigits = q
    .replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x0660))
    .replace(/\D/g, '');
  const fetchPage = (off: number, lim: number) =>
    supabase.rpc('whatsapp_conversations', { q, qdigits, lim, off });
  const { data, error } = await fetchPage(Math.max(0, page - 1) * CONVERSATIONS_PAGE, CONVERSATIONS_PAGE);
  if (error) throw error;
  const rows = (data || []) as any[];
  let total = rows.length ? Number(rows[0].total) : 0;
  if (!rows.length && page > 1) {
    // past the last page (e.g. its last chat was blacklisted): report the real total
    const first = await fetchPage(0, 1);
    if (first.error) throw first.error;
    total = first.data?.length ? Number((first.data as any[])[0].total) : 0;
  }
  return {
    total,
    items: rows.map(r => ({
      chatKey: r.chat_key, phone: r.chat_phone, name: r.contact_name, lastAt: r.last_at,
      lastBody: r.last_body, lastKind: r.last_kind, lastFromMe: r.last_from_me, count: Number(r.msg_count),
    })),
  };
}

export const THREAD_PAGE = 200;

/** Cursor for "older messages": the oldest message already shown. */
export interface ThreadCursor { sentAt: string; id: string }

/**
 * The newest THREAD_PAGE messages of a chat, or the ones just before `before`,
 * returned oldest first for display. `hasMore` is true when older ones exist.
 */
export async function getThread(chatKey: string, before?: ThreadCursor | null) {
  let query = supabase
    .from('whatsapp_messages')
    .select('id, from_me, sent_at, kind, body, media_path, media_mime, media_name')
    .eq('chat_key', chatKey);
  if (before) {
    // values are validated by the route; quoted because ids contain ':' and '@'
    query = query.or(`sent_at.lt."${before.sentAt}",and(sent_at.eq."${before.sentAt}",id.lt."${before.id}")`);
  }
  const { data, error } = await query
    .order('sent_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(THREAD_PAGE + 1);
  if (error) throw error;
  const hasMore = (data || []).length > THREAD_PAGE;
  const rows = (data || []).slice(0, THREAD_PAGE).reverse();
  const paths = rows.map(r => r.media_path).filter((p): p is string => !!p);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrls(paths, 60 * 60);
    for (const s of signed || []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }
  return {
    hasMore,
    messages: rows.map(r => ({
      id: r.id, fromMe: r.from_me, sentAt: r.sent_at, kind: r.kind, body: r.body,
      mediaUrl: r.media_path ? urls.get(r.media_path) ?? null : null, mediaMime: r.media_mime, mediaName: r.media_name,
    })),
  };
}
