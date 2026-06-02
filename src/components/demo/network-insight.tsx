import type { DemoPack } from '@/lib/demo/pack-schema';
import { buildAccountRoiModel } from '@/lib/demo/roi-model';
import { buildROIDashboard } from '@/lib/microsites/roi';
import { RoiCtaButton } from './roi-cta-button';

/**
 * Network band — the single "what's MY opportunity?" beat between the hero run
 * and the interactive atlas. Fuses two formerly-competing sections (the audit
 * friction profile + the inline ROI) into one block: the audit reveals THIS
 * network's friction, tied to the real YNS levers, and what removing it is
 * worth, on the same engine the full calculator opens on.
 *
 * Everything is computed from the audited classification fields and the shared
 * ROI engine — no fabricated numbers. Scale totals are intentionally NOT
 * repeated here (the page header already carries facilities / dock doors /
 * trailer spots / rail). Self-suppresses on packs without classification.
 */

function compactUsd(value: number): string {
  if (!Number.isFinite(value)) return '$0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${parseFloat((abs / 1_000_000).toFixed(1))}M`;
  if (abs >= 1_000) return `${sign}$${parseFloat((abs / 1_000).toFixed(1))}K`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

export function NetworkInsight({ pack }: { pack: DemoPack }) {
  const sites = pack.network.sites ?? [];
  const n = sites.length;
  if (n === 0) return null;

  const cls = sites.map((s) => s.classification).filter(Boolean);
  if (cls.length === 0) return null;
  const count = (pred: (c: (typeof cls)[number]) => boolean) => cls.filter(pred).length;

  const gated = count((c) => c.truckGate === true);
  const longDrive = count((c) => c.drivewayLong === true);
  const multiCampus = count((c) => c.multipleFacilities === true);
  const dropReady = count((c) => c.dropYard === true);
  const fastLane = count((c) => c.fastLaneOpportunity === true);

  // The friction signals to surface — each tied to a real YNS lever. Pick the
  // ones that actually fire for this network (>0), ranked by prevalence.
  const signals = [
    {
      key: 'gated',
      n: gated,
      label: `gated with a guard / booth check-in`,
      lever: 'flowGATE machine-vision check-in automates the gate step',
    },
    {
      key: 'longDrive',
      n: longDrive,
      label: `have long entry drives where queues build`,
      lever: 'pre-arrival check-in keeps the queue off the public road',
    },
    {
      key: 'multiCampus',
      n: multiCampus,
      label: `are multi-building campuses where drivers misroute`,
      lever: 'in-cab building + spot assignment on arrival',
    },
    {
      key: 'dropReady',
      n: dropReady,
      label: `already run drop yards — drop-and-hook ready`,
      lever: 'where the 48→24 min drop-and-hook win lands',
    },
    {
      key: 'fastLane',
      n: fastLane,
      label: `show a clear fast-lane bypass opportunity`,
      lever: 'priority trucks skip the queue',
    },
  ]
    .filter((s) => s.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 4);

  // Modeled value — same engine the full calculator opens on (see roi-model.ts).
  const dash = buildROIDashboard(buildAccountRoiModel(pack));
  const annual = dash.comparison.yardFlow.total;
  const payback = dash.highLevelStats.paybackAllSavingsMonths;
  const roi =
    annual > 0
      ? [
          { label: 'Modeled annual value', value: `${compactUsd(annual)}/yr` },
          payback != null ? { label: 'Modeled payback', value: `${payback.toFixed(1)} mo` } : null,
          { label: 'Facilities modeled', value: dash.totalFacilities.toLocaleString() },
        ].filter((s): s is { label: string; value: string } => s !== null)
      : [];

  return (
    <section
      data-ms-section-id="network-insight"
      className="border-b border-[#00B4FF]/[0.16] bg-[#070809] px-5 py-7"
    >
      <div className="mx-auto max-w-5xl">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00B4FF]">
          The silo tax
        </div>
        <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.01em] text-white max-[480px]:text-lg">
          What the handoffs cost across your network — and what removing them is worth
        </h2>

        {/* Friction signals → YNS levers */}
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {signals.map((s) => (
            <div key={s.key} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-3">
              <div className="shrink-0 text-right">
                <div className="text-lg font-semibold tabular-nums text-[#00B4FF]">{s.n}</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">of {n}</div>
              </div>
              <div className="min-w-0">
                <div className="text-[13px] leading-snug text-white/90">{s.label}</div>
                <div className="mt-0.5 text-[11.5px] leading-snug text-white/50">
                  <span className="text-[#00B4FF]/80">→</span> {s.lever}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modeled value — the fused ROI beat. Sits under the friction profile
            as the "what removing it is worth" answer, not a separate band. */}
        {roi.length > 0 && (
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.20em] text-[#00B4FF]/85">
                Modeled ROI
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
            <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {roi.map((s) => (
                <div key={s.label} className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">{s.label}</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-white">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <p className="mt-4 text-[12px] leading-relaxed text-white/45">
          Read from satellite + Street View across all {n.toLocaleString()} facilities, modeled on the same
          engine the full calculator opens on. At a comparable network, Primo Brands cut drop-and-hook turns
          from ~48 to ~24 min. Set your real volumes and margins in the calculator to make it yours.
        </p>
      </div>
    </section>
  );
}
