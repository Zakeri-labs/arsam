import { NextResponse } from 'next/server';
import { getCars, saveCar, deleteCar, getReservations, getContracts, effectiveCarStatus } from '@/lib/db-cars';
import { requireAdmin } from '@/lib/auth-check';

export async function GET() {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;

    const [cars, reservations, contracts] = await Promise.all([getCars(), getReservations(), getContracts()]);
    // Rented / available follows the bookings, so the fleet list is never stale
    return NextResponse.json(cars.map(car => ({ ...car, status: effectiveCarStatus(car, reservations, contracts) })));
  } catch (error: any) {
    console.error('Error fetching cars:', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات خودروها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;

    const body = await request.json();
    if (body.id && !body.title && !body.dailyRate) {
      // Partial update (e.g. status only) — the car must already exist
      const cars = await getCars();
      if (!cars.some(c => c.id === body.id)) {
        return NextResponse.json({ error: 'خودرو یافت نشد' }, { status: 404 });
      }
    } else if (!body.title || !body.dailyRate) {
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
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;

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
