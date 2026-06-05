/**
 * Proximity-led worklist scoring (Sprint 2).
 *
 * Re-aims the engine's sub-scores into a single, continuous, re-weightable
 * worklist score. The old icpScore was fit-led (75 of 100 points) and saturated
 * — dozens of max-fit sites tied at 100, so the ranking stopped discriminating
 * exactly where Casey looks first, and proximity (the strategy) was a 10-point
 * garnish. Here proximity is continuous by distance and weighted to lead, fit
 * and corridor density are levers, and exact ties are broken so the top spreads.
 *
 * Pure and deterministic. The engine sub-scores are reused as inputs; the
 * pipeline is not re-run.
 */
import type { CuratedRow } from './types';

// ── Weights ─────────────────────────────────────────────────────────────────

export interface Weights {
  /** Closeness to the nearest YardFlow reference site (the spearhead). */
  proximity: number;
  /** ICP fit: vertical + enterprise scale + network complexity. */
  fit: number;
  /** Corridor density — the "work one corridor at a time" / trip-planning lever. */
  density: number;
}

/**
 * Named weightings Casey can switch between. Proximity-led is the default; the
 * corridor-density preset supports planning a single-region day ("work one
 * corridor at a time"). Values are relative — normalizeWeights() handles the rest.
 */
export const WEIGHT_PRESETS: Record<string, Weights> = {
  'proximity-led': { proximity: 0.55, fit: 0.3, density: 0.15 },
  balanced: { proximity: 0.4, fit: 0.4, density: 0.2 },
  'fit-led': { proximity: 0.2, fit: 0.7, density: 0.1 },
  'corridor-density': { proximity: 0.35, fit: 0.25, density: 0.4 },
};

export const DEFAULT_WEIGHTS: Weights = WEIGHT_PRESETS['proximity-led'];

/** Normalize weights so they sum to 1; falls back to the default if all-zero. */
export function normalizeWeights(w: Weights): Weights {
  const sum = w.proximity + w.fit + w.density;
  if (sum <= 0) return { ...DEFAULT_WEIGHTS };
  return { proximity: w.proximity / sum, fit: w.fit / sum, density: w.density / sum };
}

// ── Components (each 0..1) ──────────────────────────────────────────────────

/**
 * Continuous proximity: exponential decay from the nearest reference site.
 * 1.0 at the gate, ~0.85 at 5 mi, ~0.72 at 10 mi, ~0.43 at 25 mi, ~0.19 at 50 mi,
 * ~0.04 at 100 mi. Smooth and monotonic, so a 2.7-mi site always beats a 2.8-mi
 * one — proximity actually orders the list instead of bucketing it.
 */
const PROX_DECAY_MI = 30;
export function proximityComponent(distanceMiles: number): number {
  const d = Math.max(0, distanceMiles);
  return Math.exp(-d / PROX_DECAY_MI);
}

/** ICP fit normalized to [0,1] from the three fit sub-scores (max 25 each). */
export function fitComponent(row: CuratedRow): number {
  return (row.verticalMatch + row.enterpriseScale + row.networkComplexity) / 75;
}

/** Corridor density normalized to [0,1] (engine caps it at 5). */
export function densityComponent(row: CuratedRow): number {
  return Math.min(1, row.corridorDensity / 5);
}

// ── Composite ───────────────────────────────────────────────────────────────

/** Weighted blend of the components, scaled to 0..100. Continuous by construction. */
export function compositeScore(row: CuratedRow, weights: Weights): number {
  const w = normalizeWeights(weights);
  const score =
    w.proximity * proximityComponent(row.nearestPrimoDistance) +
    w.fit * fitComponent(row) +
    w.density * densityComponent(row);
  return Math.round(score * 100 * 100) / 100; // 0..100, 2 decimals
}

// ── Ranking ─────────────────────────────────────────────────────────────────

export interface RankedRow extends CuratedRow {
  /** The proximity-led worklist score under the active weights (0..100). */
  worklistScore: number;
}

const CONFIDENCE_RANK = { high: 2, medium: 1, low: 0 } as const;

/**
 * Rank rows by worklist score, with deterministic tie-breaks so the top never
 * collapses into a block of identical scores:
 *   1. worklistScore desc, 2. nearest reference distance asc,
 *   3. fit desc, 4. confidence desc.
 * (Pipeline momentum slots in as a tie-break in Sprint 5.)
 */
export function rankWorklist(rows: CuratedRow[], weights: Weights): RankedRow[] {
  const scored: RankedRow[] = rows.map((r) => ({ ...r, worklistScore: compositeScore(r, weights) }));
  scored.sort((a, b) => {
    if (b.worklistScore !== a.worklistScore) return b.worklistScore - a.worklistScore;
    if (a.nearestPrimoDistance !== b.nearestPrimoDistance) return a.nearestPrimoDistance - b.nearestPrimoDistance;
    const fitDiff = fitComponent(b) - fitComponent(a);
    if (fitDiff !== 0) return fitDiff;
    return CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence];
  });
  return scored;
}
