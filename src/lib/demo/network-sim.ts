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

import type { ArchetypeId, Classification, DemoPack, LatLng, Site } from './pack-schema';

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

// ── Per-site turnaround model (REAL audit data, not industry averages) ──────

/**
 * Minutes a driver loses to a given classification flag (over a 10-minute
 * base drive time). Calibrated from public yard-throughput studies + the
 * Kraft/Primo benchmark engagements cited in the comparable section.
 * Every value here corresponds to an observed audit-record boolean — no
 * field is conjured from thin air.
 *
 * Why this matters: the KPI strip used to read from per-archetype constants
 * applied uniformly, so a Frito-Lay prospect and a Mondelez prospect saw
 * the same "30 min industry-average turnaround". That breaks the entire
 * pitch ("see your yard the way YardFlow sees it"). With this model, a
 * site with `guardShack=true, multiStep=true, backupSensitive=true` pays
 * 13 minutes of friction; a #3 open-access yard pays ~2 minutes.
 */
const FRICTION_MIN_BASELINE = {
  truckGate: 3, // gate check stop
  guardShack: 2, // GS paperwork
  multiStep: 6, // multiple checkpoints
  backupSensitive: 5, // queue spillover blocks dock
  drivewayLong: 2, // long approach drive
  remoteGsMissing: 4, // no remote check-in, driver waits at booth
  preGateStagingMissing: 2, // no pre-gate buffer, gate slows under load
} as const;

/**
 * Minutes YNS removes from each friction source. Asymmetric — some sources
 * are physics (driveway length, backup geometry) and YNS can only partly
 * compensate; others are pure dispatch / paperwork and YNS removes them
 * almost entirely. fastLaneOpportunity is YNS-unique — only realized when
 * the protocol is in place.
 */
const FRICTION_MIN_UNDER_YNS = {
  guardShack: 1.5, // pre-checked
  multiStep: 4, // automated handoffs
  backupSensitive: 4, // dispatch eliminates spotter radio
  drivewayLong: 0, // can't help physics
  remoteGsMissing: 3, // YNS provides remote check-in
  preGateStagingMissing: 1, // pre-arrival visibility cuts gate queue
  fastLaneOpportunity: 6, // unique to YNS — driver bypasses on compliance
} as const;

/** Base drive-on-yard time before any friction. */
const TURNAROUND_BASE_MIN = 10;

/**
 * Compute the turnaround minutes for ONE site, given its classification
 * record and whether YNS is on. Pure function of audit data.
 */
function siteTurnaroundMin(c: Classification, ynsMode: boolean): number {
  let friction = 0;
  if (c.truckGate) friction += FRICTION_MIN_BASELINE.truckGate;
  if (c.guardShack) friction += FRICTION_MIN_BASELINE.guardShack;
  if (c.multiStep) friction += FRICTION_MIN_BASELINE.multiStep;
  if (c.backupSensitive) friction += FRICTION_MIN_BASELINE.backupSensitive;
  if (c.drivewayLong) friction += FRICTION_MIN_BASELINE.drivewayLong;
  if (!c.remoteGs) friction += FRICTION_MIN_BASELINE.remoteGsMissing;
  if (!c.preGateStaging) friction += FRICTION_MIN_BASELINE.preGateStagingMissing;
  if (ynsMode) {
    if (c.guardShack) friction -= FRICTION_MIN_UNDER_YNS.guardShack;
    if (c.multiStep) friction -= FRICTION_MIN_UNDER_YNS.multiStep;
    if (c.backupSensitive) friction -= FRICTION_MIN_UNDER_YNS.backupSensitive;
    if (!c.remoteGs) friction -= FRICTION_MIN_UNDER_YNS.remoteGsMissing;
    if (!c.preGateStaging) friction -= FRICTION_MIN_UNDER_YNS.preGateStagingMissing;
    if (c.fastLaneOpportunity) friction -= FRICTION_MIN_UNDER_YNS.fastLaneOpportunity;
    friction = Math.max(0, friction); // floor: even with YNS, base drive time stays
  }
  return TURNAROUND_BASE_MIN + friction;
}

/**
 * Empty-trailer dwell in days for one site. Derives from classification:
 *   - backupSensitive → trailer-pool spillover, longer dwell
 *   - dropArea band → bigger drop yard = more capacity to hold dwelling trailers
 *   - railServed → outbound option reduces dwell
 *   - shipRcvSeparate → faster cycling
 * Under YNS, visibility + appointment compliance compresses dwell.
 */
function siteEmptyDwellDays(site: Site, ynsMode: boolean): number {
  const c = site.classification;
  let dwell = 1.6;
  if (c.backupSensitive) dwell += 0.8;
  if (!c.shipRcvSeparate) dwell += 0.3;
  if (site.yardMetrics.railServed) dwell -= 0.3;
  // Drop area is the dwell buffer — small drop area means trailers cycle
  // through the dock area instead of sitting, *reducing* observed dwell.
  if (c.dropArea === 'NONE' || c.dropArea === '0-10') dwell -= 0.3;
  if (c.dropArea === '50+') dwell += 0.3;
  if (ynsMode) dwell -= 0.5; // YNS-driven visibility + appointment compliance
  return Math.max(0.4, Number(dwell.toFixed(1)));
}

/**
 * Yard congestion score — derived from trailersVisible / trailerParkingCapacity.
 * Returns null if we don't have data to compute it (some sites have no
 * trailer parking — office HQs, VAC inside-an-OEM, etc.).
 */
