/**
 * GAP Prospecting OS claims registry types (Sprint 3, S3-T1).
 *
 * The single source for what outbound copy may claim is the committed
 * snapshot `registry.snapshot.json` next to this file. It carries the lane's
 * `data/claims_registry.json` rows verbatim plus the CR-034..CR-040 rows that
 * exist only in the lane's human registry `CLAIMS.md`, with their tier text
 * normalized to the six statuses below. `scripts/gap/claims-parity.ts` keeps
 * the three surfaces in parity.
 *
 * Voice: no em dashes in code, "yards" plural.
 */

export const CLAIM_STATUSES = [
  'APPROVED_EXTERNAL',
  'APPROVED_SALES_EMAIL',
  'APPROVED_UNNAMED_ONLY',
  'APPROVED_AS_QUESTION',
  'INTERNAL_ONLY',
  'DO_NOT_USE',
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

/** Surfaces the compiler can be asked to validate copy for. */
export const CLAIM_SURFACES = ['sales_email', 'web', 'deck'] as const;
export type ClaimSurface = (typeof CLAIM_SURFACES)[number];

/**
 * One registry row. The lane's JSON omits `provocative_phrasing` on question
 * and DO_NOT_USE rows; the CLAIMS.md-only rows have no permitted or forbidden
 * phrasing column and no source excerpt, so those fields are optional and
 * never invented. `status_text_in_claims_md` keeps the verbatim tier text a
 * normalized status was derived from.
 */
export interface ClaimRow {
  claim_id: string;
  claim_text: string;
  category: string;
  status: ClaimStatus;
  status_text_in_claims_md?: string;
  scope: string;
  permitted_external_phrasing?: string;
  provocative_phrasing?: string;
  forbidden_phrasing?: string;
  source_path_or_url: string;
  source_excerpt?: string;
  verified_at: string;
  confidence: string;
}

export interface ClaimsSnapshot {
  schema: 'gap-claims-snapshot.v1';
  snapshotOf: string;
  verifiedAt: string;
  rows: ClaimRow[];
}

export interface ClaimPhrasing {
  permitted: string[];
  provocative: string[];
  forbidden: string[];
}

export type ClaimRejectReason =
  | `claim_unknown:${string}`
  | `claim_forbidden:${string}`
  | `claim_internal_only:${string}`
  | `claim_needs_question:${string}`
  | `claim_unnamed_only:${string}`
  | `claim_surface:${string}`;

export interface ClaimValidationContext {
  /** True when the sequence step poses its content as a question. */
  stepIsQuestion: boolean;
  surface: ClaimSurface;
}

export type ClaimValidationResult =
  | {
      ok: true;
      /** Ids approved only as unnamed innuendo; the compiler's C05 must enforce it. */
      unnamedOnly: string[];
    }
  | { ok: false; reason: ClaimRejectReason };
