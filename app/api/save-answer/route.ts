// يستقبل إجابة محطة واحدة ويحفظها. يتأكد أولًا إن الرمز (token) صحيح
// قبل ما يسمح بأي حفظ — هذا هو خط الحماية الأساسي في الأداة كلها.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { token, journeyId, stageId, chips, freeText } = await req.json();

  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('access_token', token)
    .maybeSingle();

  if (!customer) {
    return NextResponse.json({ ok: false, reason: 'invalid token' }, { status: 401 });
  }

  // نتأكد إن هذه الرحلة فعلًا تخص صاحب الرمز، مو رحلة عميل ثاني
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
      chips: chips || [],
      free_text: freeText || '',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'journey_id,stage_id' }
  );

  if (error) return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
