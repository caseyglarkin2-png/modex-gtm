/**
 * D3.1 — Per-archetype driver-journey templates.
 *
 * For each of the 10 yard archetypes (#1–#10), defines the canonical step
 * sequence a truck would walk through the site, and the per-step wait
 * times under both the baseline (radios + clipboards) and YNS (deterministic
 * digital protocol) modes. `buildScenario(site)` maps the template onto
 * the site's actual geofences, filling in target indices and producing a
 * ready-to-replay {@link SiteScenario}.
 *
 * Wait times are calibrated from the 24-site Primo deployment baseline
 * (Sprint plan §Comparable) — drop-and-hook truck turn time went from
 * 48 min to 24 min, the bulk of which was queue + dispatch wait, not
 * physical movement. The templates here keep movement durations honest
 * (they're hard floors set by yard geometry) and put the YNS uplift
 * entirely on the wait fields, where it actually lands in real deployments.
 *
 * Narration keys are shared across archetypes via {@link NARRATIONS} so
 * the replay UI doesn't carbon-copy 10 sets of dialogue.
 */

import type { ArchetypeId, ScenarioStep, Site, SiteScenario } from './pack-schema';

// ── Narrations (baseline ↔ YNS pairs, one per step) ─────────────────────────

export interface Narration {
  /** What's happening in the baseline (radios + clipboards) world. */
  baseline: string;
  /** What's happening under YNS. */
  yns: string;
}

export const NARRATIONS: Record<string, Narration> = {
  'gate.arrive': {
    baseline: 'Truck queues at the gate. Guard checks paper BOL, runs the plate, types data into a screen, prints a gate pass.',
    yns: 'flowGATE machine vision reads the tractor and chassis at the lane — Carrier Accountability binds them to the load. The arm opens; no booth stop.',
  },
  'gate.arrive.backup': {
    baseline: 'Queue spills past the gate into the public road. Guard works through paperwork one truck at a time.',
    yns: 'flowGATE pre-arrival check-in keeps the lane flowing. Queue depth never spills past the property line.',
  },
  'gate.scale': {
    baseline: 'Driver stops at the scale house, hands the BOL down, waits for the weigh ticket to print.',
    yns: 'Truck rolls over the in-ground scale at gate speed. Weight is bound to the load record automatically.',
  },
  'gate.multi-step': {
    baseline: 'After the gate, driver pulls forward to the BOL desk, hands paperwork to a second checker.',
    yns: 'Single check-in. The downstream desk is a screen, not a stop.',
  },
  'gate.through': {
    baseline: 'Driver rolls past the gate, looks for instructions on where to drop.',
    yns: 'Appointment and drop spot are on the in-cab display before the arm closes behind the truck.',
  },
  'gate.through.kiosk': {
    baseline: 'No guard. Driver finds the call box, hits the buzzer, waits for someone inside to respond.',
    yns: 'Remote check-in already authorized the truck. The arm opens on plate read.',
  },
  'gate.exit': {
    baseline: 'Driver re-queues to exit, guard collects the gate pass.',
    yns: 'Exit gate opens on plate read. No second checkpoint.',
  },
  'gate.exit.separate': {
    baseline: 'Driver navigates to the separate exit gate. Guard there has to look up the inbound record.',
    yns: 'Exit gate sees the same record the entry gate created. No re-lookup.',
  },
  'campus.route': {
    baseline: 'Driver guesses which of the buildings on the campus is theirs. Calls dispatch. Backs out and re-routes.',
    yns: 'Building assignment is on the in-cab display before the gate scan completes.',
  },
  'spotter.dispatch': {
    baseline: 'Yard spotter waits for a dispatch radio call. Driver waits for the spotter to find the trailer.',
    yns: 'Yard Spot Mgt posts the move the instant flowGATE checks the truck in; the spotter sees the trailer\'s live position in flowVISION (RTLS) and drives straight to it.',
  },
  'spotter.dispatch.fastlane': {
    baseline: 'Driver gets stuck behind queued trucks. No bypass — every truck waits the same time.',
    yns: 'Fast-lane bypass routes priority trucks past the queue. Spotter is already in motion.',
  },
  'dock.load': {
    baseline: 'Physical load. Same time regardless of system.',
    yns: 'Physical load time is the same — but Dock Mgt sequenced the door so the trailer was staged and ready, not waiting on a free dock.',
  },
  'shiprcv.split': {
    baseline: 'Shipping and receiving live on separate building faces with separate spotters and separate radio channels. Cross-contamination of moves wastes the spotter behind a wrong dispatch.',
    yns: 'Same protocol, two operating queues. Spotters can\'t accept a move on the wrong queue.',
  },
};

