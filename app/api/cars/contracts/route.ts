import { NextResponse } from 'next/server';
import { getContracts, saveContract, deleteContract, getContractById, getReservationById, ReturnSignedError, RETURN_SIGNED_MESSAGE, syncContractExtraCharges, CONTRACT_ATTACHMENT_KINDS, type CarContract, type ContractAttachment } from '@/lib/db-cars';
import { verifyAdminAuth, requireAdmin } from '@/lib/auth-check';
import { createContractShareToken } from '@/lib/contract-share';
import { isContractMediaPath, isOwnUploadUrl, presentContractAttachments } from '@/lib/storage';

const MAX_ATTACHMENTS = 40;

// What the browser receives: each contract carries the token of its public "download the contract" link,
// and its attachments carry short-lived signed URLs (the stored form only holds bucket paths).
async function present(contracts: CarContract[]): Promise<CarContract[]> {
  const tokens = new Map(contracts.map(c => [c.id, createContractShareToken(c.id, c.shareVersion || 1)]));
  const withMedia = await presentContractAttachments(contracts, tokens);
  return withMedia.map(c => ({ ...c, shareToken: tokens.get(c.id) ?? null }));
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
    // The customer of a contract is the customer of its reservation: a contract save can never rename it
    const linkedReservationId = body.reservationId || (body.id ? (await getContractById(body.id))?.reservationId : undefined);
    if (linkedReservationId) {
      const reservation = await getReservationById(linkedReservationId);
      if (reservation) body.customerName = reservation.customerName;
    }
    body.attachments = cleanAttachments(body.attachments);
    delete body.shareToken;
    delete body.shareVersion;

    const contract = await saveContract(body);
    try {
      await syncContractExtraCharges(contract);
    } catch (syncErr) {
      console.error('Error syncing contract extra charges:', syncErr);
      const [shown] = await present([contract]);
      return NextResponse.json({ success: true, contract: shown, chargesError: true });
    }
    const [shown] = await present([contract]);
    return NextResponse.json({ success: true, contract: shown });
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
    console.error('Error deleting contract:', error);
    return NextResponse.json({ error: 'خطا در حذف صورتجلسه' }, { status: 500 });
  }
}
