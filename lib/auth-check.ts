import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { AdminScreen, AdminUserSession, findAdminByEmail } from './admin-users';

// The admin session cookie is `<base64url payload>.<base64url HMAC-SHA256>`.
// The payload only carries the email and expiry; role and allowed screens are
// always re-derived from the server-side account list, so nothing a browser
// sends can grant extra privileges. Without SESSION_SECRET no session is valid.

export const SESSION_COOKIE = 'ofogh_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

const MIN_SECRET_LENGTH = 32;

function getSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    console.error(`SESSION_SECRET is not set or shorter than ${MIN_SECRET_LENGTH} characters; admin sessions are disabled.`);
    return null;
  }
  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionToken(email: string): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const payload = Buffer.from(
    JSON.stringify({ e: email, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS })
  ).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function readSessionToken(token: string | undefined): AdminUserSession | null {
  if (!token) return null;
  const secret = getSessionSecret();
  if (!secret) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;

  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof data?.e !== 'string' || typeof data?.exp !== 'number') return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return findAdminByEmail(data.e);
  } catch {
    return null;
  }
}

export async function verifyAdminAuth(
  requiredScreens?: AdminScreen[]
): Promise<{ authenticated: boolean; authorized: boolean; user?: AdminUserSession }> {
  try {
    const cookieStore = await cookies();
    const user = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
    if (!user) return { authenticated: false, authorized: false };

    const authorized =
      !requiredScreens || requiredScreens.some(screen => user.allowedScreens.includes(screen));
    return { authenticated: true, authorized, user };
  } catch (e) {
    console.error('Auth verification error:', e);
    return { authenticated: false, authorized: false };
  }
}

/**
 * Guard for admin API routes. Returns a ready 401/403 response when the caller
 * is not logged in or lacks every one of `requiredScreens`, otherwise null.
 */
export async function requireAdmin(requiredScreens?: AdminScreen[]): Promise<Response | null> {
  const auth = await verifyAdminAuth(requiredScreens);
  if (!auth.authenticated) {
    return Response.json({ error: 'دسترسی غیرمجاز. لطفا دوباره لاگین کنید.' }, { status: 401 });
  }
  if (!auth.authorized) {
    return Response.json({ error: 'شما به این بخش دسترسی ندارید.' }, { status: 403 });
  }
  return null;
}
