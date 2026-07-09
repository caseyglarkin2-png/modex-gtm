import type { ReactNode } from 'react';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import { DemoChrome } from '@/components/demo/demo-chrome';

// Page Protocol (2026-07-09): the /demo subtree is served under yardflow.ai,
// whose native pages render Inter. This app's root layout loads Mona Sans,
// which made the proxied pages read as a different site. Load Inter here and
// apply it to the chrome wrapper so the whole subtree matches the canon.
const inter = Inter({ subsets: ['latin'], display: 'swap' });

/**
 * Demo subtree layout — loads HubSpot native tracking (portal 3819073) across
 * EVERY /demo route: the index gallery, /demo/compare, and the per-account
 * microsites. The Flow-State- shell injects this script on the root + /for
 * surfaces, but the proxied /demo subtree is served by this app, so the loader
 * lives here. Additive to the custom server-side intent pipeline
 * (microsite-tracker -> hubspot-intent Note + Slack ping): the native loader
 * powers HubSpot's own page-view analytics, de-anonymizes cookied known
 * contacts, and enables native "visited page" workflow triggers.
 *
 * DemoChrome (2026-07-09) wraps the subtree in the YardFlow site shell (slim
 * header + footer, root-relative links) so proxied /demo pages are no longer
 * navigational islands under yardflow.ai. Per-page content keeps full control
 * of its own body; the chrome only frames it.
 */
export default function DemoSubtreeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script
        id="hs-script-loader"
        strategy="afterInteractive"
        src="//js.hs-scripts.com/3819073.js"
      />
      <div className={inter.className}>
        <DemoChrome>{children}</DemoChrome>
      </div>
    </>
  );
}
