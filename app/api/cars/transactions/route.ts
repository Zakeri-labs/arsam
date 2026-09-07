import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTransactions, saveTransaction, deleteTransaction } from '@/lib/db-cars';
import { supabase } from '@/lib/supabase';
import path from 'path';

async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('ofogh_session');
  return session && session.value === 'authenticated';
}

export async function GET() {
  try {
    const isAuth = await checkAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    const transactions = await getTransactions();
    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'خطا در بارگذاری لیست تراکنش‌ها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAuth = await checkAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
    }

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
          const buffer = await file.arrayBuffer();
          const fileExt = path.extname(file.name) || '';
          const uniqueId = Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
          const cleanBaseName = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9_\u0600-\u06FF.-]/g, '_');
          const safeFileName = `tx_${cleanBaseName}_${uniqueId}${fileExt}`;

          const { data, error } = await supabase.storage
            .from('uploads')
            .upload(safeFileName, buffer, {
              contentType: file.type || 'application/octet-stream',
              upsert: false
            });

          if (!error) {
            const { data: publicUrlData } = supabase.storage
              .from('uploads')
              .getPublicUrl(safeFileName);
            receiptFileUrl = publicUrlData.publicUrl;
            receiptFileName = file.name;
          } else {
            console.error('Failed upload to Supabase storage:', error);
          }
        } catch (fileErr) {
          console.error('File process error:', fileErr);
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
    const isAuth = await checkAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
    }

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
