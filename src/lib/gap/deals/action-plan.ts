/**
 * A PRACTICAL MUTUAL ACTION PLAN (GAP OS execution recovery, R52, 2026-10-06). Pure and client-safe.
 *
 * The plan for one deal is a short list of milestones, each an R40 commitment scoped to that deal once the seller
 * agrees to it: the next milestone, the responsible person (the seller, or someone on the buyer's side), the due day,
 * what it follows (the dependency) and what proves it done. GAP proposes the standard steps (discovery, site
 * validation, pilot, stakeholder alignment, procurement); a proposal is NOT a commitment and is never Work until the
 * seller agrees to it in ONE review (like R44's capture review: keep, edit or decline each). What is unknown stays
 * visibly unknown and never becomes an administrative task:
 *
 *   - no due day agreed: the milestone is "No date agreed yet" (upcoming, never due now)
 *   - no responsible person: "Who: not set" (nothing asks the seller to fill it in)
 *   - no buyer agreement recorded: "Buyer agreement: not recorded", always shown; only the seller records who on the
 *     buyer's side agreed and when; GAP never infers it, and agreeing to a milestone in the review is the SELLER's
 *     agreement, not the buyer's
 *
 * A declined step stays declined (the decision is recorded and the same proposal is not made again).
 */
import type { Commitment, PhaseRead } from '../work/commitment-model';

export const PLAN_STEPS = ['discovery', 'site_validation', 'pilot', 'stakeholder_alignment', 'procurement'] as const;
export type PlanStep = (typeof PLAN_STEPS)[number];
export const PLAN_DECISION = 'deal.plan_decision' as const;

export const PLAN_STEP_TEXT: Record<PlanStep, { title: string; proof: string; after: PlanStep | null }> = {
  discovery: { title: 'Discovery: confirm the problem in their words', proof: 'their words on the problem, confirmed in GAP', after: null },
  site_validation: { title: 'Site validation: walk one yard with their operator', proof: 'the site walk held, and what was seen', after: 'discovery' },
  pilot: { title: 'Pilot: agree the site, the length and the success measure', proof: 'the pilot plan agreed in writing', after: 'site_validation' },
  stakeholder_alignment: { title: 'Stakeholder alignment: the people who must agree', proof: 'each of them named and spoken to', after: 'pilot' },
  procurement: { title: 'Procurement: the buying path and the paperwork', proof: 'the paperwork path named by their buyer', after: 'stakeholder_alignment' },
};

export const isPlanStep = (v: unknown): v is PlanStep => typeof v === 'string' && (PLAN_STEPS as readonly string[]).includes(v);

/** The commitment source of a milestone: one per deal and step, so a second agreement can never make a second record. */
export const planSourceId = (dealId: string, step: PlanStep) => `${dealId}:${step}`;

export interface PlanDecisionRow {
  dealId: string;
  step: PlanStep;
  decision: 'declined';
  reason: string | null;
  by: string;
  at: string;
}

export interface Milestone {
  step: PlanStep;
  dealId: string;
  /** proposed: GAP's suggestion awaiting the seller; agreed: a commitment; declined: the seller said no. */
  state: 'proposed' | 'agreed' | 'declined';
  title: string;
  /** Who does it; null = not set (shown, never a task). */
  responsible: { side: 'buyer' | 'seller'; name: string | null } | null;
  /** The New York day it is due, or null (no date agreed). */
  dueDay: string | null;
  /** What it follows, in words. */
  after: string | null;
  proof: string;
  /** The buyer's agreement as the seller recorded it, or null: "not recorded". */
  buyerAgreed: { by: string; on: string } | null;
  commitmentId: string | null;
  /** The commitment's phase now (agreed milestones): "No date agreed yet.", "Due Oct 9.", "Done Oct 9." */
  line: string | null;
  phase: PhaseRead['phase'] | null;
  declined: { reason: string | null; by: string; at: string } | null;
}

/**
 * The plan for one deal: every standard step, each agreed (its commitment), declined (the seller's decision) or still
 * proposed, in the standard order. Agreed milestones are read from the deal's commitments whose source is the plan.
 */
export function planFor(dealId: string, commitments: ReadonlyArray<Commitment & Partial<PhaseRead>>, decisions: readonly PlanDecisionRow[]): Milestone[] {
  return PLAN_STEPS.map((step) => {
    const text = PLAN_STEP_TEXT[step];
    const c = commitments.find((x) => x.source.kind === 'plan' && x.source.id === planSourceId(dealId, step));
    const after = text.after ? PLAN_STEP_TEXT[text.after].title.split(':')[0] : null;
    if (c) {
      return {
        step,
        dealId,
        state: 'agreed' as const,
        title: c.title,
        responsible: c.detail?.responsible ?? null,
        dueDay: c.dueAt ? new Date(c.dueAt).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) : null,
        after: c.detail?.after ?? after,
        proof: c.detail?.proofNeeded ?? text.proof,
        buyerAgreed: c.detail?.buyerAgreed ?? null,
        commitmentId: c.commitmentId,
        line: c.line ?? null,
        phase: c.phase ?? null,
        declined: null,
      };
    }
    const d = [...decisions].filter((x) => x.dealId === dealId && x.step === step).sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
    return { step, dealId, state: d ? ('declined' as const) : ('proposed' as const), title: text.title, responsible: null, dueDay: null, after, proof: text.proof, buyerAgreed: null, commitmentId: null, line: null, phase: null, declined: d ? { reason: d.reason, by: d.by, at: d.at } : null };
  });
}

/** One plan line in seller words: who, when, the buyer's agreement (always said), what it follows and what proves it. */
export function milestoneLine(m: Milestone): string {
  const who = m.responsible ? `${m.responsible.side === 'buyer' ? `Their side${m.responsible.name ? `: ${m.responsible.name}` : ''}` : `You${m.responsible.name ? ` (${m.responsible.name})` : ''}`}` : 'Who: not set';
  const when = m.state === 'agreed' ? m.line ?? (m.dueDay ? `Due ${m.dueDay}.` : 'No date agreed yet.') : m.dueDay ? `Proposed for ${m.dueDay}.` : 'No date agreed yet.';
  const agreed = m.buyerAgreed ? `Buyer agreed: ${m.buyerAgreed.by}, ${m.buyerAgreed.on}.` : 'Buyer agreement: not recorded.';
  return `${who}. ${when} ${agreed}${m.after ? ` After ${m.after.toLowerCase()}.` : ''} Proof: ${m.proof}.`;
}
