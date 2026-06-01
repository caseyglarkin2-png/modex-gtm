import type { DemoPack } from '@/lib/demo/pack-schema';

/**
 * Network Insight band — the missing "why". Synthesizes the audit (scale +
 * classification friction patterns) into plain-language insight tied to the
 * real YNS levers, so the prospect sees THEIR opportunity, not just a map.
 *
 * Everything here is computed from the audited classification fields — no
 * fabricated numbers. Self-suppresses on packs without classification data.
 */

function pct(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

export function NetworkInsight({ pack }: { pack: DemoPack }) {
  const sites = pack.network.sites ?? [];
  const n = sites.length;
  if (n === 0) return null;
  const t = pack.network.totals;

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

  const scale = [
    { v: n.toLocaleString(), l: 'facilities audited' },
    t.dockDoors ? { v: t.dockDoors.toLocaleString(), l: 'dock doors' } : null,
    t.trailerCapacity ? { v: t.trailerCapacity.toLocaleString(), l: 'trailer spots' } : null,
    t.acres ? { v: Math.round(t.acres).toLocaleString(), l: 'acres surveyed' } : null,
    t.railServed ? { v: t.railServed.toLocaleString(), l: 'rail-served' } : null,
  ].filter(Boolean) as { v: string; l: string }[];

  return (
    <section
      data-ms-section-id="network-insight"
      className="border-b border-[#00B4FF]/[0.16] bg-[#070809] px-5 py-7"
    >
      <div className="mx-auto max-w-5xl">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00B4FF]">
          What the audit reveals · {pack.account.displayName}
        </div>
        <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.01em] text-white max-[480px]:text-lg">
          Your network&apos;s friction profile — and where YNS removes it
        </h2>

        {/* Scale row */}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {scale.map((s) => (
            <div key={s.l}>
              <div className="text-2xl font-semibold tabular-nums text-white max-[480px]:text-xl">{s.v}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">{s.l}</div>
            </div>
          ))}
        </div>

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

        <p className="mt-4 text-[12.5px] leading-relaxed text-white/55">
          Read from satellite + Street View across all {n.toLocaleString()} facilities. At a comparable network,
          Primo Brands cut drop-and-hook turns from ~48 to ~24 min. Run the calculator above to size it on your volume.
        </p>
      </div>
    </section>
  );
}
