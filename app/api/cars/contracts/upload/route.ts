import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth-check';
import { planContractMedia, publicUrlFor, UPLOAD_BUCKET, UploadRejected } from '@/lib/storage';

// Admin only: a signed URL so the browser uploads a contract photo/video straight to storage
// (large files never pass through the serverless function body limit).
export async function POST(request: Request) {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const { objectPath, contentType } = planContractMedia(String(body.fileName || ''), Number(body.fileSize || 0), !!body.video);

    const { data, error } = await supabase.storage.from(UPLOAD_BUCKET).createSignedUploadUrl(objectPath);
    if (error || !data) {
      console.error('Failed to create signed upload URL for contract media:', error);
      return NextResponse.json({ error: 'خطا در ایجاد مجوز آپلود فایل' }, { status: 500 });
    }

    return NextResponse.json({ success: true, signedUrl: data.signedUrl, contentType, publicUrl: publicUrlFor(objectPath) });
  } catch (error: any) {
    if (error instanceof UploadRejected) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error in /api/cars/contracts/upload:', error);
    return NextResponse.json({ error: 'خطا در سرور صدور مجوز آپلود' }, { status: 500 });
  }
}
