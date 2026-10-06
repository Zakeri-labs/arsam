import { NextResponse } from 'next/server';
import { readContractShareToken } from '@/lib/contract-share';
import { getContractById } from '@/lib/db-cars';
import { saveRenterSignature, UploadRejected } from '@/lib/storage';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';

const HEADERS = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };

// Public, no login: the renter signs the contract on their own phone through their signed link.
// Same checks as reading the contract (valid, unexpired, current version); a contract is signed once.
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    if (!rateLimit(`contract-sign:${clientIp(request)}`, 10, 10 * 60 * 1000)) {
      return tooManyRequests();
    }

    const { token } = await params;
    const read = readContractShareToken(token);
    if (read.status === 'expired') {
      return NextResponse.json({ error: 'مهلت این لینک تمام شده است.', code: 'expired' }, { status: 410, headers: HEADERS });
    }
    const contract = read.status === 'ok' ? await getContractById(read.contractId) : undefined;
    if (!contract) {
      return NextResponse.json({ error: 'لینک قرارداد معتبر نیست.' }, { status: 404, headers: HEADERS });
    }
    if (read.status === 'ok' && read.version !== (contract.shareVersion || 1)) {
      return NextResponse.json({ error: 'این لینک باطل شده است.', code: 'revoked' }, { status: 410, headers: HEADERS });
    }

    const file = (await request.formData()).get('file');
    if (!file || typeof file === 'string' || !file.size) {
      return NextResponse.json({ error: 'امضا ارسال نشده است.' }, { status: 400, headers: HEADERS });
    }
    if (!(await saveRenterSignature(contract.id, await file.arrayBuffer()))) {
      return NextResponse.json({ error: 'این قرارداد قبلاً امضا شده است.', code: 'signed' }, { status: 409, headers: HEADERS });
    }
    return NextResponse.json({ success: true }, { headers: HEADERS });
  } catch (error) {
    if (error instanceof UploadRejected) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: HEADERS });
    }
    console.error('Error in /api/contract-share/sign:', error);
    return NextResponse.json({ error: 'خطا در ثبت امضا' }, { status: 500 });
  }
}
