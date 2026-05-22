/**
 * D4.1 — Network simulator model.
 *
 * Pure deterministic function. Given a {@link DemoPack} and a
 * {@link SimConfig}, returns a {@link NetworkSimState} that drives the
 * `<NetworkSimulator>` map and status readouts.
 *
 * The model is deliberately legible: every number is derived from one
 * of three sources — yard geometry (dockDoorCount × shifts × archetype-
 * specific turns/day/door), classification-derived YNS uplift, or a
 * named weather event affecting a geographic region. Nothing is sourced
 * from thin air. The accompanying disclaimer in the UI says so.
 */

import type { ArchetypeId, DemoPack, LatLng, Site } from './pack-schema';

// ── Tunables ────────────────────────────────────────────────────────────────

/**
 * Daily turns per dock door at baseline (radios + clipboards) by archetype.
 * Calibrated from public benchmarks: cross-dock DCs and open warehouses
 * run hot (8–10 turns/door/day), manufacturing campuses run slower (6–7),
 * backup-sensitive and multi-step archetypes lose throughput to the
 * checkpoint stacking they're named after.
 */
const TURNS_PER_DOOR: Record<ArchetypeId, number> = {
  '#1': 8, // Gate + GS standard
  '#2': 9, // separate in/out lanes speed flow
  '#3': 10, // open access
  '#4': 6, // backup-sensitive — queue spillover kills flow
  '#5': 6, // multi-step check-in
  '#6': 7, // campus — longer driveway times
  '#7': 8, // fast-lane opportunity (the baseline; YNS unlocks it)
  '#8': 7, // scale stop
  '#9': 9, // remote check-in (no guard bottleneck)
  '#10': 8, // ship/rcv separate
};

/**
 * Throughput multiplier when YNS is applied. Bigger uplifts on archetypes
 * where the constraint is queue + dispatch friction (backup-sensitive,
 * multi-step, fast-lane); smaller on already-open or low-gate-friction
 * archetypes. Numbers tuned conservative (~12% below earlier draft) so a
 * sophisticated buyer reads the With-YNS delta as believable, not
 * marketing math. Primo's published numbers still run higher than this.
 */
const YNS_UPLIFT: Record<ArchetypeId, number> = {
  '#1': 1.25,
  '#2': 1.2,
  '#3': 1.1,
  '#4': 1.45,
  '#5': 1.4,
  '#6': 1.3,
  '#7': 1.4,
  '#8': 1.25,
  '#9': 1.18,
  '#10': 1.3,
};

/**
 * Per-archetype baseline LOAD index — what fraction of theoretical
 * capacity the yard typically operates at under "live network" steady
 * state. Open-access yards (#3, #9) run with slack; backup-sensitive
 * ones (#4) live at the edge. Without this, the demo's default sim view
 * shows every site at exactly 100% utilization (all yellow), which
 * reads as "everything is at capacity" with no visual differentiation.
 * With it, the live view shows a mix of operational / warning /
 * critical that varies by archetype — much closer to what a real
 * network looks like, and a stronger first impression.
 */
const ARCHETYPE_BASELINE_LOAD: Record<ArchetypeId, number> = {
  '#1': 0.9, // standard gate + GS
  '#2': 0.82, // separate in/out lanes — slack
  '#3': 0.75, // open access — most slack
  '#4': 1.08, // backup-sensitive — overloaded at baseline (red)
  '#5': 0.98, // multi-step — at the edge
  '#6': 0.92, // campus
  '#7': 0.94, // fast-lane opportunity
  '#8': 0.88, // scale stop
  '#9': 0.78, // remote check-in — slack
  '#10': 0.86, // ship/rcv separate
};

/**
 * Operating shifts per day, conservative default. Sites without
 * operational data are assumed 2-shift (the public benchmark for
 * multi-temp CPG and DC operations).
 */
const DEFAULT_SHIFTS = 2;

// ── Weather event modeling ──────────────────────────────────────────────────

export interface RegionTest {
  /** Returns true when `latLng` falls inside this region. */
  match: (latLng: LatLng) => boolean;
  /** Capacity multiplier on affected sites (0.0–1.0). */
  capacityMultiplier: number;
}

/**
 * Region matchers. Lat/lng boxes are deliberate over-approximations
 * (state lines are messier than rectangles) — close enough for a demo
 * that's already disclaiming itself as modeled. Capacity multipliers
 * are passed at the event level (not hard-coded per region) so the
 * same region can be cited at "regional weather" (10% impact) and
 * "severe weather" (20% impact) intensities — matching the original
 * yns-network demand-shock prototype's intensity model.
 */
