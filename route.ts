// هذا الـ endpoint يستقبل إشارة من Gumroad كل ما يصير بيع جديد ("Ping").
// وظيفته: يتأكد إن البيع حقيقي، يسوي عميل جديد + رمز وصول، ويرسل له بريد الدخول.
// هذا هو المكان الوحيد في المشروع اللي "يعرف" إن Gumroad موجود —
// لو انتقلت لاحقًا لـ Stripe، تبدّل هذا الملف فقط، ولا شيء غيره.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, generateAccessToken } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const form = await req.formData();

  // Gumroad يرسل بيانات البيع كـ form-data — نلتقط اللي يهمنا فقط
  const email = form.get('email') as string;
  const saleId = form.get('sale_id') as string;
  const productPermalink = form.get('permalink') as string;

  // تحقق أساسي: هذا فعلًا منتجنا، ومو تكرار لعملية شراء سبق واستلمناها
  if (productPermalink !== process.env.GUMROAD_PRODUCT_PERMALINK) {
    return NextResponse.json({ ok: false, reason: 'product mismatch' }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('gumroad_sale_id', saleId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, note: 'already processed' });
  }

  const accessToken = generateAccessToken();

  const { error } = await supabaseAdmin.from('customers').insert({
    email,
    access_token: accessToken,
    gumroad_sale_id: saleId,
  });

  if (error) {
    // لو صار خطأ هنا، Gumroad يحاول يرسل نفس الإشارة مرة ثانية تلقائيًا لاحقًا
    return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
  }

  const accessUrl = `https://${process.env.APP_DOMAIN}/start?token=${accessToken}`;

  await resend.emails.send({
    from: 'Coach Fares <hello@fareskafi.com>',
    to: email,
    subject: 'رابطك الخاص جاهز — ابدأ رحلتك الآن',
    html: `
      <div style="font-family:sans-serif; direction:rtl; text-align:right; max-width:480px; margin:auto;">
        <h2 style="color:#4a3a26;">خريطة الوعي بالعلاقة</h2>
        <p>رابطك الخاص جاهز. هذا الرابط لك وحدك، واحفظه — تقدر ترجع له أي وقت لتكمل رحلتك أو تراجع تقريرك.</p>
        <a href="${accessUrl}" style="display:inline-block; background:#4a3a26; color:#f3ead9; padding:14px 28px; border-radius:8px; text-decoration:none; margin-top:12px;">ابدأ رحلتك الآن</a>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
