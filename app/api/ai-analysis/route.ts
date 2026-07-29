// هذا هو "خيار التحليل بالذكاء الاصطناعي" — يظهر كزر اختياري بعد التقرير الأساسي.
// الفرق عن محاولتنا الأولى (بالأداة المستقلة): مفتاح الذكاء الاصطناعي هنا محفوظ
// بمتغيرات البيئة على السيرفر فقط، وما يوصل لمتصفح العميل إطلاقًا — هذا هو
// السبب اللي كان يخلي الطريقة القديمة ما تشتغل، وهنا تشتغل بأمان كامل.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildAiPrompt, StageAnswer } from '@/lib/reportEngine';

export async function POST(req: NextRequest) {
  const { token, journeyId } = await req.json();

  const { data: customer } = await supabaseAdmin
    .from('customers').select('id').eq('access_token', token).maybeSingle();
  if (!customer) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: answers } = await supabaseAdmin
    .from('journey_answers').select('stage_id, chips, free_text').eq('journey_id', journeyId);

  const prompt = buildAiPrompt((answers || []) as StageAnswer[]);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ ok: false, reason: 'ai request failed' }, { status: 502 });
  }

  const data = await response.json();
  const text = (data.content || []).map((b: { text?: string }) => b.text || '').join('\n').trim();

  await supabaseAdmin
    .from('reports')
    .update({ ai_analysis: text, ai_generated_at: new Date().toISOString() })
    .eq('journey_id', journeyId);

  return NextResponse.json({ ok: true, analysis: text });
}
