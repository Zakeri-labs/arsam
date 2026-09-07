import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getReservations, saveReservation, deleteReservation } from '@/lib/db-cars';

async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('ofogh_session');
  return session && session.value === 'authenticated';
}

export async function GET() {
  try {
    const isAuth = await checkAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    const reservations = await getReservations();
    return NextResponse.json(reservations);
  } catch (error: any) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json({ error: 'خطا در دریافت لیست رزروها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAuth = await checkAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.carId || !body.customerName || !body.startDate || !body.endDate) {
      return NextResponse.json({ error: 'اطلاعات ضروری رزرو ناقص است' }, { status: 400 });
    }

    const reservation = await saveReservation(body);
    return NextResponse.json({ success: true, reservation });
  } catch (error: any) {
    console.error('Error saving reservation:', error);
    return NextResponse.json({ error: 'خطا در ذخیره‌سازی رزرو' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAuth = await checkAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'شناسه رزرو الزامی است' }, { status: 400 });
    }

    await deleteReservation(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting reservation:', error);
    return NextResponse.json({ error: 'خطا در حذف رزرو' }, { status: 500 });
  }
}
