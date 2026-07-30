import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildReport, finalAnswerFrom, StageAnswer, Summary } from '@/lib/reportEngine';

export async function POST(req: NextRequest) {
  const { token, journeyId } = await req.json();

  const { data: customer } = await supabaseAdmin
    .from('customers').select('id').eq('access_token', token).maybeSingle();
  if (!customer) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: summaryRows } = await supabaseAdmin
    .from('station_summaries').select('stage_id, summary').eq('journey_id', journeyId);
  const summaries = (summaryRows || []) as Summary[];

  const { data: finalRows } = await supabaseAdmin
    .from('journey_answers').select('stage_id, chips, free_text').eq('journey_id', journeyId).eq('stage_id', 6);
  const finalAnswer = finalAnswerFrom((finalRows || []) as StageAnswer[]);

  const report = buildReport(summaries, finalAnswer);

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
