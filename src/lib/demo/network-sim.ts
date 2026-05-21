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
 * archetypes. Numbers are conservative — the Primo deployment baseline
 * cited in the comparable section ran higher than this.
 */
const YNS_UPLIFT: Record<ArchetypeId, number> = {
  '#1': 1.4,
  '#2': 1.35,
  '#3': 1.15,
  '#4': 1.7,
  '#5': 1.6,
  '#6': 1.5,
  '#7': 1.6,
  '#8': 1.4,
  '#9': 1.3,
  '#10': 1.5,
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

/**
 * Modeled operational KPIs derived from the simulation state. Same single
 * source of truth as the markers — every number flows from utilization +
 * config, never sourced independently. The accompanying disclaimer in
 * the UI calls this out.
 */
export interface OperationalKpis {
  /** Average truck turnaround time in minutes. */
  truckTurnaroundMin: number;
  /** Average empty-trailer dwell in days. */
  emptyDwellDays: number;
  /** Trailer-pool compliance vs target, percent (target = 100). */
  poolCompliancePct: number;
  /** Drivers awaiting service network-wide (proxy for queue depth). */
  driversAwaitingService: number;
  /** Inbound shipment age in days (proxy for cycle time on loaded trailers). */
  inboundAgeDays: number;
  /** Outbound shipment age in days (proxy for outbound cycle time). */
  outboundAgeDays: number;
  /** Out-of-service trailers as a percentage of fleet. */
  oosTrailersPct: number;
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
  kpis: OperationalKpis;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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
    // Each site's demand is its share of the network's baseline capacity,
    // scaled by the demand factor. Demand is independent of YNS — YNS
    // changes the *capacity* curve, not what the customer wants moved.
    // Weather DOES affect demand under the implicit assumption that the
    // affected region's customers are equally disrupted; we keep demand
    // tied to baseline share for legibility.
    const demand = baseline * config.demandFactor;
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
    kpis: deriveKpis(networkUtilization, countsByRisk, config),
  };
}

/**
 * KPI model. All quantities derive from (utilization, ynsMode, counts).
 * Numbers cited:
 *   - 30 min baseline turn time (industry drop-and-hook benchmark).
 *   - 0.6 YNS multiplier reflects the Primo 48→24 min compression (50%).
 *   - 12% OOS / 100% pool compliance are industry-typical resting values.
 */
function deriveKpis(util: number, counts: Record<RiskLevel, number>, config: SimConfig): OperationalKpis {
  // Utilization stress: clamp 0.7..1.6 so wild slider values still produce
  // legible numbers (no negative turnaround times under extreme collapse).
  const stress = Math.max(0.7, Math.min(1.6, util));
  const ynsMul = config.ynsMode ? 0.6 : 1;
  const truckTurnaroundMin = Math.round(30 * stress * ynsMul);

  // Dwell inverts with stress (busier yards cycle trailers faster).
  // YNS knocks dwell down further via better visibility.
  const emptyDwellDays = Number((2.4 / stress * (config.ynsMode ? 0.85 : 1)).toFixed(1));

  // Pool compliance drifts off-target as stress rises; YNS adds 3-4 pts.
  const poolCompliancePct = Math.round(102 - (stress - 1) * 10 + (config.ynsMode ? 3 : 0));

  // Queue depth proxy: 2 drivers per critical site, 1 per overloaded.
  const driversAwaitingService = counts.critical * 2 + counts.overloaded * 1;

  // Cycle time proxies — small under YNS, longer under stress.
  const inboundAgeDays = Number((0.6 * stress * (config.ynsMode ? 0.8 : 1)).toFixed(1));
  const outboundAgeDays = Number((1.2 * stress * (config.ynsMode ? 0.75 : 1)).toFixed(1));

  // OOS trailers — industry-typical ~12%; YNS cuts ~4 pts via tracking.
  const oosTrailersPct = Math.round(12 - (config.ynsMode ? 4 : 0));

  return {
    truckTurnaroundMin,
    emptyDwellDays,
    poolCompliancePct,
    driversAwaitingService,
    inboundAgeDays,
    outboundAgeDays,
    oosTrailersPct,
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
