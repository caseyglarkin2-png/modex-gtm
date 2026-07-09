'use client';

import { useMemo } from 'react';
import type { ArchetypeId, DemoPack } from '@/lib/demo/pack-schema';
import { ARCHETYPE_COLORS, ARCHETYPE_LABELS } from './archetype-palette';

/**
 * Donut chart of archetype distribution + filter chips. Pure SVG, no
 * charting library needed for 10 segments. Clicking a segment or chip
 * toggles inclusion in `archetypeFilter`; the network atlas listens.
 *
 * The visual contract: percentages sum to 100, chip counts sum to
 * `pack.account.siteCount`. If they don't, the data is bad.
 */

interface Props {
  pack: DemoPack;
  archetypeFilter: Set<ArchetypeId> | null;
  onToggleArchetype: (archetype: ArchetypeId) => void;
}

export function ArchetypeMixChart({ pack, archetypeFilter, onToggleArchetype }: Props) {
  const segments = useMemo(() => {
    const mix = pack.network.archetypeMix;
    const total = Object.values(mix).reduce<number>((sum, n) => sum + (n ?? 0), 0);
    if (total === 0) return [];
    const entries = (Object.entries(mix) as [ArchetypeId, number][])
      .filter(([, n]) => n > 0)
      .sort(([, a], [, b]) => b - a);

    let cum = 0;
    const r = 80; // donut outer radius
    const ir = 50; // donut inner radius
    const cx = 100;
    const cy = 100;

    return entries.map(([archetype, count]) => {
      const start = (cum / total) * Math.PI * 2 - Math.PI / 2;
      cum += count;
      const end = (cum / total) * Math.PI * 2 - Math.PI / 2;
      const large = count / total > 0.5 ? 1 : 0;
      const x1 = cx + Math.cos(start) * r;
      const y1 = cy + Math.sin(start) * r;
      const x2 = cx + Math.cos(end) * r;
      const y2 = cy + Math.sin(end) * r;
      const xi1 = cx + Math.cos(end) * ir;
      const yi1 = cy + Math.sin(end) * ir;
      const xi2 = cx + Math.cos(start) * ir;
      const yi2 = cy + Math.sin(start) * ir;
      const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${ir} ${ir} 0 ${large} 0 ${xi2} ${yi2} Z`;
      const pct = (count / total) * 100;
      return { archetype, count, pct, d };
    });
  }, [pack.network.archetypeMix]);

  const isActive = (a: ArchetypeId) => !archetypeFilter || archetypeFilter.has(a);

  return (
    <div className="px-5 py-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-white">Archetype mix</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">{pack.account.siteCount} sites</span>
      </div>

      <div className="flex gap-4">
        <svg viewBox="0 0 200 200" className="h-40 w-40 shrink-0">
          {segments.map(({ archetype, d }) => {
            const active = isActive(archetype);
            return (
              <path
                key={archetype}
                d={d}
                fill={ARCHETYPE_COLORS[archetype]}
                opacity={active ? 1 : 0.25}
                stroke="#050505"
                strokeWidth={1}
                className="cursor-pointer transition-opacity"
                onClick={() => onToggleArchetype(archetype)}
              >
                <title>
                  {archetype} {ARCHETYPE_LABELS[archetype]}
                </title>
              </path>
            );
          })}
          <text x="100" y="96" textAnchor="middle" className="fill-white text-[18px] font-semibold tabular-nums">
            {pack.account.siteCount}
          </text>
          <text x="100" y="112" textAnchor="middle" className="fill-[#8A8A8A] text-[8px] uppercase tracking-widest">
            facilities
          </text>
        </svg>

        <ul className="flex-1 space-y-1.5 text-xs">
          {segments.map(({ archetype, count, pct }) => {
            const active = isActive(archetype);
            return (
              <li key={archetype}>
                <button
                  type="button"
                  onClick={() => onToggleArchetype(archetype)}
                  className={`flex w-full items-center gap-2 rounded px-1 py-0.5 text-left transition-colors ${
                    active ? 'opacity-100' : 'opacity-40'
                  } hover:bg-[#00B4FF]/[0.08]`}
                >
                  <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: ARCHETYPE_COLORS[archetype] }} />
                  <span className="truncate text-white/85">
                    {archetype} · {ARCHETYPE_LABELS[archetype]}
                  </span>
                  <span className="ml-auto shrink-0 tabular-nums text-white/55">
                    {count} · {pct.toFixed(0)}%
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
