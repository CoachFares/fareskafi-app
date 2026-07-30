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
  { id: 5, kicker: 'المحطة الخامسة', title: 'الاختيار الجديد', narrative: 'فرصة واحدة لتغيير مسار هذا النمط، تبدأ من هنا',
    q: 'لو أتيحت لك فرصة واحدة لتغيير مسار هذا النمط، ماذا ستفعل أول مرة يتكرر فيها الموقف؟',
    chips: ['سأتوقف قبل أن أرد ولو للحظة واحدة', 'سأقول ما أشعر به بدلا من أن أخفيه', 'سأسمح لنفسي أن أرفض من دون تبرير', 'سأطلب ما أحتاجه بصوت مسموع'] },
  { id: 6, kicker: 'المحطة السادسة', title: 'الجواب', narrative: 'الآن تكتب أنت إجابتك الكاملة، بكلماتك، على السؤال الذي جئت من أجله',
    q: 'لماذا تؤلمني علاقاتي؟ وما الذي كنت أبحث عنه فعلا؟ وماذا أعرف عن نفسي الآن؟', chips: null, big: true },
];

const LIFE_STAGES = [
  'أنا أمر بانفصال مؤلم',
  'أنا في علاقة لكنني في حيرة',
  'أنا في بداية علاقة جديدة',
];

