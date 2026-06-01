'use client';

import { useMemo, useState } from 'react';
import type { SiteGeofences, ZoneStreetView as ZoneSV } from '@/lib/demo/pack-schema';
import { GEOFENCE_COLORS } from './archetype-palette';

/**
 * #2 — Driver's-eye Street View, anchored to the geofence zones.
 *
 * Each audited zone may carry a `streetViewMeta` entry (pano + heading +
 * coverage). This renders the ground-level frame a driver actually sees at
 * each zone, in load-flow order, fetched through the server-side proxy
 * (/api/demo/streetview) so the key stays private. Zones without usable pano
 * coverage are simply omitted — no broken images. Distinct panos are deduped
 * (the gate pano often serves both perimeter + truck gate).
 */

interface ViewItem {
  key: string;
  label: string;
  color: string;
  sv: ZoneSV;
}

function collect(meta: NonNullable<SiteGeofences['streetViewMeta']>): ViewItem[] {
  const out: ViewItem[] = [];
  const push = (key: string, label: string, color: string, sv?: ZoneSV) => {
    if (sv && sv.hasCoverage && sv.pano) out.push({ key, label, color, sv });
  };
  // Load-flow order: arrival -> gate -> dock -> drop -> staging.
  push('perimeter', 'Arrival', GEOFENCE_COLORS.perimeter, meta.perimeter);
  push('truckGate', 'Truck gate', GEOFENCE_COLORS.truckGate, meta.truckGate);
  (meta.dockAprons ?? []).forEach((sv, i) => push(`dockApron:${i}`, `Dock apron ${i + 1}`, GEOFENCE_COLORS.dockApron, sv));
  (meta.dropYards ?? []).forEach((sv, i) => push(`dropYard:${i}`, `Drop yard ${i + 1}`, GEOFENCE_COLORS.dropYard, sv));
  push('staging', 'Staging', GEOFENCE_COLORS.staging, meta.staging);

  // Dedupe by pano+heading so we don't show the same frame twice.
  const seen = new Set<string>();
  return out.filter((v) => {
    const sig = `${v.sv.pano}@${v.sv.heading}`;
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
}

function svSrc(sv: ZoneSV) {
  return `/api/demo/streetview?pano=${encodeURIComponent(sv.pano)}&heading=${sv.heading}`;
}

export function ZoneStreetView({ geofences }: { geofences: SiteGeofences }) {
  const items = useMemo(
    () => (geofences.streetViewMeta ? collect(geofences.streetViewMeta) : []),
    [geofences.streetViewMeta],
  );
  const [active, setActive] = useState(0);
  const [broken, setBroken] = useState<Set<string>>(new Set());

  const visible = items.filter((v) => !broken.has(v.key));
  if (visible.length === 0) return null;
  const current = visible[Math.min(active, visible.length - 1)] ?? visible[0]!;

  return (
    <section className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Driver&apos;s-eye view</div>
        <div className="font-mono text-[10px] text-white/35">Google Street View</div>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.key}
          src={svSrc(current.sv)}
          alt={`Ground-level view at ${current.label}`}
          className="block aspect-[16/9] w-full object-cover"
          loading="lazy"
          onError={() => setBroken((b) => new Set(b).add(current.key))}
        />
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: current.color }} />
          <span className="text-[13px] font-semibold text-white">{current.label}</span>
          <span className="ml-auto font-mono text-[10px] text-white/40">what a driver sees here</span>
        </div>
      </div>

      {visible.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {visible.map((v, i) => (
            <button
              key={v.key}
              onClick={() => setActive(i)}
              className={`rounded-md border px-2 py-1 text-[11px] transition ${
                i === active
                  ? 'border-[#00B4FF]/60 bg-[#00B4FF]/[0.14] text-white'
                  : 'border-white/12 text-white/65 hover:border-white/25 hover:text-white'
              }`}
            >
              <span className="mr-1.5 inline-block h-2 w-2 rounded-sm align-middle" style={{ background: v.color }} />
              {v.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
