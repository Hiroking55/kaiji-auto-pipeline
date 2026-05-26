import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import NavBar from '@/components/NavBar';
import './globals.css';

const notoSansJP = Noto_Sans_JP({
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
    <html lang="ja" className={notoSansJP.className}>
      <body style={{ backgroundColor: '#0f0f23' }}>
        <div className="max-w-md mx-auto pb-20">
          {children}
        </div>
        <NavBar />
      </body>
    </html>
  );
}
