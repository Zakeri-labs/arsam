import { NextResponse } from 'next/server';
import { deleteServiceRow, initializeDBIfNeeded, saveServicesDB } from '@/lib/db';
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

    const success = await saveServicesDB(body, typeof body.onlyId === 'string' && body.onlyId ? body.onlyId : undefined);

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

// Saving the service list only adds and updates rows, so a service is removed with its own request.
export async function DELETE(request: Request) {
  try {
    const denied = await requireAdmin(['services']);
    if (denied) return denied;

    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'شناسه خدمت الزامی است' }, { status: 400 });
    }
    // The site always offers this service; lib/db.ts recreates it when it is missing
    if (id === 'other-services') {
      return NextResponse.json({ error: 'این خدمت ثابت است و حذف نمی‌شود' }, { status: 400 });
    }

    if (!(await deleteServiceRow(id))) {
      return NextResponse.json({ error: 'خطا در حذف خدمت' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'خطایی در سرور رخ داده است' }, { status: 500 });
  }
}