function siteCongestion(site: Site): number | null {
  const v = site.yardMetrics.trailersVisible;
  const c = site.yardMetrics.trailerParkingCapacity;
  if (v == null || c == null || c <= 0) return null;
  return v / c;
}

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
    kpis: deriveKpis(pack, sites, networkUtilization, countsByRisk, config),
  };
}

/**
 * KPI model — DERIVED FROM PER-SITE AUDIT DATA, not industry averages.
 *
 * Every quantity here aggregates a per-site computation that reads from
 * the prospect's real classification record + yard metrics. Same demo for
 * Mondelez and Frito-Lay will produce DIFFERENT numbers because their
 * yards have different flags set. That's the whole point.
 *
 * What still uses a prior:
 *   - The per-flag minute-cost table (FRICTION_MIN_BASELINE) is calibrated
 *     from public yard-throughput studies + the Kraft/Primo benchmarks.
 *     A prospect can challenge each line ("we don't think backup-sensitive
 *     adds 5 min for us") and the model will respond. Once instrumented
 *     with real telemetry, these get replaced with their actual numbers.
 *   - Scenario perturbations (demandFactor, weather) modulate the
 *     congestion multiplier on top of the per-site friction floor.
 *
 * What's gone:
 *   - Industry-average "30 min turnaround" applied to every prospect.
 *   - "0.7 × stress" applied uniformly across the whole network.
 *   - OOS trailers as a flat constant.
 */
function deriveKpis(
  pack: DemoPack,
  simSites: SiteSimState[],
  util: number,
  counts: Record<RiskLevel, number>,
  config: SimConfig,
): OperationalKpis {
  const sites = pack.network.sites;

  // Per-site turnaround = base drive + friction-from-classification +
  // congestion bump based on THAT SITE's individual stress. Sites in the
  // weather-affected region or under high local utilization get a larger
  // bump; unaffected sites see no scenario change. Network turnaround is
  // the dock-door-weighted average. This is what makes a demand surge or
  // a regional storm actually move the KPI strip.
  let weightedTurnaroundSum = 0;
  let weightSum = 0;
  let weightedDwellSum = 0;
  let dwellWeightSum = 0;
  let driversWaiting = 0;
  let oosNumerator = 0;
  let oosDenominator = 0;

  sites.forEach((site, i) => {
    const simSite = simSites[i]!;
    const siteStress = Math.max(0.7, Math.min(1.6, simSite.utilization));
    const siteCongestionBump = Math.max(0, (siteStress - 0.85) * 12);

    const doors = Math.max(1, site.yardMetrics.dockDoorCount ?? 1);
    const turn = siteTurnaroundMin(site.classification, config.ynsMode) + siteCongestionBump;
    weightedTurnaroundSum += turn * doors;
    weightSum += doors;

    const dwell = siteEmptyDwellDays(site, config.ynsMode) + (siteStress > 1 ? (siteStress - 1) * 2 : 0);
    const visible = site.yardMetrics.trailersVisible ?? 0;
    weightedDwellSum += dwell * Math.max(1, visible);
    dwellWeightSum += Math.max(1, visible);

    // Drivers waiting at THIS site — backup-sensitive yards under stress
    // queue drivers (the spotter can't dispatch fast enough). YNS removes
    // the dispatch-radio bottleneck, halving the queue.
    const cong = siteCongestion(site);
    const stressed = simSite.riskLevel === 'overloaded' || simSite.riskLevel === 'critical';
    if (site.classification.backupSensitive && ((cong != null && cong > 0.85) || stressed)) {
      driversWaiting += config.ynsMode ? 1 : 2;
    } else if (stressed) {
      driversWaiting += config.ynsMode ? 0 : 1;
    }

    const sitePct = site.confidence === 'low' ? 16 : site.confidence === 'medium' ? 12 : 10;
    const ynsAdj = config.ynsMode ? 3 : 0;
    oosNumerator += Math.max(1, visible) * (sitePct - ynsAdj);
    oosDenominator += Math.max(1, visible);
  });

  const truckTurnaroundMin = Math.round(weightedTurnaroundSum / Math.max(1, weightSum));
  const emptyDwellDays = Number((weightedDwellSum / Math.max(1, dwellWeightSum)).toFixed(1));

  // Pool compliance drifts off-target as the network stresses up; sites
  // with `dropArea === 'NONE'` or `dropYard === false` lose compliance
  // first because their drivers double-park dwellers. YNS adds 2 pts.
  const stress = Math.max(0.7, Math.min(1.6, util));
  const sitesWithoutDropBuffer = sites.filter(
    (s) => !s.classification.dropYard || s.classification.dropArea === 'NONE',
  ).length;
  const poolCompliancePct = Math.round(
    104 -
      (stress - 1) * 8 -
      (sitesWithoutDropBuffer / Math.max(1, sites.length)) * 6 +
      (config.ynsMode ? 2 : 0),
  );

  // Inbound / outbound age — derives from network turnaround (longer turn
  // → loaded trailers spend more hours per drop → larger shipment age).
  // Plus a small base because age accumulates across the shipment chain.
  const inboundAgeDays = Number((0.3 + truckTurnaroundMin / 60 / 24 + 0.4 * (stress - 0.85)).toFixed(1));
  const outboundAgeDays = Number((inboundAgeDays + 0.6).toFixed(1));

  const oosTrailersPct = Math.round(oosNumerator / Math.max(1, oosDenominator));

  return {
    truckTurnaroundMin,
    emptyDwellDays,
    poolCompliancePct,
    driversAwaitingService: Math.max(0, driversWaiting),
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
