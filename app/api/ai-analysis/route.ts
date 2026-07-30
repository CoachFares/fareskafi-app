// هذا هو "خيار التحليل بالذكاء الاصطناعي" — يظهر كزر اختياري بعد التقرير الأساسي.
// الفرق عن محاولتنا الأولى (بالأداة المستقلة): مفتاح الذكاء الاصطناعي هنا محفوظ
// بمتغيرات البيئة على السيرفر فقط، وما يوصل لمتصفح العميل إطلاقا — هذا هو
// السبب اللي كان يخلي الطريقة القديمة ما تشتغل، وهنا تشتغل بأمان كامل.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildAiPrompt, lifeStageFrom, finalAnswerFrom, StageAnswer, Summary } from '@/lib/reportEngine';

export async function POST(req: NextRequest) {
  const { token, journeyId } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: false, reason: 'ANTHROPIC_API_KEY غير مضاف في إعدادات Vercel بعد' }, { status: 500 });
  }

  const { data: customer } = await supabaseAdmin
    .from('customers').select('id').eq('access_token', token).maybeSingle();
  if (!customer) return NextResponse.json({ ok: false, reason: 'رمز الوصول غير صالح' }, { status: 401 });

  const { data: summaryRows } = await supabaseAdmin
    .from('station_summaries').select('stage_id, summary').eq('journey_id', journeyId);
  const summaries = (summaryRows || []) as Summary[];

  const { data: sideAnswers } = await supabaseAdmin
    .from('journey_answers').select('stage_id, chips, free_text').eq('journey_id', journeyId).in('stage_id', [0, 6]);
  const lifeStage = lifeStageFrom((sideAnswers || []) as StageAnswer[]);
  const finalAnswer = finalAnswerFrom((sideAnswers || []) as StageAnswer[]);

  const { data: journeyRow } = await supabaseAdmin
    .from('journeys').select('working_hypothesis').eq('id', journeyId).maybeSingle();
  const workingHypothesis = journeyRow?.working_hypothesis || '';

  const prompt = buildAiPrompt(summaries, finalAnswer, lifeStage, workingHypothesis);

  let response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err) {
    clearTimeout(timeoutId);
    return NextResponse.json({ ok: false, reason: 'تعذر الاتصال بخدمة الذكاء الاصطناعي: ' + String(err) }, { status: 502 });
  }

  if (!response.ok) {
    const errBody = await response.text();
    return NextResponse.json({ ok: false, reason: `فشل الطلب (${response.status}): ${errBody.slice(0, 200)}` }, { status: 502 });
  }

  const data = await response.json();
  const raw = (data.content || []).map((b: { text?: string }) => b.text || '').join('\n').trim();
  const text = raw
    .replace(/^\{?\s*"?narrative"?\s*:\s*/i, '')
    .replace(/^["'«]+|["'»]+\}?\s*$/g, '')
    .trim();

  if (!text) {
    return NextResponse.json({ ok: false, reason: 'رد فارغ من النموذج' }, { status: 502 });
  }

  await supabaseAdmin
    .from('reports')
    .upsert({ journey_id: journeyId, ai_analysis: text, ai_generated_at: new Date().toISOString() }, { onConflict: 'journey_id' });

  return NextResponse.json({ ok: true, analysis: text });
}
