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
import { getAccentClasses, type AccentClasses } from './theme';

// ── CTA Button ────────────────────────────────────────────────────────
function CTAButton({ cta, accent }: { cta: CTABlock; accent: AccentClasses }) {
  return (
    <a
      href={cta.calendarLink ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block ${accent.bg} ${accent.bgHover} text-slate-900 font-bold text-sm px-8 py-3 rounded-lg transition-colors`}
    >
      {cta.buttonLabel}
    </a>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────
export function HeroSectionComponent({ section, accent }: { section: HeroSection; accent: AccentClasses }) {
  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {section.accountCallout && (
          <p className={`text-xs tracking-[0.25em] ${accent.textLight} uppercase font-semibold mb-4`}>
            {section.accountCallout}
          </p>
        )}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white">
          {section.headline}
        </h1>
        <p className="mt-4 text-lg text-slate-300 leading-relaxed max-w-3xl">
          {section.subheadline}
        </p>
        <div className="mt-8">
          <CTAButton cta={section.cta} accent={accent} />
        </div>
      </div>
    </section>
  );
}

// ── Problem Section ───────────────────────────────────────────────────
export function ProblemSectionComponent({ section }: { section: ProblemSection }) {
  return (
    <section className="py-14 px-6 border-t border-slate-800">
      <div className="max-w-4xl mx-auto">
        {section.sectionLabel && (
          <p className="text-[10px] tracking-[0.3em] uppercase text-red-400 font-bold mb-2">
            {section.sectionLabel}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-4">{section.headline}</h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-8 max-w-3xl">{section.narrative}</p>
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
    <section className="py-14 px-6 border-t border-slate-800 bg-slate-900/50">
      <div className="max-w-4xl mx-auto">
        {section.sectionLabel && (
          <p className="text-[10px] tracking-[0.3em] uppercase text-amber-400 font-bold mb-2">
            {section.sectionLabel}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-4">{section.headline}</h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-6 max-w-3xl">{section.narrative}</p>

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
    <section className="py-14 px-6 border-t border-slate-800">
      <div className="max-w-4xl mx-auto">
        {section.sectionLabel && (
          <p className={`text-[10px] tracking-[0.3em] uppercase ${accent.label} font-bold mb-2`}>
            {section.sectionLabel}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-4">{section.headline}</h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-8 max-w-3xl">{section.narrative}</p>

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
    <section className="py-14 px-6 border-t border-slate-800 bg-slate-900/50">
      <div className="max-w-4xl mx-auto">
        {section.sectionLabel && (
          <div className="text-center mb-4">
            <span className="text-[10px] tracking-[0.3em] uppercase text-slate-400 font-bold border-t border-b border-slate-600 px-6 py-1.5 inline-block">
              {section.sectionLabel}
            </span>
          </div>
        )}
        <h2 className="text-2xl font-bold text-white mb-6 text-center">{section.headline}</h2>

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
      </div>
    </section>
  );
}

// ── Network Map Section ───────────────────────────────────────────────
export function NetworkMapSectionComponent({ section, accent }: { section: NetworkMapSection; accent: AccentClasses }) {
  return (
    <section className="py-14 px-6 border-t border-slate-800">
      <div className="max-w-4xl mx-auto">
        {section.sectionLabel && (
          <p className={`text-[10px] tracking-[0.3em] uppercase ${accent.label} font-bold mb-2`}>
            {section.sectionLabel}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-4">{section.headline}</h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-6 max-w-3xl">{section.narrative}</p>

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
  return (
    <section className="py-14 px-6 border-t border-slate-800 bg-slate-900/50">
      <div className="max-w-4xl mx-auto">
        {section.sectionLabel && (
          <p className="text-[10px] tracking-[0.3em] uppercase text-emerald-400 font-bold mb-2">
            {section.sectionLabel}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-4">{section.headline}</h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-6 max-w-3xl">{section.narrative}</p>

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

        <div className="grid gap-4 sm:grid-cols-2">
          {section.totalAnnualSavings && (
            <div className="text-center bg-emerald-950/20 rounded-lg py-4 px-4 border border-emerald-900/30">
              <p className="text-2xl font-extrabold text-emerald-400">{section.totalAnnualSavings}</p>
              <p className="text-xs text-slate-400 mt-1">Total Annual Savings</p>
            </div>
          )}
          {section.paybackPeriod && (
            <div className="text-center bg-emerald-950/20 rounded-lg py-4 px-4 border border-emerald-900/30">
              <p className="text-2xl font-extrabold text-emerald-400">{section.paybackPeriod}</p>
              <p className="text-xs text-slate-400 mt-1">Payback Period</p>
            </div>
          )}
        </div>

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
    <section className="py-14 px-6 border-t border-slate-800">
      <div className="max-w-4xl mx-auto">
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
    <section className="py-14 px-6 border-t border-slate-800">
      <div className="max-w-4xl mx-auto">
        {section.sectionLabel && (
          <p className={`text-[10px] tracking-[0.3em] uppercase ${accent.label} font-bold mb-2`}>
            {section.sectionLabel}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-4">{section.headline}</h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-8 max-w-3xl">{section.narrative}</p>
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
    <section className="py-14 px-6 border-t border-slate-800 bg-slate-900/50">
      <div className="max-w-4xl mx-auto">
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
    <section className="py-14 px-6 border-t border-slate-800">
      <div className="max-w-4xl mx-auto">
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
    <section className="py-14 px-6 border-t border-slate-800 bg-slate-900/50">
      <div className="max-w-4xl mx-auto">
        {section.sectionLabel && (
          <p className="text-[10px] tracking-[0.3em] uppercase text-emerald-400 font-bold mb-2">
            {section.sectionLabel}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-4">{section.headline}</h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-6 max-w-3xl">{section.narrative}</p>
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
    <section className="py-16 px-6 border-t border-slate-800 bg-gradient-to-b from-slate-900/50 to-slate-950">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-white mb-3">{section.cta.headline}</h2>
        <p className="text-sm text-slate-400 mb-6 max-w-xl mx-auto">{section.cta.subtext}</p>
        <CTAButton cta={section.cta} accent={accent} />
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
}: {
  section: MicrositeSection;
  accentColor?: string;
}) {
  const accent = getAccentClasses(accentColor);

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
}
