'use client';

import dynamic from 'next/dynamic';
import { Component, type ReactNode, useMemo, useState } from 'react';
import type { DemoPack } from '@/lib/demo/pack-schema';
import { RoiCtaButton } from './roi-cta-button';
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
    // G.T4 — CLS-free skeleton. Fills the parent's reserved height
    // (h-[420px]/md:h-[520px]) so there is zero layout shift on hydrate.
    <div
      className="motion-safe:animate-pulse flex h-full w-full items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,180,255,0.08), transparent 70%), linear-gradient(180deg, #0a0c10, #050505)',
      }}
      aria-busy="true"
      aria-label="Loading network simulator"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
        Loading network simulator…
      </span>
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
    neutral: 'text-white',
    good: 'text-emerald-700',
    warn: 'text-amber-700',
    critical: 'text-red-700',
  };
  return (
    <div className="min-w-0 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-white/55">
        <span aria-hidden>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className={`mt-0.5 text-base font-semibold tabular-nums ${toneColor[tone]}`}>{value}</div>
      {sub && <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">{sub}</div>}
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
  const { countsByRisk } = state;

  // Audit-derived facts (real, not modeled). These are the only numbers
  // we surface on the demo's KPI strip — operational dollar/time values
  // live exclusively at yardflow.ai/roi (the only approved model).
  const dropYardSites = pack.network.sites.filter((s) => s.classification.dropYard).length;
  const archetypeCounts: Record<string, number> = {};
  pack.network.sites.forEach((s) => {
    archetypeCounts[s.archetype] = (archetypeCounts[s.archetype] ?? 0) + 1;
  });
  const topArchetype = Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1])[0];

  // Scope blurb — mirror the header in demo-surface.tsx so the sim's
  // "Network state" line doesn't read as a claim about the entire
  // network when we only audited a subset.
  const cov = pack.account.coverageNote;
  const globalCount = cov?.totalGlobalFootprint;
  const networkScopeBlurb =
    globalCount && globalCount > pack.account.siteCount
      ? `${pack.account.siteCount} of ~${globalCount} facilities${cov?.auditedScope ? ` (${cov.auditedScope})` : ''}`
      : cov?.estimatedFootprint && cov.estimatedFootprint > pack.account.siteCount
        ? `${pack.account.siteCount} of ~${cov.estimatedFootprint} facilities${cov?.auditedScope ? ` (${cov.auditedScope})` : ''}`
        : `${pack.account.siteCount} facilities`;
  const facilitiesTileValue =
    globalCount && globalCount > pack.account.siteCount
      ? `${pack.account.siteCount} / ${globalCount}`
      : cov?.estimatedFootprint && cov.estimatedFootprint > pack.account.siteCount
        ? `${pack.account.siteCount} / ${cov.estimatedFootprint}`
        : `${pack.account.siteCount}`;

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0c10]">
      {/* Status header — "Operational / Warning / Critical" pill bar */}
      <div className="shrink-0 border-b border-[#00B4FF]/[0.16] bg-transparent px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/55">Network state</div>
            <div className="mt-0.5 text-sm font-semibold text-white">
              {pack.account.displayName} · {networkScopeBlurb}
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: RISK_COLORS.ok }} />
              <span className="tabular-nums">{countsByRisk.ok}</span>
              <span className="font-mono uppercase tracking-[0.18em] text-white/55">Operational</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: RISK_COLORS.tight }} />
              <span className="tabular-nums">{countsByRisk.tight + countsByRisk.overloaded}</span>
              <span className="font-mono uppercase tracking-[0.18em] text-white/55">Warning</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: RISK_COLORS.critical }} />
              <span className="tabular-nums">{countsByRisk.critical}</span>
              <span className="font-mono uppercase tracking-[0.18em] text-white/55">Critical</span>
            </span>
          </div>
        </div>
      </div>

      {/* Audit-derived facts. NO modeled operational metrics here — the
          ONLY approved value model is at yardflow.ai/roi, which the CTA
          below routes to. Every number on this strip is a count or sum
          straight off the audit JSON. */}
      <div className="grid shrink-0 grid-cols-2 divide-x divide-y divide-[#00B4FF]/[0.16] border-b border-[#00B4FF]/[0.16] bg-transparent sm:grid-cols-3 lg:grid-cols-6">
        <Kpi
          icon="🏭"
          label={cov?.auditedScope ? `Facilities (${cov.auditedScope}/total)` : 'Facilities audited'}
          value={facilitiesTileValue}
        />
        <Kpi icon="🚪" label="Dock doors" value={pack.network.totals.dockDoors.toLocaleString()} />
        <Kpi icon="🚛" label="Trailer spots" value={pack.network.totals.trailerCapacity.toLocaleString()} />
        <Kpi icon="🚉" label="Rail-served" value={pack.network.totals.railServed} />
        <Kpi icon="📦" label="Drop-yard sites" value={`${dropYardSites} / ${pack.account.siteCount}`} />
        <Kpi icon="🏷" label="Top archetype" value={topArchetype ? `${topArchetype[0]} · ${topArchetype[1]}×` : '—'} />
      </div>

      {/* ROI / Sales-deck CTA strip — the ONLY place dollar values live.
          Routes prospects to yardflow.ai/roi (the approved value model)
          and yardflow.ai/YNS (the sales deck hub). The demo itself never
          surfaces modeled dollar/time metrics — every operational number
          a prospect should care about lives at /roi. */}
      <div className="shrink-0 border-b border-[#00B4FF]/[0.16] bg-[#101218] px-4 py-3 text-white sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/55">Model the dollar value of this network</div>
            <div className="mt-0.5 text-sm">
              <span className="font-semibold text-white">Approved ROI model</span>
              <span className="text-white/55"> · 11.5× legacy YMS · $87.4M model across 50 sites</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 text-xs">
            <a
              href={`https://yardflow.ai/contact/?intent=audit&utm_source=demo&utm_medium=demo-sim&utm_campaign=${pack.account.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] border border-[#00B4FF]/55 bg-[#00B4FF]/[0.12] px-3 py-1.5 text-xs font-bold text-white transition-all hover:border-[#00B4FF]/90 hover:bg-[#00B4FF]/[0.22] hover:shadow-[0_0_22px_rgba(0,180,255,0.32)]"
              style={{ boxShadow: '0 0 0 1px rgba(0, 180, 255, 0.18) inset, 0 6px 18px rgba(0, 0, 0, 0.35)' }}
              data-ms-cta-id="demo-sim-book-audit"
            >
              Book a 30-min audit →
            </a>
            <RoiCtaButton
              pack={pack}
              ctaId="demo-sim-to-roi"
              utmMedium="demo-sim"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] border border-[#00B4FF]/[0.20] bg-transparent px-3 py-1.5 text-xs font-medium text-white transition-all hover:border-[#00B4FF]/55 hover:bg-[#00B4FF]/[0.08]"
            >
              ROI Calculator →
            </RoiCtaButton>
            <a
              href={`https://yardflow.ai/YNS/?utm_source=demo&utm_medium=demo-sim&utm_campaign=${pack.account.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-[#00B4FF]/[0.20] px-3 py-1.5 text-white/85 transition hover:border-[#00B4FF]/55 hover:text-white"
              data-ms-cta-id="demo-sim-to-yns"
            >
              Sales deck →
            </a>
          </div>
        </div>
      </div>

      {/* Map wrapper.
          CRITICAL: use CONCRETE pixel heights (`h-[420px]` mobile,
          `md:h-[520px]` desktop) — NOT flex-1 / md:h-auto / min-h.
          MapContainer inside has `style={height: '100%'}`. CSS spec:
          percentage heights only resolve against an explicit `height`,
          NOT against `min-height` or flex-allocated `auto`. Because the
          MapContainer is the wrapper's only non-absolute child, an
          `auto` wrapper height creates a circular dependency that CSS
          resolves to 0 — the symptom: getSize() returns 1280x0 and the
          map renders as an 8px outline-only bar. NetworkAtlas avoids
          this because its parent is flex-row on desktop, so the wrapper
          gets cross-axis stretched (a definite height). Sim's parent is
          flex-col — no stretch — so we hardcode height. */}
      <div className="relative h-[420px] md:h-[520px]">
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
          <div className="pointer-events-none absolute left-3 top-3 max-w-[360px] rounded-md border border-[#00B4FF]/[0.16] bg-[#101218]/95 px-3 py-2 text-[11px] shadow-md backdrop-blur">
            <div className="text-[9px] font-mono font-semibold uppercase tracking-[0.18em] text-white/55">Simulating</div>
            <div className="mt-0.5 text-xs font-medium text-white">{activePreset.label}</div>
            <div className="mt-1 text-[11px] leading-snug text-white/70">{activePreset.caption}</div>
          </div>
        )}
        {/* Floating YNS toggle */}
        <div className="absolute right-3 top-3 flex overflow-hidden rounded-md border border-[#00B4FF]/[0.20] bg-[#101218]/95 text-[11px] shadow-md backdrop-blur">
          <button
            type="button"
            onClick={toggleYns}
            className={`px-3 py-1.5 transition ${!config.ynsMode ? 'bg-[#00B4FF]/[0.22] text-white' : 'text-white/85 hover:bg-[#00B4FF]/[0.08]'}`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={toggleYns}
            className={`px-3 py-1.5 transition ${config.ynsMode ? 'bg-[#00B4FF]/[0.22] text-white' : 'text-white/85 hover:bg-[#00B4FF]/[0.08]'}`}
          >
            With YardFlow
          </button>
        </div>
        {/* Floating utilization readout */}
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-[#00B4FF]/[0.16] bg-[#101218]/95 px-3 py-2 text-[11px] tabular-nums shadow-md backdrop-blur">
          <div className="text-[9px] font-mono font-semibold uppercase tracking-[0.18em] text-white/55">Network utilization</div>
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
          <div className="mt-0.5 text-[10px] text-white/55">
            {formatMoves(Math.round(state.totals.demand))} demand · {formatMoves(Math.round(state.totals.effectiveCapacity))} capacity
          </div>
        </div>
      </div>

      {/* Selected-site detail row */}
      {selectedSiteState && (
        <div className="shrink-0 border-t border-[#00B4FF]/[0.16] bg-[#0a0c10] px-4 py-2.5 text-xs sm:px-6">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <span className="font-medium text-white">{selectedSiteState.name}</span>{' '}
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/55">{selectedSiteState.archetype}</span>
              {selectedSiteState.weatherAffected && <span className="ml-2 text-[10px] font-medium text-amber-700">⚠ weather-affected</span>}
            </div>
            <button
              type="button"
              onClick={() => setSelectedSiteId(null)}
              className="shrink-0 text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 transition hover:text-white/85"
            >
              clear
            </button>
          </div>
          <div className="mt-1 tabular-nums text-white/70">
            {Math.round(selectedSiteState.demand)} demand · {Math.round(selectedSiteState.effectiveCapacity)} capacity ·{' '}
            <span className="font-medium" style={{ color: RISK_COLORS[selectedSiteState.riskLevel as RiskLevel] }}>
              {RISK_LABELS[selectedSiteState.riskLevel as RiskLevel]} ({formatPct(selectedSiteState.utilization)})
            </span>
          </div>
        </div>
      )}

      {/* Simulations row — preset chips + slider */}
      <div className="shrink-0 border-t border-[#00B4FF]/[0.16] bg-transparent px-4 py-3 sm:px-6">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3 text-[11px]">
          <span className="font-mono font-semibold uppercase tracking-[0.18em] text-white/55">Simulations</span>
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
                  ? 'border-[#00B4FF]/55 bg-[#00B4FF]/[0.22] text-white'
                  : 'border-[#00B4FF]/[0.20] bg-transparent text-white/85 hover:border-[#00B4FF]/55 hover:bg-[#00B4FF]/[0.08]'
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
        <details className="mt-3 text-[11px] text-white/70">
          <summary className="cursor-pointer select-none text-white/55 transition hover:text-white">
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
              className="w-full accent-[#00B4FF]"
              aria-label="Network inbound demand as a percentage of baseline (±10%)"
            />
            <div className="mt-1 flex justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
              <span>−10%</span>
              <span>baseline</span>
              <span>+10%</span>
            </div>
          </div>
        </details>
      </div>

      {/* Disclaimer */}
      <div className="shrink-0 border-t border-[#00B4FF]/[0.16] bg-[#0a0c10] px-4 py-2.5 text-[11px] leading-relaxed text-white/55 sm:px-6">
        Per-site capacity is modeled from public yard geometry — dock doors × shifts × per-archetype turns/door, with
        archetype-specific YNS uplift when toggled on. Weather events are geographic capacity reductions on affected
        regions. <strong className="font-semibold text-white/85">All dollar and operational metrics live at{' '}
        <a href="https://yardflow.ai/roi/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
          yardflow.ai/roi
        </a>{' '}— the approved YardFlow ROI model.</strong>
      </div>
    </div>
  );
}
