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
 * Per-account modeled-footprint override (by slug). Caps the network the ROI is
 * modeled across, overriding the pack's coverageNote footprint.
 *
 * Dannon: the pack carries Danone's full ~190-plant GLOBAL footprint, but the
 * account is pitched to Danone NORTH AMERICA, so we model the 13 audited US
 * plants we actually mapped (Casey, 2026-06-05). This keeps /demo/dannon in
 * lockstep with /for/dannon, which applies the same 13-plant cap. The on-disk
 * pack stays honest about the 190 global footprint; only the modeled scope is
 * capped here, so the inline ROI panel + the full-calculator prefill agree.
 */
const FOOTPRINT_OVERRIDE: Record<string, number> = {
  dannon: 13,
};

/**
 * Per-account margin-per-truckload override (by slug). The engine defaults to
 * $1,000/load, which is Primo's BOTTLED-WATER contribution margin and understates
 * higher-value freight. These values come from Flow-State- scripts/estimate-margin.ts
 * (avg load wholesale value x a conservative yard-capture rate, by product class),
 * and keep every /demo page in lockstep with its /for page. Refresh both together
 * when the estimator bands change.
 */
const MARGIN_OVERRIDE: Record<string, number> = {
  'ab-inbev': 2400,
  'barnes-noble': 2700,
  'bob-evans-farms': 2500,
  'boston-beer-company': 2400,
  'campbell-s': 2500,
  'caterpillar': 3600,
  'cj-logistics-america': 450,
  'coca-cola': 2400,
  'constellation-brands': 2400,
  'cost-plus-world-market': 2700,
  'costco': 2700,
  'crowley': 450,
  'daimler-truck-north-america': 3600,
  'dannon': 2500,
  'dhl-supply-chain': 450,
  'diageo': 2400,
  'fedex': 450,
  'ford': 3600,
  'frito-lay': 2500,
  'general-mills': 2500,
  'georgia-pacific': 1750,
  'gxo': 450,
  'h-e-b': 2400,
  'honda': 3600,
  'hormel-foods': 2500,
  'hyundai-motor-america': 3600,
  'jm-smucker': 2500,
  'john-deere': 3600,
  'kenco-logistics-services': 450,
  'keurig-dr-pepper': 2400,
  'kimberly-clark': 3300,
  'kraft-heinz': 2500,
  'mondelez-international': 2500,
  'nestle-usa': 2500,
  'niagara-bottling': 1000,
  'pactiv-evergreen': 1750,
  'performance-food-group': 2400,
  'salson-logistics': 450,
  'sc-johnson': 3300,
  'the-home-depot': 2700,
  'toyota': 3600,
  'unfi': 2400,
  'universal-logistics-holdings': 450,
  'walmart': 2700,
  'westrock-coffee': 2400,
};

/**
 * Derive the network counts that drive every ROI surface from the pack.
 * Extrapolates the audited drop-yard ratio across the full footprint (the
 * audit is a deliberate sample of core facilities, so this is defensible).
 */
export function deriveNetworkCounts(pack: DemoPack): NetworkRoiCounts {
  const cov = pack.account.coverageNote;

  const total =
    FOOTPRINT_OVERRIDE[pack.account.slug] ??
    cov?.totalGlobalFootprint ??
    cov?.estimatedFootprint ??
    pack.account.siteCount;

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
    averageMarginPerShipment:
      MARGIN_OVERRIDE[pack.account.slug] ?? pack.account.roiDefaults?.averageMarginPerShipment ?? 1000,
  };
}

/**
 * Build the canonical-engine `AccountROIModel` for the pack.
 *
 * The tier split MUST mirror the full RoiCalculatorV2's `deriveArchetypeCounts`
 * (Flow-State- `src/lib/roi/roiCalcAdapter.ts`) exactly, or the inline estimate
 * and the full calculator disagree. That calculator treats drop-trailer
 * facilities as a CUMULATIVE count that includes the YMS ones (its input
 * enforces drops >= yms >= 0, total >= drops), so the tiers are nested:
 *
 *   withYms      = facilitiesWithYms
 *   dropsNoYms   = facilitiesWithDropTrailers - facilitiesWithYms
 *   withoutDrops = totalFacilities - facilitiesWithDropTrailers
 *
 * Keep this in lockstep with that function. (Verified equal on real packs via
 * a cross-engine check, 2026-06-01.)
 */
export function buildAccountRoiModel(pack: DemoPack): AccountROIModel {
  const counts = deriveNetworkCounts(pack);

  const yms = Math.max(0, Math.round(counts.facilitiesWithYms));
  const drops = Math.max(yms, Math.round(counts.facilitiesWithDropTrailers));
  const total = Math.max(drops, Math.round(counts.total));

  return {
    sourceOfTruth: 'public-calculator-contract',
    averageMarginPerShipment: counts.averageMarginPerShipment,
    facilityMix: [
      { archetype: 'with-yms', facilityCount: yms },
      { archetype: 'drops-no-yms', facilityCount: drops - yms },
      { archetype: 'without-drops', facilityCount: total - drops },
    ],
  };
}
