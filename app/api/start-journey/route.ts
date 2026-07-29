// يستدعى أول ما يفتح العميل رابطه. يتأكد إن الرمز صحيح، وإما يكمّل
// آخر رحلة غير مكتملة له، أو يبدأ رحلة جديدة لو ما عنده وحدة شغّالة.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  const { data: customer, error: custErr } = await supabaseAdmin
    .from('customers').select('id').eq('access_token', token).maybeSingle();

  if (custErr) {
    return NextResponse.json({ ok: false, debug: custErr.message }, { status: 500 });
  }
  if (!customer) return NextResponse.json({ ok: false, debug: 'no customer row matched this token' }, { status: 401 });

  let { data: journey } = await supabaseAdmin
    .from('journeys')
    .select('id')
    .eq('customer_id', customer.id)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (!journey) {
    const { data: created } = await supabaseAdmin
      .from('journeys')
      .insert({ customer_id: customer.id })
      .select('id')
      .single();
    journey = created;
  }

  const { data: answers } = await supabaseAdmin
    .from('journey_answers')
    .select('stage_id, chips, free_text')
    .eq('journey_id', journey!.id);

  const resumeStage = Math.min(answers?.length || 0, 5);

  return NextResponse.json({ ok: true, journeyId: journey!.id, answers: answers || [], resumeStage });
}
