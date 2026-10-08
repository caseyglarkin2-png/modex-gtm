/**
 * THE MUTUAL ACTION PLAN, the store (GAP OS execution recovery, R52, 2026-10-06). Server only. The model is
 * ./action-plan.ts.
 *
 * Storage: no new table. An agreed milestone IS an R40 commitment (kind `deal_step`, the deal's id, source
 * `plan:<dealId>:<step>`: one-shot, so agreeing twice makes one record); a declined step is an append-only
 * `deal.plan_decision` row (subject the account), newest per deal and step wins. The buyer's agreement is recorded by
 * the seller on the milestone (`detail.buyerAgreed`: who and on which day) and never inferred. Nothing here sends,
 * writes HubSpot or changes a thesis, a person or a suppression.
 */
import { ensureCommitment, amendCommitment, loadCommitments, withPhases } from '../work/commitments';
import { isDay, nyDayAt } from '../work/dates';
import { PLAN_DECISION, PLAN_STEP_TEXT, isPlanStep, planFor, planSourceId, type Milestone, type PlanDecisionRow, type PlanStep } from './action-plan';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface PlanReviewItem {
  step: string;
  decision: 'agree' | 'decline';
  title?: string | null;
  dueDay?: string | null;
  responsible?: { side: 'buyer' | 'seller'; name?: string | null } | null;
  proof?: string | null;
  /** The buyer agreed to this step, as the seller says: who and the day. Absent = not recorded. */
  buyerAgreed?: { by: string; on: string } | null;
  reason?: string | null;
}

export type PlanItemRefusal = 'bad_step' | 'bad_due' | 'bad_buyer_agreement' | 'already_agreed' | 'title_required' | 'title_too_long' | 'account_not_found';
export type PlanReviewResult = { step: string; ok: true; commitmentId: string | null; created: boolean } | { step: string; ok: false; reason: PlanItemRefusal | string };

const clean = (s: string | null | undefined, max: number) => {
  const t = (s ?? '').replace(/\s+/g, ' ').trim();
  return t ? t.slice(0, max) : null;
};

export async function loadPlanDecisions(prisma: PrismaLike, accountName: string): Promise<PlanDecisionRow[]> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return [];
  const rows: Array<{ actor: string; payload: Record<string, unknown> | null; created_at: Date }> = await prisma.gapAuditEvent.findMany({ where: { kind: PLAN_DECISION, subject_type: 'account', subject_id: accountName }, select: { actor: true, payload: true, created_at: true }, orderBy: { created_at: 'asc' } });
  return rows
    .filter((r) => r.payload && typeof r.payload.dealId === 'string' && isPlanStep(r.payload.step))
    .map((r) => ({ dealId: String(r.payload!.dealId), step: r.payload!.step as PlanStep, decision: 'declined' as const, reason: typeof r.payload!.reason === 'string' ? r.payload!.reason : null, by: r.actor, at: new Date(r.created_at).toISOString() }));
}

/** The plan for one deal now: agreed milestones (with their phase), declined steps and the remaining proposals. */
export async function loadPlan(prisma: PrismaLike, accountName: string, dealId: string, now: Date): Promise<Milestone[]> {
  const [cs, decisions] = await Promise.all([loadCommitments(prisma, { accountNames: [accountName] }), loadPlanDecisions(prisma, accountName)]);
  return planFor(dealId, withPhases(cs.filter((c) => c.dealId === dealId), now), decisions);
}

/**
 * ONE review of the plan: each step agreed (with the seller's edits) or declined, each answered on its own (one
 * refusal never blocks the others). Agreeing makes the milestone a commitment scoped to the deal (one-shot); declining
 * records the decision. The buyer's agreement is recorded only when the seller names who and when.
 */
