/**
 * BID selection (GAP Prospecting OS, Sprint 4, S4-T2). Pure.
 *
 * Which BuyerInputData rows count as evidence: the ones a human confirmed
 * AND that no later row corrects. A correction is a new row whose
 * `supersedes_id` points at the old one (the old row is never edited or
 * deleted; `prisma/sql/2026-09-23-gap-os.sql` GAP_BID_IMMUTABLE enforces it).
 *
 * Fail closed on corrections: an UNCONFIRMED correction still supersedes.
 * The old evidence is removed the moment someone says it was wrong, and the
 * new evidence is added only once a human confirms it (spec section 4.4).
 * So while a correction sits unconfirmed the hypothesis has LESS evidence,
 * never different evidence.
 */

export interface SelectableBid {
  id: string;
  humanConfirmed: boolean;
  supersedesId: string | null;
}

/** Ids of every row that some other row in the set corrects, confirmed or not. */
export function supersededIds(rows: readonly SelectableBid[]): Set<string> {
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.supersedesId !== null && row.supersedesId !== undefined) ids.add(row.supersedesId);
  }
  return ids;
}

/**
 * The rows that feed resolution: human-confirmed and not superseded, in the
 * input order. The superseded set is computed over the WHOLE input, so the
 * caller must pass every row of the hypothesis (or at least every correction),
 * not a pre-filtered confirmed subset.
 */
export function selectConfirmedBids<T extends SelectableBid>(rows: readonly T[]): T[] {
  const superseded = supersededIds(rows);
  return rows.filter((row) => row.humanConfirmed === true && !superseded.has(row.id));
}

/** A `BuyerInputData` row as Prisma returns it (the columns selection reads). */
export interface BidRow {
  id: string;
  type: string;
  raw_buyer_language: string;
  numeric_value: unknown;
  unit: string | null;
  human_confirmed: boolean;
  supersedes_id: string | null;
  metadata?: unknown;
  captured_at?: Date;
  created_at?: Date;
}

/** The camelCase shape `selectConfirmedBids` and `scoreResolution` read. */
export interface ResolutionBid extends SelectableBid {
  type: string;
  rawBuyerLanguage: string;
  numericValue: number | null;
  unit: string | null;
  metadata: unknown;
  capturedAt: Date | null;
}

/** Prisma Decimal, string, number or null to a finite number or null. */
export function numericValueOf(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const n = Number(value);
    return value.trim().length > 0 && Number.isFinite(n) ? n : null;
  }
  if (typeof value === 'object' && typeof (value as { toNumber?: unknown }).toNumber === 'function') {
    const n = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function bidFromRow(row: BidRow): ResolutionBid {
  return {
    id: row.id,
    type: row.type,
    rawBuyerLanguage: row.raw_buyer_language,
    numericValue: numericValueOf(row.numeric_value),
    unit: row.unit ?? null,
    humanConfirmed: row.human_confirmed === true,
    supersedesId: row.supersedes_id ?? null,
    metadata: row.metadata ?? null,
    capturedAt: row.captured_at ?? row.created_at ?? null,
  };
}
