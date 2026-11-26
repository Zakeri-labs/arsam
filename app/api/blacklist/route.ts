import { NextResponse } from 'next/server';
import { verifyAdminAuth, requireSuperadmin } from '@/lib/auth-check';
import { addToBlacklist, getBlacklist, removeFromBlacklist } from '@/lib/blacklist';
import { conversationMedia, purgeConversation, sweepOrphanMedia } from '@/lib/whatsapp';
import { phoneKey } from '@/lib/phone-key';

const text = (value: unknown, max: number) => (typeof value === 'string' ? value : '').trim().slice(0, max);

// GET (general manager) - the blacklist shown in Settings
export async function GET() {
  const { denied } = await requireSuperadmin();
  if (denied) return denied;
  try {
    return NextResponse.json(await getBlacklist());
  } catch (error) {
    console.error('Error reading blacklist:', error);
    return NextResponse.json({ error: 'خطا در بارگذاری لیست سیاه' }, { status: 500 });
  }
}

// POST (anyone who sees requests or customers) - blacklist a number
export async function POST(request: Request) {
  const auth = await verifyAdminAuth(['requests', 'customers']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز. لطفا دوباره لاگین کنید.' }, { status: 401 });
  }
  if (!auth.authorized) {
    return NextResponse.json({ error: 'شما به این بخش دسترسی ندارید.' }, { status: 403 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const phone = text(body.phone, 50);
    if (phoneKey(phone).length < 7) {
      return NextResponse.json({ error: 'شماره معتبر نیست' }, { status: 400 });
    }
    const key = phoneKey(phone);
    // Block first, so a storage hiccup can never leave the number unblocked. The media
    // paths are read just before, because the blacklist trigger deletes the rows.
    let cleanupPending = false;
    const media = await conversationMedia(key).catch(err => {
      console.error('WhatsApp media lookup failed for a blacklisted number:', err);
      cleanupPending = true;
      return [] as string[];
    });
    await addToBlacklist(phone, text(body.name, 200) || null, auth.user.email);
    // Then drop what was already stored for it. If this fails the number is still
    // blocked and hidden; the orphan sweep removes leftover files on a later run.
    await purgeConversation(key, media).catch(err => {
      console.error('WhatsApp purge failed for a blacklisted number:', err);
      cleanupPending = true;
    });
    await sweepOrphanMedia().catch(err => console.error('WhatsApp orphan sweep failed:', err));
    return NextResponse.json({ success: true, cleanupPending });
  } catch (error) {
    console.error('Error adding to blacklist:', error);
    return NextResponse.json({ error: 'خطا در افزودن به لیست سیاه' }, { status: 500 });
  }
}

// DELETE (general manager) - take a number off the blacklist
export async function DELETE(request: Request) {
  const { denied } = await requireSuperadmin();
  if (denied) return denied;
  try {
    const key = (new URL(request.url).searchParams.get('key') || '').replace(/\D/g, '');
    if (!key) {
      return NextResponse.json({ error: 'شماره معتبر نیست' }, { status: 400 });
    }
    if (!(await removeFromBlacklist(key))) {
      return NextResponse.json({ error: 'این شماره در لیست سیاه نیست' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from blacklist:', error);
    return NextResponse.json({ error: 'خطا در برداشتن از لیست سیاه' }, { status: 500 });
  }
}
