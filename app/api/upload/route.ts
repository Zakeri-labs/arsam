import { NextResponse } from 'next/server';
import { uploadFile, UploadRejected } from '@/lib/storage';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';

// Public endpoint for uploading single files for customer service requests
export async function POST(request: Request) {
  try {
    if (!rateLimit(`upload:${clientIp(request)}`, 40, 10 * 60 * 1000)) {
      return tooManyRequests();
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string' || !file.name || !file.size) {
      return NextResponse.json(
        { error: 'فایل معتبر ارسال نشده است.' },
        { status: 400 }
      );
    }

    const uploaded = await uploadFile(file, 'req');
    return NextResponse.json({ success: true, ...uploaded });
  } catch (error: any) {
    if (error instanceof UploadRejected) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error in /api/upload:', error);
    return NextResponse.json({ error: 'خطا در آپلود فایل در سرور' }, { status: 500 });
  }
}
