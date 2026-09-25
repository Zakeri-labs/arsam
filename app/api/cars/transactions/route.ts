import { NextResponse } from 'next/server';
import { getTransactions, saveTransaction, deleteTransaction } from '@/lib/db-cars';
import { uploadFile, UploadRejected } from '@/lib/storage';
import { requireAdmin } from '@/lib/auth-check';

export async function GET() {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;

    const transactions = await getTransactions();
    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'خطا در بارگذاری لیست تراکنش‌ها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;

    const contentType = request.headers.get('content-type') || '';

    // Handle multipart/form-data with file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const amount = Number(formData.get('amount'));
      const type = formData.get('type') as any;
      const paymentMethod = formData.get('paymentMethod') as any;
      const description = (formData.get('description') as string) || '';
      const customerName = (formData.get('customerName') as string) || '';
      const carId = (formData.get('carId') as string) || '';
      const reservationId = (formData.get('reservationId') as string) || '';
      const transactionDate = (formData.get('transactionDate') as string) || new Date().toISOString().split('T')[0];
      const file = formData.get('receiptFile') as File | null;

      let receiptFileUrl = '';
      let receiptFileName = '';

      if (file && file.name && file.size > 0) {
        try {
          const uploaded = await uploadFile(file, 'tx');
          receiptFileUrl = uploaded.url;
          receiptFileName = uploaded.name;
        } catch (fileErr) {
          if (fileErr instanceof UploadRejected) {
            return NextResponse.json({ error: fileErr.message }, { status: 400 });
          }
          console.error('Failed upload to Supabase storage:', fileErr);
        }
      }

      const tx = await saveTransaction({
        amount,
        type,
        paymentMethod,
        description,
        customerName,
        carId,
        reservationId,
        transactionDate,
        receiptFileUrl,
        receiptFileName
      });

      return NextResponse.json({ success: true, transaction: tx });
    }

    // JSON fallback
    const body = await request.json();
    if (!body.amount || !body.paymentMethod) {
      return NextResponse.json({ error: 'مبلغ و روش پرداخت الزامی است' }, { status: 400 });
    }

    const tx = await saveTransaction(body);
    return NextResponse.json({ success: true, transaction: tx });

  } catch (error: any) {
    console.error('Error saving transaction:', error);
    return NextResponse.json({ error: 'خطا در ثبت تراکنش مالی' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const denied = await requireAdmin(['cars']);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'شناسه تراکنش الزامی است' }, { status: 400 });
    }

    await deleteTransaction(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'خطا در حذف تراکنش' }, { status: 500 });
  }
}
