/**
 * The evidence rule — ONE definition.
 *
 * This lived inline in `fovGate()` and was re-implemented from memory in tests
 * and ad-hoc audit scripts, which is how a rule drifts. Everything that decides
 * "is this facility ship-eligible" imports from here.
 *
 * A research record may exist without being ship-eligible. That is the point of
 * a research corpus. Ship-eligible means: we can put this facility in front of a
 * buyer as a factual claim.
 */

export interface Citation {
  tier?: number;
  url?: string;
  date?: string;
  type?: string;
  claim?: string;
}

export interface Verification {
  verdict?: string;
  citations?: Citation[];
  checkedDivestiture?: boolean;
  checkedBankruptcyEra?: boolean;
  rationale?: string;
}

/** Accounts that went through a bankruptcy/restructuring needing its own check. */
export const RESTRUCTURED_COMPANIES = new Set(['general-motors']);

/**
 * A citation we control. Our own marketing page is not evidence for a claim on
 * our own marketing page — that is a closed loop, and it read as sourcing only
 * because the gate counted URLs rather than reading them.
 */
export function isSelfCitation(url: string): boolean {
  return /(^|\/\/|\.)(yardflow\.ai|freightroll\.com)(\/|$|:)/i.test(url);
}

/**
 * An API endpoint our own auditing agent issued. It returned data, which made it
 * feel like a source, but it is a record of a lookup WE performed: usually
 * key-gated, frequently non-resolvable to a reader, and never a document anyone
 * can open to check us.
 */
export function isSelfIssuedApi(url: string): boolean {
  return /(googleapis\.com|\bkey=AIza|[?&]api_key=)/i.test(url);
}

/** A citation a reader could actually open and use to check the claim. */
export function isDurableIndependent(c: Citation): boolean {
  const url = c.url ?? '';
  if (!url || !c.date) return false;
  return !isSelfCitation(url) && !isSelfIssuedApi(url);
}

export type EvidenceFailure =
  | 'no-verification-block'
  | 'no-verdict'
  | 'rejected'
  | 'no-citations'
  | 'citation-missing-url-or-date'
  | 'no-durable-independent-citation'
  | 'divestiture-unchecked'
  | 'bankruptcy-era-unchecked';

/**
 * Returns null when the record is ship-eligible, otherwise why it is not.
 *
 * `no-durable-independent-citation` was added 2026-08-12 after a dry run over
 * the whole corpus: it demotes 6 records, all Tyson, and ZERO sites in any of
 * the 58 public demo packs. The self-validating loophole was real but nothing
 * shipped was leaning on it, so closing it costs nothing and cannot silently
 * reclassify hundreds of records.
 */
export function evidenceFailure(
  accountSlug: string,
  v: Verification | undefined | null,
): EvidenceFailure | null {
  if (!v) return 'no-verification-block';
  if (!v.verdict) return 'no-verdict';
  if (v.verdict === 'rejected') return 'rejected';

  const citations = v.citations ?? [];
  if (citations.length === 0) return 'no-citations';
  if (citations.some((c) => !c.url || !c.date)) return 'citation-missing-url-or-date';
  if (!citations.some(isDurableIndependent)) return 'no-durable-independent-citation';

  if (v.checkedDivestiture !== true) return 'divestiture-unchecked';
  if (RESTRUCTURED_COMPANIES.has(accountSlug) && v.checkedBankruptcyEra !== true) {
    return 'bankruptcy-era-unchecked';
  }
  return null;
}

export function isShipEligible(accountSlug: string, v: Verification | undefined | null): boolean {
  return evidenceFailure(accountSlug, v) === null;
}
