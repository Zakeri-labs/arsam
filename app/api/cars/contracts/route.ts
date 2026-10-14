import { NextResponse } from 'next/server';
import { getContracts, saveContract, deleteContract, getContractById, getReservationById, saveReservation, syncReservationFinancials, findOverlappingReservation, overlapMessage, ContractHasPaymentsError, CONTRACT_HAS_PAYMENTS_MESSAGE, ReturnSignedError, RETURN_SIGNED_MESSAGE, syncContractExtraCharges, CONTRACT_ATTACHMENT_KINDS, type CarContract, type ContractAttachment } from '@/lib/db-cars';
import { verifyAdminAuth, requireAdmin } from '@/lib/auth-check';
import { createContractShareToken } from '@/lib/contract-share';
import { isContractMediaPath, isOwnUploadUrl, presentContractAttachments, getRenterSignedAt, renterSignaturePath, signContractMedia } from '@/lib/storage';

const MAX_ATTACHMENTS = 40;

// What the browser receives: each contract carries the token of its public "download the contract" link,
// and its attachments carry short-lived signed URLs (the stored form only holds bucket paths).
async function present(contracts: CarContract[]): Promise<CarContract[]> {
  const tokens = new Map(contracts.map(c => [c.id, createContractShareToken(c.id, c.shareVersion || 1)]));
  const withMedia = await presentContractAttachments(contracts, tokens);
  const signatures = await signContractMedia(contracts.map(c => renterSignaturePath(c.id))).catch(() => new Map<string, string>());
  return Promise.all(withMedia.map(async c => {
    const renterSignatureUrl = signatures.get(renterSignaturePath(c.id)) ?? null;
    const renterSignedAt = renterSignatureUrl ? await getRenterSignedAt(c.id).catch(() => null) : null;
    return { ...c, shareToken: tokens.get(c.id) ?? null, renterSignatureUrl, renterSignedAt };
  }));
}

// Only files that were uploaded to our own buckets are accepted as attachments. The browser sends back
// the `path`; any signed URL it also holds is ignored. Attachments from before the private bucket
// (public `url` only) are kept as they are until the migration script moves them.
function cleanAttachments(value: unknown): ContractAttachment[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  const out: ContractAttachment[] = [];
  for (const a of value as any[]) {
    if (!a || !CONTRACT_ATTACHMENT_KINDS.includes(a.kind)) continue;
    const video = a.kind === 'car_video';
    const base = {
      kind: a.kind,
      name: typeof a.name === 'string' ? a.name.slice(0, 200) : undefined,
      size: Number.isFinite(Number(a.size)) ? Number(a.size) : undefined,
    };
    if (isContractMediaPath(a.path)) {
      out.push({ ...base, path: a.path, posterPath: video && isContractMediaPath(a.posterPath) ? a.posterPath : undefined });
    } else if (isOwnUploadUrl(a.url)) {
      out.push({ ...base, url: a.url, posterUrl: video && isOwnUploadUrl(a.posterUrl) ? a.posterUrl : undefined });
    }
  }
  return out.slice(0, MAX_ATTACHMENTS);
}

