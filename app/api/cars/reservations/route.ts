import { NextResponse } from 'next/server';
import { getReservations, saveReservation, deleteReservation, issueContractAndRevenue, ReservationDeleteBlockedError } from '@/lib/db-cars';
import { requireAdmin } from '@/lib/auth-check';

export async function GET() {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;

    const reservations = await getReservations();
    return NextResponse.json(reservations);
  } catch (error: any) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json({ error: 'خطا در دریافت لیست رزروها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;

    const body = await request.json();
    if (!body.carId || !body.customerName || !body.startDate || !body.endDate) {
      return NextResponse.json({ error: 'اطلاعات ضروری رزرو ناقص است' }, { status: 400 });
    }

    const isNew = !body.id;
    const reservation = await saveReservation(body);
    if (!isNew) {
      return NextResponse.json({ success: true, reservation });
    }

    // Auto chain: new reservation -> official contract (serial) -> rental revenue in accounting
    try {
      const { contract, transaction, depositTransaction } = await issueContractAndRevenue(reservation, body.paymentMethod);
      return NextResponse.json({ success: true, reservation, contract, transaction, depositTransaction });
    } catch (chainErr) {
      console.error('Error issuing contract/revenue for reservation:', chainErr);
      return NextResponse.json({ success: true, reservation, chainError: true });
    }
  } catch (error: any) {
    console.error('Error saving reservation:', error);
    return NextResponse.json({ error: 'خطا در ذخیره‌سازی رزرو' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'شناسه رزرو الزامی است' }, { status: 400 });
    }

    const removed = await deleteReservation(id);
    return NextResponse.json({ success: true, ...removed });
  } catch (error: any) {
    if (error instanceof ReservationDeleteBlockedError) {
      return NextResponse.json({
        error: `خودرو برای این رزرو تحویل شده است (قرارداد ${error.contractId}). به‌جای حذف، وضعیت رزرو را «لغو شده» کنید.`
      }, { status: 409 });
    }
    console.error('Error deleting reservation:', error);
    return NextResponse.json({ error: 'خطا در حذف رزرو' }, { status: 500 });
  }
}
