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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/theme-toggle';
import { useSidebar } from '@/components/sidebar-context';

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

/** Lookup current page label from pathname */
function getPageLabel(pathname: string): string {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) {
        return item.label;
      }
    }
  }
  return 'Modex RevOps';
}

/* ---------- Drawer nav (mobile + expanded sidebar) ---------- */
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

/* ---------- Collapsed icon-rail nav (desktop only) ---------- */
function CollapsedNav({ pathname }: { pathname: string }) {
  return (
    <>
      <div className="flex h-14 items-center justify-center border-b border-[var(--border)]">
        <Link href="/">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary)] text-white text-sm font-bold">
            M
          </div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <TooltipProvider delayDuration={0}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              <div className="mb-1 h-4" /> {/* spacer matching section header */}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              'flex items-center justify-center rounded-md p-2 transition-colors',
                              isActive
                                ? 'bg-[var(--accent)] text-[var(--primary)]'
                                : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                            )}
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </TooltipProvider>
      </nav>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { collapsed, toggle } = useSidebar();
  const pageLabel = getPageLabel(pathname);

  return (
    <>
      {/* Mobile hamburger header */}
      <div className="fixed left-0 top-0 z-50 flex h-14 w-full items-center border-b border-[var(--border)] bg-[var(--background)] px-4 md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/" className="ml-2 flex items-center gap-2 font-semibold text-lg">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--primary)] text-white text-xs font-bold">
            M
          </div>
          <span className="truncate">{pageLabel}</span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            onClick={() => {
              // Trigger the command palette (Ctrl+K)
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
            }}
          >
            <Search className="h-4 w-4" />
          </Button>
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
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[var(--border)] bg-[var(--background)] transition-[width] duration-200 ease-in-out md:flex',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {collapsed ? (
          <CollapsedNav pathname={pathname} />
        ) : (
          <NavContent pathname={pathname} />
        )}

        {/* Collapse toggle button */}
        <div className={cn('border-t border-[var(--border)] py-2', collapsed ? 'px-2' : 'px-3')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            className={cn(
              'flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              collapsed ? 'w-full justify-center' : 'w-full'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
