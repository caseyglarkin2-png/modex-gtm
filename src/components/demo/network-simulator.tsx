'use client';

import dynamic from 'next/dynamic';
import { Component, type ReactNode, useMemo, useState } from 'react';
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
 * Diagnostic error boundary so any throw inside the dynamic-loaded
 * Leaflet `Inner` (chunk-load failure, react-leaflet incompat, runtime
 * type error) surfaces as visible text instead of an invisible
 * unmount — which is what we just spent hours debugging.
 */
class MapBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('[YNS sim map] caught error:', error);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-red-50 p-6 text-center text-xs text-red-800">
          <div className="font-semibold">Map failed to mount</div>
          <div className="font-mono text-[10px] opacity-70">{String(this.state.error?.message ?? this.state.error)}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * D4 — Network Simulator surface.
 *
 * Modeled after the yns-network demand-shock prototype: KPI strip across
 * the top, full-width map underneath, scenario chips at the bottom. The
 * KPI tiles all derive from `simulate(pack, config).kpis` so toggling a
 * scenario or YNS produces one coherent state across markers + numbers.
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
    case 'regional':
      return `Regional weather · ${w.region} · ${w.impactPct}%`;
    case 'severe':
      return `Severe weather · ${w.region} · ${w.impactPct}%`;
    case 'carrier-cuts':
      return `Carrier cuts · −${w.reductionPct}%`;
  }
}

// ── KPI tile ────────────────────────────────────────────────────────────────

