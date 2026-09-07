import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export interface AdminUserSession {
  email: string;
  name: string;
  role: 'superadmin' | 'cars_only';
  allowedScreens: ('services' | 'requests' | 'qms' | 'customers' | 'cars')[];
}

const ADMIN_USERS: (AdminUserSession & { password: string })[] = [
  {
    email: 'r.amareh@yahoo.com',
    password: process.env.ADMIN_PASSWORD || 'Ofogh@2026',
    name: 'رضا اماره (مدیر کل)',
    role: 'superadmin',
    allowedScreens: ['services', 'requests', 'qms', 'customers', 'cars'],
  },
  {
    email: 'b.mohammadi.d@gmail.com',
    password: process.env.CAR_ADMIN_PASSWORD || 'Mohammadi@2026',
    name: 'محمدی (مدیر ناوگان خودروها)',
    role: 'cars_only',
    allowedScreens: ['cars'],
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    const matchedUser = ADMIN_USERS.find(
      u => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword
    );

    if (matchedUser) {
      const sessionData: AdminUserSession = {
        email: matchedUser.email,
        name: matchedUser.name,
        role: matchedUser.role,
        allowedScreens: matchedUser.allowedScreens,
      };

      const cookieStore = await cookies();
      cookieStore.set('ofogh_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return NextResponse.json({ success: true, user: sessionData });
    }

    return NextResponse.json({ success: false, error: 'ایمیل یا رمز عبور اشتباه است' });
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

    if (session && session.value) {
      if (session.value === 'authenticated') {
        // Fallback for legacy session cookies
        const defaultUser: AdminUserSession = {
          email: 'r.amareh@yahoo.com',
          name: 'رضا اماره (مدیر کل)',
          role: 'superadmin',
          allowedScreens: ['services', 'requests', 'qms', 'customers', 'cars'],
        };
        return NextResponse.json({ authenticated: true, user: defaultUser });
      }

      try {
        const parsed = JSON.parse(session.value) as AdminUserSession;
        if (parsed && parsed.email && Array.isArray(parsed.allowedScreens)) {
          return NextResponse.json({ authenticated: true, user: parsed });
        }
      } catch (e) {
        return NextResponse.json({ authenticated: true });
      }
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
