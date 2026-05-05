import Link from 'next/link';
import type { MicrositeSection } from '@/lib/microsites/schema';
import {
  FlagshipMetaPills,
  FlagshipSectionFlow,
  FlagshipSignalRail,
  FlagshipSurface,
  splitFlagshipMeta,
} from './flagship-primitives';
import {
  FLAGSHIP_ACTION_CLASS,
  FLAGSHIP_BADGE_CLASS,
  FLAGSHIP_COPY_CLASS,
  FLAGSHIP_DISPLAY_CLASS,
  FLAGSHIP_EYEBROW_CLASS,
  FLAGSHIP_FRAME_CLASS,
  FLAGSHIP_LABEL_CLASS,
  FLAGSHIP_THEME_CLASS,
  getAccentClasses,
  getFlagshipThemeStyle,
} from './theme';

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
      className={`${className} ${FLAGSHIP_ACTION_CLASS}`}
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
  const detailPills = splitFlagshipMeta(contextDetail);
  const primaryFocusPoints = focusPoints.slice(0, 4);
  const storyFlowItems = navItems.slice(0, 6).map((item) => ({
    href: `#${item.id}`,
    label: item.label,
  }));

  return (
    <div
      data-shell="flagship"
      style={getFlagshipThemeStyle(accentColor)}
      className={`${FLAGSHIP_THEME_CLASS} relative isolate min-h-screen overflow-hidden bg-slate-950 pb-24 text-white lg:pb-0`}
    >
      <div className="pointer-events-none absolute inset-0 [background:var(--fw-shell-bg)]" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--fw-shell-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--fw-shell-grid) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
        }}
      />
      <div
        className="pointer-events-none absolute left-[-8rem] top-10 h-[30rem] w-[34rem] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--fw-shell-spotlight-strong), transparent 68%)' }}
      />
      <div
        className="pointer-events-none absolute right-[-10rem] top-[-4rem] h-[26rem] w-[26rem] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12), transparent 62%)' }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_72%)]" />

      <header className="sticky top-0 z-50 border-b [border-color:var(--fw-hairline)] bg-slate-950/78 backdrop-blur-2xl">
        <div className={`${FLAGSHIP_FRAME_CLASS} flex flex-wrap items-center justify-between gap-4 py-4`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${accent.border} ${accent.bgBadge} text-xs font-semibold ${accent.textLight}`}>
              YF
            </div>
            <div>
              <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>YardFlow by FreightRoll</div>
              <div className="mt-1 text-sm font-medium text-white/82">{accountName} private field brief</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {statusLabel && (
              <div className={`hidden rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${accent.border} ${accent.textLight} md:block`}>
                {statusLabel}
              </div>
            )}
            <ShellCta
              href={primaryCta.href}
              label={primaryCta.label}
              ctaId="header-booking"
              className={`${accent.bg} ${accent.bgHover} rounded-full px-4 py-2 text-sm font-semibold text-slate-950`}
            />
          </div>
        </div>
      </header>

      <section className="relative z-10 border-b [border-color:var(--fw-hairline)]">
        <div
          data-ms-shell-frame="hero"
          className={`${FLAGSHIP_FRAME_CLASS} grid gap-8 py-[var(--fw-space-hero)] xl:grid-cols-[minmax(0,1.14fr)_minmax(360px,0.86fr)] xl:gap-10 2xl:gap-12`}
        >
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`${FLAGSHIP_BADGE_CLASS} ${accent.border} ${accent.textLight}`}>
                  <span className={`h-2 w-2 rounded-full ${accent.bg}`} />
                  <span>{contextLabel}</span>
                </span>
                {statusLabel && <span className={FLAGSHIP_BADGE_CLASS}>{statusLabel}</span>}
              </div>
              <div className={`${FLAGSHIP_EYEBROW_CLASS} ${accent.textLight}`}>Private field brief</div>
              <h1 className={`max-w-[60rem] text-4xl font-black text-white md:text-6xl xl:text-7xl ${FLAGSHIP_DISPLAY_CLASS}`}>
                {title}
              </h1>
              <p className={`${FLAGSHIP_COPY_CLASS} text-base leading-relaxed text-slate-300 md:text-lg xl:text-[1.35rem] xl:leading-relaxed`}>
                {summary}
              </p>
            </div>

            <FlagshipMetaPills items={detailPills} accent={accent} />

            {framingNarrative && (
              <FlagshipSurface tone="muted" className="max-w-[62rem] rounded-[var(--fw-panel-radius-large)] px-6 py-5 text-[15px] leading-relaxed text-slate-300 sm:px-7">
                {framingNarrative}
              </FlagshipSurface>
            )}

            <div className="flex flex-wrap gap-3">
              <ShellCta
                href={primaryCta.href}
                label={primaryCta.label}
                ctaId="hero-booking"
                className={`${accent.bg} ${accent.bgHover} inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_24px_60px_-32px_var(--fw-accent-glow)]`}
              />
              {navItems[0] && (
                <a
                  href={`#${navItems[0].id}`}
                  className={`inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white ${FLAGSHIP_ACTION_CLASS}`}
                >
                  Open the brief
                </a>
              )}
            </div>

            {variantLinks.length > 0 && (
              <div className="space-y-3">
                <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>Named routes</div>
                <div className="flex flex-wrap gap-2">
                  {variantLinks.map((link) => (
                    <Link
                      key={link.slug}
                      href={link.href}
                      data-ms-variant-link="true"
                      data-ms-variant-slug={link.slug}
                      className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em] ${FLAGSHIP_ACTION_CLASS} ${
                        link.active
                          ? `${accent.border} ${accent.bgBadge} ${accent.textLight}`
                          : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 xl:pl-4">
            <FlagshipSurface tone="hero" className="rounded-[var(--fw-panel-radius-large)] p-7 sm:p-8 xl:p-9">
              <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>Commercial Thesis</div>
              <p className={`mt-5 text-2xl font-semibold leading-tight text-white xl:text-3xl ${FLAGSHIP_DISPLAY_CLASS}`}>
                {thesis}
              </p>
            </FlagshipSurface>

            <FlagshipSignalRail
              label="Operating pressure points"
              title="What this page is built to prove."
              items={primaryFocusPoints}
              accent={accent}
            />
          </div>
        </div>

        <div className={`${FLAGSHIP_FRAME_CLASS} pb-8 lg:pb-10`}>
          <FlagshipSectionFlow items={storyFlowItems} accent={accent} />
        </div>
      </section>

      <div
        data-ms-shell-frame="main"
        className={`relative z-10 ${FLAGSHIP_FRAME_CLASS} py-10 lg:grid lg:gap-12 lg:py-14 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-16 2xl:grid-cols-[minmax(0,1fr)_380px]`}
      >
        <main className="min-w-0">{children}</main>

        <aside className="mt-8 hidden lg:block lg:mt-0">
          <div className="sticky top-24 space-y-4">
            <FlagshipSurface tone="muted" className="rounded-[var(--fw-panel-radius)] p-6">
              <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>Section Flow</div>
              <nav className="mt-4 space-y-2">
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block rounded-2xl border border-transparent px-3 py-2 text-sm leading-tight text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white ${FLAGSHIP_ACTION_CLASS}`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </FlagshipSurface>

            <FlagshipSurface className="rounded-[var(--fw-panel-radius)] p-6">
              <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>Next Step</div>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                If the thesis is directionally right, book the working session. We will map the current yard flow, isolate the dock bottleneck, and quantify site-level ROI.
              </p>
              <FlagshipMetaPills items={detailPills.slice(0, 3)} accent={accent} className="mt-4" />
              <ShellCta
                href={primaryCta.href}
                label={primaryCta.label}
                ctaId="sidebar-booking"
                className={`${accent.bg} ${accent.bgHover} mt-5 inline-flex rounded-full px-4 py-2 text-sm font-semibold text-slate-950`}
              />
            </FlagshipSurface>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur-xl lg:hidden">
        <FlagshipSurface
          data-ms-mobile-cta="true"
          tone="hero"
          className="mx-auto flex max-w-[104rem] items-center justify-between gap-4 rounded-[var(--fw-panel-radius)] px-4 py-3"
        >
          <div>
            <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>Next Step</div>
            <div className="text-sm font-medium text-white">{primaryCta.label}</div>
          </div>
          <ShellCta
            href={primaryCta.href}
            label={primaryCta.label}
            ctaId="mobile-booking"
            className={`${accent.bg} ${accent.bgHover} shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-slate-950`}
          />
        </FlagshipSurface>
      </div>

      <footer className="relative z-10 border-t [border-color:var(--fw-hairline)] pb-24 lg:pb-8">
        <div className={`${FLAGSHIP_FRAME_CLASS} py-6 text-center text-xs text-slate-500`}>
          <p>YardFlow by FreightRoll · casey@freightroll.com</p>
        </div>
      </footer>
    </div>
  );
}
