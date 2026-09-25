import { NextResponse } from 'next/server';
import { initializeDBIfNeeded, saveServicesDB } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-check';

export async function GET() {
  try {
    const db = await initializeDBIfNeeded();
    return NextResponse.json(db);
  } catch (error) {
    console.error('Error fetching services DB:', error);
    return NextResponse.json(
      { error: 'خطا در بارگذاری اطلاعات دیتابیس خدمات' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Security check
    const denied = await requireAdmin(['services']);
    if (denied) return denied;

    const body = await request.json();

    if (!body || !body.en || !body.fa || !body.ar) {
      return NextResponse.json(
        { error: 'فرمت اطلاعات ارسالی نامعتبر است' },
        { status: 400 }
      );
    }

    const success = await saveServicesDB(body);

    if (success) {
      return NextResponse.json({ success: true, message: 'تغییرات با موفقیت ذخیره شد.' });
    } else {
      return NextResponse.json(
        { error: 'خطا در ذخیره تغییرات روی سرور' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving services:', error);
    return NextResponse.json(
      { error: 'خطایی در سرور رخ داده است' },
      { status: 500 }
    );
  }
}
