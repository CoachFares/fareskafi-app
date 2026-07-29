import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildReport } from '@/lib/reportEngine';

export async function POST(req: NextRequest) {
  const { token, journeyId } = await req.json();

  const { data: customer } = await supabaseAdmin
    .from('customers').select('id').eq('access_token', token).maybeSingle();
  if (!customer) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: answers } = await supabaseAdmin
    .from('journey_answers').select('stage_id, chips, free_text').eq('journey_id', journeyId);

  const report = buildReport(
    (answers || []).map((a) => ({ stage_id: a.stage_id, chips: a.chips, free_text: a.free_text }))
  );

  await supabaseAdmin.from('reports').upsert(
    { journey_id: journeyId, report_html: JSON.stringify(report) },
    { onConflict: 'journey_id' }
  );

  await supabaseAdmin
    .from('journeys')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', journeyId);

  return NextResponse.json({ ok: true, report });
}
