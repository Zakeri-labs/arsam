import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServicesDB, saveServicesDB, initializeDBIfNeeded, ServicesDB } from '@/lib/db';

export async function GET() {
  try {
    // Make sure DB exists and is initialized
    const db = await initializeDBIfNeeded();
    return NextResponse.json(db);
  } catch (error) {
    console.error('Error in GET /api/services:', error);
    return NextResponse.json(
      { error: 'خطا در بارگذاری اطلاعات خدمات' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Security check
    const cookieStore = await cookies();
    const session = cookieStore.get('ofogh_session');

    if (!session || session.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفا دوباره لاگین کنید.' },
        { status: 401 }
      );
    }

    const dbData = await request.json() as ServicesDB;

    // Validate structure briefly
    if (!dbData.en || !dbData.fa || !dbData.ar || !dbData.uaeServiceIds || !dbData.omanServiceIds) {
      return NextResponse.json(
        { error: 'فرمت داده‌های ارسالی نامعتبر است' },
        { status: 400 }
      );
    }

    const success = await saveServicesDB(dbData);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'خطا در ذخیره‌سازی فایل دیتابیس' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/services:', error);
    return NextResponse.json(
      { error: 'خطایی در سرور رخ داده است' },
      { status: 500 }
    );
  }
}
