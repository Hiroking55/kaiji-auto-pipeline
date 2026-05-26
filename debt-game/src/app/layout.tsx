import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import NavBar from '@/components/NavBar';
import WorldBackground from '@/components/WorldBackground';
import './globals.css';

const font = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
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
    <html lang="ja" className={font.className}>
      <body>
        <WorldBackground />
        <div className="relative z-10 max-w-md mx-auto pb-24 px-4">
          {children}
        </div>
        <NavBar />
      </body>
    </html>
  );
}
