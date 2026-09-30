import { NextResponse } from 'next/server';
import { readContractShareToken } from '@/lib/contract-share';
import { getCarById, getContractById, getReservationById } from '@/lib/db-cars';
import { buildContractData } from '@/lib/contract-data';
import { getCompanySignatureUrl } from '@/lib/storage';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';

// Public, no login: returns exactly what is printed on one contract, for the holder of its signed link.
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    if (!rateLimit(`contract-share:${clientIp(request)}`, 60, 10 * 60 * 1000)) {
      return tooManyRequests();
    }

    const { token } = await params;
    const contractId = readContractShareToken(token);
    const contract = contractId ? await getContractById(contractId) : undefined;
    if (!contract) {
      return NextResponse.json({ error: 'لینک قرارداد معتبر نیست یا قرارداد حذف شده است.' }, { status: 404 });
    }

    const reservation = contract.reservationId ? await getReservationById(contract.reservationId) : undefined;
    const carId = contract.carId || reservation?.carId;
    const car = carId ? await getCarById(carId) : undefined;
    const signatureUrl = await getCompanySignatureUrl().catch(() => null);

    return NextResponse.json(
      { contract: buildContractData(contract, reservation, car), signatureUrl },
      { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } }
    );
  } catch (error) {
    console.error('Error in /api/contract-share:', error);
    return NextResponse.json({ error: 'خطا در دریافت قرارداد' }, { status: 500 });
  }
}
