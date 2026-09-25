import { NextResponse } from 'next/server';
import { getRequests, addRequest, deleteRequest, updateRequestDetails, RequestFile } from '@/lib/db-requests';
import { requireAdmin, verifyAdminAuth } from '@/lib/auth-check';
import { isOwnUploadUrl, uploadFile, UploadRejected } from '@/lib/storage';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';

const MAX_FILES = 20;
const MAX_TEXT = 5000;

// Keeps only file entries that point into our own storage bucket, so a public
// submitter cannot plant arbitrary links in the admin panel.
function sanitizeFiles(input: unknown): RequestFile[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(f => f && isOwnUploadUrl(f.url))
    .slice(0, MAX_FILES)
    .map(f => ({
      name: String(f.name || 'file').slice(0, 255),
      size: Number(f.size) || 0,
      url: f.url as string,
    }));
}

const text = (value: unknown, max = MAX_TEXT) => (typeof value === 'string' ? value : '').trim().slice(0, max);

// POST (Public) - Submit a new request from landing page form with physical file uploads or pre-uploaded metadata
export async function POST(request: Request) {
  try {
    if (!rateLimit(`request-submit:${clientIp(request)}`, 10, 10 * 60 * 1000)) {
      return tooManyRequests();
    }

    const contentType = request.headers.get('content-type') || '';
    let name = '';
    let phone = '';
    let description = '';
    let serviceTitle = '';
    let uploadedFilesMetadata: RequestFile[] = [];

    if (contentType.includes('application/json')) {
      const body = await request.json();
      name = text(body.name, 200);
      phone = text(body.phone, 50);
      description = text(body.description);
      serviceTitle = text(body.serviceTitle, 500);
      uploadedFilesMetadata = sanitizeFiles(body.files);
    } else {
      const formData = await request.formData();
      name = text(formData.get('name'), 200);
      phone = text(formData.get('phone'), 50);
      description = text(formData.get('description'));
      serviceTitle = text(formData.get('serviceTitle'), 500);

      const fileObjects = formData.getAll('files').slice(0, MAX_FILES);
      for (const file of fileObjects) {
        if (!file || typeof file === 'string' || !file.name || !file.size) continue;
        try {
          uploadedFilesMetadata.push(await uploadFile(file, 'req'));
        } catch (fileErr) {
          if (fileErr instanceof UploadRejected) {
            return NextResponse.json({ error: fileErr.message }, { status: 400 });
          }
          console.error('Failed to upload file to Supabase:', file.name, fileErr);
        }
      }
    }

    if (!name || !phone || !serviceTitle) {
      return NextResponse.json(
        { error: 'پر کردن نام، تلفن و عنوان خدمت الزامی است' },
        { status: 400 }
      );
    }

    const newRequest = await addRequest({
      name,
      phone,
      description,
      serviceTitle,
      files: uploadedFilesMetadata
    });

    // Echo back only what the submitter needs, not the stored row.
    return NextResponse.json({ success: true, request: { id: newRequest.id } });
  } catch (error: any) {
    console.error('Error submitting request:', error);
    return NextResponse.json({ error: 'خطایی در سرور رخ داده است' }, { status: 500 });
  }
}

// GET (Secure, Admin Only) - Get all requests
export async function GET() {
  try {
    const auth = await verifyAdminAuth(['requests', 'customers', 'qms', 'cars']);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز. لطفا دوباره لاگین کنید.' }, { status: 401 });
    }
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: 'شما به این بخش دسترسی ندارید.' }, { status: 403 });
    }

    const requests = await getRequests();

    // The fleet-only admin just needs customer names/phones for the booking form.
    const seesFullRequests = auth.user.allowedScreens.some(s => s === 'requests' || s === 'customers' || s === 'qms');
    if (!seesFullRequests) {
      return NextResponse.json(requests.map(r => ({ name: r.name, phone: r.phone })));
    }
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
    const denied = await requireAdmin(['requests', 'customers', 'qms']);
    if (denied) return denied;

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

// PATCH (Secure, Admin Only) - Update request workflow, status, source, notes, or files
export async function PATCH(request: Request) {
  try {
    const denied = await requireAdmin(['requests', 'customers', 'qms']);
    if (denied) return denied;

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه درخواست الزامی است' },
        { status: 400 }
      );
    }

    const success = await updateRequestDetails(id, updates);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'بروزرسانی درخواست ناموفق بود' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating request via PATCH:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی اطلاعات درخواست' },
      { status: 500 }
    );
  }
}
