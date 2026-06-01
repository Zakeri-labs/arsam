import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRequests, addRequest, deleteRequest } from '@/lib/db-requests';
import { supabase } from '@/lib/supabase';
import path from 'path';

// POST (Public) - Submit a new request from landing page form with physical file uploads
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const description = formData.get('description') as string;
    const serviceTitle = formData.get('serviceTitle') as string;

    if (!name || !name.trim() || !phone || !phone.trim() || !serviceTitle) {
      return NextResponse.json(
        { error: 'پر کردن نام، تلفن و عنوان خدمت الزامی است' },
        { status: 400 }
      );
    }

    // Process and save physical files to Supabase Storage
    const fileObjects = formData.getAll('files') as File[];
    const uploadedFilesMetadata = [];

    for (const file of fileObjects) {
      if (!file || typeof file === 'string' || !file.name || !file.size) continue;

      try {
        const buffer = await file.arrayBuffer();
        const fileExt = path.extname(file.name) || '';
        const uniqueId = Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
        const cleanBaseName = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9_\u0600-\u06FF.-]/g, '_');
        const safeFileName = `${cleanBaseName}_${uniqueId}${fileExt}`;

        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(safeFileName, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: false
          });

        if (error) {
          console.error('Failed to upload file to Supabase:', file.name, error);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(safeFileName);

        uploadedFilesMetadata.push({
          name: file.name,
          size: file.size,
          url: publicUrlData.publicUrl
        });
      } catch (fileErr) {
        console.error('Failed to save file:', file.name, fileErr);
      }
    }

    const newRequest = await addRequest({
      name: name.trim(),
      phone: phone.trim(),
      description: (description || '').trim(),
      serviceTitle,
      files: uploadedFilesMetadata
    });

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error: any) {
    console.error('Error submitting request:', error);
    return NextResponse.json(
      { error: 'خطایی در سرور رخ داده است', details: error.message || String(error) },
      { status: 500 }
    );
  }
}

// GET (Secure, Admin Only) - Get all requests
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('ofogh_session');

    if (!session || session.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفا دوباره لاگین کنید.' },
        { status: 401 }
      );
    }

    const requests = await getRequests();
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error getting requests:', error);
    return NextResponse.json(
      { error: 'خطا در بارگذاری اطلاعات درخواست‌ها' },
      { status: 500 }
    );
  }
}

// DELETE (Secure, Admin Only) - Delete a request
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('ofogh_session');

    if (!session || session.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز. لطفا دوباره لاگین کنید.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه درخواست ارسالی معتبر نیست' },
        { status: 400 }
      );
    }

    const success = await deleteRequest(id);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'درخواست با شناسه معین یافت نشد' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting request:', error);
    return NextResponse.json(
      { error: 'خطایی در سرور رخ داده است' },
      { status: 500 }
    );
  }
}