// ── Template builder ────────────────────────────────────────────────────────

type GeofenceTarget = ScenarioStep['geofenceTarget'];

interface StepTemplate {
  step: string;
  geofenceTarget: GeofenceTarget;
  targetIndex?: number;
  /** Travel/work time — does NOT differ under YNS. */
  durationMs: number;
  narrationKey: string;
  /** Wait BEFORE the step under baseline (radios + clipboards). */
  baseline?: number;
  /** Wait BEFORE the step under YNS. */
  yns?: number;
}

/**
 * Returns true if the site's geofences cover every target in the template.
 * Stub sites (no perimeter) were already filtered upstream, but a site
 * could be archetype-#1 with the audited dropYards array empty — we don't
 * want to scenario-walk into a missing polygon.
 */
function templateFits(site: Site, template: StepTemplate[]): boolean {
  for (const t of template) {
    switch (t.geofenceTarget) {
      case 'truckGate':
        if (!site.geofences.truckGate) return false;
        break;
      case 'dropYard':
        if (site.geofences.dropYards.length <= (t.targetIndex ?? 0)) return false;
        break;
      case 'dockApron':
        if (site.geofences.dockAprons.length <= (t.targetIndex ?? 0)) return false;
        break;
      case 'staging':
        if (!site.geofences.staging) return false;
        break;
      case 'exit':
        // No geofence — handled by the replay UI as "exit through truckGate".
        break;
    }
  }
  return true;
}

function totalMs(steps: ScenarioStep[], field: 'baselineWaitMs' | 'ynsWaitMs'): number {
  return steps.reduce((sum, s) => sum + s.durationMs + (s[field] ?? 0), 0);
}

function buildFromTemplate(archetypeId: ArchetypeId, template: StepTemplate[]): SiteScenario {
  const steps: ScenarioStep[] = template.map((t) => {
    const out: ScenarioStep = {
      step: t.step,
      geofenceTarget: t.geofenceTarget,
      durationMs: t.durationMs,
      narrationKey: t.narrationKey,
    };
    if (t.targetIndex !== undefined) out.targetIndex = t.targetIndex;
    if (t.baseline !== undefined) out.baselineWaitMs = t.baseline;
    if (t.yns !== undefined) out.ynsWaitMs = t.yns;
    return out;
  });
  return {
    archetypeId,
    steps,
    totalBaselineMs: totalMs(steps, 'baselineWaitMs'),
    totalYnsMs: totalMs(steps, 'ynsWaitMs'),
  };
}

// ── Templates ────────────────────────────────────────────────────────────────
//
// Wait values are in milliseconds. Baselines reflect the radios + clipboards
// world; YNS values reflect the protocol acting end-to-end. Both are honest
// floors — physical load is the same in either world; the spread lives in
// the wait fields where YNS actually compresses.

const M = 60_000; // one minute

