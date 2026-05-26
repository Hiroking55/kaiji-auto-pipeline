import type { Metadata } from 'next';
import { DotGothic16 } from 'next/font/google';
import NavBar from '@/components/NavBar';
import './globals.css';

const dotGothic = DotGothic16({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '借金キラー - 借金返済RPG',
  description: '借金をモンスターに見立てて、倒しながら返済していくRPGゲーム',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={dotGothic.className}>
      <body className="scanlines" style={{ backgroundColor: '#0a0a1a' }}>
        <div className="max-w-md mx-auto pb-20">
          {children}
        </div>
        <NavBar />
      </body>
    </html>
  );
}
