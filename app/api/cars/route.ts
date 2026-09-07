import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCars, saveCar, deleteCar } from '@/lib/db-cars';

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

    const cars = await getCars();
    return NextResponse.json(cars);
  } catch (error: any) {
    console.error('Error fetching cars:', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات خودروها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAuth = await checkAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title || !body.dailyRate) {
      return NextResponse.json({ error: 'عنوان خودرو و نرخ روزانه الزامی است' }, { status: 400 });
    }

    const car = await saveCar(body);
    return NextResponse.json({ success: true, car });
  } catch (error: any) {
    console.error('Error saving car:', error);
    return NextResponse.json({ error: 'خطا در ذخیره اطلاعات خودرو' }, { status: 500 });
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
      return NextResponse.json({ error: 'شناسه خودرو ارسال نشده است' }, { status: 400 });
    }

    await deleteCar(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting car:', error);
    return NextResponse.json({ error: 'خطا در حذف خودرو' }, { status: 500 });
  }
}
