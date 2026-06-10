import type { ReactNode } from 'react';

/**
 * Demo route layout — strips the app shell. The demo is a public artifact;
 * it must not leak the authenticated GTM UI to prospects.
 *
 * HubSpot native tracking is loaded one level up in src/app/demo/layout.tsx so
 * it covers every /demo route (index, /compare, per-account), not just this one.
 */
export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white antialiased">
      {children}
    </div>
  );
}
