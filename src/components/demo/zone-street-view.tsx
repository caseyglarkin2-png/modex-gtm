'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SiteGeofences, ZoneStreetView as ZoneSV } from '@/lib/demo/pack-schema';
import { GEOFENCE_COLORS } from './archetype-palette';

/**
 * Driver's-eye walkthrough — a narrated ride-along through the audited zones.
 *
 * Steps the ground-level Street View frame through the real load flow
 * (arrival -> gate -> dock -> drop -> staging), one zone at a time, with a
 * one-line "what happens here" per stop and a play/prev/next control so a
 * prospect can ride a driver through their own yard. Frames come through the
 * server-side proxy (/api/demo/streetview); zones without usable pano coverage
 * are omitted (no broken images); duplicate panos are deduped.
 */

interface ViewItem {
  key: string;
  label: string;
  note: string;
  color: string;
  sv: ZoneSV;
}

function noteFor(key: string): string {
  if (key === 'perimeter') return 'The approach — what a driver sees pulling up to the property.';
  if (key === 'truckGate') return 'The gate — check-in happens here; flowGATE reads the truck and opens the lane.';
  if (key.startsWith('dockApron')) return 'The dock apron — backing into the door to load or unload.';
  if (key.startsWith('dropYard')) return 'The drop yard — where trailers stage for drop-and-hook.';
  if (key === 'staging') return 'Staging — the pre / post-gate hold before the next move.';
  return 'Ground-level view of this zone.';
}

function collect(meta: NonNullable<SiteGeofences['streetViewMeta']>): ViewItem[] {
  const out: ViewItem[] = [];
  const push = (key: string, label: string, color: string, sv?: ZoneSV) => {
    if (sv && sv.hasCoverage && sv.pano) out.push({ key, label, note: noteFor(key), color, sv });
  };
  // Load-flow order: arrival -> gate -> dock -> drop -> staging.
  push('perimeter', 'Arrival', GEOFENCE_COLORS.perimeter, meta.perimeter);
  push('truckGate', 'Truck gate', GEOFENCE_COLORS.truckGate, meta.truckGate);
  (meta.dockAprons ?? []).forEach((sv, i) => push(`dockApron:${i}`, `Dock apron ${i + 1}`, GEOFENCE_COLORS.dockApron, sv));
  (meta.dropYards ?? []).forEach((sv, i) => push(`dropYard:${i}`, `Drop yard ${i + 1}`, GEOFENCE_COLORS.dropYard, sv));
  push('staging', 'Staging', GEOFENCE_COLORS.staging, meta.staging);

  const seen = new Set<string>();
  return out.filter((v) => {
    const sig = `${v.sv.pano}@${v.sv.heading}`;
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
}

const svSrc = (sv: ZoneSV) => `/api/demo/streetview?pano=${encodeURIComponent(sv.pano)}&heading=${sv.heading}`;

export function ZoneStreetView({ geofences }: { geofences: SiteGeofences }) {
  const items = useMemo(
    () => (geofences.streetViewMeta ? collect(geofences.streetViewMeta) : []),
    [geofences.streetViewMeta],
  );
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const visible = items.filter((v) => !broken.has(v.key));

  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const idx = visible.length ? Math.min(active, visible.length - 1) : 0;

  // Auto-advance ride-along. Stops at the last stop (doesn't loop) so it ends
  // on the dock/drop, not back at the gate. Pauses on any manual nav.
  useEffect(() => {
    if (!playing || visible.length < 2) return;
    if (idx >= visible.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setActive((a) => a + 1), 3600);
    return () => clearTimeout(t);
  }, [playing, idx, visible.length]);

  if (visible.length === 0) return null;
  const current = visible[idx]!;
  const go = (n: number) => {
    setPlaying(false);
    setActive(Math.max(0, Math.min(visible.length - 1, n)));
  };

  return (
    <section className="mb-5 mt-1">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00B4FF]">
          Driver&apos;s-eye walkthrough
        </div>
        <div className="font-mono text-[10px] text-white/40">
          {visible.length > 1 ? `Stop ${idx + 1} / ${visible.length} · ` : ''}Street View
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#00B4FF]/25 bg-black shadow-[0_0_22px_rgba(0,180,255,0.10)]">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current.key}
            src={svSrc(current.sv)}
            alt={`Ground-level view at ${current.label}`}
            className="block aspect-[4/3] w-full object-cover sm:aspect-[3/2]"
            loading="lazy"
            onError={() => setBroken((b) => new Set(b).add(current.key))}
          />
          {/* Step dots */}
          {visible.length > 1 && (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/55 px-2 py-1 backdrop-blur">
              {visible.map((v, i) => (
                <button
                  key={v.key}
                  aria-label={`Go to ${v.label}`}
                  onClick={() => go(i)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === idx ? 16 : 6,
                    background: i === idx ? v.color : 'rgba(255,255,255,0.45)',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Caption + controls */}
        <div className="border-t border-white/10 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: current.color }} />
            <span className="text-sm font-semibold text-white">{current.label}</span>
            {visible.length > 1 && (
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => go(idx - 1)}
                  disabled={idx === 0}
                  aria-label="Previous stop"
                  className="rounded-md border border-white/12 px-2 py-1 text-[12px] text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-30"
                >
                  ‹
                </button>
                <button
                  onClick={() => {
                    if (playing) { setPlaying(false); return; }
                    if (idx >= visible.length - 1) setActive(0); // replay from the top
                    setPlaying(true);
                  }}
                  className="rounded-md border border-[#00B4FF]/55 bg-[#00B4FF]/[0.12] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[#00B4FF]/[0.22]"
                >
                  {playing ? '⏸ Pause' : idx >= visible.length - 1 ? '↻ Replay' : '▶ Ride along'}
                </button>
                <button
                  onClick={() => go(idx + 1)}
                  disabled={idx === visible.length - 1}
                  aria-label="Next stop"
                  className="rounded-md border border-white/12 px-2 py-1 text-[12px] text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            )}
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-white/60">{current.note}</p>
        </div>
      </div>
    </section>
  );
}
