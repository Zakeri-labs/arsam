import { cookies } from 'next/headers';
import { AdminUserSession } from '@/app/api/auth/route';

export async function verifyAdminAuth(): Promise<{ authenticated: boolean; user?: AdminUserSession }> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('ofogh_session');
    if (!session || !session.value) {
      return { authenticated: false };
    }

    if (session.value === 'authenticated') {
      return {
        authenticated: true,
        user: {
          email: 'r.amareh@yahoo.com',
          name: 'رضا اماره (مدیر کل)',
          role: 'superadmin',
          allowedScreens: ['services', 'requests', 'qms', 'customers', 'cars'],
        },
      };
    }

    try {
      const parsed = JSON.parse(session.value) as AdminUserSession;
      if (parsed && parsed.email && Array.isArray(parsed.allowedScreens)) {
        return { authenticated: true, user: parsed };
      }
    } catch (e) {
      return { authenticated: false };
    }
  } catch (e) {
    console.error('Auth verification error:', e);
  }
  return { authenticated: false };
}
