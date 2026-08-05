// هذا الـ endpoint يستقبل إشارة من Gumroad كل ما يصير بيع جديد ("Ping").
// وظيفته: يتحقق من Gumroad نفسه إن البيع حقيقي (لا يثق بالبيانات المرسلة كما هي)،
// يسوي عميل جديد + رمز وصول، ويرسل له بريد الدخول.
// هذا هو المكان الوحيد في المشروع اللي "يعرف" إن Gumroad موجود —
// لو انتقلت لاحقا لـ Stripe، تبدل هذا الملف فقط، ولا شيء غيره.
//
// مهم: يحتاج متغير بيئة جديد GUMROAD_ACCESS_TOKEN (access token من إعدادات
// حسابك في Gumroad: Settings → Advanced → Applications، أو أي Personal Access
// Token تولده من هناك). بدونه، أي طلب يوصل هذا الـ endpoint يُرفض تلقائيا،
// فتأكد من إضافته في Vercel قبل النشر.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, generateAccessToken } from '@/lib/supabase';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  // ننشئ الاتصال بالبريد هنا داخل الدالة، مو أعلى الملف — عشان ما يحاول
  // Next.js يشغله وقت البناء نفسه (قبل ما تكون متغيرات البيئة جاهزة أصلا).
  const resend = new Resend(process.env.RESEND_API_KEY);

  const form = await req.formData();

  // Gumroad يرسل بيانات البيع كـ form-data — نلتقط sale_id فقط من هنا،
  // كل باقي البيانات (الإيميل، المنتج) نتحقق منها من Gumroad نفسه بالأسفل،
  // لا نثق بأي حقل آخر مُرسل معنا كما هو.
  const saleId = form.get('sale_id') as string;

  if (!saleId) {
    return NextResponse.json({ ok: false, reason: 'no sale_id' }, { status: 400 });
  }

  if (!process.env.GUMROAD_ACCESS_TOKEN) {
    console.error('[gumroad-webhook] GUMROAD_ACCESS_TOKEN غير مضاف — تم رفض الطلب لأسباب أمنية');
    return NextResponse.json({ ok: false, reason: 'server not configured' }, { status: 500 });
  }

  // تحقق حقيقي: نسأل Gumroad نفسه عن هذا البيع بالتحديد، باستخدام مفتاحنا
  // الخاص. أي طرف خارجي ما يقدر يزور هذه الخطوة لأنه لا يملك مفتاحنا،
  // فقط استدعاء ناجح من هنا يثبت أن البيع حقيقي وينتمي لحسابنا فعلا.
  const verifyRes = await fetch(
    `https://api.gumroad.com/v2/sales/${encodeURIComponent(saleId)}?access_token=${process.env.GUMROAD_ACCESS_TOKEN}`
  ).catch(() => null);

  if (!verifyRes || !verifyRes.ok) {
    console.error(`[gumroad-webhook] فشل التحقق من البيع ${saleId} عبر Gumroad API`);
    return NextResponse.json({ ok: false, reason: 'sale verification failed' }, { status: 400 });
  }

  const verifyData = await verifyRes.json();
  if (!verifyData.success || !verifyData.sale) {
    console.error(`[gumroad-webhook] Gumroad رفض البيع ${saleId} أو لم يجده`);
    return NextResponse.json({ ok: false, reason: 'sale not found' }, { status: 400 });
  }

  const sale = verifyData.sale;

  // بعد التحقق، نستخدم البيانات القادمة من Gumroad نفسه (sale)، لا البيانات
  // المرسلة معنا بالـ form الأصلي — هذا هو الفرق الجوهري عن النسخة السابقة.
  if (sale.product_permalink !== process.env.GUMROAD_PRODUCT_PERMALINK) {
    return NextResponse.json({ ok: false, reason: 'product mismatch' }, { status: 400 });
  }

  const email = sale.email as string;
  if (!email) {
    return NextResponse.json({ ok: false, reason: 'no email on verified sale' }, { status: 400 });
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
    // لو صار خطأ هنا، Gumroad يحاول يرسل نفس الإشارة مرة ثانية تلقائيا لاحقا
    console.error(`[gumroad-webhook] فشل إنشاء العميل للبيع ${saleId}:`, error.message);
    return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
  }

  const accessUrl = `https://${process.env.APP_DOMAIN}/start?token=${accessToken}`;

  const { error: emailError } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Coach Fares <onboarding@resend.dev>',
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

  // العميل انحفظ فعليا برمز وصول صالح حتى لو فشل إرسال البريد — لكن نسجل
  // الفشل بوضوح هنا حتى تقدر تكتشفه بسجلات Vercel وترسل الرابط له يدويا،
  // بدل ما يضيع الأمر بصمت والعميل يكون دفع بدون ما يستلم شي.
  if (emailError) {
    console.error(`[gumroad-webhook] فشل إرسال بريد الدخول للعميل ${email} (بيع ${saleId}):`, emailError);
  }

  return NextResponse.json({ ok: true });
}
