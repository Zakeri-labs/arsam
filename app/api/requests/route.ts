import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRequests, addRequest, deleteRequest } from '@/lib/db-requests';

// POST (Public) - Submit a new request from landing page form
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, description, serviceTitle, files } = body;

    if (!name || !name.trim() || !phone || !phone.trim() || !serviceTitle) {
      return NextResponse.json(
        { error: 'پر کردن نام، تلفن و عنوان خدمت الزامی است' },
        { status: 400 }
      );
    }

    const newRequest = addRequest({
      name: name.trim(),
      phone: phone.trim(),
      description: (description || '').trim(),
      serviceTitle,
      files: files || []
    });

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error) {
    console.error('Error submitting request:', error);
    return NextResponse.json(
      { error: 'خطایی در سرور رخ داده است' },
      { status: 500 }
    );
  }
}

// GET (Secure, Admin Only) - Get all requests
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('ofogh_session');

    if (!session || session.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفا دوباره لاگین کنید.' },
        { status: 401 }
      );
    }

    const requests = getRequests();
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error getting requests:', error);
    return NextResponse.json(
      { error: 'خطا در بارگذاری اطلاعات درخواست‌ها' },
      { status: 500 }
    );
  }
}

// DELETE (Secure, Admin Only) - Delete a request
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('ofogh_session');

    if (!session || session.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفا دوباره لاگین کنید.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه درخواست ارسالی معتبر نیست' },
        { status: 400 }
      );
    }

    const success = deleteRequest(id);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'درخواست با شناسه معین یافت نشد' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting request:', error);
    return NextResponse.json(
      { error: 'خطایی در سرور رخ داده است' },
      { status: 500 }
    );
  }
}
