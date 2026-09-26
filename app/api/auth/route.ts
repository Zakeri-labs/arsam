import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminCredentials } from '@/lib/admin-users';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  verifyAdminAuth,
} from '@/lib/auth-check';
import { clientIp, rateLimit, resetRateLimit, tooManyRequests } from '@/lib/rate-limit';

export type { AdminUserSession } from '@/lib/admin-users';

const LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const cleanEmail = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';

    const ipKey = `login-ip:${clientIp(request)}`;
    const emailKey = `login-email:${cleanEmail}`;
    if (!rateLimit(ipKey, LOGIN_ATTEMPTS, LOGIN_WINDOW_MS) || !rateLimit(emailKey, LOGIN_ATTEMPTS, LOGIN_WINDOW_MS)) {
      return tooManyRequests();
    }

    const result = await verifyAdminCredentials(cleanEmail, password);
    if (!result) {
      return NextResponse.json({ success: false, error: 'ایمیل یا رمز عبور اشتباه است' }, { status: 401 });
    }
    const { user, sessionVersion } = result;

    const token = createSessionToken(user.email, sessionVersion);
    if (!token) {
      return NextResponse.json({ success: false, error: 'پیکربندی امنیتی سرور کامل نیست' }, { status: 500 });
    }

    resetRateLimit(ipKey);
    resetRateLimit(emailKey);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'خطایی در سرور رخ داده است' }, { status: 500 });
  }
}

export async function GET() {
  const auth = await verifyAdminAuth();
  if (auth.authenticated && auth.user) {
    return NextResponse.json({ authenticated: true, user: auth.user });
  }
  return NextResponse.json({ authenticated: false });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
