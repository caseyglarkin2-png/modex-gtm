import type { ReactNode } from 'react';
import Script from 'next/script';
import { Archivo, Inter } from 'next/font/google';
import { DemoChrome } from '@/components/demo/demo-chrome';

// Page Protocol (2026-07-09): the /demo subtree is served under yardflow.ai,
// whose native pages render Inter body + Archivo display (font verdict, see
// Flow-State- DESIGN-SYSTEM §3). This app's root layout loads Mona Sans,
// which made the proxied pages read as a different site. Load the canon
// pair here and scope them to the subtree wrapper.
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter-demo' });
const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  weight: ['700', '800', '900'],
  variable: '--font-display',
});

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
      <div className={`${inter.className} ${inter.variable} ${archivo.variable} yf-demo-type`}>
        {/* Headings speak the display face, mirroring the Flow-State- base
            rule (globals.css). Same -0.02em floor: Archivo 900 welds tighter.
            NOTE: 'inherit' is invalid inside a font-family LIST — the whole
            declaration gets dropped (shipped once; the assertion crawl caught
            it). The --font-sans token override catches elements using the
            Tailwind font-sans utility, which otherwise resolves to modex's
            Mona Sans. */}
        <style>{`.yf-demo-type{--font-sans:var(--font-inter-demo),system-ui,sans-serif}
.yf-demo-type h1,.yf-demo-type h2,.yf-demo-type h3{font-family:var(--font-display),var(--font-inter-demo),system-ui,sans-serif;letter-spacing:-0.02em}`}</style>
        <DemoChrome>{children}</DemoChrome>
      </div>
    </>
  );
}
