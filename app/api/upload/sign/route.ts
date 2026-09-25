import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MAX_SIGNED_UPLOAD_BYTES, planUpload, publicUrlFor, UPLOAD_BUCKET, UploadRejected } from '@/lib/storage';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';

// Public endpoint to generate Signed Upload URLs for uploading files up to 50MB directly to Supabase Storage
export async function POST(request: Request) {
  try {
    if (!rateLimit(`upload-sign:${clientIp(request)}`, 40, 10 * 60 * 1000)) {
      return tooManyRequests();
    }

    const body = await request.json();
    const fileName = (body.fileName || 'file').toString();
    const fileSize = Number(body.fileSize || 0);

    if (!(fileSize > 0) || fileSize > MAX_SIGNED_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `حجم فایل (${(fileSize / (1024 * 1024)).toFixed(1)}MB) بیش از سقف مجاز (۵۰ مگابایت) است.` },
        { status: 400 }
      );
    }

    const { objectPath, contentType } = planUpload(fileName, 'req');

    const { data, error } = await supabase.storage
      .from(UPLOAD_BUCKET)
      .createSignedUploadUrl(objectPath);

    if (error || !data) {
      console.error('Failed to create signed upload URL:', error);
      return NextResponse.json({ error: 'خطا در ایجاد مجوز آپلود فایل روی سرور ابری' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: objectPath,
      contentType,
      publicUrl: publicUrlFor(objectPath)
    });
  } catch (error: any) {
    if (error instanceof UploadRejected) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error in /api/upload/sign:', error);
    return NextResponse.json({ error: 'خطا در سرور صدور مجوز آپلود' }, { status: 500 });
  }
}
