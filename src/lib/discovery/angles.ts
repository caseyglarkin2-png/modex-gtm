/**
 * Angle library (additive) — a stack of distinct, recipient-facing framings for a
 * prospect so Casey can fire a different angle at each committee member instead of
 * one template. The single Casey-facing one-liner in `angle.ts` is unchanged; this
 * sits alongside it.
 *
 * Every angle is either backed by a fact on the row (proximity, network, scale,
 * corridor) or an honest capability framing that never claims something about the
 * prospect's specific yard (efficiency). No em dashes, no proof we don't show.
 */
import type { AngleKey } from './types';
import type { CuratedRow } from './types';
import { facilityNoun, formatMiles, NEAR_REFERENCE_MI } from './angle';
import { REFERENCE_SITES } from './reference-sites';

export type { AngleKey };

/** Network-complexity score (of 25) at or above which the network angle applies. */
export const ANGLE_NETWORK_MIN = 15;
/** Enterprise-scale score (of 25) at or above which the scale angle applies. */
export const ANGLE_SCALE_MIN = 15;

export interface Angle {
  key: AngleKey;
  /** Short chip label for the UI. */
  label: string;
  /** Recipient-facing subject line for this framing (consumed by buildOutreach). */
  subject: string;
  /** Recipient-facing opening line — what the detail-sheet stack shows and copies. */
  opener: string;
  /** True when the angle cites a fact on the row; false for a capability framing. */
  backed: boolean;
}

/**
 * Build the ordered angle stack for a row. Corridor and efficiency are always
 * present (so every prospect has at least two angles); proximity, network, and
 * scale appear only when their backing data supports them.
 */
export function buildAngleStack(row: CuratedRow): Angle[] {
  const noun = facilityNoun(row.name);
  const where = row.cityState ? ` in ${row.cityState}` : '';
  const out: Angle[] = [];

  if (row.nearestPrimoDistance <= NEAR_REFERENCE_MI) {
    const site = REFERENCE_SITES.find((s) => s.name === row.nearestPrimoName);
    const siteWhere = site ? ` in ${site.city}, ${site.state}` : '';
    const d = formatMiles(row.nearestPrimoDistance);
    out.push({
      key: 'proximity',
      label: 'Proximity',
      subject: `A live YardFlow site ${d} mi from your operation`,
      // Matches the default near-reference opener in outreach.ts so the proximity
      // angle and the default draft stay consistent. Site city named when it resolves.
      opener: `Primo Brands runs YardFlow at a live site${siteWhere || ' nearby'}, just ${d} mi from your ${noun}${where}.`,
      backed: true,
    });
  }

  if (row.networkComplexity >= ANGLE_NETWORK_MIN) {
    out.push({
      key: 'network',
      label: 'Network',
      subject: 'One live view across your yards',
      opener:
        'Running trailers across multiple yards leaves blind spots between sites. YardFlow puts every yard on one live map.',
      backed: true,
    });
  }

  if (row.enterpriseScale >= ANGLE_SCALE_MIN) {
    out.push({
      key: 'scale',
      label: 'Scale',
      subject: 'Cut gate and dock dwell at scale',
      opener:
        'At enterprise trailer volumes, minutes per move add up fast. YardFlow cuts gate and dock dwell with live yard tracking.',
      backed: true,
    });
  }

  out.push({
    key: 'corridor',
    label: 'Corridor',
    subject: `YardFlow in the ${row.corridor} corridor`,
    opener: `We're live with shippers and 3PLs across the ${row.corridor} corridor, running YardFlow in their yards.`,
    backed: true,
  });

  out.push({
    key: 'efficiency',
    label: 'Efficiency',
    subject: 'Stop losing trailers in your own yard',
    opener:
      'Most yards lose hours a day to trailers nobody can locate. YardFlow tracks every trailer from gate to dock in real time.',
    backed: false,
  });

  return out;
}

/**
 * Assign an angle to each of `n` committee members so they get non-duplicate copy.
 * Round-robins over the row's available angle stack: distinct while the stack
 * lasts, then repeats. Deterministic and pure.
 */
export function assignCommitteeAngles(row: CuratedRow, n: number): AngleKey[] {
  if (n <= 0) return [];
  const keys = buildAngleStack(row).map((a) => a.key);
  return Array.from({ length: n }, (_, i) => keys[i % keys.length]);
}
