'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { Site, SiteScenario } from '@/lib/demo/pack-schema';
import { NARRATIONS } from '@/lib/demo/scenarios';
import { GEOFENCE_COLORS } from './archetype-palette';

/**
 * D3.2 — Driver journey replay with the YNS toggle (D3.3) baked in.
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

export function DriverJourneyReplay({ site, scenario, onClose }: Props) {
  const [mode, setMode] = useState<'baseline' | 'yns'>('baseline');
  const [restartKey, setRestartKey] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState<'waiting' | 'moving' | 'done'>('waiting');

  const step = scenario.steps[stepIdx];
  const narration = step ? NARRATIONS[step.narrationKey] : undefined;
  const narrationLine = narration ? (mode === 'baseline' ? narration.baseline : narration.yns) : '';
  const totalMs = mode === 'baseline' ? scenario.totalBaselineMs : scenario.totalYnsMs;
  const altMs = mode === 'baseline' ? scenario.totalYnsMs : scenario.totalBaselineMs;
  const savedMs = scenario.totalBaselineMs - scenario.totalYnsMs;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#00B4FF]/[0.16] px-5 py-4">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
            Driver journey · Archetype {site.archetype}
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

      {/* Map */}
      <div className="relative h-80 w-full shrink-0 overflow-hidden border-b border-[#00B4FF]/[0.16]">
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
            Without YNS
          </button>
          <button
            type="button"
            onClick={() => setMode('yns')}
            className={`px-3 py-1.5 transition ${mode === 'yns' ? 'bg-[#00B4FF]/[0.22] text-white' : 'text-white/85 hover:bg-[#00B4FF]/[0.08]'}`}
          >
            With YNS
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

      {/* Narration + delta */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Narration card */}
        {step && (
          <div className="mb-4 border-l-2 pl-4" style={{ borderColor: mode === 'baseline' ? GEOFENCE_COLORS.truckGate : GEOFENCE_COLORS.dropYard }}>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
              {mode === 'baseline' ? 'Without YNS' : 'With YNS'} · {step.step}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-white/90">{narrationLine}</p>
          </div>
        )}

        {/* Totals */}
        <div className="mb-3 grid grid-cols-3 gap-3 rounded-lg bg-[#101218] px-4 py-3 text-center">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">This run</div>
            <div className="mt-1 text-base font-semibold tabular-nums text-white">{formatMs(totalMs)}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">{mode === 'baseline' ? 'Under YNS' : 'Baseline'}</div>
            <div className="mt-1 text-base font-semibold tabular-nums text-white">{formatMs(altMs)}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">YNS saves</div>
            <div className="mt-1 text-base font-semibold tabular-nums text-emerald-400">{formatMs(savedMs)}</div>
          </div>
        </div>

        {/* Flagship proof — anchors the modeled per-run delta above in a real,
            named-customer result so the value reads as proven, not projected.
            Primo Brands is YardFlow's flagship reference account. */}
        <div className="mb-3 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.06] px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">
            Flagship result · Primo Brands
          </div>
          <p className="mt-1 text-sm leading-relaxed text-white/90">
            <span className="font-semibold text-white">Drop-and-hook</span> turns cut from{' '}
            <span className="font-semibold text-white">~48 min</span> to{' '}
            <span className="font-semibold text-emerald-300">~24 min</span>, measured in pilot.
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/55">
            Live loads stay driver- and shipper-paced — the protocol&apos;s gains land on drop-and-hook.
          </p>
        </div>

        {/* Conversion CTA — fires right after the prospect sees the YNS-saves
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
          See your real numbers — book a 30-min audit →
        </a>

        {/* Caveat */}
        <p className="text-[11px] leading-relaxed text-white/55">
          Movement durations are honest floors set by yard geometry; YNS uplift lands on the wait fields
          (queue + dispatch + secondary checkpoints). Baseline timings reflect the radios-and-clipboards
          world; YNS timings reflect the protocol acting end-to-end. We may be wrong about parts of this —
          your actual numbers will tell us where.
        </p>
      </div>
    </div>
  );
}
