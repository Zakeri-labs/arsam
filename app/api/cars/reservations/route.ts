import { NextResponse } from 'next/server';
import { getReservations, saveReservation, deleteReservation, issueContractAndRevenue, ReservationDeleteBlockedError, findHandedOverContractId } from '@/lib/db-cars';

const HANDED_OVER_MESSAGE = (contractId: string) =>
  `خودرو برای این رزرو تحویل شده است (قرارداد ${contractId}). برای لغو یا حذف رزرو، ابتدا قرارداد را در تب «قراردادها و تحویل» حذف کنید (اسناد مالی آن هم خودکار حذف می‌شوند).`;
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
    if (!isNew && body.status === 'cancelled') {
      const handedOverId = await findHandedOverContractId(body.id);
      if (handedOverId) {
        return NextResponse.json({ error: HANDED_OVER_MESSAGE(handedOverId) }, { status: 409 });
      }
    }
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
      return NextResponse.json({ error: HANDED_OVER_MESSAGE(error.contractId) }, { status: 409 });
    }
    console.error('Error deleting reservation:', error);
    return NextResponse.json({ error: 'خطا در حذف رزرو' }, { status: 500 });
  }
}
