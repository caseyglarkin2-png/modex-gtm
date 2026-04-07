import Link from 'next/link';
import type { MicrositeSection } from '@/lib/microsites/schema';
import { getAccentClasses } from './theme';

interface MicrositeShellNavItem {
  id: string;
  label: string;
}

interface MicrositeShellVariantLink {
  href: string;
  label: string;
  slug: string;
  active?: boolean;
}

interface MicrositeShellProps {
  accountName: string;
  accentColor?: string;
  contextLabel: string;
  contextDetail?: string;
  framingNarrative?: string;
  title: string;
  summary: string;
  thesis: string;
  focusPoints: string[];
  navItems: MicrositeShellNavItem[];
  primaryCta: {
    href: string;
    label: string;
  };
  statusLabel?: string;
  variantLinks?: MicrositeShellVariantLink[];
  children: React.ReactNode;
}

function getSectionLabel(section: MicrositeSection) {
  switch (section.type) {
    case 'hero':
      return section.headline;
    case 'testimonial':
      return section.sectionLabel ?? 'Operator Proof';
    case 'cta':
      return section.sectionLabel ?? section.cta.headline;
    default:
      return section.sectionLabel ?? section.headline;
  }
}

export function getMicrositeSectionNavItems(sections: MicrositeSection[]): MicrositeShellNavItem[] {
  return sections.map((section, index) => ({
    id: section.sectionId ?? `${section.type}-${index + 1}`,
    label: getSectionLabel(section),
  }));
}

function ShellCta({
  href,
  label,
  ctaId,
  className,
}: {
  href: string;
  label: string;
  ctaId: string;
  className: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-ms-cta-id={ctaId}
      className={className}
    >
      {label}
    </a>
  );
}

export function MicrositeShell({
  accountName,
  accentColor,
  contextLabel,
  contextDetail,
  framingNarrative,
  title,
  summary,
  thesis,
  focusPoints,
  navItems,
  primaryCta,
  statusLabel,
  variantLinks = [],
  children,
}: MicrositeShellProps) {
  const accent = getAccentClasses(accentColor);
  const glow = accentColor ? `${accentColor}24` : 'rgba(6, 182, 212, 0.18)';

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 pb-24 text-white lg:pb-0">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_40%)]" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 14% 18%, ${glow}, transparent 34%), radial-gradient(circle at 86% 0%, rgba(255,255,255,0.08), transparent 24%)`,
        }}
      />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500">YardFlow by FreightRoll</div>
            <div className="mt-1 text-sm font-medium text-white/82">{accountName} private field brief</div>
          </div>
          <div className="flex items-center gap-3">
            {statusLabel && (
              <div className={`hidden rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${accent.border} ${accent.textLight} md:block`}>
                {statusLabel}
              </div>
            )}
            <ShellCta
              href={primaryCta.href}
              label={primaryCta.label}
              ctaId="header-booking"
              className={`${accent.bg} ${accent.bgHover} rounded-full px-4 py-2 text-sm font-semibold text-slate-950 transition-colors`}
            />
          </div>
        </div>
      </header>

      <section className="relative z-10 border-b border-white/10">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:py-14">
          <div>
            <div className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${accent.textLight}`}>{contextLabel}</div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.04em] text-white md:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg">{summary}</p>
            {contextDetail && <p className="mt-4 text-sm text-slate-400">{contextDetail}</p>}
            {framingNarrative && (
              <div className={`mt-6 max-w-3xl rounded-3xl border bg-slate-900/45 px-5 py-4 text-sm leading-relaxed text-slate-300 ${accent.border}`}>
                {framingNarrative}
              </div>
            )}
            {variantLinks.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {variantLinks.map((link) => (
                  <Link
                    key={link.slug}
                    href={link.href}
                    data-ms-variant-link="true"
                    data-ms-variant-slug={link.slug}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      link.active
                        ? `${accent.border} ${accent.bgBadge} ${accent.textLight}`
                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div
            className="rounded-[28px] border border-white/10 bg-slate-900/70 p-7 shadow-[0_24px_90px_-48px_rgba(15,23,42,0.95)] backdrop-blur-sm"
            style={{ boxShadow: `0 24px 90px -48px ${glow}` }}
          >
            <div className="text-[10px] uppercase tracking-[0.26em] text-slate-500">Commercial Thesis</div>
            <p className="mt-5 text-2xl font-semibold leading-tight text-white">{thesis}</p>
            <div className="mt-6 space-y-3">
              {focusPoints.slice(0, 4).map((point) => (
                <div key={point} className="flex items-start gap-3 text-sm leading-relaxed text-slate-300">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${accent.bg}`} />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10 lg:py-10">
        <main className="min-w-0">{children}</main>

        <aside className="mt-8 hidden lg:block lg:mt-0">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-[24px] border border-white/10 bg-slate-900/55 p-5 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-[0.26em] text-slate-500">Section Flow</div>
              <nav className="mt-4 space-y-2">
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block rounded-2xl border border-transparent px-3 py-2 text-sm leading-tight text-slate-300 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-5 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-[0.26em] text-slate-500">Next Step</div>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                If the thesis is directionally right, book the working session. We will map the current yard flow, isolate the dock bottleneck, and quantify site-level ROI.
              </p>
              <ShellCta
                href={primaryCta.href}
                label={primaryCta.label}
                ctaId="sidebar-booking"
                className={`${accent.bg} ${accent.bgHover} mt-5 inline-flex rounded-full px-4 py-2 text-sm font-semibold text-slate-950 transition-colors`}
              />
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/94 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Next Step</div>
            <div className="text-sm font-medium text-white">Book the working session</div>
          </div>
          <ShellCta
            href={primaryCta.href}
            label={primaryCta.label}
            ctaId="mobile-booking"
            className={`${accent.bg} ${accent.bgHover} shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-slate-950 transition-colors`}
          />
        </div>
      </div>

      <footer className="relative z-10 border-t border-white/10 pb-24 lg:pb-8">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-xs text-slate-500">
          <p>YardFlow by FreightRoll · casey@freightroll.com</p>
        </div>
      </footer>
    </div>
  );
}