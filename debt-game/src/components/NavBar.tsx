'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '王国', icon: '🏰' },
  { href: '/record', label: '討伐', icon: '⚔️' },
  { href: '/bestiary', label: '財産', icon: '📖' },
  { href: '/setup', label: '設定', icon: '⚙️' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 rpg-panel" style={{ borderRadius: '0', borderLeft: 0, borderRight: 0, borderBottom: 0 }}>
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1">
              <span className="text-lg" style={{ transform: isActive ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.15s' }}>
                {item.icon}
              </span>
              <span className="text-[10px] font-bold" style={{ color: isActive ? '#2b3a67' : '#8a96b0' }}>
                {item.label}
              </span>
              {isActive && <span style={{ color: '#ffd23f', fontSize: 6 }}>●</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
