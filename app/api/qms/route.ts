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

    // Daily queue number starts at 111 (e.g. 111, 112, 113...)
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
        const { count: totalCount } = await supabase
          .from('requests')
          .select('*', { count: 'exact', head: true });
        queueNumber = START_NUMBER + (totalCount || 0);
      }
    } catch (e) {
      console.error('Queue count fallback:', e);
      queueNumber = START_NUMBER;
    }

    const requestId = 'qms_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);

    const newRequest = {
      id: requestId,
      name: phone,
      phone: phone,
      description: 'ثبت شده از سیستم نوبت‌دهی QMS',
      service_title: serviceTitle,
      files: [],
      queue_number: queueNumber,
      source: 'qms',
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from('requests').insert([newRequest]);

    if (insertError) {
      console.error('Primary insert error, attempting fallback insert:', insertError);
      const fallbackRequest = {
        id: requestId,
        name: phone,
        phone: phone,
        description: `نوبت QMS #${queueNumber} - ${serviceTitle}`,
        service_title: serviceTitle,
        files: [],
        created_at: new Date().toISOString(),
      };
      await supabase.from('requests').insert([fallbackRequest]);
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
