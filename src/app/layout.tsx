import type { Metadata, Viewport } from 'next';
import { Onest, Oswald } from 'next/font/google';
import type { ReactNode } from 'react';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import './globals.css';

const display = Oswald({ subsets: ['cyrillic', 'latin'], variable: '--font-display', display: 'swap' });
const body = Onest({ subsets: ['cyrillic', 'latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Каталог дорам — Левитация', template: '%s — Левитация' },
  description: 'Каталог дорам: постеры, описания, актёры и рейтинги.',
};

export const viewport: Viewport = { themeColor: '#15110E' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
