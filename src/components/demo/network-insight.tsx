import type { DemoPack } from '@/lib/demo/pack-schema';
import { RoiCtaButton } from './roi-cta-button';

/**
 * Network band, the "what's MY opportunity?" beat between the hero run and the
 * interactive atlas. Surfaces THIS network's audited friction profile tied to
 * the real YNS levers.
 *
 * Layer 4 (complementarity contract): /demo is the EVIDENCE surface and states
 * NO network dollar figure. The modeled value lives exclusively at /roi. This
 * section therefore shows only audit-derived counts (real facts off the
 * classification JSON) and hands the dollar question to the calculator via the
 * CTA. Scale totals are intentionally NOT repeated here (the page header
 * already carries facilities / dock doors / trailer spots / rail).
 * Self-suppresses on packs without classification.
 */

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

  // The friction signals to surface, each tied to a real YNS lever. Pick the
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
      label: `already run drop yards, drop-and-hook ready`,
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
          What the handoffs cost across your network, and what removing them is worth
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

        {/* Layer 4, the dollar value is NOT stated on /demo. We hand the
            "what is it worth" question to the editable model at /roi, seeded
            with this pack, rather than asserting a network figure here. */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.20em] text-[#00B4FF]/85">
            Size it in the model
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

        <p className="mt-4 text-[12px] leading-relaxed text-white/45">
          Read from satellite + Street View across all {n.toLocaleString()} facilities. At a comparable
          network, Primo Brands cut drop-and-hook turns from ~48 to ~24 min. Set your real volumes and
          margins in the calculator to put a number on it.
        </p>
      </div>
    </section>
  );
}
