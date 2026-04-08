import type { MicrositeSection } from '@/lib/microsites/schema';
import type { MicrositeProposalBrief } from '@/lib/microsites/proposal';
import { MicrositeSectionRenderer } from './sections';
import { FLAGSHIP_FRAME_CLASS, getAccentClasses } from './theme';

function isHeroSection(section: MicrositeSection): section is Extract<MicrositeSection, { type: 'hero' }> {
  return section.type === 'hero';
}

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
        ? 'inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100'
        : 'inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10'}
    >
      {label}
    </a>
  );
}

export function ProposalBrief({ proposal }: { proposal: MicrositeProposalBrief }) {
  const accent = getAccentClasses(proposal.accentColor);
  const renderedSections = proposal.sections.filter((section) => !isHeroSection(section));

  return (
    <div className="relative min-h-screen overflow-hidden bg-stone-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_34%)]" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 18% 18%, ${proposal.accentColor ?? '#06B6D4'}22, transparent 32%), radial-gradient(circle at 82% 0%, rgba(255,255,255,0.08), transparent 24%)`,
        }}
      />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-stone-950/88 backdrop-blur-xl">
        <div className={`${FLAGSHIP_FRAME_CLASS} flex flex-wrap items-center justify-between gap-3 py-4`}>
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500">YardFlow by FreightRoll</div>
            <div className="mt-1 text-sm font-medium text-white/85">{proposal.accountName} board-ready proposal</div>
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

      <main data-ms-proposal-frame="main" className={`relative z-10 ${FLAGSHIP_FRAME_CLASS} space-y-10 py-12`}>
        <section
          id="proposal-summary"
          data-ms-section-id="proposal-summary"
          className="rounded-[36px] border border-white/10 bg-slate-950/70 px-6 py-8 shadow-[0_24px_90px_-48px_rgba(15,23,42,0.95)] backdrop-blur-sm sm:px-8 xl:px-10 xl:py-12"
        >
          <div className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${accent.textLight}`}>
            Shareable operator brief
          </div>
          <h1 className="mt-5 max-w-6xl text-4xl font-black tracking-[-0.04em] text-white md:text-6xl xl:text-7xl">
            {proposal.accountName} yard execution proposal
          </h1>
          <p className="mt-5 max-w-5xl text-base leading-relaxed text-slate-300 md:text-lg xl:text-xl">
            {proposal.hero.subheadline}
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Priority {proposal.band} {proposal.priorityScore}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{proposal.vertical}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Live ROI model</span>
            {proposal.network?.facilityCount && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{proposal.network.facilityCount} disclosed sites</span>
            )}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {proposal.summaryStats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{stat.label}</p>
                <p className="mt-3 text-3xl font-bold text-white">{stat.value}</p>
                {stat.detail && <p className="mt-2 text-xs leading-relaxed text-slate-400">{stat.detail}</p>}
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(380px,0.82fr)] xl:gap-10">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Commercial thesis</div>
              <p className="mt-4 max-w-4xl text-2xl font-semibold leading-tight text-white xl:text-3xl">{proposal.hero.headline}</p>
              {proposal.problem && (
                <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-300">{proposal.problem.narrative}</p>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Board conversation prompts</div>
              <div className="mt-4 space-y-3">
                {proposal.focusPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3 text-sm leading-relaxed text-slate-300">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${accent.bg}`} />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {proposal.proofStats.length > 0 && (
          <section
            id="proposal-proof-points"
            data-ms-section-id="proposal-proof-points"
            className="rounded-[28px] border border-white/10 bg-slate-950/65 px-7 py-7 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Proof from live deployment</div>
                <h2 className="mt-3 text-2xl font-semibold text-white">Evidence to carry into the room</h2>
              </div>
              <div className="text-xs text-slate-500">Shared live model, not static slideware</div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {proposal.proofStats.map((stat) => (
                <div key={`${stat.label}-${stat.value}`} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className={`text-3xl font-bold ${accent.textLight}`}>{stat.value}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
                  {stat.context && <p className="mt-3 text-xs leading-relaxed text-slate-500">{stat.context}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-12">
          <div className="space-y-6">
            {renderedSections.map((section, index) => (
              <MicrositeSectionRenderer
                key={`${section.type}-${index}`}
                section={section}
                sectionId={section.sectionId ?? `${section.type}-${index + 1}`}
                accentColor={proposal.accentColor}
              />
            ))}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
            <section
              id="proposal-network"
              data-ms-section-id="proposal-network"
              className="rounded-[28px] border border-white/10 bg-slate-900/60 p-5 backdrop-blur-sm"
            >
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Network reality</div>
              <p className="mt-4 text-lg font-semibold text-white">
                {proposal.network?.facilityCount ?? 'Configured network'} across {proposal.network?.geographicSpread ?? 'the active account footprint'}
              </p>
              {proposal.network?.narrative && (
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{proposal.network.narrative}</p>
              )}
              <div className="mt-4 space-y-2 text-xs text-slate-400">
                {proposal.network?.dailyTrailerMoves && <div>Daily trailer moves: {proposal.network.dailyTrailerMoves}</div>}
                {proposal.network?.peakMultiplier && <div>Peak multiplier: {proposal.network.peakMultiplier}</div>}
              </div>
            </section>

            {proposal.roi && (
              <section
                id="proposal-roi-signal"
                data-ms-section-id="proposal-roi-signal"
                className="rounded-[28px] border border-white/10 bg-slate-900/60 p-5 backdrop-blur-sm"
              >
                <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">ROI signal</div>
                <p className="mt-4 text-lg font-semibold text-white">{proposal.roi.totalAnnualSavings ?? proposal.roi.headlineStats?.[0]?.value ?? 'Modeled value available'}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{proposal.roi.narrative}</p>
                {proposal.roi.paybackPeriod && (
                  <p className={`mt-4 text-sm font-semibold ${accent.textLight}`}>Payback: {proposal.roi.paybackPeriod}</p>
                )}
              </section>
            )}

            {proposal.sourceNotes.length > 0 && (
              <section
                id="proposal-sources"
                data-ms-section-id="proposal-sources"
                className="rounded-[28px] border border-white/10 bg-slate-900/60 p-5 backdrop-blur-sm"
              >
                <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Evidence trail</div>
                <div className="mt-4 space-y-4">
                  {proposal.sourceNotes.slice(0, 6).map((note) => (
                    <div key={note.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{note.label}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">{note.detail}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        {note.confidence}
                        {note.citation ? ` | ${note.citation}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 pb-10">
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