import { NextResponse } from 'next/server';
import { readContractShareToken } from '@/lib/contract-share';
import { getCarById, getContractById, getReservationById } from '@/lib/db-cars';
import { buildContractData } from '@/lib/contract-data';
import { getCompanySignatureUrl, getRenterSignatureUrl, getRenterSignedAt, presentContractAttachments } from '@/lib/storage';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';

const HEADERS = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };

// Public, no login: returns exactly what is printed on one contract, for the holder of its signed link.
// The link must be unexpired and carry the contract's current share version.
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    if (!rateLimit(`contract-share:${clientIp(request)}`, 60, 10 * 60 * 1000)) {
      return tooManyRequests();
    }

    const { token } = await params;
    const read = readContractShareToken(token);
    if (read.status === 'expired') {
      return NextResponse.json({ error: 'مهلت این لینک تمام شده است.', code: 'expired' }, { status: 410, headers: HEADERS });
    }
    const contract = read.status === 'ok' ? await getContractById(read.contractId) : undefined;
    if (!contract) {
      return NextResponse.json({ error: 'لینک قرارداد معتبر نیست یا قرارداد حذف شده است.' }, { status: 404, headers: HEADERS });
    }
    if (read.status === 'ok' && read.version !== (contract.shareVersion || 1)) {
      return NextResponse.json({ error: 'این لینک باطل شده است.', code: 'revoked' }, { status: 410, headers: HEADERS });
    }

    const reservation = contract.reservationId ? await getReservationById(contract.reservationId) : undefined;
    const carId = contract.carId || reservation?.carId;
    const car = carId ? await getCarById(carId) : undefined;
    const signatureUrl = await getCompanySignatureUrl().catch(() => null);
    const [shown] = await presentContractAttachments([contract], new Map([[contract.id, token]]));
    shown.renterSignatureUrl = await getRenterSignatureUrl(contract.id).catch(() => null);
    shown.renterSignedAt = shown.renterSignatureUrl ? await getRenterSignedAt(contract.id).catch(() => null) : null;

    return NextResponse.json({ contract: buildContractData(shown, reservation, car), signatureUrl }, { headers: HEADERS });
  } catch (error) {
    console.error('Error in /api/contract-share:', error);
    return NextResponse.json({ error: 'خطا در دریافت قرارداد' }, { status: 500 });
  }
}