export async function reviewPlan(
  prisma: PrismaLike,
  input: { accountName: string; dealId: string; items: readonly PlanReviewItem[]; actor: string; now: Date },
): Promise<{ ok: true; results: PlanReviewResult[]; plan: Milestone[] } | { ok: false; reason: 'account_not_found' | 'bad_deal' }> {
  if (!/^\d{1,24}$/.test(input.dealId)) return { ok: false, reason: 'bad_deal' };
  const account = await prisma.account.findUnique({ where: { name: input.accountName }, select: { name: true } });
  if (!account) return { ok: false, reason: 'account_not_found' };
  const before = await loadPlan(prisma, input.accountName, input.dealId, input.now);
  const results: PlanReviewResult[] = [];
  for (const item of input.items) {
    if (!isPlanStep(item.step)) {
      results.push({ step: String(item.step), ok: false, reason: 'bad_step' });
      continue;
    }
    const step = item.step;
    const have = before.find((m) => m.step === step)!;
    const buyerAgreed = item.buyerAgreed ? { by: clean(item.buyerAgreed.by, 120), on: clean(item.buyerAgreed.on, 10) } : null;
    if (buyerAgreed && (!buyerAgreed.by || !buyerAgreed.on || !isDay(buyerAgreed.on))) {
      results.push({ step, ok: false, reason: 'bad_buyer_agreement' });
      continue;
    }
    if (item.decision === 'decline') {
      if (have.state === 'agreed') {
        results.push({ step, ok: false, reason: 'already_agreed' });
        continue;
      }
      await prisma.gapAuditEvent.create({ data: { kind: PLAN_DECISION, actor: input.actor, subject_type: 'account', subject_id: input.accountName, payload: { dealId: input.dealId, step, decision: 'declined', reason: clean(item.reason, 240) } } });
      results.push({ step, ok: true, commitmentId: null, created: false });
      continue;
    }
    const dueDay = clean(item.dueDay, 10);
    if (dueDay && !isDay(dueDay)) {
      results.push({ step, ok: false, reason: 'bad_due' });
      continue;
    }
    const title = clean(item.title, 1_000) ?? PLAN_STEP_TEXT[step].title;
    const responsible = item.responsible ? { side: item.responsible.side === 'buyer' ? ('buyer' as const) : ('seller' as const), name: clean(item.responsible.name, 120) } : null;
    const theirs = responsible?.side === 'buyer';
    const r = await ensureCommitment(
      prisma,
      {
        accountName: input.accountName,
        kind: 'deal_step',
        title,
        dueAt: dueDay ? nyDayAt(dueDay) : null,
        dealId: input.dealId,
        // Theirs waits on them (and becomes a chase on its day); ours is open; neither is due without a date.
        status: theirs ? 'waiting' : 'open',
        dependency: theirs ? `${responsible?.name ?? 'their side'}: ${title}` : null,
        source: { kind: 'plan', id: planSourceId(input.dealId, step) },
        detail: { milestone: step, proofNeeded: clean(item.proof, 240) ?? PLAN_STEP_TEXT[step].proof, after: have.after, responsible, buyerAgreed: buyerAgreed ? { by: buyerAgreed.by!, on: buyerAgreed.on! } : null },
      },
      { actor: input.actor, now: input.now },
    );
    if (!r.ok) {
      results.push({ step, ok: false, reason: r.reason });
      continue;
    }
    // An existing milestone keeps what it was agreed with; a buyer agreement recorded now is added to it.
    if (!r.created && buyerAgreed && !r.commitment.detail?.buyerAgreed) await amendCommitment(prisma, { commitmentId: r.commitment.commitmentId, detail: { buyerAgreed: { by: buyerAgreed.by!, on: buyerAgreed.on! } }, actor: input.actor, now: input.now });
    results.push({ step, ok: true, commitmentId: r.commitment.commitmentId, created: r.created });
  }
  return { ok: true, results, plan: await loadPlan(prisma, input.accountName, input.dealId, input.now) };
}

/** The seller records that the buyer agreed to an agreed milestone: who on their side, and the day. */
export async function recordBuyerAgreement(prisma: PrismaLike, input: { commitmentId: string; by: string; on: string; actor: string; now: Date }) {
  const by = clean(input.by, 120);
  const on = clean(input.on, 10);
  if (!by || !on || !isDay(on)) return { ok: false as const, reason: 'bad_buyer_agreement' as const };
  if (!input.commitmentId.startsWith('plan:')) return { ok: false as const, reason: 'not_a_milestone' as const };
  return amendCommitment(prisma, { commitmentId: input.commitmentId, detail: { buyerAgreed: { by, on } }, actor: input.actor, now: input.now });
}
