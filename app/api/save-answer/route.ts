// يستقبل إجابة داخل محطة، يحفظها، ثم يقرر بالذكاء الاصطناعي: سؤال متابعة، أو إنهاء
// المحطة بملخص واحد يحفظ في station_summaries. لو فشل الاتصال، ينهي المحطة بملخص
// بسيط مبني على الإجابات كما هي، حتى لا تتوقف الرحلة أبدا.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildStationTurnPrompt, STATION_CAP, STAGES, lifeStageFrom, StageAnswer, Summary, Exchange } from '@/lib/reportEngine';

export async function POST(req: NextRequest) {
  const { token, journeyId, stageId, questionText, answerText } = await req.json();

  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage) return NextResponse.json({ ok: false, reason: 'محطة غير معروفة' }, { status: 400 });

  const { data: customer } = await supabaseAdmin
    .from('customers').select('id').eq('access_token', token).maybeSingle();
  if (!customer) return NextResponse.json({ ok: false, reason: 'رمز الوصول غير صالح' }, { status: 401 });

  // نحفظ هذا التبادل أولا
  const { data: existing } = await supabaseAdmin
    .from('station_exchanges').select('exchange_index').eq('journey_id', journeyId).eq('stage_id', stageId);
  const nextIndex = existing?.length || 0;

  await supabaseAdmin.from('station_exchanges').insert({
    journey_id: journeyId, stage_id: stageId, exchange_index: nextIndex,
    question_text: questionText || '', answer_text: answerText || '',
  });

  const { data: exchangeRows } = await supabaseAdmin
    .from('station_exchanges').select('question_text, answer_text').eq('journey_id', journeyId).eq('stage_id', stageId).order('exchange_index');
  const exchanges: Exchange[] = (exchangeRows || []).map((e) => ({ question: e.question_text, answer: e.answer_text }));

  const simpleSummaryFallback = () => exchanges.map((e) => e.answer).join(' ');

  if (exchanges.length >= STATION_CAP) {
    const summary = simpleSummaryFallback();
    await supabaseAdmin.from('station_summaries').upsert(
      { journey_id: journeyId, stage_id: stageId, summary },
      { onConflict: 'journey_id,stage_id' }
    );
    return NextResponse.json({ ok: true, done: true, summary });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    const summary = simpleSummaryFallback();
    await supabaseAdmin.from('station_summaries').upsert(
      { journey_id: journeyId, stage_id: stageId, summary },
      { onConflict: 'journey_id,stage_id' }
    );
    return NextResponse.json({ ok: true, done: true, summary, reason: 'ANTHROPIC_API_KEY غير مضاف بعد' });
  }

  const { data: lifeAnswers } = await supabaseAdmin
    .from('journey_answers').select('stage_id, chips, free_text').eq('journey_id', journeyId).eq('stage_id', 0);
  const lifeStage = lifeStageFrom((lifeAnswers || []) as StageAnswer[]);

  const { data: summaryRows } = await supabaseAdmin
    .from('station_summaries').select('stage_id, summary').eq('journey_id', journeyId);
  const priorSummaries = (summaryRows || []) as Summary[];

  const prompt = buildStationTurnPrompt(stageId, exchanges, priorSummaries, lifeStage);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
    });

    if (!response.ok) throw new Error(`فشل الطلب (${response.status})`);

    const data = await response.json();
    const raw = (data.content || []).map((b: { text?: string }) => b.text || '').join('').trim();
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.done) {
      const summary = parsed.summary || simpleSummaryFallback();
      await supabaseAdmin.from('station_summaries').upsert(
        { journey_id: journeyId, stage_id: stageId, summary },
        { onConflict: 'journey_id,stage_id' }
      );
      return NextResponse.json({ ok: true, done: true, summary });
    }

    if (!parsed.question) throw new Error('لا يوجد سؤال متابعة في الرد');
    return NextResponse.json({ ok: true, done: false, reflection: parsed.reflection || '', question: parsed.question });
  } catch (err) {
    // أي خلل هنا: ننهي المحطة بأمان بدل ما نعلق العميل
    const summary = simpleSummaryFallback();
    await supabaseAdmin.from('station_summaries').upsert(
      { journey_id: journeyId, stage_id: stageId, summary },
      { onConflict: 'journey_id,stage_id' }
    );
    return NextResponse.json({ ok: true, done: true, summary, reason: String(err) });
  }
}