type Answers = Record<number, { chips: string[]; text: string }>;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@700&family=Markazi+Text:wght@500;600;700&family=Tajawal:wght@400;500;700&display=swap');
* { box-sizing: border-box; }
body { background:#f3f4f6; margin:0; }
.stage { position:relative; max-width:760px; margin:0 auto; background:#ffffff; padding:44px 32px 40px; min-height:100vh; font-family:'Tajawal',sans-serif; direction:rtl; }
.eyebrow { font-family:'Markazi Text',serif; font-size:13px; letter-spacing:3px; color:#a9832f; text-align:center; margin-bottom:6px; }
.h1 { font-family:'Aref Ruqaa',serif; font-weight:700; font-size:28px; color:#0f2847; text-align:center; }
.progress { display:flex; justify-content:center; gap:8px; margin:24px 0 30px; }
.dot { width:14px; height:14px; border-radius:50%; }
.card { background:#ffffff; border:1.6px solid #dfe3ea; border-radius:14px; padding:32px 30px; box-shadow:0 2px 18px rgba(15,40,71,0.05); }
.kicker { font-family:'Markazi Text',serif; font-size:14px; letter-spacing:2px; color:#a9832f; text-align:center; }
.title { font-family:'Aref Ruqaa',serif; font-weight:700; font-size:24px; color:#0f2847; text-align:center; margin-top:6px; }
.narrative { font-family:'Markazi Text',serif; font-size:16px; color:#5c6b80; text-align:center; margin:10px 0 24px; }
.qtext { font-family:'Tajawal',sans-serif; font-size:15.5px; color:#0f2847; text-align:center; margin-bottom:18px; line-height:1.8; }
.chips { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-bottom:18px; }
.chip { border:1.6px solid #dfe3ea; border-radius:20px; padding:9px 16px; font-size:13.5px; cursor:pointer; background:#fff; color:#0f2847; transition:all .15s; }
.chip.sel { background:#0f2847; border-color:#0f2847; color:#f4d78a; }
.orlabel { text-align:center; font-family:'Markazi Text',serif; font-size:13px; color:#9aa3b0; margin-bottom:10px; }
.reflect { width:100%; border:1.4px solid #dfe3ea; border-radius:9px; padding:14px 16px; font-family:'Tajawal',sans-serif; font-size:14px; color:#0f2847; background:#fff; resize:vertical; }
.reflect:focus { outline:none; border-color:#c6a15b; }
.navrow { display:flex; gap:12px; margin-top:26px; }
.btn { flex:1; padding:13px; border-radius:8px; font-family:'Markazi Text',serif; font-weight:700; font-size:16px; cursor:pointer; border:none; }
.btn.solid { background:#0f2847; color:#f4d78a; }
.btn.solid:hover { background:#163a63; }
.btn.outline { background:transparent; color:#0f2847; border:1.6px solid #0f2847; }
.center { text-align:center; padding-top:120px; color:#0f2847; font-family:'Markazi Text',serif; font-size:18px; }
.spinner { width:38px; height:38px; border:3px solid #e8e2d0; border-top-color:#c6a15b; border-radius:50%; margin:0 auto 18px; animation:spin 1s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.rcard { background:#ffffff; border:1.6px solid #dfe3ea; border-radius:14px; padding:24px 26px; margin-bottom:16px; }
.rcard.primary { background:#fbf5e6; border:2px solid #c6a15b; }
.rk { font-family:'Markazi Text',serif; font-weight:700; font-size:15px; color:#a9832f; margin-bottom:6px; }
.rk.dark { color:#0f2847; }
.rtext { font-family:'Tajawal',sans-serif; font-size:14px; color:#0f2847; line-height:1.9; }
.quote { font-family:'Markazi Text',serif; font-style:italic; font-size:16px; color:#5c6b80; border-right:3px solid #c6a15b; padding-right:14px; }
.sig { text-align:center; margin-top:36px; }
.signame { font-family:'Aref Ruqaa',serif; font-weight:700; font-style:italic; font-size:22px; color:#0f2847; }
.sigrule { width:100px; height:1px; background:#c6a15b; margin:9px auto; }
.sigar { font-family:'Markazi Text',serif; font-size:14px; color:#5c6b80; }
.rights { font-family:'Tajawal',sans-serif; font-size:11px; color:#9aa3b0; margin-top:10px; }
.lifecard { border:1.6px solid #dfe3ea; border-radius:12px; padding:18px 20px; margin-bottom:12px; cursor:pointer; font-family:'Tajawal',sans-serif; font-size:15px; color:#0f2847; text-align:center; transition:all .15s; }
.lifecard.sel { background:#0f2847; border-color:#0f2847; color:#f4d78a; }
`;

function Rights() {
  return <div className="sig"><div className="rights">جميع الحقوق محفوظة للكوتش فارس كافي © {new Date().getFullYear()}</div></div>;
}

export default function StartPage() {
  const [phase, setPhase] = useState<'loading' | 'invalid' | 'intro' | 'journey' | 'building' | 'report'>('loading');
  const [token, setToken] = useState('');
  const [journeyId, setJourneyId] = useState('');
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [lifeStage, setLifeStage] = useState('');
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
        const savedLifeStage = loaded[0]?.text;
        if (savedLifeStage) { setLifeStage(savedLifeStage); setCur(data.resumeStage || 0); setPhase('journey'); }
        else { setPhase('intro'); }
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

  async function confirmLifeStage() {
    if (!lifeStage) return;
    await fetch('/api/save-answer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, journeyId, stageId: 0, chips: [], freeText: lifeStage }),
    });
    setPhase('journey');
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
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, journeyId }),
      });
      const data = await res.json();
      setAiText(data.ok ? data.analysis : `تعذر إنتاج التحليل الآن. (${data.reason || 'خطأ غير معروف'})`);
    } catch (e) {
      setAiText('تعذر الاتصال بخدمة التحليل. يرجى المحاولة بعد قليل.');
    }
    setAiState('done');
  }

  const Style = () => <style>{CSS}</style>;

  if (phase === 'loading') return (<><Style /><div className="stage"><div className="center">نتحقق من رابطك الآن…</div></div></>);

  if (phase === 'invalid') return (<><Style /><div className="stage">
    <div className="center">
      هذا الرابط غير صالح أو منتهي. يرجى التأكد من استخدام الرابط الذي وصلك بالبريد الإلكتروني كما هو.
      {debugInfo && <div style={{ marginTop: 16, fontSize: 11, color: '#a9832f', direction: 'ltr' }}>{debugInfo}</div>}
    </div>
    <Rights />
  </div></>);

  if (phase === 'intro') {
    return (
      <>
        <Style />
        <div className="stage">
          <div className="eyebrow">HS–01 · قبل أن نبدأ</div>
          <div className="h1" style={{ marginBottom: 26 }}>أين أنت الآن؟</div>
          <div className="card">
            <div className="narrative" style={{ marginBottom: 22 }}>هذا يساعدنا نوجه رحلتك بما يناسب مكانك الحالي تحديدا</div>
            {LIFE_STAGES.map((l) => (
              <div key={l} className={`lifecard${lifeStage === l ? ' sel' : ''}`} onClick={() => setLifeStage(l)}>{l}</div>
            ))}
            <div className="navrow">
              <button className="btn solid" disabled={!lifeStage} onClick={confirmLifeStage} style={{ opacity: lifeStage ? 1 : 0.5 }}>ابدأ رحلتك</button>
            </div>
          </div>
          <Rights />
        </div>
      </>
    );
  }

  if (phase === 'building') return (<><Style /><div className="stage"><div className="center"><div className="spinner" />نرسم خريطتك الآن…</div></div></>);

  if (phase === 'report' && report) {
    return (
      <>
        <Style />
        <div className="stage">
          <div className="eyebrow">HS–01 · خريطتك</div>
          <div className="h1" style={{ marginBottom: 10 }}>خريطة الوعي بالعلاقة</div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 26px' }}>
            <svg width="220" height="140" viewBox="0 0 1000 660">
              <path d="M250,560 A250,300 0 1 1 750,560" fill="none" stroke="#0f2847" strokeWidth="30" strokeLinecap="round" opacity="0.9" />
              <path d="M320,560 A185,225 0 1 1 680,560" fill="none" stroke="#c6a15b" strokeWidth="30" strokeLinecap="round" opacity="0.9" />
              <path d="M390,560 A120,150 0 1 1 610,560" fill="none" stroke="#163a63" strokeWidth="30" strokeLinecap="round" opacity="0.9" />
              <path d="M455,560 A55,75 0 1 1 545,560" fill="none" stroke="#a9832f" strokeWidth="30" strokeLinecap="round" opacity="0.9" />
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
            <div className="rights">جميع الحقوق محفوظة للكوتش فارس كافي © {new Date().getFullYear()}</div>
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
        <div className="eyebrow">HS–01 · رحلتك</div>
        <div className="h1">خريطة الوعي بالعلاقة</div>
        <div className="progress">
          {STAGES.map((s, i) => (
            <div key={s.id} className="dot" style={{ background: i < cur ? '#c6a15b' : i === cur ? '#0f2847' : '#e5e7eb' }} />
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
        <Rights />
      </div>
    </>
  );
}
