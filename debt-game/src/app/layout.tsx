import type { Metadata, Viewport } from 'next';
import { DotGothic16 } from 'next/font/google';
import NavBar from '@/components/NavBar';
import WorldBackground from '@/components/WorldBackground';
import './globals.css';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const font = DotGothic16({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#5aa8e0',
};

export const metadata: Metadata = {
  title: 'Rich Hunter 〜討伐の先に、豊かな国を〜',
  description: 'お金のモンスターを討伐して、自分の王国を豊かに育てていくRPG家計簿',
  manifest: `${basePath}/manifest.json`,
  appleWebApp: {
    capable: true,
    title: 'Rich Hunter',
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
        <div className="relative z-10 max-w-md mx-auto pb-20 px-3">
          {children}
        </div>
        <NavBar />
      </body>
    </html>
  );
}
