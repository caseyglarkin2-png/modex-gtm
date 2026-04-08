import Link from 'next/link';
import type { MicrositeSection } from '@/lib/microsites/schema';
import {
  FLAGSHIP_ACTION_CLASS,
  FLAGSHIP_COPY_CLASS,
  FLAGSHIP_DISPLAY_CLASS,
  FLAGSHIP_EYEBROW_CLASS,
  FLAGSHIP_FRAME_CLASS,
  FLAGSHIP_LABEL_CLASS,
  FLAGSHIP_PANEL_CLASS,
  FLAGSHIP_PANEL_MUTED_CLASS,
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

  return (
    <div
      data-shell="flagship"
      style={getFlagshipThemeStyle(accentColor)}
      className={`${FLAGSHIP_THEME_CLASS} relative min-h-screen overflow-hidden bg-slate-950 pb-24 text-white lg:pb-0`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_40%)]" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 14% 18%, var(--fw-accent-glow), transparent 34%), radial-gradient(circle at 86% 0%, rgba(255,255,255,0.08), transparent 24%)',
        }}
      />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/82 backdrop-blur-xl">
        <div className={`${FLAGSHIP_FRAME_CLASS} flex items-center justify-between gap-4 py-4`}>
          <div>
            <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>YardFlow by FreightRoll</div>
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
              className={`${accent.bg} ${accent.bgHover} rounded-full px-4 py-2 text-sm font-semibold text-slate-950`}
            />
          </div>
        </div>
      </header>

      <section className="relative z-10 border-b border-white/10">
        <div
          data-ms-shell-frame="hero"
          className={`${FLAGSHIP_FRAME_CLASS} grid gap-8 py-12 lg:py-16 xl:grid-cols-[minmax(0,1.18fr)_minmax(370px,0.82fr)] xl:gap-12`}
        >
          <div>
            <div className={`${FLAGSHIP_EYEBROW_CLASS} ${accent.textLight}`}>{contextLabel}</div>
            <h1 className={`mt-5 max-w-[60rem] text-4xl font-black text-white md:text-6xl xl:text-7xl ${FLAGSHIP_DISPLAY_CLASS}`}>
              {title}
            </h1>
            <p className={`mt-5 ${FLAGSHIP_COPY_CLASS} text-base leading-relaxed text-slate-300 md:text-lg xl:text-xl`}>{summary}</p>
            {contextDetail && <p className="mt-4 text-sm text-slate-400">{contextDetail}</p>}
            {framingNarrative && (
              <div className={`mt-6 max-w-[58rem] rounded-[var(--fw-panel-radius)] px-6 py-5 text-[15px] leading-relaxed text-slate-300 ${FLAGSHIP_PANEL_MUTED_CLASS}`}>
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
                    className={`rounded-full border px-3 py-1 text-xs ${FLAGSHIP_ACTION_CLASS} ${
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
            className={`rounded-[var(--fw-panel-radius-large)] p-8 backdrop-blur-sm xl:p-9 ${FLAGSHIP_PANEL_CLASS}`}
            style={{ boxShadow: 'var(--fw-panel-shadow-strong), 0 0 0 1px var(--fw-accent-glow)' }}
          >
            <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>Commercial Thesis</div>
            <p className={`mt-5 text-2xl font-semibold leading-tight text-white xl:text-3xl ${FLAGSHIP_DISPLAY_CLASS}`}>{thesis}</p>
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

      <div
        data-ms-shell-frame="main"
        className={`relative z-10 ${FLAGSHIP_FRAME_CLASS} py-8 lg:grid lg:gap-10 lg:py-12 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-14`}
      >
        <main className="min-w-0">{children}</main>

        <aside className="mt-8 hidden lg:block lg:mt-0">
          <div className="sticky top-24 space-y-4">
            <div className={`rounded-[var(--fw-panel-radius)] p-6 backdrop-blur-sm ${FLAGSHIP_PANEL_MUTED_CLASS}`}>
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
            </div>

            <div className={`rounded-[var(--fw-panel-radius)] p-6 backdrop-blur-sm ${FLAGSHIP_PANEL_CLASS}`}>
              <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>Next Step</div>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                If the thesis is directionally right, book the working session. We will map the current yard flow, isolate the dock bottleneck, and quantify site-level ROI.
              </p>
              <ShellCta
                href={primaryCta.href}
                label={primaryCta.label}
                ctaId="sidebar-booking"
                className={`${accent.bg} ${accent.bgHover} mt-5 inline-flex rounded-full px-4 py-2 text-sm font-semibold text-slate-950`}
              />
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur-xl lg:hidden">
        <div
          data-ms-mobile-cta="true"
          className={`mx-auto flex max-w-[96rem] items-center justify-between gap-4 rounded-[var(--fw-panel-radius)] px-4 py-3 ${FLAGSHIP_PANEL_CLASS}`}
        >
          <div>
            <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>Next Step</div>
            <div className="text-sm font-medium text-white">Book the working session</div>
          </div>
          <ShellCta
            href={primaryCta.href}
            label={primaryCta.label}
            ctaId="mobile-booking"
            className={`${accent.bg} ${accent.bgHover} shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-slate-950`}
          />
        </div>
      </div>

      <footer className="relative z-10 border-t border-white/10 pb-24 lg:pb-8">
        <div className={`${FLAGSHIP_FRAME_CLASS} py-6 text-center text-xs text-slate-500`}>
          <p>YardFlow by FreightRoll · casey@freightroll.com</p>
        </div>
      </footer>
    </div>
  );
}