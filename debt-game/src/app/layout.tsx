import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import NavBar from '@/components/NavBar';
import WorldBackground from '@/components/WorldBackground';
import './globals.css';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const font = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#100e0a',
};

export const metadata: Metadata = {
  title: 'Debt Hunter - 借金討伐クエスト',
  description: '借金をモンスターに見立てて、クエストをクリアしながら返済していくゲーム',
  manifest: `${basePath}/manifest.json`,
  appleWebApp: {
    capable: true,
    title: 'Debt Hunter',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: `${basePath}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${basePath}/icon-512.png`, sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: `${basePath}/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' },
    ],
  },
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
