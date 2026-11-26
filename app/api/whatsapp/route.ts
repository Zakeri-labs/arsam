import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-check';
import { getThread, listConversations } from '@/lib/whatsapp';
import { getBlacklistKeys } from '@/lib/blacklist';

// GET (requests / customers staff) - conversations, or one customer's thread with ?chat=<key>
export async function GET(request: Request) {
  const denied = await requireAdmin(['requests', 'customers']);
  if (denied) return denied;
  try {
    const chat = (new URL(request.url).searchParams.get('chat') || '').replace(/\D/g, '');
    if (!chat) return NextResponse.json(await listConversations());
    if ((await getBlacklistKeys()).has(chat)) return NextResponse.json([]);
    return NextResponse.json(await getThread(chat));
  } catch (error) {
    console.error('WhatsApp inbox read failed:', error);
    return NextResponse.json({ error: 'خطا در بارگذاری پیام‌های واتس‌اپ' }, { status: 500 });
  }
}
