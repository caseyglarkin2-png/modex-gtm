'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Users,
  Waves,
  FileText,
  Smartphone,
  ListTodo,
  Route,
  QrCode,
  Search,
  Lightbulb,
  Activity,
  CalendarCheck,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Accounts', icon: Building2 },
  { href: '/personas', label: 'Personas', icon: Users },
  { href: '/waves', label: 'Outreach Waves', icon: Waves },
  { href: '/briefs', label: 'Meeting Briefs', icon: FileText },
  { href: '/capture', label: 'Mobile Capture', icon: Smartphone },
  { href: '/queue', label: 'Jake Queue', icon: ListTodo },
  { href: '/audit-routes', label: 'Audit Routes', icon: Route },
  { href: '/qr', label: 'QR Assets', icon: QrCode },
  { href: '/search', label: 'Search Strings', icon: Search },
  { href: '/intel', label: 'Actionable Intel', icon: Lightbulb },
  { href: '/activities', label: 'Activities', icon: Activity },
  { href: '/meetings', label: 'Meetings', icon: CalendarCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[var(--border)] bg-[var(--background)]">
      <div className="flex h-14 items-center border-b border-[var(--border)] px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary)] text-white text-sm font-bold">
            M
          </div>
          <span>Modex RevOps</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-[var(--accent)] text-[var(--primary)] font-medium'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--muted-foreground)]">
        YardFlow / FreightRoll &middot; MODEX 2026
      </div>
    </aside>
  );
}
