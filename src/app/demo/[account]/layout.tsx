import type { ReactNode } from 'react';

/**
 * Demo route layout — strips the app shell. The demo is a public artifact;
 * it must not leak the authenticated GTM UI to prospects.
 */
export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 antialiased">
      {children}
    </div>
  );
}
