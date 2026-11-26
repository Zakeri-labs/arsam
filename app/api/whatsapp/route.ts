import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-check';
import { getThread, listConversations } from '@/lib/whatsapp';
import { getBlacklistKeys } from '@/lib/blacklist';

// GET (requests / customers staff)
//   ?q=&page=                        one page of conversations
//   ?chat=<key>[&before_at=&before_id=]  one customer's thread (newest page, or older than the cursor)
export async function GET(request: Request) {
  const denied = await requireAdmin(['requests', 'customers']);
  if (denied) return denied;
  try {
    const params = new URL(request.url).searchParams;
    const chat = (params.get('chat') || '').replace(/\D/g, '');
    if (!chat) {
      const page = Math.max(1, Math.min(10000, Number.parseInt(params.get('page') || '1', 10) || 1));
      return NextResponse.json(await listConversations(params.get('q') || '', page));
    }
    // strict: if the blacklist cannot be read, fail rather than show a possibly blocked number
    if ((await getBlacklistKeys({ strict: true })).has(chat)) return NextResponse.json({ hasMore: false, messages: [] });
    const beforeAt = params.get('before_at');
    const beforeId = params.get('before_id') || '';
    let before = null;
    if (beforeAt) {
      const at = new Date(beforeAt);
      if (Number.isNaN(at.getTime()) || !/^[^"\\,()]{1,200}$/.test(beforeId)) {
        return NextResponse.json({ error: 'bad cursor' }, { status: 400 });
      }
      before = { sentAt: at.toISOString(), id: beforeId };
    }
    return NextResponse.json(await getThread(chat, before));
  } catch (error: any) {
    console.error('WhatsApp inbox read failed:', error);
    // code deployed before supabase_migration_whatsapp_blacklist_guard.sql was run
    if (error?.code === 'PGRST202' || error?.code === '42883' || error?.code === '42P01') {
      return NextResponse.json({ error: 'صندوق واتس‌اپ هنوز کامل راه‌اندازی نشده است (مایگریشن دیتابیس اجرا نشده).' }, { status: 503 });
    }
    return NextResponse.json({ error: 'خطا در بارگذاری پیام‌های واتس‌اپ' }, { status: 500 });
  }
}
