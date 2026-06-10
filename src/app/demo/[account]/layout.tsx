import type { ReactNode } from 'react';
import Script from 'next/script';

/**
 * Demo route layout — strips the app shell. The demo is a public artifact;
 * it must not leak the authenticated GTM UI to prospects.
 *
 * HubSpot native tracking (portal 3819073) is loaded here so the per-account
 * demo microsites feed HubSpot's own website analytics and de-anonymize
 * cookied known contacts. This is additive to the custom server-side intent
 * pipeline (microsite-tracker -> hubspot-intent Note + Slack ping): the native
 * loader catches the cookied-but-unidentified visitor case and powers
 * HubSpot-native "visited page" workflow triggers. The Flow-State- shell already
 * loads this script on the root + /for surfaces; the proxied /demo subtree did
 * not, which left the highest-intent surface dark in HubSpot's native analytics.
 */
export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white antialiased">
      <Script
        id="hs-script-loader"
        strategy="afterInteractive"
        src="//js.hs-scripts.com/3819073.js"
      />
      {children}
    </div>
  );
}
