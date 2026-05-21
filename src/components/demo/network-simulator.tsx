'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import type { DemoPack } from '@/lib/demo/pack-schema';
import {
  PRESETS,
  RISK_COLORS,
  RISK_LABELS,
  simulate,
  type RiskLevel,
  type ScenarioPreset,
  type SimConfig,
  type WeatherEvent,
} from '@/lib/demo/network-sim';

/**
 * D4 — Network Simulator surface.
 *
 * Outer client component owns the SimConfig state, runs the deterministic
 * simulation on every render, and lays out the map + controls + status
 * block. Inner Leaflet map is dynamic-imported (ssr:false).
 */

const Inner = dynamic(() => import('./network-simulator-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-xs uppercase tracking-widest text-slate-400">
      Loading simulator…
    </div>
  ),
});

interface Props {
  pack: DemoPack;
}

function formatPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function formatMoves(n: number): string {
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

function weatherChipLabel(w: WeatherEvent): string {
  switch (w.type) {
    case 'none':
      return 'No weather';
    case 'hurricane':
      return `Hurricane · ${w.region}`;
    case 'winter-storm':
      return `Winter storm · ${w.region}`;
    case 'carrier-cuts':
      return `Carrier cuts · −${w.reductionPct}%`;
  }
}

export function NetworkSimulator({ pack }: Props) {
  const [config, setConfig] = useState<SimConfig>({
    demandFactor: 1,
    weather: { type: 'none' },
    ynsMode: false,
  });
  const [activePresetId, setActivePresetId] = useState<string | null>('baseline');
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const state = useMemo(() => simulate(pack, config), [pack, config]);
  const selectedSiteState = selectedSiteId ? state.sites.find((s) => s.siteId === selectedSiteId) : null;

  const applyPreset = (preset: ScenarioPreset) => {
    setConfig((c) => ({ ...c, ...preset.config }));
    setActivePresetId(preset.id);
  };

  const setDemandFactor = (n: number) => {
    setConfig((c) => ({ ...c, demandFactor: n }));
    setActivePresetId(null); // freeform — no preset active
  };

  const toggleYns = () => {
    setConfig((c) => ({ ...c, ynsMode: !c.ynsMode }));
  };

  const activePreset = PRESETS.find((p) => p.id === activePresetId);

  return (
    <div className="flex h-full flex-col">
      {/* Map (flex-1 to take all remaining vertical room) */}
      <div className="relative flex-1 min-h-[360px]">
        <Inner
          state={state}
          bbox={pack.network.bbox}
          selectedSiteId={selectedSiteId}
          onSelectSite={setSelectedSiteId}
        />
        {/* Floating active-scenario banner */}
        {activePreset && (
          <div className="pointer-events-none absolute left-3 top-3 max-w-[340px] rounded-md bg-white/95 px-3 py-2 text-[11px] shadow-md backdrop-blur">
            <div className="text-[9px] font-semibold uppercase tracking-widest text-stone-500">Simulating</div>
            <div className="mt-0.5 text-xs font-medium text-stone-900">{activePreset.label}</div>
            <div className="mt-1 text-[11px] leading-snug text-stone-600">{activePreset.caption}</div>
          </div>
        )}
        {/* Floating YNS toggle */}
        <div className="absolute right-3 top-3 flex overflow-hidden rounded-md border border-stone-300 bg-white/95 text-[11px] shadow-md backdrop-blur">
          <button
            type="button"
            onClick={toggleYns}
            className={`px-3 py-1.5 transition ${!config.ynsMode ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
          >
            Without YNS
          </button>
          <button
            type="button"
            onClick={toggleYns}
            className={`px-3 py-1.5 transition ${config.ynsMode ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
          >
            With YNS
          </button>
        </div>
      </div>

      {/* Controls + status */}
      <div className="shrink-0 border-t border-stone-200 bg-white">
        {/* Status row */}
        <div className="grid grid-cols-2 gap-3 border-b border-stone-200 px-4 py-3 text-xs sm:grid-cols-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500">Demand</div>
            <div className="mt-0.5 text-sm font-semibold tabular-nums text-stone-900">{formatMoves(Math.round(state.totals.demand))} <span className="text-[10px] font-normal text-stone-500">moves·day</span></div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500">Capacity {config.ynsMode ? '(YNS)' : '(baseline)'}</div>
            <div className="mt-0.5 text-sm font-semibold tabular-nums text-stone-900">{formatMoves(Math.round(state.totals.effectiveCapacity))} <span className="text-[10px] font-normal text-stone-500">moves·day</span></div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500">Utilization</div>
            <div
              className="mt-0.5 text-sm font-semibold tabular-nums"
              style={{
                color: state.totals.utilization > 1.05 ? RISK_COLORS.critical : state.totals.utilization > 0.85 ? RISK_COLORS.tight : RISK_COLORS.ok,
              }}
            >
              {formatPct(state.totals.utilization)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500">At-risk sites</div>
            <div className="mt-0.5 flex items-center gap-2 text-sm font-semibold tabular-nums text-stone-900">
              <span style={{ color: RISK_COLORS.critical }}>{state.countsByRisk.critical}</span>
              <span className="text-stone-400">/</span>
              <span style={{ color: RISK_COLORS.overloaded }}>{state.countsByRisk.overloaded}</span>
              <span className="text-stone-400">/</span>
              <span style={{ color: RISK_COLORS.tight }}>{state.countsByRisk.tight}</span>
              <span className="text-[10px] font-normal text-stone-500">crit / over / tight</span>
            </div>
          </div>
        </div>

        {/* Selected-site detail row (only when a site is clicked) */}
        {selectedSiteState && (
          <div className="border-b border-stone-200 bg-stone-50 px-4 py-2.5 text-xs">
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <span className="font-medium text-stone-900">{selectedSiteState.name}</span>{' '}
                <span className="text-[10px] uppercase tracking-widest text-stone-500">{selectedSiteState.archetype}</span>
                {selectedSiteState.weatherAffected && <span className="ml-2 text-[10px] font-medium text-amber-700">⚠ weather-affected</span>}
              </div>
              <button
                type="button"
                onClick={() => setSelectedSiteId(null)}
                className="shrink-0 text-[10px] uppercase tracking-widest text-stone-400 transition hover:text-stone-700"
              >
                clear
              </button>
            </div>
            <div className="mt-1 tabular-nums text-stone-600">
              {Math.round(selectedSiteState.demand)} demand · {Math.round(selectedSiteState.effectiveCapacity)} capacity ·{' '}
              <span className="font-medium" style={{ color: RISK_COLORS[selectedSiteState.riskLevel as RiskLevel] }}>
                {RISK_LABELS[selectedSiteState.riskLevel as RiskLevel]} ({formatPct(selectedSiteState.utilization)})
              </span>
            </div>
          </div>
        )}

        {/* Demand slider */}
        <div className="px-4 py-3">
          <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
            <label htmlFor="sim-demand" className="font-semibold uppercase tracking-widest text-stone-500">
              Inbound demand
            </label>
            <span className="tabular-nums text-stone-900">{formatPct(config.demandFactor)} of baseline</span>
          </div>
          <input
            id="sim-demand"
            type="range"
            min={0}
            max={200}
            step={5}
            value={Math.round(config.demandFactor * 100)}
            onChange={(e) => setDemandFactor(Number(e.target.value) / 100)}
            className="w-full accent-stone-900"
            aria-label="Network inbound demand as a percentage of baseline"
          />
          <div className="mt-1 flex justify-between text-[10px] uppercase tracking-widest text-stone-400">
            <span>−100% collapse</span>
            <span>baseline</span>
            <span>+100% surge</span>
          </div>
        </div>

        {/* Scenario chips */}
        <div className="border-t border-stone-200 px-4 py-3">
          <div className="mb-2 flex items-baseline justify-between text-[11px]">
            <span className="font-semibold uppercase tracking-widest text-stone-500">Scenarios</span>
            {config.weather.type !== 'none' && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                {weatherChipLabel(config.weather)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className={`rounded-full border px-3 py-1 text-[11px] transition ${
                  activePresetId === p.id
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
                }`}
                title={p.caption}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-stone-200 bg-stone-50 px-4 py-2.5 text-[11px] leading-relaxed text-stone-500">
          Throughput is modeled — dock doors × shifts × per-archetype turns per door, with archetype-specific YNS uplift
          when toggled on. Weather events are geographic capacity reductions on affected regions. These are ranges, not
          point estimates; your actual numbers will tell us where we&rsquo;re wrong.
        </div>
      </div>
    </div>
  );
}
