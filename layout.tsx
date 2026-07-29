import { ReactNode } from 'react';

export const metadata = {
  title: 'جوابك الشخصي — لماذا تؤلمني علاقاتي؟',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@700&family=Markazi+Text:wght@500;600;700&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: '#ece2cd' }}>{children}</body>
    </html>
  );
}