const REGIONS: Record<string, (p: LatLng) => boolean> = {
  // Texas / Louisiana / Mississippi / Alabama / FL panhandle coastal.
  gulf: (p) => p.lat >= 24 && p.lat <= 31 && p.lng >= -98 && p.lng <= -82,
  // Florida peninsula.
  florida: (p) => p.lat >= 24 && p.lat <= 31 && p.lng >= -88 && p.lng <= -79.5,
  // VA / NC / SC / GA Atlantic strip.
  'east-coast': (p) => p.lat >= 30 && p.lat <= 39 && p.lng >= -82 && p.lng <= -75,
  // NY / NJ / PA / CT / MA / ME / NH / VT / RI / DE / MD.
  northeast: (p) => p.lat >= 38 && p.lat <= 47 && p.lng >= -80 && p.lng <= -67,
  // ND / SD / MN / WI / IL / IA / MI / OH / IN.
  midwest: (p) => p.lat >= 38 && p.lat <= 49 && p.lng >= -104 && p.lng <= -80,
};

export type WeatherRegion = 'gulf' | 'florida' | 'east-coast' | 'northeast' | 'midwest';

export type WeatherEvent =
  | { type: 'none' }
  | {
      type: 'regional';
      region: WeatherRegion;
      /** Capacity impact pct (10 = 10% capacity reduction on affected sites). */
      impactPct: number;
    }
  | {
      type: 'severe';
      region: WeatherRegion;
      impactPct: number;
    }
  /** Network-wide carrier-capacity reduction (driver shortage / spot-rate spike). */
  | { type: 'carrier-cuts'; reductionPct: number };

function siteWeatherMultiplier(site: Site, event: WeatherEvent): number {
  switch (event.type) {
    case 'none':
      return 1;
    case 'regional':
    case 'severe': {
      const test = REGIONS[event.region];
      return test(site.center) ? 1 - event.impactPct / 100 : 1;
    }
    case 'carrier-cuts':
      // Carrier cuts hit every site uniformly — there's no region geography
      // to it; it's a network-wide trailer-availability story.
      return 1 - event.reductionPct / 100;
  }
}

// ── Public types ─────────────────────────────────────────────────────────────

export interface SimConfig {
  /** 1.0 = baseline; 1.5 = +50% surge; 0.5 = −50% collapse. */
  demandFactor: number;
  weather: WeatherEvent;
  /** When true, applies the per-archetype YNS_UPLIFT multiplier. */
  ynsMode: boolean;
}

export type RiskLevel = 'ok' | 'tight' | 'overloaded' | 'critical';

export interface SiteSimState {
  siteId: string;
  name: string;
  archetype: ArchetypeId;
  center: LatLng;
  /** Moves/day capacity at baseline (radios + clipboards). */
  baselineThroughput: number;
  /** Capacity after YNS uplift × weather multiplier. */
  effectiveCapacity: number;
  /** Moves/day asked of this site under the current demandFactor. */
  demand: number;
  /** demand / effectiveCapacity. >1.0 means the yard is over-tasked. */
  utilization: number;
  riskLevel: RiskLevel;
  /** Whether weather is affecting this site. */
  weatherAffected: boolean;
}

export interface NetworkSimState {
  sites: SiteSimState[];
  totals: {
    /** Sum of baselineThroughput across the network. */
    baselineCapacity: number;
    /** Sum of effectiveCapacity. */
    effectiveCapacity: number;
    /** Sum of demand. */
    demand: number;
    /** demand / effectiveCapacity for the whole network. */
    utilization: number;
  };
  countsByRisk: Record<RiskLevel, number>;
}

// NOTE: dollar / operational KPI derivations (truck turnaround, empty
// dwell, pool compliance, drivers waiting, inbound/outbound age, OOS
// trailers) were intentionally removed. The ONLY approved YardFlow value
// model lives at https://yardflow.ai/roi — every demo surface links to
// it. We do NOT recompute the model here, faithfully or otherwise. The
// `simulate()` function below only computes per-site capacity proxies
// (dock doors × shifts × per-archetype turns) and risk classification
// for the network-state map. Treat that as visual scaffolding, not as
// operational truth.

// ── Helpers (capacity + risk only — NO dollar/time KPIs) ────────────────────

function classifyRisk(utilization: number): RiskLevel {
  if (utilization > 1.3) return 'critical';
  if (utilization > 1.05) return 'overloaded';
  if (utilization > 0.85) return 'tight';
  return 'ok';
}

