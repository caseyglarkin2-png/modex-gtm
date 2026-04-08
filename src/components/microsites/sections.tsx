/**
 * ABM Microsite Section Components
 *
 * Server-side rendered section components that map 1:1 to MicrositeSection types.
 * Each component takes its typed section data and renders with the dark theme.
 */

import type {
  HeroSection,
  ProblemSection,
  StakesSection,
  SolutionSection,
  ProofSection,
  NetworkMapSection,
  ROISection,
  TestimonialSection,
  ModulesSection,
  TimelineSection,
  ComparisonSection,
  CaseStudySection,
  CTASection,
  MicrositeSection,
  CTABlock,
} from '@/lib/microsites/schema';
import {
  FLAGSHIP_SECTION_FRAME_CLASS,
  FLAGSHIP_SECTION_GUTTER_CLASS,
  getAccentClasses,
  type AccentClasses,
} from './theme';

const STANDARD_SECTION_CLASS = `py-12 ${FLAGSHIP_SECTION_GUTTER_CLASS} xl:py-14`;
const HERO_SECTION_CLASS = `py-14 ${FLAGSHIP_SECTION_GUTTER_CLASS} md:py-16`;
const CTA_SECTION_CLASS = `py-14 ${FLAGSHIP_SECTION_GUTTER_CLASS} xl:py-16`;

