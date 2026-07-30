-- ============================================================
-- قاعدة بيانات "خريطة الوعي بالعلاقة"
-- شغل هذا الملف مرة واحدة داخل Supabase → SQL Editor → Run
-- ============================================================

-- كل عملية شراء = عميل واحد، مربوط برمز وصول فريد (مو بريد وكلمة مرور)
create table customers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  access_token text not null unique,      -- الرمز الموجود داخل رابط البريد
  gumroad_sale_id text unique,            -- لمنع تكرار نفس عملية الشراء مرتين
  created_at timestamptz default now()
);

-- كل "محاولة/رحلة" يبدأها العميل (يسمح له يبدأ أكثر من مرة عبر الزمن)
create table journeys (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  status text default 'in_progress',      -- in_progress | completed
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- إجابة كل محطة من المحطات الست، مرتبطة برحلة معينة
create table journey_answers (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid references journeys(id) on delete cascade,
  stage_id int not null,                  -- ٠ لاختيار "أين أنت الآن"، ١ إلى ٦ للمحطات
  question_text text,                     -- نص السؤال الذي ولده الذكاء الاصطناعي فعليا لهذه المحطة
  chips jsonb default '[]',               -- محجوزة لاستخدام مستقبلي
  free_text text default '',              -- كلمات العميل نفسه، لها الأولوية دائما
  updated_at timestamptz default now(),
  unique (journey_id, stage_id)
);

-- التقرير النهائي المبني، محفوظ بشكل دائم — يرجع له العميل بنفس الرابط أي وقت
create table reports (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid references journeys(id) on delete cascade unique,
  report_html text not null,              -- خريطة الوعي بالعلاقة (النسخة الأساسية، بدون ذكاء اصطناعي)
  ai_analysis text,                       -- التحليل الأعمق بالذكاء الاصطناعي (اختياري، يطلب بضغطة زر)
  ai_generated_at timestamptz,
  created_at timestamptz default now()
);

-- حماية على مستوى الصفوف: كل عميل يشوف بياناته هو فقط
alter table customers enable row level security;
alter table journeys enable row level security;
alter table journey_answers enable row level security;
alter table reports enable row level security;

-- ملاحظة: الوصول الفعلي يتم فقط عبر السيرفر (API routes) باستخدام مفتاح آمن،
-- مو من متصفح العميل مباشرة — لهذا القواعد أعلاه هي طبقة حماية إضافية، مو الوحيدة.