function siteBaselineThroughput(site: Site): number {
  // Sites with no dock doors (offices) get a tiny non-zero throughput so
  // they still render on the map but never dominate demand math.
  const doors = Math.max(1, site.yardMetrics.dockDoorCount ?? 1);
  const turns = TURNS_PER_DOOR[site.archetype] ?? 7;
  return doors * DEFAULT_SHIFTS * turns;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Run one tick of the network simulation. Deterministic — same inputs
 * always produce the same outputs. Use this as the single source for
 * the map markers + the status readouts; never derive state in two
 * places.
 */
export function simulate(pack: DemoPack, config: SimConfig): NetworkSimState {
  // First pass: compute baseline throughput per site and the network total.
  const baselines = pack.network.sites.map(siteBaselineThroughput);
  const totalBaseline = baselines.reduce((sum, n) => sum + n, 0);

  // Second pass: compute per-site demand + effective capacity.
  const sites: SiteSimState[] = pack.network.sites.map((site, i) => {
    const baseline = baselines[i]!;
    const ynsMul = config.ynsMode ? YNS_UPLIFT[site.archetype] : 1;
    const weatherMul = siteWeatherMultiplier(site, config.weather);
    const effectiveCapacity = baseline * ynsMul * weatherMul;
    // Demand = baseline capacity × per-archetype load index × scenario
    // demand factor. The load index is what makes the LIVE view show a
    // believable mix (some green, a few yellow, occasional red) instead
    // of every-site-at-100%. YNS changes the *capacity* curve, not what
    // the customer wants moved, so demand is independent of ynsMode.
    const loadIdx = ARCHETYPE_BASELINE_LOAD[site.archetype] ?? 0.9;
    const demand = baseline * loadIdx * config.demandFactor;
    const utilization = effectiveCapacity > 0 ? demand / effectiveCapacity : 0;
    const weatherAffected = weatherMul < 1;
    return {
      siteId: site.id,
      name: site.name,
      archetype: site.archetype,
      center: site.center,
      baselineThroughput: baseline,
      effectiveCapacity,
      demand,
      utilization,
      riskLevel: classifyRisk(utilization),
      weatherAffected,
    };
  });

  const totalDemand = sites.reduce((s, x) => s + x.demand, 0);
  const totalEffective = sites.reduce((s, x) => s + x.effectiveCapacity, 0);
  const networkUtilization = totalEffective > 0 ? totalDemand / totalEffective : 0;

  const countsByRisk: Record<RiskLevel, number> = { ok: 0, tight: 0, overloaded: 0, critical: 0 };
  for (const s of sites) countsByRisk[s.riskLevel]++;

  return {
    sites,
    totals: {
      baselineCapacity: totalBaseline,
      effectiveCapacity: totalEffective,
      demand: totalDemand,
      utilization: networkUtilization,
    },
    countsByRisk,
  };
}

// ── Presets ─────────────────────────────────────────────────────────────────

export interface ScenarioPreset {
  id: string;
  label: string;
  /** One-line caption shown alongside the preset chip and in the active-scenario banner. */
  caption: string;
  config: Pick<SimConfig, 'demandFactor' | 'weather'>;
}

/**
 * Scenario presets surfaced in the simulator UI. Mirrors the original
 * yns-network demand-shock prototype:
 *   Live · Demand +10% · Demand −10% · Regional weather · Severe weather
 *
 * Magnitudes deliberately kept conservative (single-digit percent on
 * demand, 10–20% on weather impact). The original's numbers — and ours —
 * are sized so that even small shocks compound into visible network-state
 * deltas, not so big that every preset turns the whole map red.
 */
export const PRESETS: ScenarioPreset[] = [
  {
    id: 'live',
    label: 'Live network',
    caption: 'Steady-state. Every site at nominal demand, no weather event in play.',
    config: { demandFactor: 1, weather: { type: 'none' } },
  },
  {
    id: 'demand-up',
    label: 'Demand +10%',
    caption: 'Sudden 10% lift in inbound — promo cycle, retail pull-forward, post-storm rebound.',
    config: { demandFactor: 1.1, weather: { type: 'none' } },
  },
  {
    id: 'demand-down',
    label: 'Demand −10%',
    caption: 'Network demand falls off 10% — retail pull-down, contract churn, demand-side shock.',
    config: { demandFactor: 0.9, weather: { type: 'none' } },
  },
  {
    id: 'regional-weather-ne',
    label: 'Regional weather (NE, 10%)',
    caption: 'Northeast regional storm reduces affected-site capacity by 10%.',
    config: {
      demandFactor: 1,
      weather: { type: 'regional', region: 'northeast', impactPct: 10 },
    },
  },
  {
    id: 'severe-hurricane',
    label: 'Severe weather (Hurricane, 20%)',
    caption: 'Gulf-Coast hurricane reduces affected-site capacity by 20%. Demand lifts 5% on rebound.',
    config: {
      demandFactor: 1.05,
      weather: { type: 'severe', region: 'gulf', impactPct: 20 },
    },
  },
];

/** Risk-level colors. Single source of truth for both the map and the status block. */
export const RISK_COLORS: Record<RiskLevel, string> = {
  ok: '#10b981', // emerald — under capacity
  tight: '#facc15', // yellow — at capacity
  overloaded: '#fb923c', // orange — over capacity
  critical: '#ef4444', // red — substantially overloaded
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  ok: 'Within capacity',
  tight: 'At capacity',
  overloaded: 'Over capacity',
  critical: 'Critically overloaded',
};
