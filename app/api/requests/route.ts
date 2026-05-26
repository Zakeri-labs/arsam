import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRequests, addRequest, deleteRequest } from '@/lib/db-requests';
import fs from 'fs';
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

    // Process and save physical files to /public/uploads/
    const fileObjects = formData.getAll('files') as File[];
    const uploadedFilesMetadata = [];

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    for (const file of fileObjects) {
      if (!file || file.size === 0) continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileExt = path.extname(file.name) || '';
      const uniqueId = Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      const cleanBaseName = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9_\u0600-\u06FF.-]/g, '_');
      const safeFileName = `${cleanBaseName}_${uniqueId}${fileExt}`;

      const filePath = path.join(uploadDir, safeFileName);
      fs.writeFileSync(filePath, buffer);

      uploadedFilesMetadata.push({
        name: file.name,
        size: file.size,
        url: `/uploads/${safeFileName}` // Public URL that can be directly accessed/downloaded
      });
    }

    const newRequest = addRequest({
      name: name.trim(),
      phone: phone.trim(),
      description: (description || '').trim(),
      serviceTitle,
      files: uploadedFilesMetadata
    });

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error) {
    console.error('Error submitting request:', error);
    return NextResponse.json(
      { error: 'خطایی در سرور رخ داده است' },
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

    const requests = getRequests();
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

    const success = deleteRequest(id);
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
