/**
 * R33 AUTOMATIC REVERSIBLE PREPARATION (batch item 5, 2026-10-07; the policy is Casey's, approved for this batch).
 *
 * Nothing turned a verified, useful claim into a reviewable proposal: a draft happened only when a seller pressed
 * DRAFT A THESIS. Now the research closeout (research/background.ts, after a run verifies claims) prepares the
 * proposal itself, through the ONE draft service (story/draft-from-fact.ts), for each fresh verified claim at the
 * account that no thesis cites and that opens a supported approach (story/draft-approach.ts).
 *
 * Reversible and bounded, by construction:
 *   - it goes only as far as the draft service does: a draft, submitted for REVIEW when complete (review_required);
 *     never approved, never activated, never routed, drafted to email, enrolled or sent
 *   - the proposal is withdrawable like any other (NOT THIS STORY); a story set aside is never prepared again (the
 *     draft service refuses it), and a rerun makes no twin (the draft service's source key)
 *   - the guess and the falsification are read off the fact (R31), and the family is derived or left as the one
 *     question (never a silent pick for an event-led thesis)
 *   - at most AUTO_PREPARE_MAX per account per run; off unless GAP_HYPOTHESIS_ENABLED is on
 *   - each preparation writes one `research.proposal_prepared` audit row naming the fact and the proposal
 */
import { assertGapEnabled } from '../flags';
import { citedQuote } from './propose';
import type { ClaimType } from './claim-types';
import { draftThesisFromFact } from '../story/draft-from-fact';
import { draftApproachFor } from '../story/draft-approach';
import { draftDefaultsForFact } from '../story/draft-defaults';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const AUTO_PREPARE_AUDIT = 'research.proposal_prepared' as const;
/** At most this many proposals prepared per account per research run. */
export const AUTO_PREPARE_MAX = 2;
/** The persona key for an account-level proposal (no person chosen yet). */
const ACCOUNT_PERSONA = 'supply_chain';
/** A thesis in any of these states already cites the fact: nothing is prepared beside it. */
const LIVE = new Set(['draft', 'review_required', 'approved', 'active', 'confirmed', 'partially_confirmed']);

export interface PreparableFact {
  signalId: string;
  fresh: boolean;
  claimType?: ClaimType;
}

export type PrepareOutcome =
  | { factId: string; outcome: 'prepared'; hypothesisId: string; preparation: string; approach: string; historical?: boolean }
  | { factId: string; outcome: 'existing'; hypothesisId: string; preparation: string }
  | { factId: string; outcome: 'cited' | 'set_aside' | 'no_approach' | 'cap_reached' }
  | { factId: string; outcome: 'refused'; reason: string; detail?: string };

export async function prepareProposalsFromResearch(
  prisma: PrismaLike,
  input: { accountName: string; facts: readonly PreparableFact[]; actor: string; now: Date },
  deps: { draft?: typeof draftThesisFromFact } = {},
): Promise<PrepareOutcome[]> {
  if (assertGapEnabled('GAP_HYPOTHESIS_ENABLED')) return [];
  const out: PrepareOutcome[] = [];
  const ids = [...new Set(input.facts.map((f) => f.signalId))];
  if (!ids.length) return out;
  const links: Array<{ signal_id: string; hypothesis: { status: string; account_name: string } | null }> = await prisma.hypothesisSignal.findMany({
    where: { signal_id: { in: ids } },
    select: { signal_id: true, hypothesis: { select: { status: true, account_name: true } } },
  });
  const rows: Array<{ id: string; title: string | null; evidence_text: string | null; claim_class: string | null; metadata: unknown }> = await prisma.prospectingSignal.findMany({
    where: { id: { in: ids }, account_name: input.accountName },
    select: { id: true, title: true, evidence_text: true, claim_class: true, metadata: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const draft = deps.draft ?? draftThesisFromFact;
  let prepared = 0;
  for (const f of input.facts) {
    const row = byId.get(f.signalId);
    if (!row?.evidence_text?.trim()) continue;
    // I03b (Casey's course correction, 2026-10-08): a fact's age is never a gate. A fact past its freshness window is
    // prepared like a fresh one; it is marked historical here and dated on the thesis (the FACT block shows the
    // signal's date), so the review says what it is and the copy never presents it as today.
    const mine = links.filter((l) => l.signal_id === f.signalId && l.hypothesis?.account_name === input.accountName);
    if (mine.some((l) => l.hypothesis && LIVE.has(l.hypothesis.status))) {
      out.push({ factId: f.signalId, outcome: 'cited' });
      continue;
    }
    if (mine.some((l) => l.hypothesis?.status === 'rejected')) {
      out.push({ factId: f.signalId, outcome: 'set_aside' });
      continue;
    }
    const meta = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? (row.metadata as Record<string, unknown>) : {};
    const recorded = meta.continuity && typeof meta.continuity === 'object' ? (meta.continuity as { kind?: string }).kind : undefined;
    const claimClass = row.claim_class ?? (f.claimType ? (f.claimType === 'physical_change' ? 'FACT' : f.claimType.toUpperCase()) : null);
    const approach = draftApproachFor({ text: row.evidence_text, claimClass, continuity: recorded === 'event' || recorded === 'ongoing_state' || recorded === 'ended' ? recorded : null });
    if (!approach) {
      out.push({ factId: f.signalId, outcome: 'no_approach' });
      continue;
    }
    if (prepared >= AUTO_PREPARE_MAX) {
      out.push({ factId: f.signalId, outcome: 'cap_reached' });
      continue;
    }
    const d = draftDefaultsForFact({ text: row.evidence_text, claimClass, approach });
    const r = await draft(prisma, {
      accountName: input.accountName,
      factId: f.signalId,
      personaId: null,
      persona: ACCOUNT_PERSONA,
      observation: citedQuote(row.title ?? 'source', row.evidence_text, f.signalId, input.accountName),
      problemHypothesis: d.problem,
      falsificationQuestions: [d.falsification],
      whatANoMeans: d.noMeans,
      problemFamily: null,
      actor: input.actor,
      now: input.now,
    });
    if (!r.ok) {
      out.push(r.reason === 'story_set_aside' ? { factId: f.signalId, outcome: 'set_aside' } : { factId: f.signalId, outcome: 'refused', reason: r.reason, ...(r.detail ? { detail: r.detail } : {}) });
      continue;
    }
    if (r.existing) {
      out.push({ factId: f.signalId, outcome: 'existing', hypothesisId: r.hypothesisId, preparation: r.preparation });
      continue;
    }
    prepared += 1;
    out.push({ factId: f.signalId, outcome: 'prepared', hypothesisId: r.hypothesisId, preparation: r.preparation, approach, ...(f.fresh ? {} : { historical: true }) });
    await prisma.gapAuditEvent.create({ data: { kind: AUTO_PREPARE_AUDIT, actor: input.actor, subject_type: 'prospecting_hypothesis', subject_id: r.hypothesisId, payload: { accountName: input.accountName, factId: f.signalId, preparation: r.preparation, status: r.status, approach } } });
  }
  return out;
}
