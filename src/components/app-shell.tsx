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
        <Sidebar />
        <CommandSearch />
        <MainContent>{children}</MainContent>
        <KeyboardShortcuts />
        <GlobalComposeButton />
      </SidebarProvider>
    </AuthProvider>
  );
}