function Kpi({
  icon,
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'neutral' | 'warn' | 'critical' | 'good';
}) {
  const toneColor: Record<typeof tone, string> = {
    neutral: 'text-stone-900',
    good: 'text-emerald-700',
    warn: 'text-amber-700',
    critical: 'text-red-700',
  };
  return (
    <div className="min-w-0 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-stone-500">
        <span aria-hidden>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className={`mt-0.5 text-base font-semibold tabular-nums ${toneColor[tone]}`}>{value}</div>
      {sub && <div className="text-[10px] uppercase tracking-widest text-stone-400">{sub}</div>}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

export function NetworkSimulator({ pack }: Props) {
  const [config, setConfig] = useState<SimConfig>({
    demandFactor: 1,
    weather: { type: 'none' },
    ynsMode: false,
  });
  const [activePresetId, setActivePresetId] = useState<string | null>('live');
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

  const toggleYns = () => setConfig((c) => ({ ...c, ynsMode: !c.ynsMode }));

  const activePreset = PRESETS.find((p) => p.id === activePresetId);
  const { kpis, countsByRisk } = state;

  // Tone the turnaround tile by current utilization — visual answer to
  // "is YNS helping right now?" even before reading the number.
  const turnaroundTone: 'neutral' | 'warn' | 'critical' | 'good' =
    kpis.truckTurnaroundMin <= 24 ? 'good' : kpis.truckTurnaroundMin <= 36 ? 'neutral' : kpis.truckTurnaroundMin <= 48 ? 'warn' : 'critical';

  return (
    <div className="flex h-full w-full flex-col bg-stone-50">
      {/* Status header — "Operational / Warning / Critical" pill bar */}
      <div className="shrink-0 border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500">Network state</div>
            <div className="mt-0.5 text-sm font-semibold text-stone-900">
              {pack.account.displayName} · {pack.account.siteCount} facilities
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: RISK_COLORS.ok }} />
              <span className="tabular-nums">{countsByRisk.ok}</span>
              <span className="uppercase tracking-widest text-stone-500">Operational</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: RISK_COLORS.tight }} />
              <span className="tabular-nums">{countsByRisk.tight + countsByRisk.overloaded}</span>
              <span className="uppercase tracking-widest text-stone-500">Warning</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: RISK_COLORS.critical }} />
              <span className="tabular-nums">{countsByRisk.critical}</span>
              <span className="uppercase tracking-widest text-stone-500">Critical</span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI grid — 7 modeled operational tiles */}
      <div className="grid shrink-0 grid-cols-2 divide-x divide-y divide-stone-200 border-b border-stone-200 bg-white sm:grid-cols-4 lg:grid-cols-7">
        <Kpi icon="⏱" label="Truck turnaround" value={`${kpis.truckTurnaroundMin} min`} tone={turnaroundTone} />
        <Kpi icon="📦" label="Empty dwell" value={`${kpis.emptyDwellDays} days`} />
        <Kpi icon="✓" label="Pool compliance" value={`${kpis.poolCompliancePct}%`} tone={kpis.poolCompliancePct >= 100 ? 'good' : 'neutral'} />
        <Kpi icon="🚛" label="Drivers waiting" value={kpis.driversAwaitingService} tone={kpis.driversAwaitingService > 0 ? 'warn' : 'neutral'} />
        <Kpi icon="↓" label="Inbound age" value={`${kpis.inboundAgeDays} days`} />
        <Kpi icon="↑" label="Outbound age" value={`${kpis.outboundAgeDays} days`} />
        <Kpi icon="⚠" label="OOS trailers" value={`${kpis.oosTrailersPct}%`} />
      </div>

      {/* Map (flex-1 so it claims remaining vertical room).
          Explicit `h-[420px] md:h-auto` mirrors NetworkAtlas — gives Leaflet
          a concrete height to init against on first mount (it caches size at
          init and renders blank if it computes zero). */}
      <div className="relative h-[420px] flex-1 md:h-auto md:min-h-[320px]">
        <MapBoundary>
          <Inner
            state={state}
            bbox={pack.network.bbox}
            selectedSiteId={selectedSiteId}
            onSelectSite={setSelectedSiteId}
          />
        </MapBoundary>
        {/* Floating active-scenario banner */}
        {activePreset && (
          <div className="pointer-events-none absolute left-3 top-3 max-w-[360px] rounded-md bg-white/95 px-3 py-2 text-[11px] shadow-md backdrop-blur">
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
        {/* Floating utilization readout */}
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-white/95 px-3 py-2 text-[11px] tabular-nums shadow-md backdrop-blur">
          <div className="text-[9px] font-semibold uppercase tracking-widest text-stone-500">Network utilization</div>
          <div
            className="mt-0.5 text-base font-semibold"
            style={{
              color:
                state.totals.utilization > 1.05
                  ? RISK_COLORS.critical
                  : state.totals.utilization > 0.85
                    ? RISK_COLORS.tight
                    : RISK_COLORS.ok,
            }}
          >
            {formatPct(state.totals.utilization)}
          </div>
          <div className="mt-0.5 text-[10px] text-stone-500">
            {formatMoves(Math.round(state.totals.demand))} demand · {formatMoves(Math.round(state.totals.effectiveCapacity))} capacity
          </div>
        </div>
      </div>

      {/* Selected-site detail row */}
      {selectedSiteState && (
        <div className="shrink-0 border-t border-stone-200 bg-stone-50 px-4 py-2.5 text-xs sm:px-6">
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

      {/* Simulations row — preset chips + slider */}
      <div className="shrink-0 border-t border-stone-200 bg-white px-4 py-3 sm:px-6">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3 text-[11px]">
          <span className="font-semibold uppercase tracking-widest text-stone-500">Simulations</span>
          {config.weather.type !== 'none' && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">{weatherChipLabel(config.weather)}</span>
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

        {/* Fine-grained demand slider, collapsed by default.
            Clamped to ±10% — anything larger is theatrical for a daily-ops
            sim. Use the preset chips for named events; this slider is for
            poking the model in the realistic range. */}
        <details className="mt-3 text-[11px] text-stone-600">
          <summary className="cursor-pointer select-none text-stone-500 transition hover:text-stone-900">
            Fine-tune demand factor ({formatPct(config.demandFactor)} of baseline)
          </summary>
          <div className="mt-2 px-1">
            <input
              type="range"
              min={90}
              max={110}
              step={1}
              value={Math.round(config.demandFactor * 100)}
              onChange={(e) => setDemandFactor(Number(e.target.value) / 100)}
              className="w-full accent-stone-900"
              aria-label="Network inbound demand as a percentage of baseline (±10%)"
            />
            <div className="mt-1 flex justify-between text-[10px] uppercase tracking-widest text-stone-400">
              <span>−10%</span>
              <span>baseline</span>
              <span>+10%</span>
            </div>
          </div>
        </details>
      </div>

      {/* Disclaimer */}
      <div className="shrink-0 border-t border-stone-200 bg-stone-50 px-4 py-2.5 text-[11px] leading-relaxed text-stone-500 sm:px-6">
        Throughput, turnaround, dwell, and queue depth are modeled from public yard geometry — dock doors × shifts × per-archetype
        turns/door, with archetype-specific YNS uplift when toggled on. Weather events are geographic capacity reductions on
        affected regions. These are ranges, not point estimates; your actual numbers will tell us where we&rsquo;re wrong.
      </div>
    </div>
  );
}
