'use client';

import { useState } from 'react';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
* { box-sizing: border-box; }
body { background:#f3f4f6; margin:0; }
.landing { max-width:520px; margin:0 auto; min-height:100vh; display:flex; flex-direction:column; justify-content:center; padding:40px 32px; font-family:'Tajawal',sans-serif; direction:rtl; }
.eyebrow { font-size:13px; letter-spacing:3px; color:#a9832f; text-align:center; margin-bottom:10px; }
.h1 { font-weight:900; font-size:26px; color:#0f2847; text-align:center; margin-bottom:14px; }
.sub { font-size:15px; color:#5c6b80; text-align:center; margin-bottom:36px; line-height:1.9; }
.card { background:#ffffff; border:1.6px solid #dfe3ea; border-radius:14px; padding:30px 28px; box-shadow:0 2px 18px rgba(15,40,71,0.05); }
.label { font-size:13px; color:#0f2847; font-weight:700; margin-bottom:8px; }
.input { width:100%; border:1.4px solid #dfe3ea; border-radius:9px; padding:13px 16px; font-family:'Tajawal',sans-serif; font-size:15px; color:#0f2847; background:#fff; }
.input:focus { outline:none; border-color:#c6a15b; }
.btn { width:100%; padding:14px; border-radius:8px; font-weight:700; font-size:16px; cursor:pointer; border:none; background:#0f2847; color:#f4d78a; margin-top:18px; }
.btn:hover { background:#163a63; }
.btn:disabled { opacity:.5; cursor:default; }
.err { color:#b9552e; font-size:13px; text-align:center; margin-top:10px; }
.hint { font-size:12px; color:#9aa3b0; text-align:center; margin-top:16px; }
.rights { font-size:11px; color:#9aa3b0; text-align:center; margin-top:40px; }
`;

export default function Home() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

  function submit() {
        const trimmed = code.trim();
        if (!trimmed) { setError('الرجاء إدخال رمز الوصول'); return; }
        setError('');
        setLoading(true);
        window.location.href = `/start?token=${encodeURIComponent(trimmed)}`;
  }

  return (
        <>
              <style>{CSS}</style>style>
              <div className="landing">
                      <div className="eyebrow">HS–01</div>div>
                      <div className="h1">جوابك الشخصي</div>div>
                      <div className="sub">لماذا تؤلمني علاقاتي؟ — رحلة تأملية شخصية تأخذك عبر ست محطات لفهم النمط الذي يتكرر معك في علاقاتك.</div>div>
                      <div className="card">
                                <div className="label">رمز الوصول الخاص بك</div>div>
                                <input
                                              className="input"
                                              placeholder="الصق الرمز الذي وصلك بالبريد الإلكتروني"
                                              value={code}
                                              onChange={(e) => setCode(e.target.value)}
                                              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                                              dir="ltr"
                                              style={{ textAlign: 'left' }}
                                            />
                        {error && <div className="err">{error}</div>div>}
                                <button className="btn" onClick={submit} disabled={loading}>{loading ? 'يجري الدخول الآن…' : 'ابدأ رحلتك'}</button>button>
                                <div className="hint">لم تستلم الرمز؟ تحقق من بريدك الإلكتروني بعد إتمام الشراء، أو راجع مجلد الرسائل غير المرغوب فيها.</div>div>
                      </div>div>
                      <div className="rights">جميع الحقوق محفوظة للكوتش فارس كافي © {new Date().getFullYear()}</div>div>
              </div>div>
        </>>
      );
}
</>
