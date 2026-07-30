'use client';

import { useEffect, useState } from 'react';

const STAGES = [
  { id: 1, kicker: 'المحطة الأولى', title: 'الوجع كما هو' },
  { id: 2, kicker: 'المحطة الثانية', title: 'الحاجة التي لم تقل' },
  { id: 3, kicker: 'المحطة الثالثة', title: 'الثمن الذي ندفعه لنبقى محبوبين' },
  { id: 4, kicker: 'المحطة الرابعة', title: 'من أين بدأ هذا' },
  { id: 5, kicker: 'المحطة الخامسة', title: 'الاختيار الجديد' },
  { id: 6, kicker: 'المحطة السادسة', title: 'الجواب' },
];

const LIFE_STAGES = [
  'أنا أمر بانفصال مؤلم',
  'أنا في علاقة لكنني في حيرة',
  'أنا في بداية علاقة جديدة',
  'لست في علاقة حاليا، وأريد أن أفهم نفسي في العلاقات',
];

const MIN_ANSWER_LENGTH = 25;
const STATION_CAP = 4;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
* { box-sizing: border-box; }
body { background:#f3f4f6; margin:0; }
.stage { position:relative; max-width:760px; margin:0 auto; background:#ffffff; padding:44px 32px 40px; min-height:100vh; font-family:'Tajawal',sans-serif; direction:rtl; }
.eyebrow { font-family:'Tajawal',sans-serif; font-size:13px; letter-spacing:3px; color:#a9832f; text-align:center; margin-bottom:6px; }
.h1 { font-family:'Tajawal',sans-serif; font-weight:700; font-size:26px; color:#0f2847; text-align:center; }
.progress { display:flex; justify-content:center; gap:8px; margin:24px 0 8px; }
.dot { width:14px; height:14px; border-radius:50%; }
.subprogress { text-align:center; font-family:'Tajawal',sans-serif; font-size:12px; color:#9aa3b0; margin-bottom:22px; }
.card { background:#ffffff; border:1.6px solid #dfe3ea; border-radius:14px; padding:32px 30px; box-shadow:0 2px 18px rgba(15,40,71,0.05); min-height:260px; }
.kicker { font-family:'Tajawal',sans-serif; font-size:14px; letter-spacing:2px; color:#a9832f; text-align:center; }
.title { font-family:'Tajawal',sans-serif; font-weight:700; font-size:21px; color:#0f2847; text-align:center; margin-top:6px; }
.narrative { font-family:'Tajawal',sans-serif; font-size:16px; color:#5c6b80; text-align:center; margin:10px 0 24px; }
.qtext { font-family:'Tajawal',sans-serif; font-size:15.5px; color:#0f2847; text-align:center; margin-bottom:18px; line-height:1.8; }
.orlabel { text-align:center; font-family:'Tajawal',sans-serif; font-size:13px; color:#9aa3b0; margin-bottom:10px; }
.reflectbubble { background:#fbf5e6; border-right:3px solid #c6a15b; border-radius:8px; padding:12px 16px; margin-bottom:16px; font-family:'Tajawal',sans-serif; font-size:13.5px; color:#5c4a1a; line-height:1.8; }
.nudge { font-family:'Tajawal',sans-serif; font-size:12px; color:#a9832f; text-align:center; margin-top:8px; }
.reflect { width:100%; border:1.4px solid #dfe3ea; border-radius:9px; padding:14px 16px; font-family:'Tajawal',sans-serif; font-size:14px; color:#0f2847; background:#fff; resize:vertical; }
.reflect:focus { outline:none; border-color:#c6a15b; }
.navrow { display:flex; gap:12px; margin-top:26px; }
.btn { flex:1; padding:13px; border-radius:8px; font-family:'Tajawal',sans-serif; font-weight:700; font-size:16px; cursor:pointer; border:none; }
.btn.solid { background:#0f2847; color:#f4d78a; }
.btn.solid:hover { background:#163a63; }
.btn.solid:disabled { opacity:.5; cursor:default; }
.btn.outline { background:transparent; color:#0f2847; border:1.6px solid #0f2847; }
.center { text-align:center; padding-top:120px; color:#0f2847; font-family:'Tajawal',sans-serif; font-size:18px; }
.centersmall { text-align:center; padding:60px 0; color:#5c6b80; font-family:'Tajawal',sans-serif; font-size:15px; }
.spinner { width:38px; height:38px; border:3px solid #e8e2d0; border-top-color:#c6a15b; border-radius:50%; margin:0 auto 18px; animation:spin 1s linear infinite; }
.spinnersm { width:26px; height:26px; border:2.5px solid #e8e2d0; border-top-color:#c6a15b; border-radius:50%; margin:0 auto 12px; animation:spin 1s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.rcard { background:#ffffff; border:1.6px solid #dfe3ea; border-radius:14px; padding:24px 26px; margin-bottom:16px; }
.rcard.primary { background:#fbf5e6; border:2px solid #c6a15b; }
.rk { font-family:'Tajawal',sans-serif; font-weight:700; font-size:15px; color:#a9832f; margin-bottom:6px; }
.rk.dark { color:#0f2847; }
.rtext { font-family:'Tajawal',sans-serif; font-size:14px; color:#0f2847; line-height:1.9; }
.quote { font-family:'Tajawal',sans-serif; font-style:italic; font-size:16px; color:#5c6b80; border-right:3px solid #c6a15b; padding-right:14px; }
.sig { text-align:center; margin-top:36px; }
.signame { font-family:'Tajawal',sans-serif; font-weight:700; font-style:italic; font-size:22px; color:#0f2847; }
.sigrule { width:100px; height:1px; background:#c6a15b; margin:9px auto; }
.sigar { font-family:'Tajawal',sans-serif; font-size:14px; color:#5c6b80; }
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
  const [lifeStage, setLifeStage] = useState('');
  const [draftText, setDraftText] = useState('');
  const [report, setReport] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [aiText, setAiText] = useState('');
  const [nextAvailable, setNextAvailable] = useState('');

  const [qState, setQState] = useState<'loading' | 'ready' | 'submitting'>('loading');
  const [curQ, setCurQ] = useState('');
  const [curReflection, setCurReflection] = useState('');
  const [exchangeIndex, setExchangeIndex] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) { setPhase('invalid'); return; }
    setToken(t);
    fetch('/api/start-journey', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: t }),
    })
      .then(async (r) => {
        const text = await r.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch { setDebugInfo(text.slice(0, 300)); }
        if (!data.ok) { setDebugInfo(data.debug || text.slice(0, 300)); setPhase('invalid'); return; }

        if (data.locked) {
          setReport(data.report);
          setAiText(data.aiAnalysis || '');
          setAiState('done');
          setNextAvailable(data.nextAvailable || '');
          setPhase('report');
          return;
        }

        setJourneyId(data.journeyId);
        const life = (data.answers || []).find((a: any) => a.stage_id === 0);
        if (life?.free_text) { setLifeStage(life.free_text); setCur(data.resumeStage || 0); setPhase('journey'); }
        else { setPhase('intro'); }
      })
      .catch((err) => { setDebugInfo(String(err)); setPhase('invalid'); });
  }, []);

  useEffect(() => {
    if (phase !== 'journey') return;
    const stageId = STAGES[cur].id;
    setDraftText('');
    setExchangeIndex(0);
    setCurReflection('');
    setQState('loading');

    const endpoint = stageId === 6 ? '/api/next-question' : '/api/station-open';
    const body = stageId === 6 ? { token, journeyId } : { token, journeyId, stageId };

    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then((r) => r.json())
      .then((data) => {
        setCurQ(data.ok ? data.question : 'صف بصدق ما يخطر ببالك حول هذه المحطة.');
        if (stageId === 6 && data.narrative) setCurReflection(data.narrative);
        setQState('ready');
      })
      .catch(() => { setCurQ('صف بصدق ما يخطر ببالك حول هذه المحطة.'); setQState('ready'); });
  }, [cur, phase]);

  async function confirmLifeStage() {
    if (!lifeStage) return;
    await fetch('/api/save-answer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, journeyId, stageId: 0, chips: [], freeText: lifeStage }),
    });
    setPhase('journey');
  }

  async function finishToReport() {
    setPhase('building');
    const res = await fetch('/api/generate-report', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, journeyId }),
    });
    const data = await res.json();
    setReport(data.report);
    setTimeout(() => { setPhase('report'); runAi(); }, 1300);
  }

  async function next() {
    const stageId = STAGES[cur].id;

    if (stageId === 6) {
      await fetch('/api/save-answer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, journeyId, stageId: 6, chips: [], freeText: draftText, questionText: curQ }),
      });
      finishToReport();
      return;
    }

    setQState('submitting');
    const res = await fetch('/api/station-answer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, journeyId, stageId, questionText: curQ, answerText: draftText }),
    });
    const data = await res.json();

    if (data.done) {
      if (data.reason) setDebugInfo(`[محطة ${stageId}]: ${data.reason}`);
      setCur((c) => c + 1);
      return;
    }

    setCurQ(data.question || 'حدثني أكثر عن هذا.');
    setCurReflection(data.reflection || '');
    setDraftText('');
    setExchangeIndex((i) => i + 1);
    setQState('ready');
  }

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
          <div className="h1" style={{ marginBottom: 18 }}>خريطة الوعي بالعلاقة</div>
          <div className="rcard" style={{ marginBottom: 22 }}>
            <div className="rtext">
              أنت مقبل على رحلة تأملية من ست محطات، كل محطة تطرح عليك أسئلة قد تحتاج منك صدقا أكثر من المعتاد. لا توجد إجابات صحيحة أو خاطئة هنا، والأداة أحيانا تعيد سؤالك بصياغة أخرى إن شعرت أن إجابتك تحتاج تفصيلا أكثر — هذا مقصود، لا خطأ تقني.
              <br /><br />
              خذ وقتك، اكتب بصدق، وفي النهاية ستحصل على خريطة شخصية مبنية بالكامل على كلماتك أنت.
            </div>
          </div>
          <div className="card">
            <div className="narrative" style={{ marginBottom: 22 }}>أولا، هذا يساعدنا نوجه رحلتك بما يناسب مكانك الحالي تحديدا</div>
            {LIFE_STAGES.map((l) => (
              <div key={l} className={`lifecard${lifeStage === l ? ' sel' : ''}`} onClick={() => setLifeStage(l)}>{l}</div>
            ))}
            <div className="navrow">
              <button className="btn solid" disabled={!lifeStage} onClick={confirmLifeStage}>ابدأ رحلتك</button>
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
          {nextAvailable && (
            <div className="narrative" style={{ marginTop: -4 }}>
              هذه خريطتك المحفوظة من رحلتك الأخيرة. رحلة جديدة تتوفر بتاريخ {new Date(nextAvailable).toLocaleDateString('ar')}.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 26px' }}>
            <svg width="220" height="140" viewBox="0 0 1000 660">
              <path d="M250,560 A250,300 0 1 1 750,560" fill="none" stroke="#0f2847" strokeWidth="30" strokeLinecap="round" opacity="0.9" />
              <path d="M320,560 A185,225 0 1 1 680,560" fill="none" stroke="#c6a15b" strokeWidth="30" strokeLinecap="round" opacity="0.9" />
              <path d="M390,560 A120,150 0 1 1 610,560" fill="none" stroke="#163a63" strokeWidth="30" strokeLinecap="round" opacity="0.9" />
              <path d="M455,560 A55,75 0 1 1 545,560" fill="none" stroke="#a9832f" strokeWidth="30" strokeLinecap="round" opacity="0.9" />
            </svg>
          </div>

          <div className="rcard primary">
            <div className="rk dark">خريطة الوعي بالعلاقة</div>
            {aiState !== 'done' && <div className="center" style={{ paddingTop: 16, paddingBottom: 8 }}><div className="spinner" />نكتب خريطتك الآن…</div>}
            {aiState === 'done' && aiText.split(/\n\s*\n/).map((p, i) => (
              <p key={i} className="rtext" style={{ fontSize: 15, lineHeight: 2, marginTop: i > 0 ? 16 : 0 }}>{p.trim()}</p>
            ))}
          </div>

          {report.finalAnswer && (
            <div className="rcard"><div className="rk">جوابك الكامل، بكلماتك أنت</div><div className="quote">&quot;{report.finalAnswer}&quot;</div></div>
          )}

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
  const isFinal = stage.id === 6;

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
        {!isFinal && <div className="subprogress">سؤال {exchangeIndex + 1} من {STATION_CAP} كحد أقصى بهذه المحطة</div>}

        <div className="card">
          <div className="kicker">{stage.kicker}</div>
          <div className="title">{stage.title}</div>

          {(qState === 'loading' || qState === 'submitting') && (
            <div className="centersmall"><div className="spinnersm" />{qState === 'loading' ? 'يعد سؤالك الآن…' : 'لحظة، يقرأ إجابتك…'}</div>
          )}

          {qState === 'ready' && (
            <>
              {curReflection && <div className="reflectbubble">{curReflection}</div>}
              <div className="qtext">{curQ}</div>
              <textarea
                className="reflect"
                style={{ minHeight: isFinal ? 170 : 110 }}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="اكتب بكلماتك…"
              />
              {draftText.trim().length > 0 && draftText.trim().length < MIN_ANSWER_LENGTH && (
                <div className="nudge">حاول تكتب أكثر شوي، حتى نقدر نفهم ما تقصده بعمق أكبر</div>
              )}
              <div className="navrow">
                <button className="btn solid" disabled={draftText.trim().length < MIN_ANSWER_LENGTH} onClick={next}>
                  {isFinal ? 'اعرض خريطتي' : 'التالية'}
                </button>
              </div>
            </>
          )}
        </div>
        {debugInfo && <div style={{ fontSize: 10, color: '#a9832f', textAlign: 'center', marginTop: 10, direction: 'ltr' }}>{debugInfo}</div>}
        <Rights />
      </div>
    </>
  );
}
