'use client';

import { useState } from 'react';
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
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';

const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/accounts', label: 'Accounts', icon: Building2 },
      { href: '/personas', label: 'Personas', icon: Users },
    ],
  },
  {
    label: 'Outreach',
    items: [
      { href: '/waves', label: 'Outreach Waves', icon: Waves },
      { href: '/briefs', label: 'Meeting Briefs', icon: FileText },
      { href: '/search', label: 'Search Strings', icon: Search },
      { href: '/intel', label: 'Actionable Intel', icon: Lightbulb },
    ],
  },
  {
    label: 'Field',
    items: [
      { href: '/capture', label: 'Mobile Capture', icon: Smartphone },
      { href: '/queue', label: 'Jake Queue', icon: ListTodo },
      { href: '/audit-routes', label: 'Audit Routes', icon: Route },
      { href: '/qr', label: 'QR Assets', icon: QrCode },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { href: '/activities', label: 'Activities', icon: Activity },
      { href: '/meetings', label: 'Meetings', icon: CalendarCheck },
    ],
  },
];

function NavContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg" onClick={onNavigate}>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary)] text-white text-sm font-bold">
            M
          </div>
          <span>Modex RevOps</span>
        </Link>
        <ThemeToggle />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
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
          </div>
        ))}
      </nav>
      <div className="border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--muted-foreground)]">
        YardFlow / FreightRoll &middot; MODEX 2026
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <div className="fixed left-0 top-0 z-50 flex h-14 w-full items-center border-b border-[var(--border)] bg-[var(--background)] px-4 md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/" className="ml-2 flex items-center gap-2 font-semibold text-lg">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--primary)] text-white text-xs font-bold">
            M
          </div>
          <span>Modex RevOps</span>
        </Link>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <NavContent pathname={pathname} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[var(--border)] bg-[var(--background)] md:flex">
        <NavContent pathname={pathname} />
      </aside>
    </>
  );
}
