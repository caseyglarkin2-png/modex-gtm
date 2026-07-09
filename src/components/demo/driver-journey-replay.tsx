'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Site, SiteScenario, ZoneStreetView } from '@/lib/demo/pack-schema';
import { NARRATIONS } from '@/lib/demo/scenarios';
import { GEOFENCE_COLORS } from './archetype-palette';

/**
 * D3.2, Driver journey replay with the YNS toggle (D3.3) baked in.
 *
 * Outer wrapper handles UI chrome (controls, narration card, totals,
 * mode toggle, reset). The Leaflet map is dynamic-imported to keep
 * `window`-dependent code off the server.
 */

const Inner = dynamic(() => import('./driver-journey-replay-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0a0c10] font-mono text-xs uppercase tracking-[0.18em] text-white/40">
      Loading replay…
    </div>
  ),
});

interface Props {
  site: Site;
  scenario: SiteScenario;
  onClose: () => void;
}

function formatMs(ms: number): string {
  const totalMin = Math.round(ms / 60_000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/**
 * #1 (fusion), the map run and the ground-level ride-along, locked together.
 *
 * As the truck dot crosses each geofence in the Leaflet replay, the synced
 * Street View pane swaps in that zone's driver's-eye frame, so map position
 * and what-the-driver-sees stay in step. The opening "waiting" beat of step 0
 * holds on the perimeter pano, the approach, what a driver sees pulling up ,
 * then the run carries the eye gate -> dock -> drop.
 */

interface SyncedFrame {
  pano: string;
  heading: number;
  label: string;
  color: string;
}

function svSrc(pano: string, heading: number): string {
  return `/api/demo/streetview?pano=${encodeURIComponent(pano)}&heading=${heading}`;
}

/** True when the pack carries at least one usable ground-level pano. */
function hasAnyStreetView(site: Site): boolean {
  const m = site.geofences.streetViewMeta;
  if (!m) return false;
  const ok = (z?: ZoneStreetView | null) => !!(z && z.hasCoverage && z.pano);
  return (
    ok(m.perimeter) ||
    ok(m.truckGate) ||
    ok(m.staging) ||
    (m.dropYards?.some(ok) ?? false) ||
    (m.dockAprons?.some(ok) ?? false)
  );
}

/**
 * Resolve the driver's-eye frame for the truck's current position. Never
 * returns blank mid-run while any pano exists, the switch picks the exact
 * zone, then a fallback chain covers steps whose own pano has no coverage.
 */
function resolveFrame(
  site: Site,
  scenario: SiteScenario,
  stepIdx: number,
  phase: 'waiting' | 'moving' | 'done',
): SyncedFrame | null {
  const m = site.geofences.streetViewMeta;
  if (!m) return null;
  const ok = (z?: ZoneStreetView | null) => (z && z.hasCoverage && z.pano ? z : null);

  // The approach: hold on the perimeter frame during the opening beat.
  if (stepIdx === 0 && phase === 'waiting') {
    const p = ok(m.perimeter);
    if (p) return { pano: p.pano, heading: p.heading, label: 'The approach', color: GEOFENCE_COLORS.perimeter };
  }

  const step = scenario.steps[stepIdx];
  const i = step?.targetIndex ?? 0;
  let frame: ZoneStreetView | null = null;
  let label = '';
  let color: string = GEOFENCE_COLORS.perimeter;
  switch (step?.geofenceTarget) {
    case 'truckGate':
      frame = ok(m.truckGate);
      label = 'Truck gate';
      color = GEOFENCE_COLORS.truckGate;
      break;
    case 'dropYard':
      frame = ok(m.dropYards?.[i]) ?? ok(m.dropYards?.[0]);
      label = 'Drop yard';
      color = GEOFENCE_COLORS.dropYard;
      break;
    case 'dockApron':
      frame = ok(m.dockAprons?.[i]) ?? ok(m.dockAprons?.[0]);
      label = 'Dock apron';
      color = GEOFENCE_COLORS.dockApron;
      break;
    case 'staging':
      frame = ok(m.staging);
      label = 'Staging';
      color = GEOFENCE_COLORS.staging;
      break;
    case 'exit':
      frame = ok(m.truckGate) ?? ok(m.perimeter);
      label = 'Exit';
      color = GEOFENCE_COLORS.truckGate;
      break;
  }

  if (!frame) {
    // No ground-level pano for this zone (audit reality: most yard interiors
    // have no public Street View, only the gate/road). Fall back to a covered
    // frame and RELABEL honestly so we never show the gate while claiming it's
    // the dock apron.
    const gate = ok(m.truckGate);
    const peri = ok(m.perimeter);
    if (gate) {
      frame = gate;
      label = 'Truck gate';
      color = GEOFENCE_COLORS.truckGate;
    } else if (peri) {
      frame = peri;
      label = 'The approach';
      color = GEOFENCE_COLORS.perimeter;
    } else {
      frame = ok(m.staging) ?? ok(m.dockAprons?.[0]) ?? ok(m.dropYards?.[0]);
      label = "Driver’s-eye";
    }
  }

  return frame ? { pano: frame.pano, heading: frame.heading, label, color } : null;
}

/** The synced ground-level pane. Cross-fades on each frame change. */
function SyncedStreetView({ frame }: { frame: SyncedFrame }) {
  const src = svSrc(frame.pano, frame.heading);
  const imgRef = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  // Re-arm on src change. CRITICAL: these panos are small and often already
  // cached, so the load event can fire before React attaches onLoad, in which
  // case onLoad never runs and the pane stays at opacity-0 (a black box). Check
  // .complete here as well. (Found in live browser QA, 2026-06-01.)
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setStatus('loaded');
    else setStatus('loading');
  }, [src]);

  return (
    <div className="relative h-72 w-full shrink-0 overflow-hidden border-t border-[#00B4FF]/[0.16] bg-[#070809] md:h-80 md:w-[44%] md:border-l md:border-t-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        ref={imgRef}
        src={src}
        alt={`Driver's-eye view at ${frame.label}`}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
      />
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
            Ground-level view unavailable here
          </span>
        </div>
      )}
      <div aria-hidden className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/65 to-transparent" />
      <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 backdrop-blur">
        <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: frame.color }} />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/85">
          Driver&rsquo;s-eye · {frame.label}
        </span>
      </div>
    </div>
  );
}

