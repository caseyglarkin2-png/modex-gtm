import type { ReactNode } from 'react';
import Script from 'next/script';
import { DemoChrome } from '@/components/demo/demo-chrome';

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
      <DemoChrome>{children}</DemoChrome>
    </>
  );
}
