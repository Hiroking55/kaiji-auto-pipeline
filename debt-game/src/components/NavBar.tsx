'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'ホーム', icon: '🏠' },
  { href: '/record', label: 'たたかう', icon: '⚔️' },
  { href: '/status', label: 'つよさ', icon: '📊' },
  { href: '/setup', label: 'せってい', icon: '⚙️' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: '#1a1040',
        borderTop: '3px solid #ffffff',
        boxShadow: '0 -3px 0 #6060a0',
      }}
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2 pb-[env(safe-area-inset-bottom)]">
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
                className="text-[10px]"
                style={{
                  color: isActive ? '#f8d830' : '#9090c0',
                  textShadow: isActive ? '0 0 6px #f8d830' : 'none',
                }}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="animate-blink" style={{ color: '#f8d830', fontSize: '6px', marginTop: '-2px' }}>
                  ▶
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
