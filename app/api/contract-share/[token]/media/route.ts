import { NextResponse } from 'next/server';
import { readContractShareToken } from '@/lib/contract-share';
import { getContractById } from '@/lib/db-cars';
import { signContractMedia } from '@/lib/storage';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';

// Public, no login: the link printed in a contract PDF for a car video. It only works while the
// contract's share link is valid, and only for files attached to that contract; it then redirects to a
// fresh short-lived signed URL, so the PDF itself never holds a permanent address.
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    if (!rateLimit(`contract-share-media:${clientIp(request)}`, 120, 10 * 60 * 1000)) {
      return tooManyRequests();
    }
    const { token } = await params;
    const file = new URL(request.url).searchParams.get('f') || '';
    const read = readContractShareToken(token);
    const contract = read.status === 'ok' ? await getContractById(read.contractId) : undefined;
    const allowed = contract?.attachments?.some(a => a.path === file || a.posterPath === file);
    if (!contract || read.status !== 'ok' || read.version !== (contract.shareVersion || 1) || !allowed) {
      return new NextResponse('This link is not valid or has expired.', { status: 410, headers: { 'Cache-Control': 'no-store' } });
    }
    const url = (await signContractMedia([file])).get(file);
    if (!url) return new NextResponse('File not found', { status: 404 });
    return NextResponse.redirect(url, { status: 302, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  } catch (error) {
    console.error('Error in /api/contract-share media:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
