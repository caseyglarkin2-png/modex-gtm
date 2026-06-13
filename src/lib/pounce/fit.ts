/**
 * The Pounce Spine — account FIT weighting.
 *
 * A trigger's value to us is its signal strength TIMES how good a YardFlow
 * target the account is. Fit is the audited yard footprint: dock doors (the
 * best single proxy for "many yards and high freight volume") from the demo
 * pack. An account with no audited pack — a vendor like Gatik, say — gets a
 * floor fit, so no source's raw score can rank it as a hot opportunity.
 *
 * Calibration (57 audited packs, 2026-06): dock doors range ~70 (Boston Beer)
 * to ~4,450 (Home Depot), median ~850. Full fit caps at 2,000 docks.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FLOOR = 0.1; // no audited pack (vendors, unknowns)
const AUDITED_FLOOR = 0.25; // smallest audited network
const FULL_FIT_DOCKS = 2000;

const cache = new Map<string, number>();

export function accountFit(slug: string): number {
  const hit = cache.get(slug);
  if (hit !== undefined) return hit;

  let fit = FLOOR;
  try {
    const file = join(process.cwd(), 'public', 'demo-packs', `${slug}.json`);
    const pack = JSON.parse(readFileSync(file, 'utf8'));
    const docks: number =
      pack?.network?.totals?.dockDoors ??
      (pack?.network?.sites ?? []).reduce(
        (n: number, s: { yardMetrics?: { dockDoorCount?: number } }) => n + (s.yardMetrics?.dockDoorCount ?? 0),
        0,
      );
    if (docks > 0) {
      fit = AUDITED_FLOOR + (1 - AUDITED_FLOOR) * Math.min(1, docks / FULL_FIT_DOCKS);
    }
  } catch {
    // no pack on disk → FLOOR (handles vendors / accounts we haven't audited)
  }
  fit = Math.round(fit * 100) / 100;
  cache.set(slug, fit);
  return fit;
}

/**
 * Normalize a source's raw score onto a common 0-100 scale so heat is
 * comparable across producers. clawd already emits 0-100; the news/X taxonomy
 * tops out ~18, so it scales up. Per-source factors keep it source-agnostic.
 */
const SCALE: Record<string, number> = { clawd: 1, news: 5.5, x: 5.5, web: 5.5 };

export function normalizeScore(rawScore: number, source: string): number {
  const factor = SCALE[source] ?? 5.5;
  return Math.min(100, Math.round(rawScore * factor));
}
