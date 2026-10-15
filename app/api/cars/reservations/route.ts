import { NextResponse } from 'next/server';
import { getReservations, saveReservation, deleteReservation, issueContractAndRevenue, syncReservationFinancials, ReservationDeleteBlockedError, ReturnMediaLockedError, ReturnSignedError, RETURN_SIGNED_MESSAGE, findHandedOverContractId, findOverlappingReservation, overlapMessage, clearPendingCharges, getReservationById, type CarReservation, type ContractAttachment } from '@/lib/db-cars';
import { isContractMediaPath, isOwnUploadUrl, presentContractAttachments, signContractMedia } from '@/lib/storage';

const HANDED_OVER_MESSAGE = (contractId: string) =>
  `خودرو برای این رزرو تحویل شده است (قرارداد ${contractId}). برای لغو یا حذف رزرو، ابتدا قرارداد را در تب «قراردادها و تحویل» حذف کنید (اسناد مالی آن هم خودکار حذف می‌شوند).`;
import { requireAdmin } from '@/lib/auth-check';
import { businessToday, PAST_RESERVATION_MESSAGE } from '@/lib/business-day';

const MAX_RETURN_PHOTOS = 30;

// Return photos are stored as bucket paths; the browser gets short-lived signed URLs instead.
async function presentReturnPhotos(reservations: CarReservation[]): Promise<CarReservation[]> {
  const shown = await presentContractAttachments(reservations.map(r => ({ id: r.id, attachments: r.returnPhotos })));
  const byId = new Map(shown.map(r => [r.id, r.attachments]));
  const signed = await signContractMedia(reservations.map(r => r.returnSignature?.path || ''));
  return reservations.map(r => ({
    ...r,
    returnPhotos: byId.get(r.id),
    returnSignature: r.returnSignature ? { ...r.returnSignature, url: r.returnSignature.path ? signed.get(r.returnSignature.path) : undefined } : null,
  }));
}

// Only photos uploaded to our own buckets are accepted; any signed URL the browser sends back is ignored.
function cleanReturnPhotos(value: unknown): ContractAttachment[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  const out: ContractAttachment[] = [];
  for (const a of value as any[]) {
    if (!a) continue;
    const video = a.kind === 'car_video';
    const base = {
      kind: video ? ('car_video' as const) : ('car_photo' as const),
      name: typeof a.name === 'string' ? a.name.slice(0, 200) : undefined,
      size: Number.isFinite(Number(a.size)) ? Number(a.size) : undefined,
    };
    if (isContractMediaPath(a.path)) out.push({ ...base, path: a.path, posterPath: video && isContractMediaPath(a.posterPath) ? a.posterPath : undefined });
    else if (isOwnUploadUrl(a.url)) out.push({ ...base, url: a.url });
  }
  return out.slice(0, MAX_RETURN_PHOTOS);
}

export async function GET() {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;

    const reservations = await getReservations();
    return NextResponse.json(await presentReturnPhotos(reservations));
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
    // Saving an existing reservation: whatever is not sent keeps its stored value (e.g. a return-media save)
    const previous = body.id ? await getReservationById(body.id) : undefined;
    if (previous) {
      for (const k of ['carId', 'carTitle', 'customerName', 'customerPhone', 'startDate', 'endDate'] as const) {
        if (body[k] === undefined) body[k] = previous[k];
      }
    }
    if (!body.carId || !body.customerName || !body.startDate || !body.endDate) {
      return NextResponse.json({ error: 'اطلاعات ضروری رزرو ناقص است' }, { status: 400 });
    }

    // New = not in the database yet (a made-up id from a client is still a new reservation)
    const isNew = !previous;
    if (isNew && String(body.startDate).slice(0, 10) < businessToday()) {
      return NextResponse.json({ error: PAST_RESERVATION_MESSAGE }, { status: 400 });
    }
    if (String(body.endDate).slice(0, 10) < String(body.startDate).slice(0, 10)) {
      return NextResponse.json({ error: 'تاریخ پایان رزرو نمی‌تواند قبل از تاریخ شروع باشد' }, { status: 400 });
    }
    // One car, one customer at a time: a live reservation may not overlap another live one of the same car
    const willBeLive = !['cancelled', 'completed'].includes(body.status ?? previous?.status ?? 'confirmed');
    if (willBeLive) {
      const clash = await findOverlappingReservation(body.carId, String(body.startDate).slice(0, 10), String(body.endDate).slice(0, 10), body.id);
      if (clash) return NextResponse.json({ error: overlapMessage(clash) }, { status: 409 });
    }
    if (!isNew && body.status === 'cancelled') {
      const handedOverId = await findHandedOverContractId(body.id);
      if (handedOverId) {
        return NextResponse.json({ error: HANDED_OVER_MESSAGE(handedOverId) }, { status: 409 });
      }
    }
    body.returnPhotos = cleanReturnPhotos(body.returnPhotos);
    // Only a freshly drawn signature (a path in our private bucket) is accepted; stored ones are never taken from the browser
    body.returnSignature = isContractMediaPath(body.returnSignature?.path) ? { path: body.returnSignature.path } : undefined;
    const reservation = await saveReservation(body);
    if (!isNew) {
      const [shown] = await presentReturnPhotos([reservation]);
      if (reservation.status === 'cancelled') {
        // Nothing is owed for a cancelled booking any more; payments already received stay (to be refunded)
        const removedTransactionIds = await clearPendingCharges(reservation.id);
        return NextResponse.json({ success: true, reservation: shown, removedTransactionIds });
      }
      // Edited dates / price / deposit must carry through to the contract and the accounting rows
      try {
        const synced = await syncReservationFinancials(reservation);
        return NextResponse.json({ success: true, reservation: shown, contract: synced.contract, transactions: synced.transactions, overpaid: synced.overpaid });
      } catch (syncErr) {
        console.error('Error syncing contract/accounting for edited reservation:', syncErr);
        return NextResponse.json({ success: true, reservation: shown, syncError: true });
      }
    }

    // Auto chain: new reservation -> official contract (serial) -> rental revenue in accounting
    try {
      const { contract, transaction, depositTransaction } = await issueContractAndRevenue(reservation);
      return NextResponse.json({ success: true, reservation, contract, transaction, depositTransaction });
    } catch (chainErr) {
      console.error('Error issuing contract/revenue for reservation:', chainErr);
      return NextResponse.json({ success: true, reservation, chainError: true });
    }
  } catch (error: any) {
    if (error instanceof ReturnMediaLockedError) {
      return NextResponse.json({ error: 'تصاویر و ویدیوهای عودت توسط مشتری امضا شده‌اند و دیگر قابل تغییر یا حذف نیستند' }, { status: 409 });
    }
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
    if (error instanceof ReturnSignedError) {
      return NextResponse.json({ error: RETURN_SIGNED_MESSAGE }, { status: 409 });
    }
    console.error('Error deleting reservation:', error);
    return NextResponse.json({ error: 'خطا در حذف رزرو' }, { status: 500 });
  }
}
