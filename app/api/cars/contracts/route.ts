import { NextResponse } from 'next/server';
import { getContracts, saveContract, deleteContract, syncContractExtraCharges, CONTRACT_ATTACHMENT_KINDS, type CarContract, type ContractAttachment } from '@/lib/db-cars';
import { verifyAdminAuth, requireAdmin } from '@/lib/auth-check';
import { createContractShareToken } from '@/lib/contract-share';
import { isOwnUploadUrl } from '@/lib/storage';

const MAX_ATTACHMENTS = 40;

// Each contract carries the token of its public "download the contract" link
const withShareToken = (contract: CarContract) => ({ ...contract, shareToken: createContractShareToken(contract.id) });

// Only files that were uploaded to our own bucket are accepted as attachments
function cleanAttachments(value: unknown): ContractAttachment[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return value
    .filter((a: any) => a && CONTRACT_ATTACHMENT_KINDS.includes(a.kind) && isOwnUploadUrl(a.url))
    .slice(0, MAX_ATTACHMENTS)
    .map((a: any) => ({
      kind: a.kind,
      url: a.url,
      name: typeof a.name === 'string' ? a.name.slice(0, 200) : undefined,
      size: Number.isFinite(Number(a.size)) ? Number(a.size) : undefined,
      posterUrl: a.kind === 'car_video' && isOwnUploadUrl(a.posterUrl) ? a.posterUrl : undefined,
    }));
}

export async function GET() {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;
    return NextResponse.json((await getContracts()).map(withShareToken));
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
    body.attachments = cleanAttachments(body.attachments);
    delete body.shareToken;

    const contract = await saveContract(body);
    try {
      await syncContractExtraCharges(contract);
    } catch (syncErr) {
      console.error('Error syncing contract extra charges:', syncErr);
      return NextResponse.json({ success: true, contract: withShareToken(contract), chargesError: true });
    }
    return NextResponse.json({ success: true, contract: withShareToken(contract) });
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
    console.error('Error deleting contract:', error);
    return NextResponse.json({ error: 'خطا در حذف صورتجلسه' }, { status: 500 });
  }
}