export async function GET() {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;
    return NextResponse.json(await present(await getContracts()));
  } catch (error: any) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'خطا در دریافت صورتجلسه‌های تحویل' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;

    const body = await request.json();
    if (!body.customerName || !body.carTitle || body.initialOdometer === undefined || body.initialOdometer === '') {
      return NextResponse.json({ error: 'اطلاعات ضروری صورتجلسه ناقص است' }, { status: 400 });
    }
    // An existing contract stays on its reservation: moving it would overwrite another customer's contract
    const existingContract = body.id ? await getContractById(body.id) : undefined;
    if (existingContract?.reservationId && body.reservationId && body.reservationId !== existingContract.reservationId) {
      return NextResponse.json({ error: 'این قرارداد به رزرو دیگری تعلق دارد و قابل انتقال نیست' }, { status: 409 });
    }
    // The customer of a contract is the customer of its reservation: a contract save can never rename it
    const linkedReservationId = existingContract?.reservationId || body.reservationId;
    const reservation = linkedReservationId ? await getReservationById(linkedReservationId) : undefined;
    if (reservation) body.customerName = reservation.customerName;

    // Dates / price / deposit changed in the contract (e.g. an extension) are the reservation's too: the calendar
    // and the owed rent must follow, and the car must be free for the new dates.
    const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
    const num = (v: unknown) => (v === undefined || v === null || v === '' || !Number.isFinite(Number(v)) ? undefined : Number(v));
    const resUpdate: { startDate?: string; endDate?: string; totalPrice?: number; depositPaid?: number } = {};
    // Only a field edited in this save moves (compared with the stored contract), so an old mismatch between
    // contract and reservation is never pushed into the books by just opening and saving the wizard.
    const stored = existingContract ?? (reservation ? (await getContracts()).find(c => c.reservationId === reservation.id) : undefined);
    if (reservation && stored && ['confirmed', 'active'].includes(reservation.status)) {
      const start = str(body.startDate), end = str(body.endDate), total = num(body.totalPrice), deposit = num(body.depositAmount);
      if (start && start !== (stored.startDate ?? reservation.startDate)) resUpdate.startDate = start;
      if (end && end !== (stored.endDate ?? reservation.endDate)) resUpdate.endDate = end;
      if (total !== undefined && total !== (stored.totalPrice ?? reservation.totalPrice)) resUpdate.totalPrice = total;
      if (deposit !== undefined && deposit !== stored.depositAmount) resUpdate.depositPaid = deposit;
      const newStart = resUpdate.startDate ?? reservation.startDate, newEnd = resUpdate.endDate ?? reservation.endDate;
      if (newEnd < newStart) {
        return NextResponse.json({ error: 'تاریخ عودت نمی‌تواند قبل از تاریخ تحویل باشد' }, { status: 400 });
      }
      if (resUpdate.startDate || resUpdate.endDate) {
        const clash = await findOverlappingReservation(reservation.carId, newStart, newEnd, reservation.id);
        if (clash) return NextResponse.json({ error: overlapMessage(clash) }, { status: 409 });
      }
    }
    body.attachments = cleanAttachments(body.attachments);
    delete body.shareToken;
    delete body.shareVersion;

    let contract = await saveContract(body);
    let overpaid = 0;
    if (reservation && Object.keys(resUpdate).length) {
      try {
        const updated = await saveReservation({ id: reservation.id, ...resUpdate });
        const synced = await syncReservationFinancials(updated);
        if (synced.contract) contract = synced.contract;
        overpaid = synced.overpaid;
      } catch (syncErr) {
        console.error('Error carrying contract dates/amounts to the reservation:', syncErr);
        const [shown] = await present([contract]);
        return NextResponse.json({ success: true, contract: shown, chargesError: true });
      }
    }
    try {
      await syncContractExtraCharges(contract);
    } catch (syncErr) {
      console.error('Error syncing contract extra charges:', syncErr);
      const [shown] = await present([contract]);
      return NextResponse.json({ success: true, contract: shown, chargesError: true });
    }
    const [shown] = await present([contract]);
    return NextResponse.json({ success: true, contract: shown, overpaid });
  } catch (error: any) {
    console.error('Error saving contract:', error);
    const missingColumn = /attachments/.test(String(error?.message || ''));
    return NextResponse.json(
      { error: missingColumn ? 'ذخیره تصاویر قرارداد هنوز فعال نشده است (اسکریپت دیتابیس اجرا نشده)' : 'خطا در ذخیره‌سازی صورتجلسه' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await verifyAdminAuth(['cars']);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز. لطفا دوباره لاگین کنید.' }, { status: 401 });
    }
    if (!auth.authorized) {
      return NextResponse.json({ error: 'شما به این بخش دسترسی ندارید.' }, { status: 403 });
    }
    // Deleting a contract also removes its accounting rows: general manager only
    if (auth.user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'حذف قرارداد فقط برای مدیر کل مجاز است' }, { status: 403 });
    }

    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'شناسه صورتجلسه الزامی است' }, { status: 400 });
    }

    const removed = await deleteContract(id);
    return NextResponse.json({ success: true, ...removed });
  } catch (error: any) {
    if (error instanceof ReturnSignedError) {
      return NextResponse.json({ error: RETURN_SIGNED_MESSAGE }, { status: 409 });
    }
    if (error instanceof ContractHasPaymentsError) {
      return NextResponse.json({ error: CONTRACT_HAS_PAYMENTS_MESSAGE }, { status: 409 });
    }
    console.error('Error deleting contract:', error);
    return NextResponse.json({ error: 'خطا در حذف صورتجلسه' }, { status: 500 });
  }
}
