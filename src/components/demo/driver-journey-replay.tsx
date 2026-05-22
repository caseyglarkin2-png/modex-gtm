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
    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-xs uppercase tracking-widest text-slate-400">
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
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-200 px-5 py-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-stone-500">
            Driver journey · Archetype {site.archetype}
          </div>
          <h2 className="mt-1 truncate text-base font-semibold text-stone-900">{site.name}</h2>
          <div className="mt-0.5 text-xs text-stone-600">{site.type}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          aria-label="Back to site details"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Map */}
      <div className="relative h-80 w-full shrink-0 overflow-hidden border-b border-stone-200">
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
        <div className="absolute right-2 top-2 flex overflow-hidden rounded-md border border-stone-300 bg-white/95 text-[11px] shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={() => setMode('baseline')}
            className={`px-3 py-1.5 transition ${mode === 'baseline' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
          >
            Without YNS
          </button>
          <button
            type="button"
            onClick={() => setMode('yns')}
            className={`px-3 py-1.5 transition ${mode === 'yns' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
          >
            With YNS
          </button>
        </div>
        {/* Step counter */}
        <div className="absolute bottom-2 left-2 rounded-md bg-white/95 px-3 py-1.5 text-[11px] tabular-nums text-stone-700 shadow-sm backdrop-blur">
          Step {stepIdx + 1} / {scenario.steps.length}
          {phase === 'waiting' && <span className="ml-2 text-stone-500">⏸ waiting</span>}
          {phase === 'done' && <span className="ml-2 text-emerald-700">✓ done</span>}
        </div>
        {/* Lift above Leaflet's attribution control (z-index ~999) so the
            click reaches THIS button, not the OSM/ESRI text underneath.
            `bottom-7` (vs. bottom-2) also moves the button visually off
            the attribution strip. Verify regression with
            `scripts/verify-replay.mjs`. */}
        <button
          type="button"
          onClick={() => setRestartKey((k) => k + 1)}
          className="absolute bottom-7 right-2 z-[1100] rounded-md bg-white/95 px-3 py-1.5 text-[11px] text-stone-700 shadow-sm backdrop-blur transition hover:bg-white"
        >
          ⟲ Replay
        </button>
      </div>

      {/* Narration + delta */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Narration card */}
        {step && (
          <div className="mb-4 border-l-2 pl-4" style={{ borderColor: mode === 'baseline' ? GEOFENCE_COLORS.truckGate : GEOFENCE_COLORS.dropYard }}>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
              {mode === 'baseline' ? 'Without YNS' : 'With YNS'} · {step.step}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-stone-800">{narrationLine}</p>
          </div>
        )}

        {/* Totals */}
        <div className="mb-3 grid grid-cols-3 gap-3 rounded-lg bg-stone-100 px-4 py-3 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500">This run</div>
            <div className="mt-1 text-base font-semibold tabular-nums text-stone-900">{formatMs(totalMs)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500">{mode === 'baseline' ? 'Under YNS' : 'Baseline'}</div>
            <div className="mt-1 text-base font-semibold tabular-nums text-stone-900">{formatMs(altMs)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-emerald-700">YNS saves</div>
            <div className="mt-1 text-base font-semibold tabular-nums text-emerald-700">{formatMs(savedMs)}</div>
          </div>
        </div>

        {/* Conversion CTA — fires right after the prospect sees the YNS-saves
            delta on their own yard. The 30-min audit is the canonical next
            step on yardflow.ai; this just makes it one click away. */}
        <a
          href={`https://yardflow.ai/contact/?intent=audit&utm_source=demo&utm_medium=demo-replay&utm_campaign=${site.id}`}
          target="_blank"
          rel="noopener noreferrer"
          data-ms-cta-id="demo-replay-book-audit"
          className="mb-3 block rounded-lg bg-stone-900 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-stone-700"
        >
          See your real numbers — book a 30-min audit →
        </a>

        {/* Caveat */}
        <p className="text-[11px] leading-relaxed text-stone-500">
          Movement durations are honest floors set by yard geometry; YNS uplift lands on the wait fields
          (queue + dispatch + secondary checkpoints). Baseline timings reflect the radios-and-clipboards
          world; YNS timings reflect the protocol acting end-to-end. We may be wrong about parts of this —
          your actual numbers will tell us where.
        </p>
      </div>
    </div>
  );
}
