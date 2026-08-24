import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST (Public) - Submit a QMS queue request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, serviceTitle } = body;

    if (!phone || !serviceTitle) {
      return NextResponse.json(
        { error: 'شماره موبایل و عنوان خدمت الزامی است' },
        { status: 400 }
      );
    }

    // Daily queue number: count today's QMS requests and increment
    const START_NUMBER = 111;
    let queueNumber = START_NUMBER;

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count, error: countError } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'qms')
        .gte('created_at', todayStart.toISOString());

      if (!countError && typeof count === 'number') {
        queueNumber = START_NUMBER + count;
      } else {
        // Fallback: use total QMS count ever
        const { count: totalCount } = await supabase
          .from('requests')
          .select('*', { count: 'exact', head: true })
          .eq('source', 'qms');
        queueNumber = START_NUMBER + (totalCount || 0);
      }
    } catch (e) {
      console.error('Queue count fallback:', e);
      queueNumber = START_NUMBER;
    }

    const requestId = 'qms_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    const now = new Date().toISOString();

    const newRequest = {
      id: requestId,
      name: phone,
      phone: phone,
      description: 'ثبت شده از سیستم نوبت‌دهی QMS',
      service_title: serviceTitle,
      files: [],
      queue_number: queueNumber,
      source: 'qms',
      queue_name: 'جناب اماره',
      queue_status: 'waiting',
      created_at: now,
    };

    const { error: insertError } = await supabase.from('requests').insert([newRequest]);

    if (insertError) {
      console.error('QMS insert error:', insertError);
      return NextResponse.json(
        { error: 'خطا در ثبت نوبت در دیتابیس', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      queueNumber,
      requestId,
    });
  } catch (error: any) {
    console.error('Error in QMS route:', error);
    return NextResponse.json(
      { error: 'خطایی در سرور رخ داده است', details: error.message },
      { status: 500 }
    );
  }
}
