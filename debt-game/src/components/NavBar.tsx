'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', emoji: '🏠' },
  { href: '/record', label: 'Battle', emoji: '⚔️' },
  { href: '/status', label: 'Stats', emoji: '📊' },
  { href: '/setup', label: 'Setup', emoji: '⚙️' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10"
      style={{ backgroundColor: '#1a1a2e' }}
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
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors duration-200"
            >
              <span className="text-xl">{item.emoji}</span>
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? '#ffd700' : '#8888aa' }}
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
