// يستدعى أول ما يفتح العميل رابطه. المنطق:
// ١. لو عنده رحلة غير مكتملة، يكملها من حيث وقف.
// ٢. لو آخر رحلة مكتملة له لسا داخل فترة التبريد (COOLDOWN_DAYS)، يعرض له
//    تقريره المحفوظ مباشرة بدل ما يبدأ رحلة جديدة تستهلك طلبات ذكاء اصطناعي بلا داع.
// ٣. غير ذلك، يبدأ له رحلة جديدة.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const COOLDOWN_DAYS = 90;

export async function POST(req: NextRequest) {
  const { token: rawToken } = await req.json();
  const token = (rawToken || '').trim();

  const { data: customer, error: custErr } = await supabaseAdmin
    .from('customers').select('id').eq('access_token', token).maybeSingle();

  if (custErr) {
    return NextResponse.json({ ok: false, debug: custErr.message }, { status: 500 });
  }
  if (!customer) return NextResponse.json({ ok: false, debug: 'no customer row matched this token' }, { status: 401 });

  // أولا: هل عنده رحلة غير مكتملة يكملها؟
  const { data: inProgress } = await supabaseAdmin
    .from('journeys')
    .select('id')
    .eq('customer_id', customer.id)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .maybeSingle();

  let journey = inProgress;

  if (!journey) {
    // ثانيا: هل عنده رحلة مكتملة حديثة ضمن فترة التبريد؟
    const { data: lastCompleted } = await supabaseAdmin
      .from('journeys')
      .select('id, completed_at')
      .eq('customer_id', customer.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastCompleted?.completed_at) {
      const daysSince = (Date.now() - new Date(lastCompleted.completed_at).getTime()) / 86400000;
      if (daysSince < COOLDOWN_DAYS) {
        const { data: reportRow } = await supabaseAdmin
          .from('reports')
          .select('report_html, ai_analysis')
          .eq('journey_id', lastCompleted.id)
          .maybeSingle();

        const nextAvailable = new Date(new Date(lastCompleted.completed_at).getTime() + COOLDOWN_DAYS * 86400000);

        return NextResponse.json({
          ok: true,
          locked: true,
          nextAvailable: nextAvailable.toISOString(),
          report: reportRow ? JSON.parse(reportRow.report_html) : null,
          aiAnalysis: reportRow?.ai_analysis || '',
        });
      }
    }

    // ثالثا: ما فيه شي معلق ولا حديث، نبدأ رحلة جديدة
    const { data: created } = await supabaseAdmin
      .from('journeys')
      .insert({ customer_id: customer.id })
      .select('id')
      .single();
    journey = created;
  }

  const { data: lifeAnswers } = await supabaseAdmin
    .from('journey_answers')
    .select('stage_id, chips, free_text, question_text')
    .eq('journey_id', journey!.id)
    .eq('stage_id', 0);

  const { data: summaryRows } = await supabaseAdmin
    .from('station_summaries')
    .select('stage_id, summary')
    .eq('journey_id', journey!.id);

  const doneStages = (summaryRows || []).map((s) => s.stage_id);
  const resumeStage = Math.min(doneStages.length, 5);

  return NextResponse.json({
    ok: true,
    journeyId: journey!.id,
    answers: lifeAnswers || [],
    summaries: summaryRows || [],
    resumeStage,
  });
}
