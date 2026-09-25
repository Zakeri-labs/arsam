import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-check';
import { uploadFile, UploadRejected } from '@/lib/storage';

// Admin upload: service images, car photos and documents attached to a case.
export async function POST(request: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string' || !file.name || !file.size) {
      return NextResponse.json(
        { error: 'فایل معتبر ارسال نشده است.' },
        { status: 400 }
      );
    }

    const uploaded = await uploadFile(file, 'admin');
    return NextResponse.json({ success: true, ...uploaded });
  } catch (error: any) {
    if (error instanceof UploadRejected) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error uploading admin file:', error);
    return NextResponse.json({ error: 'خطا در آپلود فایل در سرور' }, { status: 500 });
  }
}
