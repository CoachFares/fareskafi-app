'use client';

import { useEffect, useState } from 'react';

const STAGES = [
  { id: 1, kicker: 'المحطة الأولى', title: 'الوجع كما هو', narrative: 'ننزع القصة عن الألم، لنرى ما يختبئ تحتها فعلا',
    q: 'لو رويت قصة علاقتك لغريب لا يعرفك، أي شعور سيتكرر في الرواية مهما بدلت الأسماء والتفاصيل؟',
    chips: ['الغياب وأنا حاضر', 'الخوف من أن أترك فجأة', 'الإحساس بأني عبء على من أحب', 'الرفض مهما بذلت', 'انعدام قيمتي في عين الآخر', 'ضيق يخنقني كلما اقترب أحد'] },
  { id: 2, kicker: 'المحطة الثانية', title: 'الحاجة التي لم تقل', narrative: 'نكشف ما كنت تطلبه من دون كلمات',
    q: 'لو أرسلت نداء صامتا لكل من أحببت، ماذا كان سيقول هذا النداء؟',
    chips: ['أن يراني أحد كما أنا لا كما يتمنى', 'أن أصدق حين أتألم', 'الاطمئنان إلى أني لن أترك وحيدا', 'أن يطلب مني لا أن أفرض نفسي', 'احترام مساحتي من دون أن أطلبها'] },
  { id: 3, kicker: 'المحطة الثالثة', title: 'الثمن الذي ندفعه لنبقى محبوبين', narrative: 'نرصد الطريقة التي نساوم بها على أنفسنا مقابل الأمان',
    q: 'أي جزء منك اختفى تدريجيا كي تبقى العلاقة قائمة؟',
    chips: ['صوتي حين توقفت عن الاعتراض', 'غضبي حين ابتلعته مرارا', 'رغباتي حين أجلتها إلى ما لا نهاية', 'ثقتي بنفسي حين بدأت أشك في كل قراراتي', 'حدودي حين سمحت بتجاوزها'] },
  { id: 4, kicker: 'المحطة الرابعة', title: 'من أين بدأ هذا', narrative: 'نعود إلى اللحظة الأولى التي تعلمنا فيها هذا الدرس، من دون أن نوجه اللوم لأحد',
    q: 'أغمض عينيك للحظة. متى شعرت أول مرة أن الحب يأتي بهذا الشكل تحديدا؟ من كان حاضرا، وماذا حدث؟', chips: null },
  { id: 5, kicker: 'المحطة الخامسة', title: 'الاختيار الجديد', narrative: 'نترجم كل ما رأيناه إلى خطوة واحدة نبدأ بها',
    q: 'لو أتيحت لك فرصة واحدة لتغيير مسار هذا النمط، ماذا ستفعل أول مرة يتكرر فيها الموقف؟',
    chips: ['سأتوقف قبل أن أرد ولو للحظة واحدة', 'سأقول ما أشعر به بدلا من أن أخفيه', 'سأسمح لنفسي أن أرفض من دون تبرير', 'سأطلب ما أحتاجه بصوت مسموع'] },
  { id: 6, kicker: 'المحطة السادسة', title: 'الجواب', narrative: 'الآن تكتب أنت إجابتك الكاملة، بكلماتك، على السؤال الذي جئت من أجله',
    q: 'لماذا تؤلمني علاقاتي؟ وما الذي كنت أبحث عنه فعلا؟ وماذا أعرف عن نفسي الآن؟', chips: null, big: true },
];

