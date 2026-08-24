import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'R.amareh@yahoo.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Ofogh@2026';

// check-auth or login post
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const cookieStore = await cookies();
      cookieStore.set('ofogh_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'ایمیل یا رمز عبور اشتباه است' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطایی در سرور رخ داده است' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('ofogh_session');

    if (session && session.value === 'authenticated') {
      return NextResponse.json({ authenticated: true });
    }
  } catch (e) {
    console.error('Auth GET check error:', e);
  }

  return NextResponse.json({ authenticated: false });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('ofogh_session');
  return NextResponse.json({ success: true });
}
