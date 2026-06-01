'use client';

import { useMemo } from 'react';
import type { DemoPack } from '@/lib/demo/pack-schema';
import { buildAccountRoiModel } from '@/lib/demo/roi-model';
import { buildROIDashboard } from '@/lib/microsites/roi';
import { RoiCtaButton } from './roi-cta-button';

/**
 * #4 — inline ROI. A modeled value read shown on the demo surface itself, so
 * the prospect sees what their network is worth without leaving the page. Runs
 * the SAME canonical engine the full /roi calculator uses (lib/microsites/roi.ts,
 * "ROI Calculator V2 public contract"), fed by the shared network read
 * (lib/demo/roi-model.ts) — so the inline number and the full calculator agree.
 *
 * Tone: honest and restrained. It says these are modeled estimates that move
 * with the operator's real assumptions, and points to the calculator to set
 * them. No hype, no em dashes.
 */

function compactUsd(value: number): string {
  if (!Number.isFinite(value)) return '$0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${parseFloat((abs / 1_000_000).toFixed(1))}M`;
  if (abs >= 1_000) return `${sign}$${parseFloat((abs / 1_000).toFixed(1))}K`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

export function InlineRoi({ pack }: { pack: DemoPack }) {
  const dash = useMemo(() => buildROIDashboard(buildAccountRoiModel(pack)), [pack]);

  const annual = dash.comparison.yardFlow.total;
  // Nothing credible to model (e.g. a single non-logistics site) — stay quiet.
  if (!(annual > 0)) return null;

  const payback = dash.highLevelStats.paybackAllSavingsMonths;
  const facilities = dash.totalFacilities;

  // Deliberately omit the "value vs legacy YMS" multiplier here — a big "16x"
  // headline reads as a pitch on a demo surface. Keep the grounded metrics; the
  // full calculator is where the prospect goes deeper.
  const stats: { label: string; value: string }[] = [
    { label: 'Modeled annual value', value: `${compactUsd(annual)}/yr` },
    payback != null ? { label: 'Modeled payback', value: `${payback.toFixed(1)} mo` } : null,
    { label: 'Facilities modeled', value: facilities.toLocaleString() },
  ].filter((s): s is { label: string; value: string } => s !== null);

  return (
    <section
      data-ms-section-id="inline-roi"
      className="shrink-0 border-b border-[#00B4FF]/[0.16] bg-[#070809]"
    >
      <div className="mx-auto w-full max-w-5xl px-5 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.20em] text-[#00B4FF]/85">
              Modeled ROI
            </div>
            <p className="mt-1 text-sm text-white/70">
              A modeled view of what this network is worth under YardFlow.
            </p>
          </div>
          <RoiCtaButton
            pack={pack}
            ctaId="microsite-inline-roi"
            utmMedium="demo-inline-roi"
            source="microsite"
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.12] px-3 py-1.5 text-xs font-bold text-white transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.22] hover:shadow-[0_0_22px_rgba(0,180,255,0.32)]"
          >
            Open the full calculator →
          </RoiCtaButton>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">{s.label}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-white">{s.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-3 text-[11px] leading-relaxed text-white/45">
          Modeled from your audited network and industry operating priors. This is the same estimate the
          full calculator opens on; set your real shift counts, shipment volumes, and margins there to
          make it yours.
        </p>
      </div>
    </section>
  );
}
