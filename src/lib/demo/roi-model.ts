import type { DemoPack } from './pack-schema';
import type { AccountROIModel } from '@/lib/microsites/schema';

/**
 * Single source of truth for reading a prospect's audited network into ROI
 * inputs. Both the inline ROI panel (#4, canonical engine in lib/microsites/roi.ts)
 * and the RoiCtaButton hand-off (localStorage pre-fill for the full calculator)
 * derive from this, so the inline estimate and the full calculator start from
 * the same network read instead of drifting apart.
 */

/**
 * Vertical-based legacy-YMS adoption priors — the fraction of an account's
 * facilities estimated to run on SOME legacy YMS today (CHEP, SAP, Manhattan,
 * in-house). NOT a YardFlow deployment count (always 0 on a demo). Used only
 * when the pack has no curated `coverageNote.legacyYmsFacilityCount`.
 */
const LEGACY_YMS_ADOPTION_BY_VERTICAL: Record<string, number> = {
  cpg: 0.35,
  'grocer-distributor': 0.45,
  '3pl': 0.55,
  retailer: 0.4,
  manufacturer: 0.3,
  'oem-automotive': 0.4,
  beverage: 0.4,
  'logistics-carrier': 0.5,
};

export interface NetworkRoiCounts {
  /** Full in-scope footprint (global where known), not just audited sites. */
  total: number;
  facilitiesWithYms: number;
  facilitiesWithDropTrailers: number;
  averageMarginPerShipment: number;
}

/**
 * Derive the network counts that drive every ROI surface from the pack.
 * Extrapolates the audited drop-yard ratio across the full footprint (the
 * audit is a deliberate sample of core facilities, so this is defensible).
 */
export function deriveNetworkCounts(pack: DemoPack): NetworkRoiCounts {
  const cov = pack.account.coverageNote;

  const total = cov?.totalGlobalFootprint ?? cov?.estimatedFootprint ?? pack.account.siteCount;

  const auditedSites = pack.network.sites.length;
  const auditedDrops = pack.network.sites.filter((s) => s.classification.dropYard).length;
  const dropRatio = auditedSites > 0 ? auditedDrops / auditedSites : 0;
  const facilitiesWithDropTrailers = Math.round(total * dropRatio);

  let facilitiesWithYms: number;
  if (typeof cov?.legacyYmsFacilityCount === 'number') {
    facilitiesWithYms = cov.legacyYmsFacilityCount;
  } else {
    const rate = LEGACY_YMS_ADOPTION_BY_VERTICAL[pack.account.archetype] ?? 0.3;
    facilitiesWithYms = Math.round(total * rate);
  }
  facilitiesWithYms = Math.max(0, Math.min(facilitiesWithYms, total));

  return {
    total,
    facilitiesWithYms,
    facilitiesWithDropTrailers,
    averageMarginPerShipment: pack.account.roiDefaults?.averageMarginPerShipment ?? 1000,
  };
}

/**
 * Build the canonical-engine `AccountROIModel` for the pack. Partitions the
 * footprint into the engine's three tiers (with-yms / drops-no-yms /
 * without-drops) so they sum to the full network without double-counting.
 */
export function buildAccountRoiModel(pack: DemoPack): AccountROIModel {
  const { total, facilitiesWithYms, facilitiesWithDropTrailers, averageMarginPerShipment } =
    deriveNetworkCounts(pack);

  const withYms = Math.max(0, Math.min(facilitiesWithYms, total));
  const dropsNoYms = Math.max(0, Math.min(facilitiesWithDropTrailers, total - withYms));
  const withoutDrops = Math.max(0, total - withYms - dropsNoYms);

  return {
    sourceOfTruth: 'public-calculator-contract',
    averageMarginPerShipment,
    facilityMix: [
      { archetype: 'with-yms', facilityCount: withYms },
      { archetype: 'drops-no-yms', facilityCount: dropsNoYms },
      { archetype: 'without-drops', facilityCount: withoutDrops },
    ],
  };
}
