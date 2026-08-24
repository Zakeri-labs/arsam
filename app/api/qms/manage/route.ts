import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRequests, updateRequestQueue, getRequestsByPhone } from '@/lib/db-requests';

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('ofogh_session');
  return !!(session && session.value === 'authenticated');
}

// GET (Secure, Admin Only) - Get QMS queue items, or files by phone
export async function GET(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفا دوباره لاگین کنید.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queueNameFilter = searchParams.get('queueName');
    const phoneFilter = searchParams.get('phone');

    // --- Mode: fetch files/requests by phone number ---
    if (phoneFilter) {
      const requests = await getRequestsByPhone(phoneFilter);
      return NextResponse.json({ success: true, requests });
    }

    // --- Mode: fetch QMS queue ---
    let allRequests = await getRequests();
    let qmsRequests = allRequests.filter(r => r.source === 'qms');

    // Optional filter by queue name (if not 'all')
    if (queueNameFilter && queueNameFilter !== 'all') {
      qmsRequests = qmsRequests.filter(r => (r.queueName || 'جناب اماره') === queueNameFilter);
    }

    // Sort by queue_number ascending (FIFO)
    qmsRequests.sort((a, b) => (a.queueNumber ?? 999) - (b.queueNumber ?? 999));

    return NextResponse.json({
      success: true,
      requests: qmsRequests,
    });
  } catch (error: any) {
    console.error('Error fetching QMS queue:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست صف' },
      { status: 500 }
    );
  }
}

// PATCH (Secure, Admin Only) - Update status or queue name of a ticket
export async function PATCH(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفا دوباره لاگین کنید.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, queueName, queueStatus } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه نوبت الزامی است' },
        { status: 400 }
      );
    }

    const success = await updateRequestQueue(id, { queueName, queueStatus });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'خطا در به‌روزرسانی نوبت' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating QMS ticket status:', error);
    return NextResponse.json(
      { error: 'خطایی در سرور رخ داده است' },
      { status: 500 }
    );
  }
}
