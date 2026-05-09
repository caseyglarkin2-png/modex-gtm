/**
 * Engine-backed ROI section renderer.
 *
 * The ROI engine is the only structural section type that survives the
 * M7 cleanup of legacy sections — it's still useful as a self-contained
 * "ROI panel" the proposal pipeline drops into the brief. Memo content
 * (yns-thesis, observation, comparable, methodology, about) is rendered
 * by `MemoSectionList` over in `memo-section.tsx`.
 */

import type { ROISection } from '@/lib/microsites/schema';
import {
  FLAGSHIP_LABEL_CLASS,
  FLAGSHIP_SECTION_FRAME_CLASS,
  FLAGSHIP_SECTION_GUTTER_CLASS,
  FLAGSHIP_SECTION_SPACE_CLASS,
  FLAGSHIP_SECTION_TITLE_CLASS,
  getAccentClasses,
  type AccentClasses,
} from './theme';

const STANDARD_SECTION_CLASS = `${FLAGSHIP_SECTION_SPACE_CLASS} ${FLAGSHIP_SECTION_GUTTER_CLASS}`;
const SECTION_LABEL_CLASS = `mb-2 ${FLAGSHIP_LABEL_CLASS}`;
const SECTION_TITLE_CLASS = `mb-4 ${FLAGSHIP_SECTION_TITLE_CLASS}`;
const SECTION_COPY_CLASS = 'max-w-4xl text-sm leading-relaxed text-slate-300 md:text-[0.98rem]';

export function ROISectionComponent({ section, accent }: { section: ROISection; accent: AccentClasses }) {
  const totalLabel = section.modelingMode === 'engine' ? 'Modeled Annual Value' : 'Total Annual Savings';
  const paybackLabel = section.modelingMode === 'engine' ? 'Payback (All Savings)' : 'Payback Period';

  return (
    <section className={`${STANDARD_SECTION_CLASS} border-t border-slate-800 bg-slate-900/50`}>
      <div className={FLAGSHIP_SECTION_FRAME_CLASS}>
        {section.sectionLabel && (
          <p className={`${SECTION_LABEL_CLASS} text-emerald-400`}>
            {section.sectionLabel}
          </p>
        )}
        <h2 className={SECTION_TITLE_CLASS}>{section.headline}</h2>
        <p className={`mb-6 ${SECTION_COPY_CLASS}`}>{section.narrative}</p>

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

export function MicrositeRoiPanel({ section, accentColor }: { section: ROISection; accentColor?: string }) {
  const accent = getAccentClasses(accentColor);
  return <ROISectionComponent section={section} accent={accent} />;
}