type Answers = Record<number, { chips: string[]; text: string }>;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@700&family=Markazi+Text:wght@500;600;700&family=Tajawal:wght@400;500;700&display=swap');
* { box-sizing: border-box; }
body { background:#ece2cd; margin:0; }
.stage { position:relative; max-width:760px; margin:0 auto; background:#f3ead9; padding:40px 30px 60px; min-height:100vh; font-family:'Tajawal',sans-serif; direction:rtl; }
.eyebrow { font-family:'Markazi Text',serif; font-size:13px; letter-spacing:3px; color:#8a8272; text-align:center; margin-bottom:6px; }
.h1 { font-family:'Aref Ruqaa',serif; font-weight:700; font-size:28px; color:#4a3a26; text-align:center; }
.progress { display:flex; justify-content:center; gap:8px; margin:24px 0 30px; }
.dot { width:14px; height:14px; border-radius:50%; }
.card { background:#fbf6ea; border:1.8px solid #c9b98f; border-radius:14px; padding:32px 30px; }
.kicker { font-family:'Markazi Text',serif; font-size:14px; letter-spacing:2px; color:#8a8272; text-align:center; }
.title { font-family:'Aref Ruqaa',serif; font-weight:700; font-size:24px; color:#4a3a26; text-align:center; margin-top:6px; }
.narrative { font-family:'Markazi Text',serif; font-size:16px; color:#8a5a24; text-align:center; margin:10px 0 24px; }
.qtext { font-family:'Tajawal',sans-serif; font-size:15.5px; color:#4a3a26; text-align:center; margin-bottom:18px; line-height:1.8; }
.chips { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-bottom:18px; }
.chip { border:1.6px solid #c9b98f; border-radius:20px; padding:9px 16px; font-size:13.5px; cursor:pointer; background:#fff; color:#4a3a26; transition:all .15s; }
.chip.sel { background:#f7ddc2; border-color:#b97a3e; color:#7a4a1c; }
.orlabel { text-align:center; font-family:'Markazi Text',serif; font-size:13px; color:#a0937a; margin-bottom:10px; }
.reflect { width:100%; border:1.4px solid #c9b98f; border-radius:9px; padding:14px 16px; font-family:'Tajawal',sans-serif; font-size:14px; color:#4a3a26; background:#fff; resize:vertical; }
.navrow { display:flex; gap:12px; margin-top:26px; }
.btn { flex:1; padding:13px; border-radius:8px; font-family:'Markazi Text',serif; font-weight:700; font-size:16px; cursor:pointer; border:none; }
.btn.solid { background:#4a3a26; color:#f3ead9; }
.btn.outline { background:transparent; color:#4a3a26; border:1.6px solid #4a3a26; }
.center { text-align:center; padding-top:120px; color:#4a3a26; font-family:'Markazi Text',serif; font-size:18px; }
.spinner { width:38px; height:38px; border:3px solid #d9c9a0; border-top-color:#b97a3e; border-radius:50%; margin:0 auto 18px; animation:spin 1s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.rcard { background:#fbf6ea; border:1.8px solid #c9b98f; border-radius:14px; padding:24px 26px; margin-bottom:16px; }
.rcard.primary { background:#f6dfc1; border:2px solid #4a3a26; }
.rk { font-family:'Markazi Text',serif; font-weight:700; font-size:15px; color:#8a5a24; margin-bottom:6px; }
.rk.dark { color:#7a3313; }
.rtext { font-family:'Tajawal',sans-serif; font-size:14px; color:#4a3a26; line-height:1.9; }
.quote { font-family:'Markazi Text',serif; font-style:italic; font-size:16px; color:#6b5c3e; border-right:3px solid #b97a3e; padding-right:14px; }
.aibtn { width:100%; padding:14px; border-radius:9px; border:1.8px solid #4a3a26; background:transparent; color:#4a3a26; font-family:'Markazi Text',serif; font-weight:700; font-size:16px; cursor:pointer; margin-top:10px; }
.aibtn:hover { background:#4a3a26; color:#f3ead9; }
.aiout { margin-top:14px; background:#fff; border:1.6px solid #b97a3e; border-radius:10px; padding:20px 22px; font-family:'Tajawal',sans-serif; font-size:14px; color:#4a3a26; line-height:1.95; white-space:pre-line; }
.sig { text-align:center; margin-top:36px; }
.signame { font-family:'Aref Ruqaa',serif; font-weight:700; font-style:italic; font-size:24px; color:#4a3a26; }
.sigrule { width:110px; height:1px; background:#4a3a26; margin:9px auto; opacity:.5; }
.sigar { font-family:'Markazi Text',serif; font-size:14px; color:#5b4a30; }
`;

export default function StartPage() {
  const BUILD_TAG = 'نسخة-٣٠-يوليو-فصحى-v2';
  const [phase, setPhase] = useState<'loading' | 'invalid' | 'journey' | 'building' | 'report'>('loading');
  const [token, setToken] = useState('');
  const [journeyId, setJourneyId] = useState('');
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [draftChips, setDraftChips] = useState<string[]>([]);
  const [draftText, setDraftText] = useState('');
  const [report, setReport] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [aiText, setAiText] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) { setPhase('invalid'); return; }
    setToken(t);
    fetch('/api/start-journey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: t }),
    })
      .then(async (r) => {
        const text = await r.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch { setDebugInfo(text.slice(0, 300)); }
        if (!data.ok) { setDebugInfo(data.debug || text.slice(0, 300)); setPhase('invalid'); return; }
        setJourneyId(data.journeyId);
        const loaded: Answers = {};
        (data.answers || []).forEach((a: any) => { loaded[a.stage_id] = { chips: a.chips || [], text: a.free_text || '' }; });
        setAnswers(loaded);
        setCur(data.resumeStage || 0);
        setPhase('journey');
      })
      .catch((err) => { setDebugInfo(String(err)); setPhase('invalid'); });
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
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, journeyId, stageId: stage.id, chips: draftChips, freeText: draftText }),
    });
  }

  async function next() {
    await saveCurrent();
    if (cur >= STAGES.length - 1) {
      setPhase('building');
      const res = await fetch('/api/generate-report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, journeyId }),
      });
      const data = await res.json();
      setReport(data.report);
      setTimeout(() => { setPhase('report'); runAi(); }, 1300);
      return;
    }
    setCur((c) => c + 1);
  }

  function prev() { saveCurrent(); setCur((c) => Math.max(0, c - 1)); }

  async function runAi() {
    setAiState('loading');
    const res = await fetch('/api/ai-analysis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, journeyId }),
    });
    const data = await res.json();
    setAiText(data.ok ? data.analysis : 'تعذر إنتاج التحليل الآن، يرجى المحاولة بعد قليل.');
    setAiState('done');
  }

  const Style = () => <style>{CSS}</style>;

  if (phase === 'loading') return (<><Style /><div className="stage"><div className="center">نتحقق من رابطك الآن…</div></div></>);
  if (phase === 'invalid') return (<><Style /><div className="stage"><div className="center">
    هذا الرابط غير صالح أو منتهي. يرجى التأكد من استخدام الرابط الذي وصلك بالبريد الإلكتروني كما هو.
    {debugInfo && <div style={{ marginTop: 16, fontSize: 11, color: '#b9552e', direction: 'ltr' }}>{debugInfo}</div>}
  </div></div></>);
  if (phase === 'building') return (<><Style /><div className="stage"><div className="center"><div className="spinner" />نرسم خريطتك الآن…</div></div></>);

  if (phase === 'report' && report) {
    return (
      <>
        <Style />
        <div className="stage">
          <div className="eyebrow">HS–01 · خريطتك · {BUILD_TAG}</div>
          <div className="h1" style={{ marginBottom: 10 }}>خريطة الوعي بالعلاقة</div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 26px' }}>
            <svg width="220" height="140" viewBox="0 0 1000 660">
              <path d="M250,560 A250,300 0 1 1 750,560" fill="none" stroke="#b97a3e" strokeWidth="34" strokeLinecap="round" opacity="0.9" />
              <path d="M320,560 A185,225 0 1 1 680,560" fill="none" stroke="#6d818e" strokeWidth="34" strokeLinecap="round" opacity="0.9" />
              <path d="M390,560 A120,150 0 1 1 610,560" fill="none" stroke="#7c8a5a" strokeWidth="34" strokeLinecap="round" opacity="0.9" />
              <path d="M455,560 A55,75 0 1 1 545,560" fill="none" stroke="#b9552e" strokeWidth="34" strokeLinecap="round" opacity="0.9" />
            </svg>
          </div>

          <div className="rcard primary">
            <div className="rk dark">تحليلك الشخصي</div>
            {aiState !== 'done' && <div className="center" style={{ paddingTop: 16, paddingBottom: 8 }}><div className="spinner" />نكتب تحليلك الآن…</div>}
            {aiState === 'done' && <div className="rtext" style={{ fontSize: 15, lineHeight: 2 }}>{aiText}</div>}
          </div>

          {report.finalAnswer && (
            <div className="rcard"><div className="rk">جوابك الكامل، بكلماتك أنت</div><div className="quote">&quot;{report.finalAnswer}&quot;</div></div>
          )}

          <div className="orlabel" style={{ margin: '22px 0 14px' }}>تفاصيل رحلتك، محطة بمحطة</div>
          {report.sections.map((s: any) => (
            <div className="rcard" key={s.key}><div className="rk">{s.key}</div><div className="rtext">{s.text}</div></div>
          ))}

          <div className="sig">
            <div className="signame">Fares Kafi</div>
            <div className="sigrule" />
            <div className="sigar">فارس كافي</div>
          </div>
        </div>
      </>
    );
  }

  const stage = STAGES[cur];

  return (
    <>
      <Style />
      <div className="stage">
        <div className="eyebrow">HS–01 · رحلتك · {BUILD_TAG}</div>
        <div className="h1">خريطة الوعي بالعلاقة</div>
        <div className="progress">
          {STAGES.map((s, i) => (
            <div key={s.id} className="dot" style={{ background: i < cur ? '#7c8a5a' : i === cur ? '#b97a3e' : '#e3d8bd' }} />
          ))}
        </div>
        <div className="card">
          <div className="kicker">{stage.kicker}</div>
          <div className="title">{stage.title}</div>
          <div className="narrative">{stage.narrative}</div>
          <div className="qtext">{stage.q}</div>

          {stage.chips && (
            <>
              <div className="chips">
                {stage.chips.map((c) => (
                  <div key={c} className={`chip${draftChips.includes(c) ? ' sel' : ''}`} onClick={() => toggleChip(c)}>{c}</div>
                ))}
              </div>
              <div className="orlabel">أو بكلماتك مباشرة</div>
            </>
          )}

          <textarea
            className="reflect"
            style={{ minHeight: stage.big ? 170 : 90 }}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="اكتب بكلماتك…"
          />

          <div className="navrow">
            {cur > 0 && <button className="btn outline" onClick={prev}>السابقة</button>}
            <button className="btn solid" onClick={next}>{stage.id === 6 ? 'اعرض خريطتي' : 'التالية'}</button>
          </div>
        </div>
      </div>
    </>
  );
}
