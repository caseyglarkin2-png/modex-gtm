/**
 * GAP Prospecting OS claims validation (Sprint 3, S3-T1). Pure.
 *
 * Backs the message compiler's C13 CLAIMS check (docs/GAP_PROSPECTING_OS.md
 * section 8): every `claimsUsed` id must resolve in the committed snapshot,
 * and its status decides whether the step may carry it at all.
 *
 * Rules, in the order they are applied per id:
 *   unknown id                                   -> claim_unknown:<id>
 *   DO_NOT_USE                                   -> claim_forbidden:<id>
 *   INTERNAL_ONLY                                -> claim_internal_only:<id>
 *   APPROVED_AS_QUESTION and the step is not one -> claim_needs_question:<id>
 *   APPROVED_SALES_EMAIL on web or deck          -> claim_surface:<id>
 *   APPROVED_UNNAMED_ONLY                        -> ok, listed in unnamedOnly
 *   APPROVED_EXTERNAL                            -> ok
 * The first failing id wins, so a caller sees one specific reason.
 */

import snapshot from './registry.snapshot.json';
import {
  CLAIM_STATUSES,
  type ClaimPhrasing,
  type ClaimRow,
  type ClaimsSnapshot,
  type ClaimStatus,
  type ClaimValidationContext,
  type ClaimValidationResult,
} from './types';

const SNAPSHOT = snapshot as ClaimsSnapshot;

/** The committed snapshot rows, typed. Never mutated. */
export function loadClaims(): readonly ClaimRow[] {
  return SNAPSHOT.rows;
}

export function snapshotMeta(): Omit<ClaimsSnapshot, 'rows'> {
  return { schema: SNAPSHOT.schema, snapshotOf: SNAPSHOT.snapshotOf, verifiedAt: SNAPSHOT.verifiedAt };
}

const BY_ID: ReadonlyMap<string, ClaimRow> = new Map(SNAPSHOT.rows.map((r) => [r.claim_id, r]));

export function claimById(id: string): ClaimRow | undefined {
  return BY_ID.get(id);
}

export function isClaimStatus(value: unknown): value is ClaimStatus {
  return typeof value === 'string' && (CLAIM_STATUSES as readonly string[]).includes(value);
}

/**
 * Map the tier text CLAIMS.md writes in its Status column onto a ClaimStatus.
 * Returns undefined for text it cannot map so a caller fails loudly instead
 * of guessing. The match is on the leading words, so the "(Casey 2026-09-15)"
 * provenance suffixes and the "innuendo" / "hints" wording variants both map.
 */
export function normalizeTierText(text: string): ClaimStatus | undefined {
  const t = text.trim().toLowerCase();
  if (t.startsWith('do not use')) return 'DO_NOT_USE';
  if (t.startsWith('internal only')) return 'INTERNAL_ONLY';
  if (t.startsWith('approved (external')) return 'APPROVED_EXTERNAL';
  if (t.startsWith('approved (sales email')) return 'APPROVED_SALES_EMAIL';
  if (t.startsWith('approved (as question')) return 'APPROVED_AS_QUESTION';
  if (t.startsWith('approved as unnamed')) return 'APPROVED_UNNAMED_ONLY';
  return undefined;
}

/**
 * The lane writes one phrasing string per field. When that string is a list of
 * quoted alternatives ('a', 'b' / "a" / "b") it splits into the alternatives;
 * any other text is one phrasing. Empty or absent fields yield [].
 */
export function splitPhrasing(text: string | undefined): string[] {
  if (!text) return [];
  const trimmed = text.trim();
  if (!trimmed) return [];
  const quoted: string[] = [];
  const re = /'([^']+)'|"([^"]+)"/g;
  let rest = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(trimmed)) !== null) {
    quoted.push((m[1] ?? m[2]).trim());
    rest += trimmed.slice(last, m.index);
    last = m.index + m[0].length;
  }
  rest += trimmed.slice(last);
  const onlySeparators = /^[\s,\/.;]*(?:or[\s,\/.;]*)?$/.test(rest);
  if (quoted.length >= 2 && onlySeparators) return quoted;
  return [trimmed];
}

export function phrasingFor(id: string): ClaimPhrasing | undefined {
  const row = BY_ID.get(id);
  if (!row) return undefined;
  return {
    permitted: splitPhrasing(row.permitted_external_phrasing),
    provocative: splitPhrasing(row.provocative_phrasing),
    forbidden: splitPhrasing(row.forbidden_phrasing),
  };
}

export function validateClaimsUsed(
  claimIds: readonly string[],
  ctx: ClaimValidationContext,
): ClaimValidationResult {
  const unnamedOnly: string[] = [];
  for (const id of claimIds) {
    const row = BY_ID.get(id);
    if (!row) return { ok: false, reason: `claim_unknown:${id}` };
    switch (row.status) {
      case 'DO_NOT_USE':
        return { ok: false, reason: `claim_forbidden:${id}` };
      case 'INTERNAL_ONLY':
        return { ok: false, reason: `claim_internal_only:${id}` };
      case 'APPROVED_AS_QUESTION':
        if (!ctx.stepIsQuestion) return { ok: false, reason: `claim_needs_question:${id}` };
        break;
      case 'APPROVED_SALES_EMAIL':
        if (ctx.surface !== 'sales_email') return { ok: false, reason: `claim_surface:${id}` };
        break;
      case 'APPROVED_UNNAMED_ONLY':
        if (!unnamedOnly.includes(id)) unnamedOnly.push(id);
        break;
      case 'APPROVED_EXTERNAL':
        break;
    }
  }
  return { ok: true, unnamedOnly };
}
