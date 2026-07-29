'use client';

import { useEffect, useState, CSSProperties, ReactNode } from 'react';

const STAGES = [
  { id: 1, kicker: 'المحطة ١', title: 'الوجع كما هو', narrative: 'نزيل الحكاية عن الألم، لنرى ما تحتها فعلًا.',
    q: 'لو نزعنا كل تفاصيل القصة... وش الشعور الحقيقي اللي يتكرر تحتها، مهما تغيّر الشخص؟',
    chips: ['الوحدة حتى وأنا مع حد', 'الخوف من الفقد', 'الإحساس إني مو كافي', 'الرفض', 'عدم الأهمية', 'الاختناق'] },
  { id: 2, kicker: 'المحطة ٢', title: 'الحاجة التي لم تُقل', narrative: 'نكتشف ما كنت تطلبه دون أن تطلبه بصوت مسموع.',
    q: 'وش كنت تنتظر تحس فيه من الطرف الآخر، ولم يجِ؟',
    chips: ['أن أُرى وأُفهم بدون ما أشرح', 'الأمان إني مو راح أتُرك', 'الاهتمام حتى بدون ما أطلبه', 'الطمأنة المستمرة', 'الاحترام لحدودي'] },
  { id: 3, kicker: 'المحطة ٣', title: 'الثمن الذي ندفعه لنبقى محبوبين', narrative: 'نرى كيف نتنازل، أو ننسحب، أو نتحكم، لنشتري أمانًا لم يكن للبيع يومًا.',
    q: 'وش خسرت من نفسك عشان تحس بالأمان أو ما تفقد حد؟',
    chips: ['تنازلت عن رأيي كثير', 'انسحبت بصمت بدل ما أواجه', 'حاولت أتحكم بكل التفاصيل', 'سكتّ عن احتياجاتي', 'أعطيت أكثر مما يُرد'] },
  { id: 4, kicker: 'المحطة ٤', title: 'من أين بدأ هذا', narrative: 'نعود إلى أول مرة تعلمنا فيها هذا النمط، بلا لوم لأحد.',
    q: 'متى تعلّمت هذه الطريقة في الحب لأول مرة؟ مع مين، ووين؟', chips: null },
  { id: 5, kicker: 'المحطة ٥', title: 'الاختيار الجديد', narrative: 'نحوّل كل ما رأيناه إلى فعل واحد بسيط تبدأ به.',
    q: 'ما الشيء الواحد الذي ستفعله بشكل مختلف بعد أن رأيت نمطك؟',
    chips: ['سلوك جديد أجربه', 'حد جديد أضعه', 'طريقة جديدة أتعامل فيها مع نفسي', 'طريقة جديدة أتعامل فيها مع الطرف الآخر'] },
  { id: 6, kicker: 'المحطة ٦', title: 'الجواب', narrative: 'تكتب أنت، بكلماتك أنت، إجابتك الكاملة على السؤال الذي جئت من أجله.',
    q: 'لماذا تؤلمني علاقاتي؟ ماذا كنت أبحث عنه؟ ماذا أصبحت أعرف عن نفسي الآن؟', chips: null, big: true },
];

type Answers = Record<number, { chips: string[]; text: string }>;

