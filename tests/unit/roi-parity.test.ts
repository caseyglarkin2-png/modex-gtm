import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDemoPack, type DemoPack } from '@/lib/demo/pack-schema';
import { buildAccountRoiModel, deriveNetworkCounts } from '@/lib/demo/roi-model';
import { buildROIDashboard } from '@/lib/microsites/roi';

/**
 * Guards the inline demo ROI (#4) against silently drifting from the full
 * RoiCalculatorV2 the "Open the full calculator" CTA hands off to.
 *
 * Two engines, two repos: the inline panel runs modex-gtm's
 * `lib/microsites/roi.ts`; the full calculator runs Flow-State-'s
 * `src/lib/roi/csvModel.ts`. They are byte-identical ports of the same model
 * (verified 2026-06-01: same asks -> same $ to the dollar). The fragile part is
 * the facility-tier SPLIT — `buildAccountRoiModel` must mirror Flow-State-'s
 * `roiCalcAdapter.deriveArchetypeCounts`, or the two surfaces show different
 * numbers for the same network.
 */

const PACK_DIR = path.resolve(process.cwd(), 'public/demo-packs');
const packFiles = readdirSync(PACK_DIR).filter((f) => f.endsWith('.json'));
const loadPack = (file: string): DemoPack =>
  parseDemoPack(JSON.parse(readFileSync(path.join(PACK_DIR, file), 'utf8')));

/**
 * Reference copy of the full calculator's tier mapping
 * (Flow-State- `src/lib/roi/roiCalcAdapter.ts` -> deriveArchetypeCounts).
 * Drop-trailer facilities are a CUMULATIVE count that includes the YMS ones
 * (its input enforces drops >= yms, total >= drops), so the tiers nest.
 *
 * KEEP IN LOCKSTEP: if Flow-State- changes deriveArchetypeCounts, update this
 * reference AND `buildAccountRoiModel` together. This test fails if the modex
 * side drifts from the documented contract.
 */
function calculatorTiers(total: number, yms: number, drops: number) {
  const y = Math.max(0, Math.round(yms));
  const d = Math.max(y, Math.round(drops));
  const t = Math.max(d, Math.round(total));
  return { withYms: y, dropsNoYms: d - y, withoutDrops: t - d };
}

describe('inline ROI parity with the full calculator', () => {
  it.each(packFiles)('%s: facility split matches the calculator contract', (file) => {
    const pack = loadPack(file);
    const c = deriveNetworkCounts(pack);
    const expected = calculatorTiers(c.total, c.facilitiesWithYms, c.facilitiesWithDropTrailers);

    const mix = Object.fromEntries(
      buildAccountRoiModel(pack).facilityMix.map((m) => [m.archetype, m.facilityCount]),
    );

    expect(mix['with-yms']).toBe(expected.withYms);
    expect(mix['drops-no-yms']).toBe(expected.dropsNoYms);
    expect(mix['without-drops']).toBe(expected.withoutDrops);
  });

  it('coca-cola inline annual value equals the calculator output to the dollar', () => {
    // Golden value cross-checked against the actual Flow-State- engine
    // (buildInputsFromAsks + buildDashboard) on 2026-06-01. If the coca-cola
    // pack is re-audited this will change — update it deliberately, don't paper
    // over it; a drift here means inline and calculator disagree.
    const pack = loadPack('coca-cola.json');
    const dash = buildROIDashboard(buildAccountRoiModel(pack));
    expect(dash.totalFacilities).toBe(30);
    expect(Math.round(dash.comparison.yardFlow.total)).toBe(55_864_262);
  });

  it.each(packFiles)('%s: produces a finite, positive, summing ROI', (file) => {
    const pack = loadPack(file);
    const model = buildAccountRoiModel(pack);
    const dash = buildROIDashboard(model);
    const tierSum = model.facilityMix.reduce((s, m) => s + m.facilityCount, 0);

    expect(model.facilityMix.every((m) => m.facilityCount >= 0)).toBe(true);
    expect(tierSum).toBe(dash.totalFacilities);
    expect(Number.isFinite(dash.comparison.yardFlow.total)).toBe(true);
    expect(dash.comparison.yardFlow.total).toBeGreaterThan(0);
  });
});
