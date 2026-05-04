'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/components/auth-provider';
import { CommandSearch } from '@/components/command-search';
import { GlobalComposeButton } from '@/components/global-compose-button';
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts';
import { MainContent } from '@/components/main-content';
import { Sidebar } from '@/components/sidebar';
import { SidebarProvider } from '@/components/sidebar-context';

const PUBLIC_PATHS = new Set(['/login', '/unsubscribe']);
const PUBLIC_PATH_PREFIXES = ['/for', '/proposal'];

export function isPublicAppPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (PUBLIC_PATHS.has(pathname)) return true;

  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isPublicAppPath(pathname)) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <SidebarProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:ring-2 focus:ring-primary"
        >
          Skip to main content
        </a>
        <Sidebar />
        <CommandSearch />
        <MainContent>{children}</MainContent>
        <KeyboardShortcuts />
        <GlobalComposeButton />
      </SidebarProvider>
    </AuthProvider>
  );
}
