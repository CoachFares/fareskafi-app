// يستقبل إجابة داخل محطة، يحفظها، ثم يقرر بالذكاء الاصطناعي: سؤال متابعة، أو إنهاء
// المحطة بملخص واحد يحفظ في station_summaries. يحاول مرتين قبل الاستسلام لملخص
// بسيط مبني على الإجابات كما هي، حتى لا تتوقف الرحلة أبدا. الوصول للحد الأقصى من
// الأسئلة لا يعني تخطي الذكاء الاصطناعي أبدا — الـ prompt نفسه يعرف يختم بملخص
// حقيقي عند آخر سؤال، والسطر isDone أدناه شبكة أمان إضافية فقط.

export const maxDuration = 90;

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildStationTurnPrompt, STATION_CAP, STAGES, lifeStageFrom, StageAnswer, Summary, Exchange } from '@/lib/reportEngine';

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
if (!raw) {
const blockTypes = (data.content || []).map((b: { type?: string }) => b.type).join(',');
return { ok: false as const, reason: `رد فارغ (stop_reason: ${data.stop_reason}, blocks: ${blockTypes})` };
}
return { ok: true as const, raw };
} catch (err) {
clearTimeout(timeoutId);
return { ok: false as const, reason: 'تعذر الاتصال: ' + String(err) };
}
}

export async function POST(req: NextRequest) {
const { token, journeyId, stageId, questionText, answerText } = await req.json();

const stage = STAGES.find((s) => s.id === stageId);
if (!stage) return NextResponse.json({ ok: false, reason: 'محطة غير معروفة' }, { status: 400 });

const { data: customer } = await supabaseAdmin
.from('customers').select('id').eq('access_token', token).maybeSingle();
if (!customer) return NextResponse.json({ ok: false, reason: 'رمز الوصول غير صالح' }, { status: 401 });

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

async function finishWithFallback(reason?: string) {
const summary = simpleSummaryFallback();
await supabaseAdmin.from('station_summaries').upsert(
{ journey_id: journeyId, stage_id: stageId, summary, source: 'fallback' },
{ onConflict: 'journey_id,stage_id' }
);
console.error(`[station-answer] fallback used — journey:${journeyId} stage:${stageId} reason:${reason || 'unknown'}`);
return NextResponse.json({ ok: true, done: true, summary, ...(reason ? { reason } : {}) });
}

if (!process.env.ANTHROPIC_API_KEY) {
return finishWithFallback('ANTHROPIC_API_KEY غير مضاف بعد');
}

const { data: lifeAnswers } = await supabaseAdmin
.from('journey_answers').select('stage_id, chips, free_text').eq('journey_id', journeyId).eq('stage_id', 0);
const lifeStage = lifeStageFrom((lifeAnswers || []) as StageAnswer[]);

const { data: journeyRow } = await supabaseAdmin
.from('journeys').select('working_hypothesis').eq('id', journeyId).maybeSingle();
const workingHypothesis = journeyRow?.working_hypothesis || '';

const { data: summaryRows } = await supabaseAdmin
.from('station_summaries').select('stage_id, summary').eq('journey_id', journeyId);
const priorSummaries = (summaryRows || []) as Summary[];

const prompt = buildStationTurnPrompt(stageId, exchanges, priorSummaries, lifeStage, workingHypothesis);

let result = await callClaude(prompt, 20000);
if (!result.ok) result = await callClaude(prompt, 35000);

if (!result.ok) {
return finishWithFallback(result.reason);
}

const raw = result.raw;
const grab = (label: string): string => {
const re = new RegExp(label + ':\\s*([^\\n]*(?:\\n(?!(?:DONE|REFLECTION|QUESTION|SUMMARY|HYPOTHESIS):)[^\\n]*)*)', 'i');
const m = raw.match(re);
return m ? m[1].trim().replace(/^["'«]+|["'»]+$/g, '').trim() : '';
};

// الحد الأقصى من الأسئلة لا يعني تخطي الذكاء الاصطناعي — الـ prompt وصله بالفعل
// أنه لا يتبقى أسئلة (عبر remaining) وهو مصمم يختم بملخص حقيقي عندها. هذا السطر
// شبكة أمان فقط: لو الذكاء الاصطناعي تجاهل التعليمة وطلب سؤالا خامسا رغم ذلك،
// نجبر الإنهاء بدل ما نسمح بحلقة أسئلة لا نهائية.
let isDone = /DONE:\s*true/i.test(raw);
if (exchanges.length >= STATION_CAP) isDone = true;

if (isDone) {
const aiSummary = grab('SUMMARY');
const summary = aiSummary || simpleSummaryFallback();
const hypothesis = grab('HYPOTHESIS');
await supabaseAdmin.from('station_summaries').upsert(
{ journey_id: journeyId, stage_id: stageId, summary, source: aiSummary ? 'ai' : 'fallback' },
{ onConflict: 'journey_id,stage_id' }
);
if (!aiSummary) console.error(`[station-answer] SUMMARY grab failed at cap — journey:${journeyId} stage:${stageId}, raw:`, raw.slice(0, 200));
if (hypothesis) {
await supabaseAdmin.from('journeys').update({ working_hypothesis: hypothesis }).eq('id', journeyId);
}
return NextResponse.json({ ok: true, done: true, summary });
}

const question = grab('QUESTION');
const reflection = grab('REFLECTION');
if (!question) {
return finishWithFallback('لا يوجد سؤال متابعة صالح في الرد بعد محاولتين');
}
return NextResponse.json({ ok: true, done: false, reflection, question });
}
