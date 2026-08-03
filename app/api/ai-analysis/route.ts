// هذا هو التحليل الشخصي النهائي — أهم مخرج بالأداة كلها. يحتاج وقتا أطول من باقي
// الطلبات لأنه يقرأ ست محطات كاملة مرة واحدة، فهذا الملف يعطيه مهلة كافية حقا
// بدل مهلة قصيرة تفشل بثبات، ويحاول مرتين قبل الاستسلام.

export const maxDuration = 120;

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildAiPrompt, lifeStageFrom, finalAnswerFrom, StageAnswer, Summary } from '@/lib/reportEngine';

async function callClaude(prompt: string, timeoutMs: number) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
              const response = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                                    'Content-Type': 'application/json',
                                    'x-api-key': process.env.ANTHROPIC_API_KEY!,
                                    'anthropic-version': '2023-06-01',
                        },
                        body: JSON.stringify({
                                    model: 'claude-sonnet-5',
                                    max_tokens: 4000,
                                    messages: [{ role: 'user', content: prompt }],
                        }),
                        signal: controller.signal,
              });
              clearTimeout(timeoutId);
              if (!response.ok) {
                        const errBody = await response.text();
                        return { ok: false, reason: `فشل الطلب (${response.status}): ${errBody.slice(0, 200)}` };
              }
              const data = await response.json();
              const raw = (data.content || []).map((b: { text?: string }) => b.text || '').join('\n').trim();
              const text = raw
                .replace(/^\{?\s*"?narrative"?\s*:\s*/i, '')
                .replace(/^["'«]+|["'»]+\}?\s*$/g, '')
                .trim();
              if (!text) {
                        const blockTypes = (data.content || []).map((b: { type?: string }) => b.type).join(',');
                        return { ok: false, reason: `رد فارغ (stop_reason: ${data.stop_reason}, blocks: ${blockTypes})` };
              }
              return { ok: true, text };
      } catch (err) {
              clearTimeout(timeoutId);
              return { ok: false, reason: 'تعذر الاتصال: ' + String(err) };
      }
}

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

  let result = await callClaude(prompt, 50000);
      if (!result.ok) {
              result = await callClaude(prompt, 50000);
      }

  if (!result.ok) {
          return NextResponse.json({ ok: false, reason: result.reason }, { status: 502 });
  }

  await supabaseAdmin
        .from('reports')
        .upsert({ journey_id: journeyId, ai_analysis: result.text, ai_generated_at: new Date().toISOString() }, { onConflict: 'journey_id' });

  return NextResponse.json({ ok: true, analysis: result.text });
}
