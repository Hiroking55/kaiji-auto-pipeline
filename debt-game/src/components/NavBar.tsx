'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '拠点', icon: '🏠' },
  { href: '/record', label: '出発', icon: '⚔️' },
  { href: '/status', label: 'カード', icon: '📋' },
  { href: '/setup', label: '設定', icon: '⚙️' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: '#1e1a14',
        borderTop: '2px solid #4a3c28',
      }}
    >
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
            >
              <span className="text-lg">{item.icon}</span>
              <span
                className="text-[10px] font-bold"
                style={{
                  color: isActive ? '#ffc830' : '#706050',
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
