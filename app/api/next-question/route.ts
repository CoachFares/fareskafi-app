// يستخدم فقط للمحطة السادسة (الجواب) — السؤال المفتوح الأخير الوحيد في الرحلة كلها.
// يحاول مرتين قبل الاستسلام لسؤال احتياطي جاهز.

export const maxDuration = 90;

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildFinalQuestionPrompt, STAGES, lifeStageFrom, StageAnswer, Summary } from '@/lib/reportEngine';

async function callClaude(prompt: string, timeoutMs: number) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
                  body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
                  signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (!response.ok) {
                  const errText = await response.text();
                  return { ok: false as const, reason: `فشل الطلب (${response.status}): ${errText.slice(0, 150)}` };
          }
          const data = await response.json();
          const raw = (data.content || []).map((b: { text?: string }) => b.text || '').join('').trim();
          const intro = raw
            .replace(/^\{?\s*"?(intro|narrative)"?\s*:\s*/i, '')
            .replace(/^["'«]+|["'»]+\}?\s*$/g, '')
            .trim();
          if (!intro) {
                  const blockTypes = (data.content || []).map((b: { type?: string }) => b.type).join(',');
                  return { ok: false as const, reason: `رد فارغ (stop_reason: ${data.stop_reason}, blocks: ${blockTypes})` };
          }
          return { ok: true as const, intro };
    } catch (err) {
          clearTimeout(timeoutId);
          return { ok: false as const, reason: 'تعذر الاتصال: ' + String(err) };
    }
}

export async function POST(req: NextRequest) {
    const { token, journeyId } = await req.json();

  const stage = STAGES[5];
    const fallback = { question: stage.fallbackQ, source: 'fallback' };

  const { data: customer } = await supabaseAdmin
      .from('customers').select('id').eq('access_token', token).maybeSingle();
    if (!customer) return NextResponse.json({ ok: false, reason: 'رمز الوصول غير صالح' }, { status: 401 });

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

  const prompt = buildFinalQuestionPrompt(summaries, lifeStage, workingHypothesis);

  let result = await callClaude(prompt, 20000);
    if (!result.ok) result = await callClaude(prompt, 35000);

  if (!result.ok) {
        return NextResponse.json({ ok: true, ...fallback, reason: result.reason });
  }
    return NextResponse.json({ ok: true, question: stage.fallbackQ, narrative: result.intro, source: 'ai' });
}
