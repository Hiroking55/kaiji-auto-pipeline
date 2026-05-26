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
        background: 'rgba(8, 11, 22, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-1.5 transition-all duration-200"
            >
              <span
                className="text-xl transition-transform duration-200"
                style={{ transform: isActive ? 'scale(1.15)' : 'scale(1)' }}
              >
                {item.icon}
              </span>
              <span
                className="text-[10px] font-bold tracking-wide"
                style={{
                  color: isActive ? '#e8b849' : '#505878',
                  textShadow: isActive ? '0 0 12px rgba(232,184,73,0.4)' : 'none',
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
