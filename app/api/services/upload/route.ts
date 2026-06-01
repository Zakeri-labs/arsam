import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import path from 'path';

export async function POST(request: Request) {
  try {
    // Security check
    const cookieStore = await cookies();
    const session = cookieStore.get('ofogh_session');

    if (!session || session.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفا دوباره لاگین کنید.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || typeof file === 'string' || !file.name || !file.size) {
      return NextResponse.json(
        { error: 'فایل تصویر معتبر ارسال نشده است.' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const fileExt = path.extname(file.name) || '';
    const uniqueId = Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    const cleanBaseName = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9_\u0600-\u06FF.-]/g, '_');
    const safeFileName = `service_${cleanBaseName}_${uniqueId}${fileExt}`;

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(safeFileName, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      });

    if (error) {
      console.error('Failed to upload file to Supabase:', error);
      return NextResponse.json(
        { error: 'خطا در آپلود عکس در سرور ابری', details: error.message },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(safeFileName);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl
    });
  } catch (error: any) {
    console.error('Error uploading service image:', error);
    return NextResponse.json(
      { error: 'خطا در آپلود عکس در سرور', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
