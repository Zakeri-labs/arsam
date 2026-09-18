import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import path from 'path';

// Public endpoint for uploading single files for customer service requests
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || typeof file === 'string' || !file.name || !file.size) {
      return NextResponse.json(
        { error: 'فایل معتبر ارسال نشده است.' },
        { status: 400 }
      );
    }

    // Safety check for Vercel serverless function payload limit (4.2 MB)
    if (file.size > 4.2 * 1024 * 1024) {
      return NextResponse.json(
        { error: `حجم فایل (${(file.size / (1024 * 1024)).toFixed(1)}MB) بیش از سقف مجاز (۴ مگابایت) است.` },
        { status: 413 }
      );
    }

    const buffer = await file.arrayBuffer();
    const fileExt = path.extname(file.name) || '';
    const uniqueId = Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    const cleanBaseName = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9_\u0600-\u06FF.-]/g, '_');
    const safeFileName = `req_${cleanBaseName}_${uniqueId}${fileExt}`;

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(safeFileName, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      });

    if (error) {
      console.error('Failed to upload file to Supabase Storage:', file.name, error);
      return NextResponse.json(
        { error: 'خطا در ذخیره‌سازی فایل در سرور ابری', details: error.message },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(safeFileName);

    return NextResponse.json({
      success: true,
      name: file.name,
      size: file.size,
      url: publicUrlData.publicUrl
    });
  } catch (error: any) {
    console.error('Error in /api/upload:', error);
    return NextResponse.json(
      { error: 'خطا در آپلود فایل در سرور', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
