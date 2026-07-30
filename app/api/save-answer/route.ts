// يستقبل إجابة محطة واحدة ويحفظها، مع نص السؤال الذي عرض عليه فعلا (قد يكون
// مولدا حيا بالذكاء الاصطناعي). يتأكد أولا إن رمز الوصول صحيح قبل أي حفظ.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { token, journeyId, stageId, chips, freeText, questionText } = await req.json();

  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('access_token', token)
    .maybeSingle();

  if (!customer) {
    return NextResponse.json({ ok: false, reason: 'invalid token' }, { status: 401 });
  }

  // نتأكد إن هذه الرحلة فعلا تخص صاحب الرمز، لا رحلة عميل ثاني
  const { data: journey } = await supabaseAdmin
    .from('journeys')
    .select('id')
    .eq('id', journeyId)
    .eq('customer_id', customer.id)
    .maybeSingle();

  if (!journey) {
    return NextResponse.json({ ok: false, reason: 'journey not found' }, { status: 404 });
  }

  const { error } = await supabaseAdmin.from('journey_answers').upsert(
    {
      journey_id: journeyId,
      stage_id: stageId,
      question_text: questionText || null,
      chips: chips || [],
      free_text: freeText || '',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'journey_id,stage_id' }
  );

  if (error) return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
