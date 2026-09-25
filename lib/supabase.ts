import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-only Supabase client. It authenticates with the service-role key,
// which bypasses row level security, so it must never reach the browser: the
// database itself rejects the public (anon) key, and every read/write goes
// through the authenticated API routes. Keys come only from the environment.

// Note: components/cars-screen imports shared constants from lib/db-cars, so
// this module is bundled for the browser too. That is harmless — the service
// key is not a NEXT_PUBLIC_ variable and is never inlined into client code —
// but any attempt to actually query from the browser fails below.

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  if (typeof window !== 'undefined') {
    throw new Error('Supabase is server-only; call the API routes from the browser');
  }
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on the server');
  }
  client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

// Created lazily so a build without secrets still succeeds; the first real
// query fails loudly if they are missing.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const real = getClient();
    const value = Reflect.get(real, prop, real);
    return typeof value === 'function' ? value.bind(real) : value;
  },
});
