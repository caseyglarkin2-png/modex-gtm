import type { MicrositeProposalBrief } from '@/lib/microsites/proposal';
import {
  FlagshipMetaPills,
  FlagshipSignalRail,
  FlagshipSurface,
} from './flagship-primitives';
import {
  FLAGSHIP_ACTION_CLASS,
  FLAGSHIP_BADGE_CLASS,
  FLAGSHIP_DISPLAY_CLASS,
  FLAGSHIP_FRAME_CLASS,
  FLAGSHIP_LABEL_CLASS,
  FLAGSHIP_SECTION_TITLE_CLASS,
  FLAGSHIP_THEME_CLASS,
  getAccentClasses,
  getFlagshipThemeStyle,
} from './theme';

function ActionLink({
  href,
  label,
  ctaId,
  primary = false,
  download,
}: {
  href: string;
  label: string;
  ctaId: string;
  primary?: boolean;
  download?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-ms-cta-id={ctaId}
      download={download}
      className={primary
        ? `inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-100 ${FLAGSHIP_ACTION_CLASS}`
        : `inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 ${FLAGSHIP_ACTION_CLASS}`}
    >
      {label}
    </a>
  );
}

export function ProposalBrief({ proposal }: { proposal: MicrositeProposalBrief }) {
  const accent = getAccentClasses(proposal.accentColor);
  const metaPills = [
    `Priority ${proposal.band} ${proposal.priorityScore}`,
    proposal.vertical,
    'Live ROI model',
    proposal.network.facilityCount ? `${proposal.network.facilityCount} disclosed sites` : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <div
      style={getFlagshipThemeStyle(proposal.accentColor)}
      className={`${FLAGSHIP_THEME_CLASS} relative isolate min-h-screen overflow-hidden bg-stone-950 text-white`}
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

      <header className="sticky top-0 z-50 border-b [border-color:var(--fw-hairline)] bg-stone-950/82 backdrop-blur-2xl">
        <div className={`${FLAGSHIP_FRAME_CLASS} flex flex-wrap items-center justify-between gap-3 py-4`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${accent.border} ${accent.bgBadge} text-xs font-semibold ${accent.textLight}`}>
              YF
            </div>
            <div>
              <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>YardFlow by FreightRoll</div>
              <div className="mt-1 text-sm font-medium text-white/85">{proposal.accountName} board-ready proposal</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={`hidden rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${accent.border} ${accent.textLight} md:block`}>
              {proposal.band}-Band | {proposal.tier}
            </div>
            <ActionLink href={proposal.exportJsonPath} label="Export JSON" ctaId="proposal-export-json" download />
            <ActionLink href={proposal.exportHtmlPath} label="Export HTML" ctaId="proposal-export-html" download />
            {proposal.bookingLink && (
              <ActionLink href={proposal.bookingLink} label={proposal.cta.buttonLabel} ctaId="proposal-booking" primary />
            )}
          </div>
        </div>
      </header>

      <main data-ms-proposal-frame="main" className={`relative z-10 ${FLAGSHIP_FRAME_CLASS} space-y-8 py-10 lg:py-14`}>
        <FlagshipSurface
          id="proposal-summary"
          data-ms-section-id="proposal-summary"
          tone="hero"
          className="rounded-[var(--fw-panel-radius-large)] px-6 py-8 sm:px-8 xl:px-10 xl:py-12"
        >
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.14fr)_minmax(360px,0.86fr)] xl:gap-10 2xl:gap-12">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`${FLAGSHIP_BADGE_CLASS} ${accent.border} ${accent.textLight}`}>
                  <span className={`h-2 w-2 rounded-full ${accent.bg}`} />
                  <span>Shareable operator brief</span>
                </span>
                <span className={FLAGSHIP_BADGE_CLASS}>{proposal.band}-Band | {proposal.tier}</span>
              </div>

              <h1 className={`max-w-6xl text-4xl font-black text-white md:text-6xl xl:text-7xl ${FLAGSHIP_DISPLAY_CLASS}`}>
                {proposal.accountName} yard execution proposal
              </h1>
              <p className="max-w-5xl text-base leading-relaxed text-slate-300 md:text-lg xl:text-[1.35rem] xl:leading-relaxed">
                {proposal.subheadline}
              </p>

              <FlagshipMetaPills items={metaPills} accent={accent} />

              <div className="flex flex-wrap gap-3">
                {proposal.bookingLink && (
                  <ActionLink href={proposal.bookingLink} label={proposal.cta.buttonLabel} ctaId="proposal-booking-hero" primary />
                )}
                <ActionLink href={proposal.exportHtmlPath} label="Export HTML" ctaId="proposal-export-html-hero" download />
                <ActionLink href={proposal.exportJsonPath} label="Export JSON" ctaId="proposal-export-json-hero" download />
              </div>
            </div>

            <div className="space-y-4 xl:pl-4">
              <FlagshipSurface tone="hero" className="rounded-[var(--fw-panel-radius-large)] p-7 sm:p-8 xl:p-9">
                <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>Commercial thesis</div>
                <p className={`mt-5 text-2xl leading-tight text-white xl:text-3xl ${FLAGSHIP_SECTION_TITLE_CLASS}`}>
                  {proposal.headline}
                </p>
                {proposal.problemNarrative && (
                  <p className="mt-4 text-sm leading-relaxed text-slate-300">{proposal.problemNarrative}</p>
                )}
              </FlagshipSurface>

              <FlagshipSignalRail
                label="Board conversation prompts"
                title="How to frame the room in the first five minutes."
                items={proposal.focusPoints.slice(0, 5)}
                accent={accent}
              />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {proposal.summaryStats.map((stat) => (
              <FlagshipSurface key={stat.label} tone="muted" className="rounded-[var(--fw-panel-radius)] p-5">
                <p className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>{stat.label}</p>
                <p className="mt-3 text-3xl font-bold text-white">{stat.value}</p>
                {stat.detail && <p className="mt-2 text-xs leading-relaxed text-slate-400">{stat.detail}</p>}
              </FlagshipSurface>
            ))}
          </div>
        </FlagshipSurface>

        {proposal.proofStats.length > 0 && (
          <FlagshipSurface
            id="proposal-proof-points"
            data-ms-section-id="proposal-proof-points"
            tone="muted"
            className="rounded-[var(--fw-panel-radius)] px-7 py-7"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>Proof from live deployment</div>
                <h2 className={`mt-3 ${FLAGSHIP_SECTION_TITLE_CLASS}`}>Evidence to carry into the room</h2>
              </div>
              <div className="text-xs text-slate-500">Shared live model, not static slideware</div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {proposal.proofStats.map((stat) => (
                <FlagshipSurface key={`${stat.label}-${stat.value}`} tone="muted" className="rounded-[var(--fw-panel-radius)] p-5">
                  <p className={`text-3xl font-bold ${accent.textLight}`}>{stat.value}</p>
                  <p className={`mt-2 ${FLAGSHIP_LABEL_CLASS} text-slate-400`}>{stat.label}</p>
                  {stat.context && <p className="mt-3 text-xs leading-relaxed text-slate-500">{stat.context}</p>}
                </FlagshipSurface>
              ))}
            </div>
          </FlagshipSurface>
        )}

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-14 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6" />

          <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
            <FlagshipSurface
              id="proposal-network"
              data-ms-section-id="proposal-network"
              tone="muted"
              className="rounded-[var(--fw-panel-radius)] p-5"
            >
              <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>Network reality</div>
              <p className="mt-4 text-lg font-semibold text-white">
                {proposal.network.facilityCount ?? 'Configured network'} across {proposal.network.geographicSpread ?? 'the active account footprint'}
              </p>
              {proposal.network.narrative && (
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{proposal.network.narrative}</p>
              )}
              <div className="mt-4 space-y-2 text-xs text-slate-400">
                {proposal.network.dailyTrailerMoves && <div>Daily trailer moves: {proposal.network.dailyTrailerMoves}</div>}
                {proposal.network.peakMultiplier && <div>Peak multiplier: {proposal.network.peakMultiplier}</div>}
              </div>
            </FlagshipSurface>

            {proposal.roi && (
              <FlagshipSurface
                id="proposal-roi-signal"
                data-ms-section-id="proposal-roi-signal"
                tone="muted"
                className="rounded-[var(--fw-panel-radius)] p-5"
              >
                <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>ROI signal</div>
                <p className="mt-4 text-lg font-semibold text-white">{proposal.roi.totalAnnualSavings ?? proposal.roi.headlineStats?.[0]?.value ?? 'Modeled value available'}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{proposal.roi.narrative}</p>
                {proposal.roi.paybackPeriod && (
                  <p className={`mt-4 text-sm font-semibold ${accent.textLight}`}>Payback: {proposal.roi.paybackPeriod}</p>
                )}
              </FlagshipSurface>
            )}

            {proposal.sourceNotes.length > 0 && (
              <FlagshipSurface
                id="proposal-sources"
                data-ms-section-id="proposal-sources"
                tone="muted"
                className="rounded-[var(--fw-panel-radius)] p-5"
              >
                <div className={`${FLAGSHIP_LABEL_CLASS} text-slate-500`}>Evidence trail</div>
                <div className="mt-4 space-y-4">
                  {proposal.sourceNotes.slice(0, 6).map((note) => (
                    <FlagshipSurface key={note.id} tone="muted" className="rounded-[var(--fw-panel-radius)] p-4">
                      <p className={`${FLAGSHIP_LABEL_CLASS} text-slate-400`}>{note.label}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">{note.detail}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        {note.confidence}
                        {note.citation ? ` | ${note.citation}` : ''}
                      </p>
                    </FlagshipSurface>
                  ))}
                </div>
              </FlagshipSurface>
            )}
          </aside>
        </div>
      </main>

      <footer className="relative z-10 border-t [border-color:var(--fw-hairline)] pb-10">
        <div className={`${FLAGSHIP_FRAME_CLASS} flex flex-wrap items-center justify-between gap-4 py-6 text-xs text-slate-500`}>
          <p>YardFlow by FreightRoll | casey@freightroll.com</p>
          <div className="flex flex-wrap gap-2">
            <ActionLink href={proposal.exportHtmlPath} label="Download HTML" ctaId="proposal-footer-export-html" download />
            {proposal.bookingLink && (
              <ActionLink href={proposal.bookingLink} label={proposal.cta.buttonLabel} ctaId="proposal-footer-booking" primary />
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}