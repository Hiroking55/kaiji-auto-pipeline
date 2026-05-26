import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import NavBar from '@/components/NavBar';
import './globals.css';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '借金キラー - 借金討伐クエスト',
  description: '借金をモンスターに見立てて、クエストをクリアしながら返済していくゲーム',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={notoSansJP.className}>
      <body style={{ backgroundColor: '#12100e' }}>
        <div className="max-w-md mx-auto pb-20">
          {children}
        </div>
        <NavBar />
      </body>
    </html>
  );
}