// ── CTA Button ────────────────────────────────────────────────────────
function CTAButton({ cta, accent, ctaId }: { cta: CTABlock; accent: AccentClasses; ctaId: string }) {
  return (
    <a
      href={cta.calendarLink ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      data-ms-cta-id={ctaId}
      className={`inline-block ${accent.bg} ${accent.bgHover} text-slate-900 font-bold text-sm px-8 py-3 rounded-lg transition-colors`}
    >
      {cta.buttonLabel}
    </a>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────
export function HeroSectionComponent({ section, accent }: { section: HeroSection; accent: AccentClasses }) {
  return (
    <section className={HERO_SECTION_CLASS}>
      <div className={FLAGSHIP_SECTION_FRAME_CLASS}>
        {section.accountCallout && (
          <p className={`text-xs tracking-[0.25em] ${accent.textLight} uppercase font-semibold mb-4`}>
            {section.accountCallout}
          </p>
        )}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white">
          {section.headline}
        </h1>
        <p className="mt-4 max-w-4xl text-lg leading-relaxed text-slate-300">
          {section.subheadline}
        </p>
        <div className="mt-8">
          <CTAButton cta={section.cta} accent={accent} ctaId={section.sectionId ?? 'hero-cta'} />
        </div>
      </div>
    </section>
  );
}

// ── Problem Section ───────────────────────────────────────────────────
export function ProblemSectionComponent({ section }: { section: ProblemSection }) {
  return (
    <section className={`${STANDARD_SECTION_CLASS} border-t border-slate-800`}>
      <div className={FLAGSHIP_SECTION_FRAME_CLASS}>
        {section.sectionLabel && (
          <p className="text-[10px] tracking-[0.3em] uppercase text-red-400 font-bold mb-2">
            {section.sectionLabel}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-4">{section.headline}</h2>
        <p className="mb-8 max-w-4xl text-sm leading-relaxed text-slate-300">{section.narrative}</p>
        <div className="grid gap-4 md:grid-cols-2">
          {section.painPoints.map((pain, i) => (
            <div
              key={i}
              className="rounded-lg border border-red-900/30 bg-red-950/20 p-4"
            >
              <div className="flex gap-2 items-start">
                <span className="text-red-400 shrink-0 mt-0.5">&#9888;</span>
                <div>
                  <p className="text-sm font-semibold text-white">{pain.headline}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{pain.description}</p>
                  {pain.kpiImpact && (
                    <p className="text-xs text-red-300 mt-2 font-mono">{pain.kpiImpact}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Stakes Section ────────────────────────────────────────────────────
export function StakesSectionComponent({ section }: { section: StakesSection }) {
  return (
    <section className={`${STANDARD_SECTION_CLASS} border-t border-slate-800 bg-slate-900/50`}>
      <div className={FLAGSHIP_SECTION_FRAME_CLASS}>
        {section.sectionLabel && (
          <p className="text-[10px] tracking-[0.3em] uppercase text-amber-400 font-bold mb-2">
            {section.sectionLabel}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-4">{section.headline}</h2>
        <p className="mb-6 max-w-4xl text-sm leading-relaxed text-slate-300">{section.narrative}</p>

        {section.annualCost && (
          <div className="mb-6 text-center">
            <p className="text-3xl font-extrabold text-amber-400">{section.annualCost}</p>
            <p className="text-sm text-slate-400 mt-1">estimated annual cost of yard-driven inefficiency</p>
          </div>
        )}

        {section.costBreakdown && section.costBreakdown.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {section.costBreakdown.map((item, i) => (
              <div key={i} className="rounded-lg border border-amber-900/30 bg-amber-950/10 p-3 text-center">
                <p className="text-lg font-bold text-amber-400">{item.value}</p>
                <p className="text-xs text-slate-400 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        {section.urgencyDriver && (
          <div className="rounded-lg border border-amber-800/30 bg-amber-950/20 px-4 py-3 border-l-2 border-l-amber-400">
            <p className="text-xs text-amber-200 leading-relaxed">{section.urgencyDriver}</p>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Solution Section ──────────────────────────────────────────────────
export function SolutionSectionComponent({ section, accent }: { section: SolutionSection; accent: AccentClasses }) {
  return (
    <section className={`${STANDARD_SECTION_CLASS} border-t border-slate-800`}>
      <div className={FLAGSHIP_SECTION_FRAME_CLASS}>
        {section.sectionLabel && (
          <p className={`text-[10px] tracking-[0.3em] uppercase ${accent.label} font-bold mb-2`}>
            {section.sectionLabel}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-4">{section.headline}</h2>
        <p className="mb-8 max-w-4xl text-sm leading-relaxed text-slate-300">{section.narrative}</p>

        <div className="grid gap-4 md:grid-cols-2">
          {section.modules.map((mod) => (
            <div key={mod.id} className={`rounded-lg border ${accent.border} ${accent.bgSubtle} p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-mono ${accent.text} ${accent.bgBadge} px-2 py-0.5 rounded`}>
                  {mod.verb}
                </span>
                <span className="text-sm font-bold text-white">{mod.name}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{mod.shortDescription}</p>
              {mod.relevanceToAccount && (
                <p className={`text-xs ${accent.textLight} mt-2 leading-relaxed`}>{mod.relevanceToAccount}</p>
              )}
            </div>
          ))}
        </div>

        {section.accountFit && (
          <div className={`mt-6 rounded-lg border ${accent.border} ${accent.bgSubtle} px-4 py-3 border-l-2 ${accent.borderAccent}`}>
            <p className={`text-xs ${accent.textMuted} leading-relaxed`}>{section.accountFit}</p>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Proof Section ─────────────────────────────────────────────────────
export function ProofSectionComponent({ section, accent }: { section: ProofSection; accent: AccentClasses }) {
  return (
    <section className={`${STANDARD_SECTION_CLASS} border-t border-slate-800 bg-slate-900/50`}>
      <div className={FLAGSHIP_SECTION_FRAME_CLASS}>
        {section.sectionLabel && (
          <div className="text-center mb-4">
            <span className="text-[10px] tracking-[0.3em] uppercase text-slate-400 font-bold border-t border-b border-slate-600 px-6 py-1.5 inline-block">
              {section.sectionLabel}
            </span>
          </div>
        )}
        <h2 className="text-2xl font-bold text-white mb-6 text-center">{section.headline}</h2>

        {section.proofVisual && (
          <div className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-950/40 p-5">
            {section.proofVisual.headline && (
              <h3 className="text-lg font-semibold text-white">{section.proofVisual.headline}</h3>
            )}
            {section.proofVisual.narrative && (
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{section.proofVisual.narrative}</p>
            )}

            {section.proofVisual.type === 'metric-grid' && section.proofVisual.stats && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {section.proofVisual.stats.map((stat, index) => (
                  <div key={index} className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
                    <p className={`text-2xl font-bold ${accent.textLight}`}>{stat.value}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
                    {stat.context && <p className="mt-2 text-xs leading-relaxed text-slate-500">{stat.context}</p>}
                  </div>
                ))}
              </div>
            )}

            {section.proofVisual.type === 'before-after' && section.proofVisual.beforeAfter && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{section.proofVisual.beforeAfter.before.label}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{section.proofVisual.beforeAfter.before.description}</p>
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
                  <p className={`text-[10px] uppercase tracking-[0.22em] ${accent.textLight}`}>{section.proofVisual.beforeAfter.after.label}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-200">{section.proofVisual.beforeAfter.after.description}</p>
                </div>
              </div>
            )}

            {section.proofVisual.type === 'comparison' && section.proofVisual.comparisonData && (
              <div className="mt-4 overflow-x-auto">
                {section.proofVisual.comparisonLabel && (
                  <p className="mb-3 text-sm font-semibold text-white">{section.proofVisual.comparisonLabel}</p>
                )}
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="py-2 text-left font-medium text-slate-400">Metric</th>
                      <th className="py-2 text-left font-medium text-slate-400">Current</th>
                      <th className={`py-2 text-left font-medium ${accent.text}`}>With YardFlow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.proofVisual.comparisonData.map((row, index) => (
                      <tr key={index} className="border-b border-slate-800">
                        <td className="py-2 text-slate-300">{row.metric}</td>
                        <td className="py-2 text-slate-400">{row.competitor}</td>
                        <td className={`py-2 font-semibold ${accent.textLight}`}>{row.yardflow}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {section.liveDeployment && (
          <div className={`mb-6 rounded-2xl border bg-slate-950/40 p-5 ${accent.border}`}>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Live Deployment</p>
            <h3 className="mt-3 text-lg font-semibold text-white">{section.liveDeployment.headline}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{section.liveDeployment.summary}</p>
            {section.liveDeployment.badges && section.liveDeployment.badges.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {section.liveDeployment.badges.map((badge, index) => (
                  <span key={index} className="rounded-full border border-slate-700/50 bg-slate-900/60 px-3 py-1 text-xs text-slate-200">
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {section.blocks.map((block, i) => (
          <div key={i} className="mb-6">
            {block.type === 'metric' && block.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {block.stats.map((stat, j) => (
                  <div key={j} className="text-center bg-slate-800/50 rounded-lg py-4 px-2 border border-slate-700/40">
                    <p className="text-2xl font-bold text-white leading-none">{stat.value}</p>
                    <p className="text-[10px] text-slate-400 mt-2 leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            {block.type === 'quote' && block.quote && (
              <div className={`bg-slate-800/30 rounded-lg px-5 py-4 border-l-2 ${accent.borderAccent}`}>
                <p className="text-sm text-slate-300 italic leading-relaxed">
                  &ldquo;{block.quote.text}&rdquo;
                </p>
                {(block.quote.role || block.quote.company) && (
                  <p className="text-xs text-slate-500 mt-2">
                    {block.quote.role}{block.quote.company ? `, ${block.quote.company}` : ''}
                  </p>
                )}
              </div>
            )}

            {block.type === 'comparison' && block.comparisonData && (
              <div className="overflow-x-auto">
                {block.comparisonLabel && (
                  <p className="text-sm font-semibold text-white mb-3">{block.comparisonLabel}</p>
                )}
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 text-slate-400 font-medium">Metric</th>
                      <th className="text-left py-2 text-slate-400 font-medium">Current</th>
                      <th className={`text-left py-2 ${accent.text} font-medium`}>With YardFlow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.comparisonData.map((row, j) => (
                      <tr key={j} className="border-b border-slate-800">
                        <td className="py-2 text-slate-300">{row.metric}</td>
                        <td className="py-2 text-slate-400">{row.competitor}</td>
                        <td className={`py-2 ${accent.textLight} font-semibold`}>{row.yardflow}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {section.methodology && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Methodology</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{section.methodology}</p>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Network Map Section ───────────────────────────────────────────────
export function NetworkMapSectionComponent({ section, accent }: { section: NetworkMapSection; accent: AccentClasses }) {
  return (
    <section className={`${STANDARD_SECTION_CLASS} border-t border-slate-800`}>
      <div className={FLAGSHIP_SECTION_FRAME_CLASS}>
        {section.sectionLabel && (
          <p className={`text-[10px] tracking-[0.3em] uppercase ${accent.label} font-bold mb-2`}>
            {section.sectionLabel}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-4">{section.headline}</h2>
        <p className="mb-6 max-w-4xl text-sm leading-relaxed text-slate-300">{section.narrative}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center bg-slate-800/50 rounded-lg py-4 px-2 border border-slate-700/40">
            <p className={`text-2xl font-bold ${accent.text}`}>{section.facilityCount}</p>
            <p className="text-[10px] text-slate-400 mt-1">Facilities</p>
          </div>
          {section.dailyTrailerMoves && (
            <div className="text-center bg-slate-800/50 rounded-lg py-4 px-2 border border-slate-700/40">
              <p className={`text-xl font-bold ${accent.text}`}>{section.dailyTrailerMoves}</p>
              <p className="text-[10px] text-slate-400 mt-1">Daily Trailer Moves</p>
            </div>
          )}
          {section.peakMultiplier && (
            <div className="text-center bg-slate-800/50 rounded-lg py-4 px-2 border border-slate-700/40">
              <p className={`text-xl font-bold ${accent.text}`}>{section.peakMultiplier}</p>
              <p className="text-[10px] text-slate-400 mt-1">Peak Multiplier</p>
            </div>
          )}
          {section.facilityTypes && (
            <div className="text-center bg-slate-800/50 rounded-lg py-4 px-2 border border-slate-700/40">
              <p className={`text-xl font-bold ${accent.text}`}>{section.facilityTypes.length}</p>
              <p className="text-[10px] text-slate-400 mt-1">Facility Types</p>
            </div>
          )}
        </div>

        {section.facilityTypes && (
          <div className="mt-4 flex flex-wrap gap-2">
            {section.facilityTypes.map((type, i) => (
              <span key={i} className="text-xs text-slate-300 bg-slate-800/50 border border-slate-700/40 rounded-full px-3 py-1">
                {type}
              </span>
            ))}
          </div>
        )}

        {section.geographicSpread && (
          <p className="mt-4 text-xs text-slate-400">{section.geographicSpread}</p>
        )}
      </div>
    </section>
  );
}

// ── ROI Section ───────────────────────────────────────────────────────
export function ROISectionComponent({ section, accent }: { section: ROISection; accent: AccentClasses }) {
  const totalLabel = section.modelingMode === 'engine' ? 'Modeled Annual Value' : 'Total Annual Savings';
  const paybackLabel = section.modelingMode === 'engine' ? 'Payback (All Savings)' : 'Payback Period';

  return (
    <section className={`${STANDARD_SECTION_CLASS} border-t border-slate-800 bg-slate-900/50`}>
      <div className={FLAGSHIP_SECTION_FRAME_CLASS}>
        {section.sectionLabel && (
          <p className="text-[10px] tracking-[0.3em] uppercase text-emerald-400 font-bold mb-2">
            {section.sectionLabel}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-4">{section.headline}</h2>
        <p className="mb-6 max-w-4xl text-sm leading-relaxed text-slate-300">{section.narrative}</p>

        {section.headlineStats && section.headlineStats.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-6">
            {section.headlineStats.map((stat) => (
              <div key={stat.id} className="rounded-lg border border-slate-700/50 bg-slate-950/40 px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-extrabold text-emerald-400">{stat.value}</p>
                {stat.footnote && <p className="mt-2 text-xs leading-relaxed text-slate-500">{stat.footnote}</p>}
              </div>
            ))}
          </div>
        )}

        {section.totalValueComparison && (
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div className="rounded-lg border border-slate-700/50 bg-slate-950/40 px-4 py-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Legacy YMS</p>
              <p className="mt-2 text-xl font-bold text-slate-200">{section.totalValueComparison.legacyYmsAnnualValue ?? 'N/A'}</p>
            </div>
            <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/10 px-4 py-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300/80">YardFlow</p>
              <p className="mt-2 text-xl font-bold text-emerald-400">{section.totalValueComparison.yardflowAnnualValue ?? 'N/A'}</p>
            </div>
            <div className="rounded-lg border border-slate-700/50 bg-slate-950/40 px-4 py-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Value Multiple</p>
              <p className="mt-2 text-xl font-bold text-white">{section.totalValueComparison.valueMultiple ?? 'N/A'}</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 text-sm text-slate-400 font-medium">Metric</th>
                <th className="text-left py-3 text-sm text-slate-400 font-medium">Before</th>
                <th className={`text-left py-3 text-sm ${accent.text} font-medium`}>After</th>
                <th className="text-left py-3 text-sm text-emerald-400 font-medium">Impact</th>
              </tr>
            </thead>
            <tbody>
              {section.roiLines.map((line, i) => (
                <tr key={i} className="border-b border-slate-800">
                  <td className="py-3 text-sm text-slate-300">{line.label}</td>
                  <td className="py-3 text-sm text-slate-500">{line.before}</td>
                  <td className={`py-3 text-sm ${accent.textLight} font-semibold`}>{line.after}</td>
                  <td className="py-3 text-sm text-emerald-400 font-bold">{line.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {section.archetypeBreakdowns && section.archetypeBreakdowns.length > 0 && (
          <div className="grid gap-4 xl:grid-cols-3 mb-6">
            {section.archetypeBreakdowns.map((breakdown) => (
              <div key={breakdown.archetype} className="rounded-xl border border-slate-700/50 bg-slate-950/40 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{breakdown.headline ?? breakdown.archetype}</p>
                    <p className="mt-1 text-xs text-slate-400">{breakdown.facilityCount} sites</p>
                  </div>
                  {breakdown.returnMultiple && (
                    <span className={`rounded-full ${accent.bgSubtle} px-3 py-1 text-xs font-semibold ${accent.textLight}`}>
                      {breakdown.returnMultiple}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {breakdown.yardflowCostPerYear && (
                    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">YF Cost / Year</p>
                      <p className="mt-2 text-lg font-bold text-white">{breakdown.yardflowCostPerYear}</p>
                    </div>
                  )}
                  {breakdown.yardflowSavingsPerYear && (
                    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">YF Hard Savings</p>
                      <p className="mt-2 text-lg font-bold text-emerald-400">{breakdown.yardflowSavingsPerYear}</p>
                    </div>
                  )}
                  {breakdown.legacyYmsCostPerYear && (
                    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Legacy Cost / Year</p>
                      <p className="mt-2 text-lg font-bold text-slate-300">{breakdown.legacyYmsCostPerYear}</p>
                    </div>
                  )}
                  {breakdown.legacyYmsSavingsPerYear && (
                    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Legacy Hard Savings</p>
                      <p className="mt-2 text-lg font-bold text-slate-300">{breakdown.legacyYmsSavingsPerYear}</p>
                    </div>
                  )}
                </div>

                {breakdown.hardSavingsLines && breakdown.hardSavingsLines.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-2">Hard Savings</p>
                    <div className="space-y-2">
                      {breakdown.hardSavingsLines.map((line) => (
                        <div key={`${breakdown.archetype}-${line.label}`} className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-400">{line.label}</span>
                          <span className="font-semibold text-white">{line.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {breakdown.throughputLines && breakdown.throughputLines.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-2">Throughput Value</p>
                    <div className="space-y-2">
                      {breakdown.throughputLines.map((line) => (
                        <div key={`${breakdown.archetype}-${line.label}`} className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-400">{line.label}</span>
                          <span className={`font-semibold ${accent.textLight}`}>{line.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {section.totalAnnualSavings && (
            <div className="text-center bg-emerald-950/20 rounded-lg py-4 px-4 border border-emerald-900/30">
              <p className="text-2xl font-extrabold text-emerald-400">{section.totalAnnualSavings}</p>
              <p className="text-xs text-slate-400 mt-1">{totalLabel}</p>
            </div>
          )}
          {section.paybackPeriod && (
            <div className="text-center bg-emerald-950/20 rounded-lg py-4 px-4 border border-emerald-900/30">
              <p className="text-2xl font-extrabold text-emerald-400">{section.paybackPeriod}</p>
              <p className="text-xs text-slate-400 mt-1">{paybackLabel}</p>
            </div>
          )}
        </div>

        {section.assumptionNotes && section.assumptionNotes.length > 0 && (
          <div className="mt-6 rounded-lg border border-slate-700/50 bg-slate-950/40 px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Scenario Assumptions</p>
            <div className="mt-3 space-y-3">
              {section.assumptionNotes.map((note) => (
                <div key={note.id} className="flex flex-col gap-1 text-xs">
                  <span className="font-semibold text-slate-200">{note.label}</span>
                  <span className="text-slate-400">{note.detail}</span>
                  <span className="text-slate-500">Confidence: {note.confidence}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {section.sourceNotes && section.sourceNotes.length > 0 && (
          <div className="mt-4 rounded-lg border border-slate-700/50 bg-slate-950/40 px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Source Notes</p>
            <div className="mt-3 space-y-3">
              {section.sourceNotes.map((note) => (
                <div key={note.id} className="flex flex-col gap-1 text-xs">
                  <span className="font-semibold text-slate-200">{note.label}</span>
                  <span className="text-slate-400">{note.detail}</span>
                  <span className="text-slate-500">
                    Confidence: {note.confidence}
                    {note.citation ? ` · ${note.citation}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {section.methodology && (
          <p className="mt-4 text-[10px] text-slate-500 leading-relaxed">{section.methodology}</p>
        )}
      </div>
    </section>
  );
}

// ── Testimonial Section ───────────────────────────────────────────────
export function TestimonialSectionComponent({ section, accent }: { section: TestimonialSection; accent: AccentClasses }) {
  return (
    <section className={`${STANDARD_SECTION_CLASS} border-t border-slate-800`}>
      <div className={FLAGSHIP_SECTION_FRAME_CLASS}>
        {section.sectionLabel && (
          <p className="text-[10px] tracking-[0.3em] uppercase text-slate-400 font-bold mb-4">
            {section.sectionLabel}
          </p>
        )}
        <div className={`bg-slate-800/30 rounded-lg px-6 py-5 border-l-2 ${accent.borderAccent}`}>
          <p className="text-base text-slate-300 italic leading-relaxed">
            &ldquo;{section.quote}&rdquo;
          </p>
          {(section.role || section.company) && (
            <p className="text-sm text-slate-500 mt-3">
              {section.role}{section.company ? `, ${section.company}` : ''}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Modules Section ───────────────────────────────────────────────────
export function ModulesSectionComponent({ section, accent }: { section: ModulesSection; accent: AccentClasses }) {
  return (
    <section className={`${STANDARD_SECTION_CLASS} border-t border-slate-800`}>
      <div className={FLAGSHIP_SECTION_FRAME_CLASS}>
        {section.sectionLabel && (
          <p className={`text-[10px] tracking-[0.3em] uppercase ${accent.label} font-bold mb-2`}>
            {section.sectionLabel}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-4">{section.headline}</h2>
        <p className="mb-8 max-w-4xl text-sm leading-relaxed text-slate-300">{section.narrative}</p>
        <div className="grid gap-4 md:grid-cols-2">
          {section.modules.map((mod) => (
            <div key={mod.id} className={`rounded-lg border ${accent.border} ${accent.bgSubtle} p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-mono ${accent.text} ${accent.bgBadge} px-2 py-0.5 rounded`}>
                  {mod.verb}
                </span>
                <span className="text-sm font-bold text-white">{mod.name}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{mod.shortDescription}</p>
              {mod.relevanceToAccount && (
                <p className={`text-xs ${accent.textLight} mt-2 leading-relaxed`}>{mod.relevanceToAccount}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Timeline Section ──────────────────────────────────────────────────
export function TimelineSectionComponent({ section, accent }: { section: TimelineSection; accent: AccentClasses }) {
  return (
    <section className={`${STANDARD_SECTION_CLASS} border-t border-slate-800 bg-slate-900/50`}>
      <div className={FLAGSHIP_SECTION_FRAME_CLASS}>
        {section.sectionLabel && (
          <p className={`text-[10px] tracking-[0.3em] uppercase ${accent.label} font-bold mb-2`}>
            {section.sectionLabel}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-8">{section.headline}</h2>
        <div className="relative">
          {section.steps.map((step, i) => (
            <div key={i} className="relative pl-8 pb-8 last:pb-0">
              {i < section.steps.length - 1 && (
                <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/60 to-cyan-500/10" />
              )}
              <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full border-2 border-slate-700 bg-slate-950 flex items-center justify-center">
                <span className={`text-[10px] font-bold ${accent.text}`}>{step.week}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Comparison Section ────────────────────────────────────────────────
export function ComparisonSectionComponent({ section, accent }: { section: ComparisonSection; accent: AccentClasses }) {
  return (
    <section className={`${STANDARD_SECTION_CLASS} border-t border-slate-800`}>
      <div className={FLAGSHIP_SECTION_FRAME_CLASS}>
        {section.sectionLabel && (
          <p className="text-[10px] tracking-[0.3em] uppercase text-slate-400 font-bold mb-2">
            {section.sectionLabel}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-6">{section.headline}</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 text-sm text-slate-400 font-medium">Dimension</th>
                <th className="text-left py-3 text-sm text-slate-400 font-medium">Before</th>
                <th className={`text-left py-3 text-sm ${accent.text} font-medium`}>With YardFlow</th>
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-800">
                  <td className="py-3 text-sm text-slate-300">{row.dimension}</td>
                  <td className="py-3 text-sm text-slate-500">{row.before}</td>
                  <td className={`py-3 text-sm ${accent.textLight} font-semibold`}>{row.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ── Case Study Section ────────────────────────────────────────────────
export function CaseStudySectionComponent({ section }: { section: CaseStudySection }) {
  return (
    <section className={`${STANDARD_SECTION_CLASS} border-t border-slate-800 bg-slate-900/50`}>
      <div className={FLAGSHIP_SECTION_FRAME_CLASS}>
        {section.sectionLabel && (
          <p className="text-[10px] tracking-[0.3em] uppercase text-emerald-400 font-bold mb-2">
            {section.sectionLabel}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-4">{section.headline}</h2>
        <p className="mb-6 max-w-4xl text-sm leading-relaxed text-slate-300">{section.narrative}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {section.results.map((stat, i) => (
            <div key={i} className="text-center bg-emerald-950/20 rounded-lg py-4 px-2 border border-emerald-900/30">
              <p className="text-2xl font-bold text-emerald-400">{stat.value}</p>
              <p className="text-[10px] text-slate-400 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Section ───────────────────────────────────────────────────────
export function CTASectionComponent({ section, accent }: { section: CTASection; accent: AccentClasses }) {
  return (
    <section className={`${CTA_SECTION_CLASS} border-t border-slate-800 bg-gradient-to-b from-slate-900/50 to-slate-950`}>
      <div className={`${FLAGSHIP_SECTION_FRAME_CLASS} text-center`}>
        <h2 className="text-2xl font-bold text-white mb-3">{section.cta.headline}</h2>
        <p className="mx-auto mb-6 max-w-2xl text-sm text-slate-400">{section.cta.subtext}</p>
        <CTAButton cta={section.cta} accent={accent} ctaId={section.sectionId ?? 'cta'} />
        {section.closingLine && (
          <p className="mt-6 text-xs text-slate-500">{section.closingLine}</p>
        )}
      </div>
    </section>
  );
}

// ── Section Renderer ──────────────────────────────────────────────────
// Maps section type to the correct component. Accepts optional accentColor for theming.
export function MicrositeSectionRenderer({
  section,
  accentColor,
  sectionId,
}: {
  section: MicrositeSection;
  accentColor?: string;
  sectionId?: string;
}) {
  const accent = getAccentClasses(accentColor);
  const resolvedSectionId = sectionId ?? section.sectionId ?? section.type;
  const content = (() => {
    switch (section.type) {
      case 'hero':
        return <HeroSectionComponent section={section} accent={accent} />;
      case 'problem':
        return <ProblemSectionComponent section={section} />;
      case 'stakes':
        return <StakesSectionComponent section={section} />;
      case 'solution':
        return <SolutionSectionComponent section={section} accent={accent} />;
      case 'proof':
        return <ProofSectionComponent section={section} accent={accent} />;
      case 'network-map':
        return <NetworkMapSectionComponent section={section} accent={accent} />;
      case 'roi':
        return <ROISectionComponent section={section} accent={accent} />;
      case 'testimonial':
        return <TestimonialSectionComponent section={section} accent={accent} />;
      case 'modules':
        return <ModulesSectionComponent section={section} accent={accent} />;
      case 'timeline':
        return <TimelineSectionComponent section={section} accent={accent} />;
      case 'comparison':
        return <ComparisonSectionComponent section={section} accent={accent} />;
      case 'case-study':
        return <CaseStudySectionComponent section={section} />;
      case 'cta':
        return <CTASectionComponent section={section} accent={accent} />;
      default:
        return null;
    }
  })();

  if (!content) return null;

  return (
    <div
      id={resolvedSectionId}
      data-ms-section-id={resolvedSectionId}
      data-ms-narrative-role={section.narrativeRole ?? section.type}
    >
      {content}
    </div>
  );
}
