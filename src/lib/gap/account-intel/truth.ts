/**
 * ACCOUNT INTELLIGENCE: the TRUTH CONTRACT (2026-09-29).
 *
 * Every material statement about an account is exactly ONE of:
 *   BUYER_CONFIRMED    Casey confirmed it from the buyer (a human-confirmed BID); outranks everything public
 *   VERIFIED_PUBLIC    a source-backed fact (verified at its source, or a dated audit)
 *   MODELED_ESTIMATE   a number GAP computed: inputs, formula, a RANGE, assumptions (never a point)
 *   INFERENCE          GAP's reasoning, falsifiable (says what would make it wrong)
 *   UNKNOWN            not known; an honest answer and a discovery target
 *   CONTRADICTED       two sources disagree; stays visible until Casey resolves it
 * `statementProblems` refuses a statement that does not carry what its class requires; the brief builder
 * never renders one that fails. Section status is derived, never scored.
 */

export type TruthClass = 'BUYER_CONFIRMED' | 'VERIFIED_PUBLIC' | 'MODELED_ESTIMATE' | 'INFERENCE' | 'UNKNOWN' | 'CONTRADICTED';
export type SectionStatus = 'KNOWN' | 'PARTIAL' | 'MODELED' | 'UNKNOWN' | 'STALE' | 'CONTRADICTED';

export interface Source {
  kind: 'evidence' | 'bid' | 'hubspot' | 'gap' | 'work_source' | 'microsite' | 'audit' | 'roi' | 'signal' | 'persona' | 'account' | 'ledger';
  ref: string | null;
  label: string;
  url: string | null;
  at: string | null;
}

export interface Model {
  inputs: Record<string, string | number>;
  formula: string;
  range: [number, number];
  unit: string;
  assumptions: string[];
}

export interface Statement {
  text: string;
  truth: TruthClass;
  sources: Source[];
  asOf?: string | null;
  model?: Model;
  /** INFERENCE: the observation that would make it wrong. */
  falsifiableBy?: string;
  /** CONTRADICTED: what disagrees. */
  contradictedBy?: Source[];
}

/**
 * Sources that can back a VERIFIED statement: a fact verified at its source, a dated facility audit, or a
 * FIRST-PARTY RECORD about our own relationship (a CRM Persona or company, a work-source membership, the send
 * ledger). GAP's own derived state (a hypothesis, a signal, a hand-authored microsite) never can.
 */
const PUBLIC_BACKING = new Set<Source['kind']>(['evidence', 'audit', 'persona', 'hubspot', 'work_source', 'ledger', 'account']);

export function statementProblems(s: Statement): string[] {
  const out: string[] = [];
  // An audit backs a VERIFIED statement only through a cited URL; every other first-party record needs a ref or URL.
  if (s.truth === 'VERIFIED_PUBLIC' && !s.sources.some((x) => PUBLIC_BACKING.has(x.kind) && (x.kind === 'audit' || x.kind === 'evidence' ? !!x.url : !!(x.url || x.ref)))) out.push('verified_public_without_source');
  if (s.truth === 'BUYER_CONFIRMED' && !s.sources.some((x) => x.kind === 'bid')) out.push('buyer_confirmed_without_bid');
  if (s.truth === 'MODELED_ESTIMATE') {
    const m = s.model;
    if (!m || !Object.keys(m.inputs).length || !m.formula || !m.assumptions.length) out.push('modeled_without_model');
    else if (m.range[0] === m.range[1]) out.push('modeled_point_estimate');
  }
  if (s.truth === 'INFERENCE' && !s.falsifiableBy?.trim()) out.push('inference_not_falsifiable');
  if (s.truth === 'CONTRADICTED' && !s.contradictedBy?.length) out.push('contradicted_without_counter');
  return out;
}

export const isValidStatement = (s: Statement) => statementProblems(s).length === 0;

const RANK: Record<TruthClass, number> = { BUYER_CONFIRMED: 0, CONTRADICTED: 1, VERIFIED_PUBLIC: 2, MODELED_ESTIMATE: 3, INFERENCE: 4, UNKNOWN: 5 };

/** Buyer truth first; a contradiction stays visible right after it; then public, modeled, inferred, unknown. */
export function orderStatements<T extends Statement>(s: readonly T[]): T[] {
  return [...s].sort((a, b) => RANK[a.truth] - RANK[b.truth]);
}

const newest = (s: Statement[]) => s.map((x) => (x.asOf ? new Date(x.asOf).getTime() : 0)).reduce((a, b) => Math.max(a, b), 0);

/** Derived from what the section holds; never a score. */
export function sectionStatus(statements: readonly Statement[], unknowns: readonly string[], freshnessDays: number, now: Date): SectionStatus {
  const valid = statements.filter(isValidStatement);
  if (valid.some((s) => s.truth === 'CONTRADICTED')) return 'CONTRADICTED';
  const grounded = valid.filter((s) => s.truth === 'BUYER_CONFIRMED' || s.truth === 'VERIFIED_PUBLIC');
  if (grounded.length) {
    const age = now.getTime() - newest(grounded);
    if (!grounded.some((s) => s.truth === 'BUYER_CONFIRMED') && newest(grounded) > 0 && age > freshnessDays * 86_400_000) return 'STALE';
    return unknowns.length ? 'PARTIAL' : 'KNOWN';
  }
  if (valid.some((s) => s.truth === 'MODELED_ESTIMATE' || s.truth === 'INFERENCE')) return 'MODELED';
  return 'UNKNOWN';
}
