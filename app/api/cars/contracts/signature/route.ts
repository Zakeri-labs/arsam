import { NextResponse } from 'next/server';
import { getContractById } from '@/lib/db-cars';
import { getRenterSignatureUrl, saveRenterSignature, UploadRejected } from '@/lib/storage';
import { requireAdmin } from '@/lib/auth-check';

// Staff collect the renter's signature on the office device (the customer signs on the staff's screen).
// Same rule as the customer's own link: a contract is signed once, and the signature is kept in the private bucket.
export async function POST(request: Request) {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;

    const form = await request.formData();
    const id = form.get('id');
    const file = form.get('file');
    if (typeof id !== 'string' || !id) {
      return NextResponse.json({ error: 'شناسه قرارداد الزامی است' }, { status: 400 });
    }
    if (!file || typeof file === 'string' || !file.size) {
      return NextResponse.json({ error: 'امضا ارسال نشده است.' }, { status: 400 });
    }
    const contract = await getContractById(id);
    if (!contract) {
      return NextResponse.json({ error: 'قرارداد پیدا نشد' }, { status: 404 });
    }
    if (!(await saveRenterSignature(contract.id, await file.arrayBuffer()))) {
      return NextResponse.json({ error: 'این قرارداد قبلاً امضا شده است.', code: 'signed' }, { status: 409 });
    }
    return NextResponse.json({ success: true, renterSignatureUrl: await getRenterSignatureUrl(contract.id).catch(() => null) });
  } catch (error) {
    if (error instanceof UploadRejected) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error saving renter signature:', error);
    return NextResponse.json({ error: 'خطا در ثبت امضا' }, { status: 500 });
  }
}
