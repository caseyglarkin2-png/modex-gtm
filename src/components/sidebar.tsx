'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { canonicalNavModules, getPageLabelForPath, isActiveNavModule } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationBell } from '@/components/notification-bell';
import { useSidebar } from '@/components/sidebar-context';

/* ---------- Drawer nav (mobile + expanded sidebar) ---------- */
function NavContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg" onClick={onNavigate}>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary)] text-white text-sm font-bold">
            Y
          </div>
          <span>YardFlow by FreightRoll</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-3 px-2">
          <Link
            href="/capture"
            onClick={onNavigate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border bg-[var(--accent)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <Smartphone className="h-3.5 w-3.5" />
            Quick Capture
          </Link>
        </div>
        <div className="mb-4">
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            RevOps OS
          </p>
          <ul className="space-y-0.5">
            {canonicalNavModules.map((item) => {
              const isActive = isActiveNavModule(pathname, item);
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
      </nav>
      <div className="border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--muted-foreground)]">
        YardFlow by FreightRoll &middot; RevOps OS
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
            Y
          </div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <TooltipProvider delayDuration={0}>
          <div className="mb-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/capture"
                  className="flex items-center justify-center rounded-md border bg-[var(--accent)] p-2 text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                >
                  <Smartphone className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                Quick Capture
              </TooltipContent>
            </Tooltip>
          </div>
          <ul className="space-y-0.5">
            {canonicalNavModules.map((item) => {
              const isActive = isActiveNavModule(pathname, item);
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
        </TooltipProvider>
      </nav>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { collapsed, toggle } = useSidebar();
  const pageLabel = getPageLabelForPath(pathname);

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
          <NotificationBell />
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