export function DriverJourneyReplay({ site, scenario, onClose }: Props) {
  const [mode, setMode] = useState<'baseline' | 'yns'>('baseline');
  const [restartKey, setRestartKey] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState<'waiting' | 'moving' | 'done'>('waiting');

  const step = scenario.steps[stepIdx];
  const narration = step ? NARRATIONS[step.narrationKey] : undefined;
  const narrationLine = narration ? (mode === 'baseline' ? narration.baseline : narration.yns) : '';
  const savedMs = scenario.totalBaselineMs - scenario.totalYnsMs;

  // #1 fusion, does this site carry ground-level panos? Decided once so the
  // layout doesn't reflow between steps; the per-step frame is resolved live.
  const svAvailable = useMemo(() => hasAnyStreetView(site), [site]);
  const svFrame = svAvailable ? resolveFrame(site, scenario, stepIdx, phase) : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#00B4FF]/[0.16] px-5 py-4">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
            Driver&rsquo;s-eye run
          </div>
          <h2 className="mt-1 truncate text-base font-semibold text-white">{site.name}</h2>
          <div className="mt-0.5 text-xs text-white/70">{site.type}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-1 text-white/40 transition hover:bg-[#00B4FF]/[0.08] hover:text-white"
          aria-label="Back to site details"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Map + synced driver's-eye view (#1 fusion). On md+ they sit side by
          side; on mobile the ground-level pane stacks under the map. When the
          site has no usable panos the map keeps the full width, unchanged. */}
      <div className="flex shrink-0 flex-col border-b border-[#00B4FF]/[0.16] md:flex-row">
      <div className="relative h-80 w-full overflow-hidden md:flex-1">
        <Inner
          site={site}
          scenario={scenario}
          mode={mode}
          restartKey={restartKey}
          onStep={(i, p) => {
            setStepIdx(i);
            setPhase(p);
          }}
        />
        {/* Floating mode toggle */}
        <div className="absolute right-2 top-2 flex overflow-hidden rounded-md border border-[#00B4FF]/[0.16] bg-[#0a0c10]/95 text-[11px] shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={() => setMode('baseline')}
            className={`px-3 py-1.5 transition ${mode === 'baseline' ? 'bg-[#00B4FF]/[0.22] text-white' : 'text-white/85 hover:bg-[#00B4FF]/[0.08]'}`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setMode('yns')}
            className={`px-3 py-1.5 transition ${mode === 'yns' ? 'bg-[#00B4FF]/[0.22] text-white' : 'text-white/85 hover:bg-[#00B4FF]/[0.08]'}`}
          >
            With YardFlow
          </button>
        </div>
        {/* Step counter */}
        <div className="absolute bottom-2 left-2 rounded-md bg-[#0a0c10]/95 px-3 py-1.5 text-[11px] tabular-nums text-white/85 shadow-sm backdrop-blur">
          Step {stepIdx + 1} / {scenario.steps.length}
          {phase === 'waiting' && <span className="ml-2 text-white/55">⏸ waiting</span>}
          {phase === 'done' && <span className="ml-2 text-emerald-400">✓ done</span>}
        </div>
        {/* Lift above Leaflet's attribution control (z-index ~999) so the
            click reaches THIS button, not the OSM/ESRI text underneath.
            `bottom-7` (vs. bottom-2) also moves the button visually off
            the attribution strip. Verify regression with
            `scripts/verify-replay.mjs`. */}
        <button
          type="button"
          onClick={() => setRestartKey((k) => k + 1)}
          className="absolute bottom-7 right-2 z-[1100] rounded-md border border-[#00B4FF]/[0.16] bg-[#0a0c10]/95 px-3 py-1.5 text-[11px] text-white/85 shadow-sm backdrop-blur transition hover:bg-[#00B4FF]/[0.08] hover:text-white"
        >
          ⟲ Replay
        </button>
      </div>
        {svFrame && <SyncedStreetView frame={svFrame} />}
      </div>

      {/* Narration + delta */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Narration card */}
        {step && (
          <div className="mb-4 border-l-2 pl-4" style={{ borderColor: mode === 'baseline' ? GEOFENCE_COLORS.truckGate : GEOFENCE_COLORS.dropYard }}>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
              {mode === 'baseline' ? 'Today' : 'With YardFlow'} · {step.step}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-white/90">{narrationLine}</p>
          </div>
        )}

        {/* Totals */}
        {/* Fixed comparison frame, always Today / With YardFlow / You save,
            independent of the toggle, so the reference point never shifts. */}
        <div className="mb-3 grid grid-cols-3 gap-3 rounded-lg bg-[#101218] px-4 py-3 text-center">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">Today</div>
            <div className="mt-1 text-base font-semibold tabular-nums text-white">{formatMs(scenario.totalBaselineMs)}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">With YardFlow</div>
            <div className="mt-1 text-base font-semibold tabular-nums text-white">{formatMs(scenario.totalYnsMs)}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">You save</div>
            <div className="mt-1 text-base font-semibold tabular-nums text-emerald-400">{formatMs(savedMs)}</div>
          </div>
        </div>

        {/* Capability strip, names the real YNS modules behind the run so the
            demo doesn't reduce the platform to a single gate->dock->exit move.
            Module names mirror the live operator console (flowGATE / flowTWIN /
            Yard Spot Mgt / Dock Mgt / Appointments). */}
        <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            What removes the wait
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              { name: 'flowGATE', note: 'machine-vision gate check-in' },
              { name: 'flowTWIN', note: 'RTLS yard twin' },
              { name: 'Yard Spot Mgt', note: 'spotter dispatch' },
              { name: 'Dock Mgt', note: 'door orchestration' },
              { name: 'Appointments', note: 'drop-and-hook planning' },
            ].map((m) => (
              <span
                key={m.name}
                title={m.note}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#00B4FF]/25 bg-[#00B4FF]/[0.06] px-2 py-1 text-[11px] text-white/85"
              >
                <span className="font-semibold text-[#00B4FF]">{m.name}</span>
                <span className="text-white/50">{m.note}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Conversion CTA, fires right after the prospect sees the YardFlow-saves
            delta on their own yard. The 30-min audit is the canonical next
            step on yardflow.ai; this just makes it one click away. */}
        <a
          href={`https://yardflow.ai/contact/?intent=audit&utm_source=demo&utm_medium=demo-replay&utm_campaign=${site.id}`}
          target="_blank"
          rel="noopener noreferrer"
          data-ms-cta-id="demo-replay-book-audit"
          className="mb-3 inline-flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.12] px-4 py-2.5 text-sm font-bold text-white transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.22] hover:shadow-[0_0_22px_rgba(0,180,255,0.32)]"
          style={{ boxShadow: '0 0 0 1px rgba(0, 180, 255, 0.18) inset, 0 6px 18px rgba(0, 0, 0, 0.35)' }}
        >
          See your real numbers, start a conversation →
        </a>

        {/* Caveat */}
        <p className="text-[11px] leading-relaxed text-white/55">
          Movement durations are honest floors set by yard geometry; the uplift lands on the wait fields
          (queue + dispatch + secondary checkpoints). &ldquo;Today&rdquo; timings reflect the
          radios-and-clipboards world; &ldquo;With YardFlow&rdquo; reflects the protocol acting
          end-to-end. We may be wrong about parts of this, your actual numbers will tell us where.
        </p>
      </div>
    </div>
  );
}
