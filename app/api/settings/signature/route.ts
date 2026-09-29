import { NextResponse } from 'next/server';
import { requireAdmin, requireSuperadmin } from '@/lib/auth-check';
import { deleteCompanySignature, getCompanySignatureUrl, saveCompanySignature, UploadRejected } from '@/lib/storage';

// Company signature printed in the "In charge signature" box of every contract.
// Anyone who can open the cars section may read it; only the general manager changes it.

export async function GET() {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;
    return NextResponse.json({ url: await getCompanySignatureUrl() });
  } catch (error) {
    console.error('Error reading company signature:', error);
    return NextResponse.json({ error: 'خطا در دریافت امضا' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { denied } = await requireSuperadmin();
    if (denied) return denied;

    const file = (await request.formData()).get('file');
    if (!file || typeof file === 'string' || !file.size) {
      return NextResponse.json({ error: 'فایل امضا ارسال نشده است.' }, { status: 400 });
    }
    return NextResponse.json({ success: true, url: await saveCompanySignature(file) });
  } catch (error) {
    if (error instanceof UploadRejected) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error saving company signature:', error);
    return NextResponse.json({ error: 'خطا در ذخیره امضا' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { denied } = await requireSuperadmin();
    if (denied) return denied;
    await deleteCompanySignature();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting company signature:', error);
    return NextResponse.json({ error: 'خطا در حذف امضا' }, { status: 500 });
  }
}
