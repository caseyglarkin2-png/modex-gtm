import Link from 'next/link';

/**
 * DemoChrome — the YardFlow site shell for the proxied /demo subtree.
 *
 * The /demo gallery, /demo/<account> microsites, and /demo/compare are served
 * by this app but shown under yardflow.ai via the Flow-State- rewrite. That app
 * renders the global Header/Footer; this subtree did not, so every prospect who
 * landed on a shared demo link was stranded with no logo, no nav, no way back
 * (2026-07-09: Casey hit exactly this). This gives the subtree a slim shell in
 * the YardFlow palette (void/neon) with root-relative links: under yardflow.ai
 * they resolve to the native Flow-State- routes (/product, /roi, the live sims),
 * so the demo pages rejoin the site instead of being islands.
 *
 * Self-contained: explicit hex colors, no dependency on this app's theme tokens.
 * Sticky (not fixed) so it takes layout space and never overlaps page content.
 */

const NAV = [
  { href: '/product', label: 'Product' },
  { href: '/solutions', label: 'Solutions' },
  { href: '/roi', label: 'ROI' },
  { href: '/demo/yard-explorer', label: 'Live sim' },
  { href: '/order-of-operations', label: 'Research' },
];

const NEON = '#00B4FF';

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 no-underline" aria-label="YardFlow home">
      <svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke={NEON} strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <path d="M4 24 C8 24, 10 21, 14 17" />
        <path d="M14 30 C14 24, 14 21, 14 17" />
        <path d="M14 17 C18 13, 22 13, 28 18" />
        <circle cx="4" cy="24" r="2.5" fill={NEON} />
        <circle cx="14" cy="30" r="2.5" fill={NEON} />
        <circle cx="28" cy="18" r="2.5" fill={NEON} />
        <circle cx="14" cy="17" r="3" fill={NEON} />
      </svg>
      <span className="text-[17px] font-extrabold tracking-tight">
        <span className="text-white">Yard</span><span style={{ color: NEON }}>Flow</span>
      </span>
    </Link>
  );
}

export function DemoChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#05070a] text-white">
      <header className="sticky top-0 z-50 border-b border-[#00B4FF]/12 bg-[#05070a]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
          <Wordmark />
          <nav aria-label="Primary" className="ml-auto hidden items-center gap-6 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="font-mono text-[12px] uppercase tracking-[0.14em] text-white/70 no-underline transition-colors hover:text-[#00B4FF]"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/contact"
            className="ml-auto rounded-lg bg-[#00B4FF] px-4 py-2 text-[13px] font-bold text-[#05070a] no-underline transition-colors hover:bg-white md:ml-0"
          >
            Book a call
          </Link>
        </div>
        {/* Mobile nav row: the desktop links are hidden < md, so give phones a
            scrollable strip instead of stranding them with only the logo + CTA. */}
        <nav aria-label="Primary mobile" className="flex gap-5 overflow-x-auto border-t border-white/5 px-5 py-2 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.12em] text-white/70 no-underline"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-white/10 bg-[#05070a] px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark />
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/55">
            <Link href="/product" className="no-underline hover:text-[#00B4FF]">Product</Link>
            <Link href="/solutions" className="no-underline hover:text-[#00B4FF]">Solutions</Link>
            <Link href="/roi" className="no-underline hover:text-[#00B4FF]">ROI</Link>
            <Link href="/demo/yard-explorer" className="no-underline hover:text-[#00B4FF]">Live sim</Link>
            <Link href="/order-of-operations" className="no-underline hover:text-[#00B4FF]">Research</Link>
            <Link href="/security" className="no-underline hover:text-[#00B4FF]">Security</Link>
            <Link href="/contact" className="no-underline hover:text-[#00B4FF]">Contact</Link>
          </nav>
        </div>
        <p className="mx-auto mt-5 max-w-6xl text-[11px] text-white/35">
          YardFlow by FreightRoll. The Yard Network System. These templates model public
          satellite imagery and audited facility data; every number carries its source.
        </p>
      </footer>
    </div>
  );
}

export default DemoChrome;
