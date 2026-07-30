// يفتح محطة من المحطات ١ إلى ٥ بسؤالها الأول، مبنيا على ملخصات المحطات السابقة لها.
// لو فشل الاتصال بالذكاء الاصطناعي، يرجع سؤالا احتياطيا جاهزا حتى لا تتوقف الرحلة.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildStationOpenPrompt, STAGES, lifeStageFrom, StageAnswer, Summary } from '@/lib/reportEngine';

export async function POST(req: NextRequest) {
  const { token, journeyId, stageId } = await req.json();

  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage) return NextResponse.json({ ok: false, reason: 'محطة غير معروفة' }, { status: 400 });

  const { data: customer } = await supabaseAdmin
    .from('customers').select('id').eq('access_token', token).maybeSingle();
  if (!customer) return NextResponse.json({ ok: false, reason: 'رمز الوصول غير صالح' }, { status: 401 });

  const fallback = { question: stage.fallbackQ, source: 'fallback' };

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: true, ...fallback, reason: 'ANTHROPIC_API_KEY غير مضاف بعد' });
  }

  const { data: lifeAnswers } = await supabaseAdmin
    .from('journey_answers').select('stage_id, chips, free_text').eq('journey_id', journeyId).eq('stage_id', 0);
  const lifeStage = lifeStageFrom((lifeAnswers || []) as StageAnswer[]);

  const { data: journeyRow } = await supabaseAdmin
    .from('journeys').select('working_hypothesis').eq('id', journeyId).maybeSingle();
  const workingHypothesis = journeyRow?.working_hypothesis || '';

  const { data: summaryRows } = await supabaseAdmin
    .from('station_summaries').select('stage_id, summary').eq('journey_id', journeyId);
  const summaries = (summaryRows || []) as Summary[];

  const prompt = buildStationOpenPrompt(stageId, summaries, lifeStage, workingHypothesis);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 600, messages: [{ role: 'user', content: prompt }] }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ ok: true, ...fallback, reason: `فشل الطلب (${response.status}): ${errText.slice(0, 150)}` });
    }

    const data = await response.json();
    const raw = (data.content || []).map((b: { text?: string }) => b.text || '').join('').trim();
    const question = raw
      .replace(/^\{?\s*"?question"?\s*:\s*/i, '')
      .replace(/^["'«]+|["'»]+\}?\s*$/g, '')
      .trim();
    if (!question) {
      const blockTypes = (data.content || []).map((b: { type?: string }) => b.type).join(',');
      throw new Error(`رد فارغ من النموذج (stop_reason: ${data.stop_reason}, blocks: ${blockTypes})`);
    }

    return NextResponse.json({ ok: true, question, source: 'ai' });
  } catch (err) {
    return NextResponse.json({ ok: true, ...fallback, reason: 'تعذر توليد سؤال حي: ' + String(err) });
  }
}
