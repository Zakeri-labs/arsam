import { NextResponse } from 'next/server';
import { getTransactions, saveTransaction, deleteTransactionRestoringDebt, recordPayment, setTransactionReceived, TransactionRuleError } from '@/lib/db-cars';
import { uploadFile, UploadRejected } from '@/lib/storage';
import { requireAdmin, verifyAdminAuth } from '@/lib/auth-check';

// Same checks as requireAdmin(['cars']), but also returns who is acting so it can be stored on the row
async function requireCarsUser(): Promise<{ denied: Response | null; actor?: string }> {
  const auth = await verifyAdminAuth(['cars']);
  if (!auth.authenticated) {
    return { denied: NextResponse.json({ error: 'دسترسی غیرمجاز. لطفا دوباره لاگین کنید.' }, { status: 401 }) };
  }
  if (!auth.authorized) {
    return { denied: NextResponse.json({ error: 'شما به این بخش دسترسی ندارید.' }, { status: 403 }) };
  }
  return { denied: null, actor: auth.user?.name || auth.user?.email };
}

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
    const { denied, actor } = await requireCarsUser();
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
        receiptFileName,
        paymentStatus: 'paid',
        recordedBy: actor,
      });

      return NextResponse.json({ success: true, transaction: tx });
    }

    // JSON fallback
    const body = await request.json();
    if (!body.amount || !body.paymentMethod) {
      return NextResponse.json({ error: 'مبلغ و روش پرداخت الزامی است' }, { status: 400 });
    }

    // Rows entered by hand are money that already moved; only the reservation chain issues pending rows.
    // POST always creates a new row: a client-sent id could otherwise overwrite (e.g. settle) an existing row.
    const tx = await saveTransaction({
      amount: body.amount,
      type: body.type,
      paymentMethod: body.paymentMethod,
      description: body.description,
      customerName: body.customerName,
      carId: body.carId,
      reservationId: body.reservationId,
      transactionDate: body.transactionDate,
      receiptFileUrl: body.receiptFileUrl,
      receiptFileName: body.receiptFileName,
      paymentStatus: 'paid',
      recordedBy: actor,
    });
    return NextResponse.json({ success: true, transaction: tx });

  } catch (error: any) {
    console.error('Error saving transaction:', error);
    return NextResponse.json({ error: 'خطا در ثبت تراکنش مالی' }, { status: 500 });
  }
}

// { action: 'pay', id, amount, paymentMethod, transactionDate } records a payment against a pending row;
// { action: 'confirm_received' | 'undo_received', id } confirms the money reached the account / person.
export async function PATCH(request: Request) {
  try {
    const { denied, actor } = await requireCarsUser();
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json({ error: 'شناسه تراکنش الزامی است' }, { status: 400 });
    }

    if (body.action === 'pay') {
      const result = await recordPayment(body.id, {
        amount: Number(body.amount),
        paymentMethod: body.paymentMethod,
        transactionDate: typeof body.transactionDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.transactionDate) ? body.transactionDate : undefined,
        recordedBy: actor,
      });
      return NextResponse.json({ success: true, ...result });
    }
    if (body.action === 'confirm_received' || body.action === 'undo_received') {
      const transaction = await setTransactionReceived(body.id, body.action === 'confirm_received', actor);
      return NextResponse.json({ success: true, transaction });
    }
    return NextResponse.json({ error: 'عملیات نامعتبر است' }, { status: 400 });
  } catch (error: any) {
    if (error instanceof TransactionRuleError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی تراکنش مالی' }, { status: 500 });
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

    // Deleting a recorded payment puts its amount back on what the customer owes
    const { restored } = await deleteTransactionRestoringDebt(id);
    return NextResponse.json({ success: true, restored });
  } catch (error: any) {
    if (error instanceof TransactionRuleError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'خطا در حذف تراکنش' }, { status: 500 });
  }
}
