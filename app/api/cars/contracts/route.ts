import { NextResponse } from 'next/server';
import { getContracts, saveContract, deleteContract, syncContractExtraCharges } from '@/lib/db-cars';
import { verifyAdminAuth, requireAdmin } from '@/lib/auth-check';

export async function GET() {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;
    return NextResponse.json(await getContracts());
  } catch (error: any) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'خطا در دریافت صورتجلسه‌های تحویل' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;

    const body = await request.json();
    if (!body.customerName || !body.carTitle || body.initialOdometer === undefined || body.initialOdometer === '') {
      return NextResponse.json({ error: 'اطلاعات ضروری صورتجلسه ناقص است' }, { status: 400 });
    }

    const contract = await saveContract(body);
    try {
      await syncContractExtraCharges(contract);
    } catch (syncErr) {
      console.error('Error syncing contract extra charges:', syncErr);
      return NextResponse.json({ success: true, contract, chargesError: true });
    }
    return NextResponse.json({ success: true, contract });
  } catch (error: any) {
    console.error('Error saving contract:', error);
    return NextResponse.json({ error: 'خطا در ذخیره‌سازی صورتجلسه' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await verifyAdminAuth(['cars']);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز. لطفا دوباره لاگین کنید.' }, { status: 401 });
    }
    if (!auth.authorized) {
      return NextResponse.json({ error: 'شما به این بخش دسترسی ندارید.' }, { status: 403 });
    }
    // Removes the reservation and accounting rows too, even after handover: general manager only
    if (auth.user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'حذف قرارداد فقط برای مدیر کل مجاز است' }, { status: 403 });
    }

    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'شناسه صورتجلسه الزامی است' }, { status: 400 });
    }

    const removed = await deleteContract(id);
    return NextResponse.json({ success: true, ...removed });
  } catch (error: any) {
    console.error('Error deleting contract:', error);
    return NextResponse.json({ error: 'خطا در حذف صورتجلسه' }, { status: 500 });
  }
}
