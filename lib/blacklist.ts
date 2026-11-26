import { supabase } from './supabase';
import { phoneKey } from './phone-key';

export interface BlacklistEntry {
  key: string;
  phone: string;
  name: string | null;
  createdBy: string | null;
  createdAt: string;
}

export async function getBlacklist(): Promise<BlacklistEntry[]> {
  const { data, error } = await supabase
    .from('phone_blacklist')
    .select('phone_key, phone, name, created_by, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({ key: r.phone_key, phone: r.phone, name: r.name, createdBy: r.created_by, createdAt: r.created_at }));
}

/**
 * Keys of every blacklisted number.
 * Default fails open (empty set) so a missing table or a database hiccup never
 * hides the whole requests list. Pass { strict: true } where the blacklist is a
 * privacy guard (the WhatsApp sync): there a read error must throw so the number
 * is never surfaced, rather than silently letting everything through.
 */
// ponytail: reads the whole table (PostgREST caps at 1000 rows); fine for a family list,
// filter in the database if it ever grows past that.
export async function getBlacklistKeys(opts?: { strict?: boolean }): Promise<Set<string>> {
  const { data, error } = await supabase.from('phone_blacklist').select('phone_key');
  if (error) {
    console.error('Error reading phone blacklist:', error);
    if (opts?.strict) throw error;
    return new Set();
  }
  return new Set((data || []).map(r => r.phone_key));
}

export function isBlacklisted(keys: Set<string>, phone: string): boolean {
  const key = phoneKey(phone);
  return key !== '' && keys.has(key);
}

export async function addToBlacklist(phone: string, name: string | null, createdBy: string): Promise<void> {
  const key = phoneKey(phone);
  if (!key) throw new Error('invalid phone');
  const { error } = await supabase
    .from('phone_blacklist')
    .upsert({ phone_key: key, phone: phone.trim(), name, created_by: createdBy }, { onConflict: 'phone_key' });
  if (error) throw error;
}

/** Removes by the stored key; returns false when no row matched. */
export async function removeFromBlacklist(key: string): Promise<boolean> {
  const { data, error } = await supabase.from('phone_blacklist').delete().eq('phone_key', key).select('phone_key');
  if (error) throw error;
  return (data || []).length > 0;
}
