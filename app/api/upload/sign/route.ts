import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import path from 'path';

// Public endpoint to generate Signed Upload URLs for uploading files up to 50MB directly to Supabase Storage
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fileName = (body.fileName || 'file').toString();
    const fileSize = Number(body.fileSize || 0);

    // Limit per file to 50 MB (52,428,800 bytes)
    const MAX_50MB = 50 * 1024 * 1024;
    if (fileSize > MAX_50MB) {
      return NextResponse.json(
        { error: `حجم فایل (${(fileSize / (1024 * 1024)).toFixed(1)}MB) بیش از سقف مجاز (۵۰ مگابایت) است.` },
        { status: 400 }
      );
    }

    const fileExt = path.extname(fileName) || '';
    const uniqueId = Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    const cleanBaseName = path.basename(fileName, fileExt).replace(/[^a-zA-Z0-9_\u0600-\u06FF.-]/g, '_');
    const safeFileName = `req_${cleanBaseName}_${uniqueId}${fileExt}`;

    // Generate signed upload URL from Supabase Storage bucket 'uploads'
    const { data, error } = await supabase.storage
      .from('uploads')
      .createSignedUploadUrl(safeFileName);

    if (error || !data) {
      console.error('Failed to create signed upload URL:', error);
      return NextResponse.json(
        { error: 'خطا در ایجاد مجوز آپلود فایل روی سرور ابری', details: error?.message },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(safeFileName);

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: safeFileName,
      publicUrl: publicUrlData.publicUrl
    });
  } catch (error: any) {
    console.error('Error in /api/upload/sign:', error);
    return NextResponse.json(
      { error: 'خطا در سرور صدور مجوز آپلود', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
