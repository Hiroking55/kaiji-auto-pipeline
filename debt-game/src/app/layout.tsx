import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import NavBar from '@/components/NavBar';
import './globals.css';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const font = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f7f7fa',
};

export const metadata: Metadata = {
  title: 'Rich Hunter 〜討伐の先に、豊かな国を〜',
  description: 'お金のモンスターを討伐して、自分の王国を豊かに育てていくRPG家計簿',
  manifest: `${basePath}/manifest.json`,
  appleWebApp: {
    capable: true,
    title: 'Rich Hunter',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [{ url: `${basePath}/icon-192.png`, sizes: '192x192', type: 'image/png' }],
    apple: [{ url: `${basePath}/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={font.className}>
      <body>
        <div className="max-w-md mx-auto pb-20 px-3">{children}</div>
        <NavBar />
      </body>
    </html>
  );
}
