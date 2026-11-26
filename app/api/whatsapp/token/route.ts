import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/auth-check';
import { createAgentToken, getSyncStatus } from '@/lib/whatsapp';

// GET (general manager) - connection status of the office WhatsApp agent
export async function GET() {
  const { denied } = await requireSuperadmin();
  if (denied) return denied;
  try {
    return NextResponse.json(await getSyncStatus());
  } catch (error) {
    console.error('WhatsApp status failed:', error);
    return NextResponse.json({ error: 'خطا در خواندن وضعیت اتصال واتس‌اپ' }, { status: 500 });
  }
}

// POST (general manager) - new agent token, shown once; the previous one stops working
export async function POST() {
  const { denied } = await requireSuperadmin();
  if (denied) return denied;
  try {
    return NextResponse.json({ token: await createAgentToken() });
  } catch (error) {
    console.error('WhatsApp token failed:', error);
    return NextResponse.json({ error: 'خطا در ساخت کلید اتصال' }, { status: 500 });
  }
}