const TEMPLATES: Record<ArchetypeId, StepTemplate[]> = {
  // ── #1 Gate + GS standard ──────────────────────────────────────────────
  '#1': [
    { step: 'Arrive at gate, queue for guard scan', geofenceTarget: 'truckGate', durationMs: 30_000, narrationKey: 'gate.arrive', baseline: 10 * M, yns: 30_000 },
    { step: 'Pass through gate to drop yard', geofenceTarget: 'dropYard', targetIndex: 0, durationMs: 60_000, narrationKey: 'gate.through' },
    { step: 'Spotter pulls trailer to dock apron', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 90_000, narrationKey: 'spotter.dispatch', baseline: 20 * M, yns: 2 * M },
    { step: 'Dock load', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 40 * M, narrationKey: 'dock.load' },
    { step: 'Driver exits through gate', geofenceTarget: 'exit', durationMs: 60_000, narrationKey: 'gate.exit' },
  ],

  // ── #2 Gate + GS + separate entry/exit ──────────────────────────────────
  '#2': [
    { step: 'Arrive at entry gate', geofenceTarget: 'truckGate', durationMs: 30_000, narrationKey: 'gate.arrive', baseline: 10 * M, yns: 30_000 },
    { step: 'Pass through entry to drop yard', geofenceTarget: 'dropYard', targetIndex: 0, durationMs: 60_000, narrationKey: 'gate.through' },
    { step: 'Spotter pulls trailer to dock apron', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 90_000, narrationKey: 'spotter.dispatch', baseline: 20 * M, yns: 2 * M },
    { step: 'Dock load', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 40 * M, narrationKey: 'dock.load' },
    { step: 'Driver exits via separate exit gate', geofenceTarget: 'exit', durationMs: 90_000, narrationKey: 'gate.exit.separate', baseline: 3 * M, yns: 15_000 },
  ],

  // ── #3 No gate / no GS ──────────────────────────────────────────────────
  '#3': [
    { step: 'Arrive on site (no gate)', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 60_000, narrationKey: 'gate.through' },
    { step: 'Drive to dock apron', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 60_000, narrationKey: 'spotter.dispatch', baseline: 8 * M, yns: 90_000 },
    { step: 'Dock load', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 40 * M, narrationKey: 'dock.load' },
    { step: 'Exit', geofenceTarget: 'exit', durationMs: 30_000, narrationKey: 'gate.exit' },
  ],

  // ── #4 Backup-sensitive (gate queue spills into road) ──────────────────
  '#4': [
    { step: 'Arrive at gate, queue spills into traffic', geofenceTarget: 'truckGate', durationMs: 30_000, narrationKey: 'gate.arrive.backup', baseline: 25 * M, yns: 90_000 },
    { step: 'Pass through gate', geofenceTarget: 'dropYard', targetIndex: 0, durationMs: 60_000, narrationKey: 'gate.through' },
    { step: 'Spotter pulls to dock apron', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 90_000, narrationKey: 'spotter.dispatch', baseline: 20 * M, yns: 2 * M },
    { step: 'Dock load', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 40 * M, narrationKey: 'dock.load' },
    { step: 'Exit through gate', geofenceTarget: 'exit', durationMs: 60_000, narrationKey: 'gate.exit' },
  ],

  // ── #5 Multi-step check-in ──────────────────────────────────────────────
  '#5': [
    { step: 'Arrive at gate, guard scan', geofenceTarget: 'truckGate', durationMs: 30_000, narrationKey: 'gate.arrive', baseline: 10 * M, yns: 30_000 },
    { step: 'Stop at secondary checkpoint (BOL desk / scale)', geofenceTarget: 'staging', durationMs: 60_000, narrationKey: 'gate.multi-step', baseline: 12 * M, yns: 30_000 },
    { step: 'Spotter pulls to dock apron', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 90_000, narrationKey: 'spotter.dispatch', baseline: 18 * M, yns: 2 * M },
    { step: 'Dock load', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 40 * M, narrationKey: 'dock.load' },
    { step: 'Exit through gate', geofenceTarget: 'exit', durationMs: 60_000, narrationKey: 'gate.exit' },
  ],

  // ── #6 Campus (multi-building behind one gate) ──────────────────────────
  '#6': [
    { step: 'Arrive at outer campus gate', geofenceTarget: 'truckGate', durationMs: 30_000, narrationKey: 'gate.arrive', baseline: 10 * M, yns: 30_000 },
    { step: 'Route to correct building / drop yard', geofenceTarget: 'dropYard', targetIndex: 0, durationMs: 3 * M, narrationKey: 'campus.route', baseline: 15 * M, yns: 0 },
    { step: 'Spotter pulls to dock apron', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 90_000, narrationKey: 'spotter.dispatch', baseline: 20 * M, yns: 2 * M },
    { step: 'Dock load', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 40 * M, narrationKey: 'dock.load' },
    { step: 'Exit through gate', geofenceTarget: 'exit', durationMs: 60_000, narrationKey: 'gate.exit' },
  ],

  // ── #7 Fast-lane opportunity (room for bypass) ─────────────────────────
  '#7': [
    { step: 'Arrive at gate (fast-lane bypass possible)', geofenceTarget: 'truckGate', durationMs: 30_000, narrationKey: 'gate.arrive', baseline: 10 * M, yns: 0 },
    { step: 'Pass through to drop yard', geofenceTarget: 'dropYard', targetIndex: 0, durationMs: 60_000, narrationKey: 'gate.through' },
    { step: 'Spotter dispatch (fast-lane priority for live loads)', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 90_000, narrationKey: 'spotter.dispatch.fastlane', baseline: 20 * M, yns: 90_000 },
    { step: 'Dock load', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 40 * M, narrationKey: 'dock.load' },
    { step: 'Exit through gate', geofenceTarget: 'exit', durationMs: 60_000, narrationKey: 'gate.exit' },
  ],

  // ── #8 Scale on-site ────────────────────────────────────────────────────
  '#8': [
    { step: 'Arrive at gate', geofenceTarget: 'truckGate', durationMs: 30_000, narrationKey: 'gate.arrive', baseline: 10 * M, yns: 30_000 },
    { step: 'Stop at scale house', geofenceTarget: 'staging', durationMs: 90_000, narrationKey: 'gate.scale', baseline: 8 * M, yns: 0 },
    { step: 'Spotter pulls to dock apron', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 90_000, narrationKey: 'spotter.dispatch', baseline: 20 * M, yns: 2 * M },
    { step: 'Dock load', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 40 * M, narrationKey: 'dock.load' },
    { step: 'Exit through gate', geofenceTarget: 'exit', durationMs: 60_000, narrationKey: 'gate.exit' },
  ],

  // ── #9 Remote check-in (gate, no guard) ────────────────────────────────
  '#9': [
    { step: 'Arrive at gate (no guard, kiosk or call box)', geofenceTarget: 'truckGate', durationMs: 60_000, narrationKey: 'gate.through.kiosk', baseline: 12 * M, yns: 0 },
    { step: 'Pass through to drop yard', geofenceTarget: 'dropYard', targetIndex: 0, durationMs: 60_000, narrationKey: 'gate.through' },
    { step: 'Spotter pulls to dock apron', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 90_000, narrationKey: 'spotter.dispatch', baseline: 20 * M, yns: 90_000 },
    { step: 'Dock load', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 40 * M, narrationKey: 'dock.load' },
    { step: 'Exit through gate', geofenceTarget: 'exit', durationMs: 30_000, narrationKey: 'gate.exit' },
  ],

  // ── #10 Ship/Rcv separate ──────────────────────────────────────────────
  '#10': [
    { step: 'Arrive at gate, queue for guard', geofenceTarget: 'truckGate', durationMs: 30_000, narrationKey: 'gate.arrive', baseline: 10 * M, yns: 30_000 },
    { step: 'Route to correct (shipping vs receiving) drop yard', geofenceTarget: 'dropYard', targetIndex: 0, durationMs: 2 * M, narrationKey: 'shiprcv.split', baseline: 12 * M, yns: 0 },
    { step: 'Spotter pulls to dock apron on correct side', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 90_000, narrationKey: 'spotter.dispatch', baseline: 22 * M, yns: 2 * M },
    { step: 'Dock load', geofenceTarget: 'dockApron', targetIndex: 0, durationMs: 40 * M, narrationKey: 'dock.load' },
    { step: 'Exit through gate', geofenceTarget: 'exit', durationMs: 60_000, narrationKey: 'gate.exit' },
  ],
};

/**
 * Build a {@link SiteScenario} for one site. Returns null if the site's
 * geofences can't carry the archetype's template (e.g. archetype #1 but
 * no dropYards audited). Callers should fall back to "no scenario" — the
 * detail panel still renders fine.
 */
export function buildScenario(site: Site): SiteScenario | null {
  const template = TEMPLATES[site.archetype];
  if (!template) return null;
  if (!templateFits(site, template)) return null;
  return buildFromTemplate(site.archetype, template);
}
