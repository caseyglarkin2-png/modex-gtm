'use client';

import { useSidebar } from '@/components/sidebar-context';

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen pt-14 md:pt-0 transition-[margin-left] duration-200 ease-in-out"
      style={{ marginLeft: undefined }}
    >
      {/* On mobile: no left margin (pt-14 for fixed header). On md+: dynamic margin matching sidebar width. */}
      <style>{`
        @media (min-width: 768px) {
          main { margin-left: ${collapsed ? '4rem' : '16rem'}; }
        }
      `}</style>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {children}
      </div>
    </main>
  );
}
