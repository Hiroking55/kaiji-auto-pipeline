'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: '王国', icon: '🏰' },
  { href: '/record', label: '討伐', icon: '⚔️' },
  { href: '/bestiary', label: '財産', icon: '📖' },
  { href: '/setup', label: '設定', icon: '⚙️' },
];

export default function NavBar() {
  const p = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t" style={{ borderColor: '#e5e7eb' }}>
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
        {items.map(i => {
          const active = i.href === '/' ? p === '/' : p.startsWith(i.href);
          return (
            <Link key={i.href} href={i.href} className="flex flex-col items-center gap-0.5 flex-1 py-1">
              <span className="text-xl">{i.icon}</span>
              <span className="text-[10px] font-semibold" style={{ color: active ? '#d4a020' : '#9ca3af' }}>{i.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
