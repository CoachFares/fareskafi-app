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
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: '#ece2cd' }}>{children}</body>
    </html>
  );
}