export default function StartPage() {
  const [phase, setPhase] = useState<'loading' | 'invalid' | 'journey' | 'building' | 'report'>('loading');
  const [token, setToken] = useState('');
  const [journeyId, setJourneyId] = useState('');
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [draftChips, setDraftChips] = useState<string[]>([]);
  const [draftText, setDraftText] = useState('');
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) { setPhase('invalid'); return; }
    setToken(t);
    fetch('/api/start-journey', { method: 'POST', body: JSON.stringify({ token: t }) })
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) { setPhase('invalid'); return; }
        setJourneyId(data.journeyId);
        const loaded: Answers = {};
        (data.answers || []).forEach((a: any) => {
          loaded[a.stage_id] = { chips: a.chips || [], text: a.free_text || '' };
        });
        setAnswers(loaded);
        setCur(data.resumeStage || 0);
        setPhase('journey');
      })
      .catch(() => setPhase('invalid'));
  }, []);

  useEffect(() => {
    if (phase !== 'journey') return;
    const saved = answers[STAGES[cur].id];
    setDraftChips(saved?.chips || []);
    setDraftText(saved?.text || '');
  }, [cur, phase]);

  function toggleChip(c: string) {
    setDraftChips((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function saveCurrent() {
    const stage = STAGES[cur];
    setAnswers((prev) => ({ ...prev, [stage.id]: { chips: draftChips, text: draftText } }));
    await fetch('/api/save-answer', {
      method: 'POST',
      body: JSON.stringify({ token, journeyId, stageId: stage.id, chips: draftChips, freeText: draftText }),
    });
  }

  async function next() {
    await saveCurrent();
    if (cur >= STAGES.length - 1) {
      setPhase('building');
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        body: JSON.stringify({ token, journeyId }),
      });
      const data = await res.json();
      setReport(data.report);
      setTimeout(() => setPhase('report'), 1200);
      return;
    }
    setCur((c) => c + 1);
  }

  function prev() {
    saveCurrent();
    setCur((c) => Math.max(0, c - 1));
  }

  if (phase === 'loading') {
    return <Center>جارٍ التحقق من رابطك…</Center>;
  }
  if (phase === 'invalid') {
    return <Center>هذا الرابط غير صالح أو منتهي. تأكد إنك تستخدم الرابط اللي وصلك بالبريد بالضبط.</Center>;
  }
  if (phase === 'building') {
    return <Center>جارٍ رسم خريطتك…</Center>;
  }
  if (phase === 'report' && report) {
    return <Report report={report} />;
  }

  const stage = STAGES[cur];

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '24px 0' }}>
        {STAGES.map((s, i) => (
          <div key={s.id} style={{
            width: 14, height: 14, borderRadius: '50%',
            background: i < cur ? '#7c8a5a' : i === cur ? '#b97a3e' : '#e3d8bd',
          }} />
        ))}
      </div>

      <div style={card}>
        <div style={{ fontFamily: 'serif', fontSize: 14, color: '#8a8272', textAlign: 'center' }}>{stage.kicker}</div>
        <h2 style={{ textAlign: 'center', color: '#4a3a26' }}>{stage.title}</h2>
        <p style={{ textAlign: 'center', color: '#8a5a24' }}>{stage.narrative}</p>
        <p style={{ textAlign: 'center', color: '#4a3a26', margin: '20px 0' }}>{stage.q}</p>

        {stage.chips && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            {stage.chips.map((c) => (
              <div key={c} onClick={() => toggleChip(c)} style={{
                ...chip,
                background: draftChips.includes(c) ? '#f7ddc2' : '#fff',
                borderColor: draftChips.includes(c) ? '#b97a3e' : '#c9b98f',
              }}>{c}</div>
            ))}
          </div>
        )}

        <textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder="اكتب بكلماتك أنت…"
          style={{ ...textarea, minHeight: stage.big ? 170 : 90 }}
        />

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          {cur > 0 && <button onClick={prev} style={btnOutline}>السابقة</button>}
          <button onClick={next} style={btnSolid}>{stage.id === 6 ? 'اعرض خريطتي' : 'التالية'}</button>
        </div>
      </div>
    </div>
  );
}

function Report({ report }: { report: any }) {
  return (
    <div style={wrap}>
      <div style={card}>
        <h2 style={{ textAlign: 'center', color: '#4a3a26' }}>خريطة الوعي بالعلاقة</h2>
        {report.sections.map((s: any) => (
          <div key={s.key} style={{ marginTop: 18 }}>
            <div style={{ fontWeight: 700, color: '#8a5a24' }}>{s.key}</div>
            <p style={{ color: '#4a3a26' }}>{s.text}</p>
          </div>
        ))}
        <div style={{ marginTop: 22, padding: 18, background: '#f6dfc1', borderRadius: 10 }}>
          <div style={{ fontWeight: 700, color: '#7a3313' }}>رسالة شخصية</div>
          <p style={{ color: '#4a3a26' }}>{report.closingMessage}</p>
        </div>
        {report.finalAnswer && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontWeight: 700, color: '#8a5a24' }}>جوابك الكامل، بكلماتك أنت</div>
            <p style={{ fontStyle: 'italic', color: '#6b5c3e' }}>&quot;{report.finalAnswer}&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Center({ children }: { children: ReactNode }) {
  return <div style={{ ...wrap, textAlign: 'center', paddingTop: 120, color: '#4a3a26' }}>{children}</div>;
}

const wrap: CSSProperties = { maxWidth: 720, margin: '0 auto', padding: '20px 24px', fontFamily: 'sans-serif', direction: 'rtl' };
const card: CSSProperties = { background: '#fbf6ea', border: '1.8px solid #c9b98f', borderRadius: 14, padding: '30px 28px' };
const chip: CSSProperties = { border: '1.6px solid', borderRadius: 20, padding: '8px 16px', cursor: 'pointer', fontSize: 13 };
const textarea: CSSProperties = { width: '100%', border: '1.4px solid #c9b98f', borderRadius: 8, padding: 12, fontSize: 14 };
const btnSolid: CSSProperties = { flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#4a3a26', color: '#f3ead9', cursor: 'pointer' };
const btnOutline: CSSProperties = { flex: 1, padding: 12, borderRadius: 8, border: '1.6px solid #4a3a26', background: 'transparent', color: '#4a3a26', cursor: 'pointer' };
