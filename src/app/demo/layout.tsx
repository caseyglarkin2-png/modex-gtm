import type { ReactNode } from 'react';
import Script from 'next/script';

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
 * This is a pass-through layout (no wrapper markup) so per-route layouts and
 * pages keep full control of their own chrome.
 */
export default function DemoSubtreeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script
        id="hs-script-loader"
        strategy="afterInteractive"
        src="//js.hs-scripts.com/3819073.js"
      />
      {children}
    </>
  );
}
