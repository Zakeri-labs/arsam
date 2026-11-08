import { NextResponse } from 'next/server';
import { getContracts, saveContract, deleteContract, getContractById, getCarById, discardRental, renameRentalCustomer, findUnreturnedRental, unreturnedMessage, LIVE_RESERVATION, getReservationById, saveReservation, syncReservationFinancials, issueContractAndRevenue, findOverlappingReservation, overlapMessage, ContractHasPaymentsError, CONTRACT_HAS_PAYMENTS_MESSAGE, ReturnSignedError, RETURN_SIGNED_MESSAGE, syncContractExtraCharges, CONTRACT_ATTACHMENT_KINDS, type CarContract, type ContractAttachment } from '@/lib/db-cars';
import { verifyAdminAuth, requireAdmin } from '@/lib/auth-check';
import { createContractShareToken } from '@/lib/contract-share';
import { businessToday, PAST_RESERVATION_MESSAGE } from '@/lib/business-day';
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

const round3 = (n: number) => Math.round(n * 1000) / 1000;
const parseAmount = (v: unknown): number | null => {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? round3(n) : null;
};
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/**
 * A direct contract: the car is handed over on the spot. It gets its own rental record, so the calendar, accounting,
 * payments and return media work as for any contract. Always a new record: it can never land on another customer's.
 * Validates and normalises `body` in place; the car's identity comes from the fleet, not from the browser.
 */
async function createDirectRental(body: any): Promise<{ rentalId: string } | { response: NextResponse }> {
  const fail = (error: string, status: number) => ({ response: NextResponse.json({ error }, { status }) });
  const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
  const customerPhone = typeof body.customerPhone === 'string' ? body.customerPhone.trim() : '';
  if (!body.carId || !customerName || !customerPhone || !isDay(body.startDate) || !isDay(body.endDate)) {
    return fail('خودرو، نام و شماره مشتری و تاریخ‌های قرارداد الزامی است', 400);
  }
  const { startDate: start, endDate: end } = body;
  if (end < start) return fail('تاریخ بازگشت نمی‌تواند قبل از تاریخ خروج باشد', 400);
  if (start < businessToday()) return fail(PAST_RESERVATION_MESSAGE, 400);
  const totalPrice = parseAmount(body.totalPrice), depositPaid = parseAmount(body.depositAmount);
  if (totalPrice === null || depositPaid === null) return fail('مبالغ قرارداد معتبر نیست', 400);

  const car = await getCarById(body.carId);
  if (!car) return fail('خودروی انتخاب‌شده پیدا نشد', 404);
  if (car.status === 'maintenance' || car.status === 'disabled') return fail('این خودرو در حال حاضر قابل اجاره نیست', 409);
  const unreturned = await findUnreturnedRental(car.id, start);
  if (unreturned) return fail(unreturnedMessage(unreturned), 409);
  const clash = await findOverlappingReservation(car.id, start, end);
  if (clash) return fail(overlapMessage(clash), 409);

  Object.assign(body, { customerName, customerPhone, totalPrice, depositAmount: depositPaid, carId: car.id, carTitle: car.title, carTitleEn: body.carTitleEn || car.titleEn, plateNumber: car.plateNumber });
  const rental = await saveReservation({
    carId: car.id, carTitle: car.title, customerName, customerPhone,
    customerNationalId: body.customerNationalId || '', startDate: start, endDate: end, totalPrice, depositPaid, status: 'confirmed',
  });
  // Re-checked after the write: of two contracts saved at the same moment, at least one sees the other and backs out
  try {
    const lateClash = await findOverlappingReservation(car.id, start, end, rental.id);
    if (lateClash) {
      await discardRental(rental.id).catch(e => console.error(`Error discarding rental ${rental.id}:`, e));
      return fail(overlapMessage(lateClash), 409);
    }
  } catch (checkErr) {
    await discardRental(rental.id).catch(e => console.error(`Error discarding rental ${rental.id}:`, e));
    throw checkErr;
  }
  body.reservationId = rental.id;
  return { rentalId: rental.id };
}

