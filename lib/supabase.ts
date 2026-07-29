// هذا الملف هو نقطة الاتصال الوحيدة بقاعدة البيانات.
// يُستخدم فقط داخل API routes (على السيرفر) — أبدًا داخل صفحات تعرض في المتصفح.
// المفتاح المستخدم هنا (SERVICE_ROLE_KEY) قوي جدًا، لهذا لازم يبقى سرًا في متغيرات البيئة فقط.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// دالة صغيرة تولّد رمز وصول عشوائي طويل يصعب تخمينه (يُستخدم في رابط العميل)
export function generateAccessToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
