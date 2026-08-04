'use client';

import { useState, createElement as h } from 'react';

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
          window.location.href = '/start?token=' + encodeURIComponent(trimmed);
  }

  return h('div', { className: 'landing' },
               h('style', null, CSS),
               h('div', { className: 'eyebrow' }, 'HS\u201301'),
               h('div', { className: 'h1' }, '\u062c\u0648\u0627\u0628\u0643 \u0627\u0644\u0634\u062e\u0635\u064a'),
               h('div', { className: 'sub' }, '\u0644\u0645\u0627\u0630\u0627 \u062a\u0624\u0644\u0645\u0646\u064a \u0639\u0644\u0627\u0642\u0627\u062a\u064a\u061f \u2014 \u0631\u062d\u0644\u0629 \u062a\u0623\u0645\u0644\u064a\u0629 \u0634\u062e\u0635\u064a\u0629 \u062a\u0623\u062e\u0630\u0643 \u0639\u0628\u0631 \u0633\u062a \u0645\u062d\u0637\u0627\u062a \u0644\u0641\u0647\u0645 \u0627\u0644\u0646\u0645\u0637 \u0627\u0644\u0630\u064a \u064a\u062a\u0643\u0631\u0631 \u0645\u0639\u0643 \u0641\u064a \u0639\u0644\u0627\u0642\u0627\u062a\u0643.'),
               h('div', { className: 'card' },
                       h('div', { className: 'label' }, '\u0631\u0645\u0632 \u0627\u0644\u0648\u0635\u0648\u0644 \u0627\u0644\u062e\u0627\u0635 \u0628\u0643'),
                       h('input', {
                                   className: 'input',
                                   placeholder: '\u0627\u0644\u0635\u0642 \u0627\u0644\u0631\u0645\u0632 \u0627\u0644\u0630\u064a \u0648\u0635\u0644\u0643 \u0628\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a',
                                   value: code,
                                   onChange: (e) => setCode(e.target.value),
                                   onKeyDown: (e) => { if (e.key === 'Enter') submit(); },
                                   dir: 'ltr',
                                   style: { textAlign: 'left' },
                       }),
                       error ? h('div', { className: 'err' }, error) : null,
                       h('button', { className: 'btn', onClick: submit, disabled: loading },
                                 loading ? '\u064a\u062c\u0631\u064a \u0627\u0644\u062f\u062e\u0648\u0644 \u0627\u0644\u0622\u0646\u2026' : '\u0627\u0628\u062f\u0623 \u0631\u062d\u0644\u062a\u0643'),
                       h('div', { className: 'hint' }, '\u0644\u0645 \u062a\u0633\u062a\u0644\u0645 \u0627\u0644\u0631\u0645\u0632\u061f \u062a\u062d\u0642\u0642 \u0645\u0646 \u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0628\u0639\u062f \u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u0634\u0631\u0627\u0621\u060c \u0623\u0648 \u0631\u0627\u062c\u0639 \u0645\u062c\u0644\u062f \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u063a\u064a\u0631 \u0627\u0644\u0645\u0631\u063a\u0648\u0628 \u0641\u064a\u0647\u0627.')
                     ),
               h('div', { className: 'rights' }, '\u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0642 \u0645\u062d\u0641\u0648\u0638\u0629 \u0644\u0644\u0643\u0648\u062a\u0634 \u0641\u0627\u0631\u0633 \u0643\u0627\u0641\u064a \u00a9 ' + new Date().getFullYear())
             );
}