export async function POST(request: Request) {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;

    const body = await request.json();
    if (!body.customerName || !body.carTitle || body.initialOdometer === undefined || body.initialOdometer === '') {
      return NextResponse.json({ error: 'اطلاعات ضروری صورتجلسه ناقص است' }, { status: 400 });
    }
    // Two shapes only: a new contract (no id, no rental) or an edit of a stored one. Anything else could land on
    // another customer's record.
    if (!body.id && body.reservationId) {
      return NextResponse.json({ error: 'قرارداد جدید نمی‌تواند به اجاره موجود وصل شود' }, { status: 400 });
    }
    const existingContract = body.id ? await getContractById(body.id) : undefined;
    if (body.id && !existingContract) return NextResponse.json({ error: 'قرارداد پیدا نشد' }, { status: 404 });
    if (existingContract) {
      if ((body.startDate && !isDay(body.startDate)) || (body.endDate && !isDay(body.endDate)) || parseAmount(body.totalPrice) === null || parseAmount(body.depositAmount) === null) {
        return NextResponse.json({ error: 'تاریخ یا مبالغ قرارداد معتبر نیست' }, { status: 400 });
      }
      body.reservationId = existingContract.reservationId;
      body.carId = existingContract.carId;
    }

    // A signed contract keeps the identity it was signed under, and so does any link already sent
    const clean = (v: unknown) => String(v ?? '').trim();
    if (existingContract) {
      // The wizard fills a contract's empty phone / national ID from its rental: that is not a change
      const linked = existingContract.reservationId ? await getReservationById(existingContract.reservationId) : undefined;
      const storedValue = (k: string) => clean((existingContract as any)[k]) || clean((linked as any)?.[k]);
      const changed = ['customerName', 'customerNameEn', 'customerPhone', 'customerNationalId', 'customerNationality', 'licenceType', 'licenceNo', 'whatsapp', 'customerAddress', 'workAddress']
        .some(k => body[k] !== undefined && clean(body[k]) !== storedValue(k));
      if (changed && await getRenterSignedAt(existingContract.id)) {
        return NextResponse.json({ error: 'این قرارداد امضا شده است؛ برای تغییر مشخصات مشتری، ابتدا امضا باید حذف شود' }, { status: 409 });
      }
    }

    let createdRentalId: string | undefined;
    if (!existingContract) {
      const direct = await createDirectRental(body);
      if ('response' in direct) return direct.response;
      createdRentalId = direct.rentalId;
    }

    let contract: CarContract;
    let overpaid = 0;
    let datesToRestore: { id: string; startDate: string; endDate: string } | undefined;
    try {
      const reservation = body.reservationId ? await getReservationById(body.reservationId) : undefined;
      const rentalIsOpen = !!reservation && LIVE_RESERVATION.includes(reservation.status);
      // While the rental is open the contract is where the customer is corrected; a closed rental keeps its name
      if (reservation && !rentalIsOpen) body.customerName = reservation.customerName;

      // Dates / price / deposit changed in the contract (e.g. an extension) are the rental's too. Only a field edited
      // in this save moves (compared with the stored contract), so an old mismatch between contract and rental is
      // never pushed into the books by just opening and saving the wizard.
      const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
      const num = (v: unknown) => (v === undefined || v === null || v === '' || !Number.isFinite(Number(v)) ? undefined : Number(v));
      const moneyUpdate: { startDate?: string; endDate?: string; totalPrice?: number; depositPaid?: number } = {};
      const identityUpdate: { customerName?: string; customerPhone?: string; customerNationalId?: string } = {};
      if (reservation && existingContract && rentalIsOpen) {
        const start = str(body.startDate), end = str(body.endDate), total = num(body.totalPrice), deposit = num(body.depositAmount);
        if (start && start !== (existingContract.startDate ?? reservation.startDate)) moneyUpdate.startDate = start;
        if (end && end !== (existingContract.endDate ?? reservation.endDate)) moneyUpdate.endDate = end;
        if (total !== undefined && total !== (existingContract.totalPrice ?? reservation.totalPrice)) moneyUpdate.totalPrice = total;
        if (deposit !== undefined && deposit !== existingContract.depositAmount) moneyUpdate.depositPaid = deposit;
        const name = str(body.customerName), phone = str(body.customerPhone), nationalId = str(body.customerNationalId);
        if (name && name !== existingContract.customerName) identityUpdate.customerName = name;
        if (phone && phone !== existingContract.customerPhone) identityUpdate.customerPhone = phone;
        if (nationalId && nationalId !== existingContract.customerNationalId) identityUpdate.customerNationalId = nationalId;

        const newStart = moneyUpdate.startDate ?? reservation.startDate, newEnd = moneyUpdate.endDate ?? reservation.endDate;
        if (newEnd < newStart) {
          return NextResponse.json({ error: 'تاریخ بازگشت نمی‌تواند قبل از تاریخ خروج باشد' }, { status: 400 });
        }
        if (moneyUpdate.startDate || moneyUpdate.endDate) {
          const clash = await findOverlappingReservation(reservation.carId, newStart, newEnd, reservation.id);
          if (clash) return NextResponse.json({ error: overlapMessage(clash) }, { status: 409 });
          // Re-checked after the write: of two saves at the same moment, the later one always sees the other
          await saveReservation({ id: reservation.id, startDate: newStart, endDate: newEnd });
          datesToRestore = { id: reservation.id, startDate: reservation.startDate, endDate: reservation.endDate };
          const lateClash = await findOverlappingReservation(reservation.carId, newStart, newEnd, reservation.id);
          if (lateClash) {
            await saveReservation(datesToRestore);
            return NextResponse.json({ error: overlapMessage(lateClash) }, { status: 409 });
          }
        }
      }
      body.attachments = cleanAttachments(body.attachments);
      delete body.shareToken;
      delete body.shareVersion;

      contract = await saveContract(body);
      datesToRestore = undefined;
      if (reservation && createdRentalId) await issueContractAndRevenue(reservation);

      if (reservation && (Object.keys(moneyUpdate).length || Object.keys(identityUpdate).length)) {
        try {
          const updated = await saveReservation({ id: reservation.id, ...moneyUpdate, ...identityUpdate });
          if (identityUpdate.customerName) await renameRentalCustomer(updated.id, existingContract?.customerName || '', identityUpdate.customerName);
          // Only a change of dates or amounts touches the books; a corrected phone or name must not rewrite them
          if (Object.keys(moneyUpdate).length) {
            const synced = await syncReservationFinancials(updated);
            if (synced.contract) contract = synced.contract;
            overpaid = synced.overpaid;
          }
        } catch (syncErr) {
          console.error('Error carrying contract changes to the rental:', syncErr);
          const [shown] = await present([contract]);
          return NextResponse.json({ success: true, contract: shown, chargesError: true });
        }
      }
    } catch (saveErr) {
      if (createdRentalId) await discardRental(createdRentalId).catch(e => console.error(`Error discarding rental ${createdRentalId}:`, e));
      if (datesToRestore) await saveReservation(datesToRestore).catch(e => console.error(`Error restoring dates of rental ${datesToRestore?.id}:`, e));
      throw saveErr;
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
