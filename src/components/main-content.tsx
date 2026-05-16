'use client';

import type { CSSProperties } from 'react';
import { useSidebar } from '@/components/sidebar-context';

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  // The sidebar width rides on a CSS variable scoped to this element —
  // no global `main` selector, no injected <style> tag. On mobile there
  // is no left margin (fixed header handled by pt-14); md+ tracks the var.
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen pt-14 transition-[margin-left] duration-200 ease-in-out md:pt-0 md:ml-[var(--sidebar-width)]"
      style={{ '--sidebar-width': collapsed ? '4rem' : '16rem' } as CSSProperties}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {children}
      </div>
    </main>
  );
}
