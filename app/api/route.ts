// يولد سؤال المحطة التالية حيا، بناء على إجابات العميل الفعلية حتى الآن.
// لو فشل الاتصال بالذكاء الاصطناعي لأي سبب (رصيد، شبكة)، يرجع سؤالا احتياطيا
// جاهزا مسبقا لنفس المحطة، حتى لا تتوقف رحلة العميل أبدا.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildNextQuestionPrompt, STAGES, StageAnswer } from '@/lib/reportEngine';

export async function POST(req: NextRequest) {
  const { token, journeyId, stageId } = await req.json();

  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage) return NextResponse.json({ ok: false, reason: 'محطة غير معروفة' }, { status: 400 });

  const { data: customer } = await supabaseAdmin
    .from('customers').select('id').eq('access_token', token).maybeSingle();
  if (!customer) return NextResponse.json({ ok: false, reason: 'رمز الوصول غير صالح' }, { status: 401 });

  const fallback = { narrative: stage.fallbackNarrative, question: stage.fallbackQ, source: 'fallback' };

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: true, ...fallback, reason: 'ANTHROPIC_API_KEY غير مضاف بعد' });
  }

  const { data: answers } = await supabaseAdmin
    .from('journey_answers').select('stage_id, chips, free_text, question_text').eq('journey_id', journeyId);

  const prompt = buildNextQuestionPrompt(stageId, (answers || []) as StageAnswer[]);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ ok: true, ...fallback, reason: `فشل الطلب (${response.status}): ${errText.slice(0, 150)}` });
    }

    const data = await response.json();
    const raw = (data.content || []).map((b: { text?: string }) => b.text || '').join('').trim();
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.question) throw new Error('لا يوجد سؤال في الرد');

    return NextResponse.json({
      ok: true,
      narrative: parsed.narrative || stage.fallbackNarrative,
      question: parsed.question,
      source: 'ai',
    });
  } catch (err) {
    return NextResponse.json({ ok: true, ...fallback, reason: 'تعذر توليد سؤال حي: ' + String(err) });
  }
}
