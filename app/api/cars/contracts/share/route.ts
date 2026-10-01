import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-check';
import { bumpContractShareVersion } from '@/lib/db-cars';
import { createContractShareToken } from '@/lib/contract-share';

// Admin only: "revoke link". Moves the contract to the next share version, so every link issued
// before stops working, and returns a fresh link.
export async function POST(request: Request) {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) return NextResponse.json({ error: 'شناسه قرارداد الزامی است' }, { status: 400 });

    const version = await bumpContractShareVersion(id);
    if (!version) return NextResponse.json({ error: 'قرارداد پیدا نشد' }, { status: 404 });
    return NextResponse.json({ success: true, shareVersion: version, shareToken: createContractShareToken(id, version) });
  } catch (error: any) {
    console.error('Error revoking contract link:', error);
    const missingColumn = /share_version/.test(String(error?.message || ''));
    return NextResponse.json(
      { error: missingColumn ? 'باطل کردن لینک هنوز فعال نشده است (اسکریپت دیتابیس اجرا نشده)' : 'خطا در باطل کردن لینک' },
      { status: 500 }
    );
  }
}
