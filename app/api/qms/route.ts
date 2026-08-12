import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST (Public) - Submit a QMS queue request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, serviceTitle, serviceId } = body;

    if (!phone || !serviceTitle) {
      return NextResponse.json(
        { error: 'شماره موبایل و عنوان خدمت الزامی است' },
        { status: 400 }
      );
    }

    // Get the next queue number for today
    // Count today's QMS requests and add 1
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'qms')
      .gte('created_at', todayStart.toISOString());

    if (countError) {
      console.error('Error getting queue count:', countError);
      return NextResponse.json({ error: 'خطا در سرور' }, { status: 500 });
    }

    const queueNumber = (count || 0) + 1;

    // Generate a unique request ID
    const requestId = 'qms_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);

    const newRequest = {
      id: requestId,
      name: phone, // For QMS, name field stores phone (no name collected)
      phone: phone,
      description: '',
      service_title: serviceTitle,
      files: [],
      queue_number: queueNumber,
      source: 'qms',
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from('requests').insert([newRequest]);

    if (insertError) {
      console.error('Failed to insert QMS request:', insertError);
      return NextResponse.json({ error: 'خطا در ثبت نوبت' }, { status: 500 });
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
