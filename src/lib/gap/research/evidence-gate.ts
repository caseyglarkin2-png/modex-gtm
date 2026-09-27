/**
 * THE EVIDENCE GATE (red team T6, 2026-09-26). Pure.
 *
 * GAP approved, activated and sent on evidence it itself labeled
 * INSUFFICIENT: an auto-ingested keyword hit ("PEP 10-Q mentions: capital
 * expenditure") reached the observation, the copy and the call script, and
 * three verbatim-but-irrelevant 10-Q sentences (a restructuring-charge split,
 * a risk factor, a liquidity paragraph) counted as facts.
 *
 * The rule, one place, used by approval, activation, routing, the compiler
 * and the send gate:
 *
 *   A first touch needs ONE outreach fact: a verified, dated, quoted,
 *   account-specific statement of a relevant physical-network change.
 *
 * An outreach fact proves only that the change happened. It never proves a
 * yard problem; everything beyond it stays a question or a hypothesis.
 *
 * A keyword-only signal (nothing quoted) may trigger RESEARCH. It may not be
 * cited in outbound copy, may not count toward approval and may not make a
 * hypothesis sendable. Casey's own operator knowledge informs a thesis but is
 * not a public, verifiable fact, so it cannot be the first-touch fact either.
 */
import { isPhysicalOpsFact } from './facts';
import { extractCitationIds } from '../hypothesis/observation';

export interface GateSignal {
  id: string;
  account_name?: string | null;
  source_kind?: string | null;
  source_type?: string | null;
  evidence_text?: string | null;
  evidence_url?: string | null;
  observed_at?: Date | string | null;
  external_ok?: boolean | null;
  metadata?: unknown;
}

export type OutreachFactRefusal =
  | 'keyword_only'
  | 'operator_knowledge'
  | 'not_public'
  | 'not_verified'
  | 'not_external'
  | 'undated'
  | 'other_account'
  | 'not_a_physical_network_change';

/** The verification stamp research writes when the excerpt was found in the fetched source (research/run.ts). */
export const VERIFIED_EXCERPT = 'excerpt_found_at_source';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** A signal that quotes nothing: it names a document, it does not show a fact from it. */
export function isKeywordOnly(s: GateSignal): boolean {
  const operator = s.source_kind === 'operator_knowledge' || s.source_kind === 'manual';
  return !operator && !(s.evidence_text ?? '').trim();
}

/** Why this signal is not an outreach fact, or null when it is one. */
export function outreachFactRefusal(s: GateSignal, accountName: string): OutreachFactRefusal | null {
  if (s.source_kind === 'operator_knowledge' || s.source_kind === 'manual') return 'operator_knowledge';
  const text = (s.evidence_text ?? '').trim();
  if (!text) return 'keyword_only';
  if (s.source_type !== 'public_primary' && s.source_type !== 'public_secondary') return 'not_public';
  if (!isObj(s.metadata) || s.metadata.verified !== VERIFIED_EXCERPT) return 'not_verified';
  if (s.external_ok !== true) return 'not_external';
  const observed = s.observed_at instanceof Date ? s.observed_at : s.observed_at ? new Date(s.observed_at) : null;
  if (!observed || Number.isNaN(observed.getTime())) return 'undated';
  if (s.account_name != null && s.account_name.trim().toLowerCase() !== accountName.trim().toLowerCase()) return 'other_account';
  if (!isPhysicalOpsFact(text)) return 'not_a_physical_network_change';
  return null;
}

export interface OutreachEvidence {
  /** 'VERIFIED_FACT' when at least one outreach fact is linked, else 'INSUFFICIENT'. */
  tier: 'VERIFIED_FACT' | 'INSUFFICIENT';
  facts: string[];
  keywordOnly: string[];
  refused: Array<{ id: string; reason: OutreachFactRefusal }>;
}

/** The outreach tier of a hypothesis from its linked signals. */
export function outreachEvidence(signals: readonly GateSignal[], accountName: string): OutreachEvidence {
  const facts: string[] = [];
  const keywordOnly: string[] = [];
  const refused: Array<{ id: string; reason: OutreachFactRefusal }> = [];
  for (const s of signals) {
    if (!s || typeof s.id !== 'string') continue;
    const why = outreachFactRefusal(s, accountName);
    if (why === null) facts.push(s.id);
    else {
      refused.push({ id: s.id, reason: why });
      if (why === 'keyword_only') keywordOnly.push(s.id);
    }
  }
  return { tier: facts.length > 0 ? 'VERIFIED_FACT' : 'INSUFFICIENT', facts, keywordOnly, refused };
}

export interface SendableEvidence extends OutreachEvidence {
  /** Ids the observation cites that are not live outreach facts. Any one makes the hypothesis unsendable. */
  nonFactCitations: string[];
}

/**
 * The send decision (Release C review SF1). A linked fact is not enough when
 * the sentence that reaches the buyer cites something else: the observation
 * must cite at least one signal, and every signal it cites must itself be a
 * live outreach fact. Pass only live (unexpired) signals, so a cited expired
 * fact counts as a non-fact citation.
 */
export function sendableEvidence(observation: string | null | undefined, signals: readonly GateSignal[], accountName: string): SendableEvidence {
  const base = outreachEvidence(signals, accountName);
  const facts = new Set(base.facts);
  const cited = extractCitationIds(observation ?? '');
  const nonFactCitations = cited.filter((id) => !facts.has(id));
  const ok = base.tier === 'VERIFIED_FACT' && cited.length > 0 && nonFactCitations.length === 0;
  return { ...base, tier: ok ? 'VERIFIED_FACT' : 'INSUFFICIENT', nonFactCitations };
}

/** The Prisma select every gate caller needs on a linked ProspectingSignal. */
export const GATE_SIGNAL_SELECT = {
  id: true,
  account_name: true,
  source_kind: true,
  source_type: true,
  evidence_text: true,
  evidence_url: true,
  observed_at: true,
  external_ok: true,
  metadata: true,
} as const;

/**
 * The send decision for a loaded hypothesis row (`signals: [{ signal }]`),
 * with only LIVE signals considered (Release C re-review S8): an expired fact
 * never makes a hypothesis sendable, and is never read aloud as an opener.
 */
export function hypothesisSendable(
  h: { observation?: string | null; account_name: string; signals?: ReadonlyArray<{ signal?: (GateSignal & { freshness_expires_at?: Date | string | null }) | null }> | null },
  now: Date,
): boolean {
  const live = (h.signals ?? [])
    .map((l) => l.signal)
    .filter((s): s is GateSignal & { freshness_expires_at?: Date | string | null } => !!s && (!s.freshness_expires_at || new Date(s.freshness_expires_at).getTime() > now.getTime()));
  return sendableEvidence(h.observation, live, h.account_name).tier === 'VERIFIED_FACT';
}
