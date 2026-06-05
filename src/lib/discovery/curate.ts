/**
 * Discovery curation — turns the raw scored pile into a sellable target set.
 *
 * Three jobs, all pure and testable:
 *  - grain: collapse truck-entrance / gate artifacts and same-site duplicates so
 *    there is one row per physical site;
 *  - segment: tag each row shipper / carrier / 3pl / parcel (only parcel is
 *    demoted from the daily slice — carriers and 3PLs run yards too);
 *  - confidence: how sure we are the row is a real, sellable facility.
 *
 * Reuses the engine's sub-scores as signal; does not re-run the pipeline.
 */
import type { ProspectRow, ProspectSegment, Confidence, CuratedRow } from './types';

// ── Geo ──────────────────────────────────────────────────────────────────

function haversineMi(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Name normalization ─────────────────────────────────────────────────────

const COMPANY_SUFFIXES =
  /\b(inc|llc|corp|co|ltd|lp|company|corporation|enterprises|holdings|group|international|north america)\b/gi;

/** Lowercase, strip punctuation + company suffixes, collapse whitespace. */
export function normalizeSiteName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // drop parenthetical qualifiers e.g. "(Truck Entrance)"
    .replace(/[^\w\s]/g, ' ')
    .replace(COMPANY_SUFFIXES, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Grain artifacts ─────────────────────────────────────────────────────────

const GRAIN_ARTIFACT =
  /(truck\s*entrance|truck\s*gate|\bgate\s*\d+|\(entrance\)|inbound\s*gate|outbound\s*gate|shipping\s*gate|receiving\s*gate|employee\s*entrance|visitor\s*entrance)/i;

/** A gate / truck-entrance pin that should fold into its parent site, not stand alone. */
export function isGrainArtifact(name: string): boolean {
  return GRAIN_ARTIFACT.test(name);
}

// ── Segmentation ────────────────────────────────────────────────────────────

const PARCEL_TOKENS = [
  'delivery station',
  'sortation',
  'last mile',
  'last-mile',
  'authorized shipcenter',
  'amazon delivery',
  'parcel',
  'fedex ground',
  'package center',
  'ground hub',
];

const CARRIER_TOKENS = [
  'transport',
  'trucking',
  'freight line',
  'freight lines',
  'cartage',
  'motor lines',
  'intermodal',
  'drayage',
  'truck rental',
  'truck leasing',
  // asset-carrier brands
  'j.b. hunt',
  'jb hunt',
  'schneider',
  'swift',
  'knight',
  'werner',
  'old dominion',
  'estes',
  'saia',
  'abf',
  'arcbest',
  'tforce',
  'averitt',
  'penske',
  'ryder',
  'xpo',
];

const THREEPL_TOKENS = [
  'logistics',
  '3pl',
  'third party logistics',
  'fulfillment',
  'supply chain',
  'warehousing',
  'distribution services',
  // 3PL brands
  'nfi',
  'geodis',
  'ceva',
  'kuehne',
  'dsv',
  'gxo',
  'kenco',
  'saddle creek',
  'americold',
  'lineage',
];

/** shipper (default) / carrier / 3pl / parcel. Parcel & carrier are most specific, checked first. */
export function classifySegment(row: ProspectRow): ProspectSegment {
  const name = row.name.toLowerCase();
  if (PARCEL_TOKENS.some((t) => name.includes(t))) return 'parcel';
  if (CARRIER_TOKENS.some((t) => name.includes(t))) return 'carrier';
  if (THREEPL_TOKENS.some((t) => name.includes(t))) return '3pl';
  return 'shipper';
}

// ── Confidence ──────────────────────────────────────────────────────────────

const FACILITY_TOKENS = [
  'distribution center',
  'distribution',
  'warehouse',
  'fulfillment',
  'logistics',
  'cold storage',
  'manufacturing',
  'plant',
  'processing',
  'bottling',
  'cannery',
  'creamery',
  'foodservice',
  'food service',
  'depot',
  'terminal',
  'sortation',
  'supply chain',
];

/**
 * High when the name reads like a real facility AND an enterprise signal backs it
 * (revenue band ≥ $1B or footprint ≥ 10 sites, via the engine sub-scores). Low
 * when neither holds — likely a stray establishment. Medium otherwise.
 */
export function assessConfidence(row: ProspectRow): Confidence {
  const name = row.name.toLowerCase();
  const facilityName = FACILITY_TOKENS.some((t) => name.includes(t));
  const brandSignal = row.enterpriseScale >= 18 || row.networkComplexity >= 15;
  if (facilityName && brandSignal) return 'high';
  if (!facilityName && !brandSignal) return 'low';
  return 'medium';
}

// ── Grain dedup ─────────────────────────────────────────────────────────────

const SAME_SITE_RADIUS_MI = 0.15;
const ARTIFACT_RADIUS_MI = 0.3;

type RowWithMerge = ProspectRow & { mergedCount: number };

function nameMatch(a: string, b: string): boolean {
  const na = normalizeSiteName(a);
  const nb = normalizeSiteName(b);
  if (na === nb) return true;
  return na.length >= 4 && nb.length >= 4 && (na.includes(nb) || nb.includes(na));
}

/**
 * Collapse to one row per physical site. A grain artifact (truck entrance, gate)
 * folds into any kept row within ARTIFACT_RADIUS_MI; an ordinary duplicate folds
 * into a kept row of the same site name within SAME_SITE_RADIUS_MI. The kept row
 * is the highest-scoring non-artifact, and carries `mergedCount`.
 */
export function dedupeByGrain(rows: ProspectRow[]): RowWithMerge[] {
  const sorted = [...rows].sort((a, b) => {
    const aa = isGrainArtifact(a.name) ? 1 : 0;
    const ba = isGrainArtifact(b.name) ? 1 : 0;
    if (aa !== ba) return aa - ba; // non-artifacts first → they become representatives
    return b.icpScore - a.icpScore; // then best score first
  });

  const kept: RowWithMerge[] = [];
  for (const cand of sorted) {
    let merged = false;
    for (const k of kept) {
      const d = haversineMi(cand.lat, cand.lng, k.lat, k.lng);
      if (isGrainArtifact(cand.name) && d <= ARTIFACT_RADIUS_MI) {
        k.mergedCount += 1;
        merged = true;
        break;
      }
      if (d <= SAME_SITE_RADIUS_MI && nameMatch(cand.name, k.name)) {
        k.mergedCount += 1;
        merged = true;
        break;
      }
    }
    if (!merged) kept.push({ ...cand, mergedCount: 0 });
  }
  return kept;
}

// ── Top-level ───────────────────────────────────────────────────────────────

/** Dedup to one-per-site, then tag each surviving row with segment + confidence. */
export function curate(rows: ProspectRow[]): CuratedRow[] {
  return dedupeByGrain(rows).map((r) => ({
    ...r,
    segment: classifySegment(r),
    confidence: assessConfidence(r),
  }));
}

export interface CurationSummary {
  /** Rows surviving dedup. */
  curatedTotal: number;
  /** Duplicate / artifact rows folded away during dedup. */
  mergedTotal: number;
  bySegment: Record<ProspectSegment, number>;
  byConfidence: Record<Confidence, number>;
}

/** Headline curation counts for the Scan panel / provenance line. */
export function summarizeCuration(rows: CuratedRow[]): CurationSummary {
  const bySegment: Record<ProspectSegment, number> = { shipper: 0, carrier: 0, '3pl': 0, parcel: 0 };
  const byConfidence: Record<Confidence, number> = { high: 0, medium: 0, low: 0 };
  let mergedTotal = 0;
  for (const r of rows) {
    bySegment[r.segment] += 1;
    byConfidence[r.confidence] += 1;
    mergedTotal += r.mergedCount;
  }
  return { curatedTotal: rows.length, mergedTotal, bySegment, byConfidence };
}
