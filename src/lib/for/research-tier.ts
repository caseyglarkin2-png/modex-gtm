import { snapshotFromModel, type ForSnapshot } from './snapshot';
import type { AccountROIModel } from '@/lib/microsites/schema';
// Reuse the canonical vertical heuristics from roi-model.ts (exported in Task 2 Step 1).
import { LEGACY_YMS_ADOPTION_BY_VERTICAL, marginForArchetype } from '@/lib/demo/roi-model';

/**
 * Estimated drop-trailer adoption by vertical when there is no audit to sample.
 * Conservative; parallels LEGACY_YMS_ADOPTION_BY_VERTICAL. The nested-split
 * contract (drops >= yms >= 0, total >= drops) is enforced in buildResearchModel.
 */
export const DROP_RATIO_BY_VERTICAL: Record<string, number> = {
  cpg: 0.55,
  beverage: 0.55,
  'grocer-distributor': 0.6,
  retailer: 0.5,
  manufacturer: 0.45,
  'oem-automotive': 0.5,
  '3pl': 0.65,
  'logistics-carrier': 0.6,
};

const DEFAULT_DROP_RATIO = 0.5;

const ZERO_SILO: ForSnapshot['siloTax'] = {
  auditedCount: 0,
  dropReady: 0,
  gated: 0,
  longDrive: 0,
  fastLane: 0,
  multiCampus: 0,
};

/**
 * Build a canonical AccountROIModel from a facility count + vertical/archetype.
 * Uses the same YMS-adoption priors and margin defaults as the audited-pack path
 * (LEGACY_YMS_ADOPTION_BY_VERTICAL + marginForArchetype from roi-model.ts).
 *
 * The 3-bucket nested split mirrors buildAccountRoiModel exactly:
 *   with-yms      = round(total * ymsRate)
 *   drops-no-yms  = max(yms, round(total * dropRate)) - yms
 *   without-drops = total - max(yms, round(total * dropRate))
 */
export function buildResearchModel(
  archetype: string,
  facilityCount: number,
  marginOverride?: number,
): AccountROIModel {
  const a = (archetype || '').toLowerCase();
  const ymsRate = LEGACY_YMS_ADOPTION_BY_VERTICAL[a] ?? 0.3;
  const dropRate = DROP_RATIO_BY_VERTICAL[a] ?? DEFAULT_DROP_RATIO;
  const total = Math.max(0, Math.round(facilityCount));
  const yms = Math.round(total * ymsRate);
  const drops = Math.max(yms, Math.round(total * dropRate)); // nested: drops >= yms

  return {
    sourceOfTruth: 'shared-engine',
    averageMarginPerShipment: marginOverride ?? marginForArchetype(a),
    facilityMix: [
      { archetype: 'with-yms', facilityCount: yms },
      { archetype: 'drops-no-yms', facilityCount: Math.max(0, drops - yms) },
      { archetype: 'without-drops', facilityCount: Math.max(0, total - drops) },
    ],
  };
}

/**
 * Build a ForSnapshot for an un-audited account using only a facility count +
 * industry vertical. The siloTax is zeroed (no audit = no site classifications).
 */
export function buildResearchSnapshot(
  slug: string,
  account: { displayName: string; archetype: string },
  facilityCount: number,
  marginOverride?: number,
): ForSnapshot {
  return snapshotFromModel(
    slug,
    buildResearchModel(account.archetype, facilityCount, marginOverride),
    ZERO_SILO,
  );
}

/**
 * Count-based, brand-ruled spear for an un-audited account (no real site names).
 * Brand law: yards plural, no em dash, realized production capacity.
 */
export function researchTierSpear(
  displayName: string,
  snap: ForSnapshot,
  _archetype: string,
): { problemHook: string; pilot: { site: string; body: string }; metaDescription?: string } {
  const n = snap.totalFacilities;
  return {
    problemHook: `Across the estimated ${n.toLocaleString()} ${displayName} facilities in scope, the yards still run on guard shacks, radios, and clipboards.`,
    pilot: {
      site: `a flagship ${displayName} yard`,
      body: `Nothing gets ripped out to start. Prove it in one yard in 60 days, then standardize across the network on realized production capacity. Modeled at ${snap.annualValueLabel} on flat headcount.`,
    },
    metaDescription: `${displayName}: unify your yards into realized production capacity. Modeled ${snap.annualValueLabel} across ${n} facilities.`,
  };
}
