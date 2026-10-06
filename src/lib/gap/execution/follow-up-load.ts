/**
 * FOLLOW-UP READS AND RECOVERY (GAP OS execution recovery, R43, 2026-10-06). Server only.
 *
 *   loadFollowUpPlans           the plan (execution/follow-up-plan.ts) for each follow-up due today: the person's
 *                               history across every card (person-history.ts), whether the pinned version has copy for
 *                               the next step, and the holds (an open or unreadable deal, an opt-out). Bounded.
 *   reconcileFollowUpsFromSent  a follow-up sent by hand from the GAP mailbox (outside GAP) closes the obligation:
 *                               the mailbox's Sent folder after the last recorded touch, minus every message GAP
 *                               recorded, holding a message to that person, is the proof (`mailbox_sent`). Nothing
 *                               else is written: no ledger send is fabricated for copy GAP did not render. An unreadable
 *                               mailbox writes nothing (unknown, never "not sent"). Bounded per run.
 */
import { parseSteps } from '../sequence/steps';
import { personSendHistory } from './person-history';
import { planFollowUp, type FollowUpHold, type FollowUpPlan } from './follow-up-plan';
import type { SentMatch } from './unknown-send-reconcile';
import { commitmentPhase, TERMINAL_STATUSES, type Commitment } from '../work/commitment-model';
import { loadCommitments, transitionCommitment } from '../work/commitments';
import { dayLabel, nyDay } from '../work/dates';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const FOLLOW_UP_PLAN_LIMIT = 25;
export const FOLLOW_UP_RECONCILE_MAX = 10;

export async function loadFollowUpPlans(
  prisma: PrismaLike,
  commitments: readonly Commitment[],
  opts: { now: Date; mailbox: string | null; held?: ReadonlyMap<string, 'active_opportunity' | 'opportunity_unknown'>; dealAccounts?: ReadonlySet<string>; limit?: number },
): Promise<Map<string, FollowUpPlan>> {
  const out = new Map<string, FollowUpPlan>();
  const due = commitments.filter((c) => c.kind === 'follow_up' && !TERMINAL_STATUSES.includes(c.status) && c.person?.email && commitmentPhase(c, opts.now).phase === 'due').slice(0, opts.limit ?? FOLLOW_UP_PLAN_LIMIT);
  for (const c of due) {
    const email = c.person!.email!;
    const history = await personSendHistory(prisma, c.person?.personaId ?? null, email).catch(() => null);
    if (!history) continue;
    const last = [...history.sent].sort((a, b) => b.stepIndex - a.stepIndex)[0] ?? null;
    let nextStepHasCopy = false;
    if (last?.sequenceVersionId && typeof prisma.sequenceVersion?.findUnique === 'function') {
      const v = await prisma.sequenceVersion.findUnique({ where: { id: last.sequenceVersionId }, select: { steps: true } }).catch(() => null);
      const parsed = v ? parseSteps(v.steps) : null;
      nextStepHasCopy = !!(parsed && parsed.ok && parsed.steps.steps[c.detail?.stepIndex ?? 1]);
    }
    let hold: FollowUpHold | null = null;
    const heldWhy = opts.held?.get(c.accountName);
    if (opts.dealAccounts?.has(c.accountName) || heldWhy === 'active_opportunity') hold = { kind: 'deal', detail: `An open HubSpot deal at ${c.accountName}: work it from the deal.` };
    else if (heldWhy === 'opportunity_unknown') hold = { kind: 'unknown_deal', detail: `HubSpot could not say whether ${c.accountName} is in a deal.` };
    if (!hold) {
      const persona = c.person?.personaId != null && typeof prisma.persona?.findUnique === 'function' ? await prisma.persona.findUnique({ where: { id: c.person.personaId }, select: { do_not_contact: true } }).catch(() => null) : null;
      const unsub = typeof prisma.unsubscribedEmail?.findFirst === 'function' ? await prisma.unsubscribedEmail.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } }).catch(() => null) : null;
      if (persona?.do_not_contact || unsub) hold = { kind: 'opt_out', detail: `${c.person?.name ?? email} asked not to be contacted.` };
    }
    out.set(c.commitmentId, planFollowUp({ commitment: c, history, nextStepHasCopy, hold, now: opts.now, mailbox: opts.mailbox }));
  }
  return out;
}

export interface FollowUpReconcileReport {
  checked: number;
  reconciled: number;
  unknown: Array<{ commitmentId: string; reason: 'gmail_error' | 'not_yet_checked'; detail?: string }>;
}

export async function reconcileFollowUpsFromSent(
  prisma: PrismaLike,
  input: { now: Date; actor?: string },
  deps: { listSent: (recipient: string, afterEpoch: number, beforeEpoch: number) => Promise<SentMatch[]>; max?: number },
): Promise<FollowUpReconcileReport> {
  const actor = input.actor ?? 'cron:gap-mailbox';
  const report: FollowUpReconcileReport = { checked: 0, reconciled: 0, unknown: [] };
  const open = (await loadCommitments(prisma)).filter((c) => c.kind === 'follow_up' && !TERMINAL_STATUSES.includes(c.status) && c.person?.email);
  for (const [k, c] of open.entries()) {
    if (k >= (deps.max ?? FOLLOW_UP_RECONCILE_MAX)) {
      report.unknown.push({ commitmentId: c.commitmentId, reason: 'not_yet_checked' });
      continue;
    }
    report.checked += 1;
    const email = c.person!.email!;
    const since = new Date(c.detail?.sentAt ?? c.createdAt).getTime() + 60_000;
    const history = await personSendHistory(prisma, c.person?.personaId ?? null, email).catch(() => null);
    const recorded = new Set((history?.sent ?? []).map((s) => s.gmailSentMessageId));
    let found: SentMatch[];
    try {
      found = (await deps.listSent(email, Math.floor(since / 1000), Math.ceil(input.now.getTime() / 1000) + 60)).filter((m) => m.internalDate.getTime() > since && !recorded.has(m.id) && m.to.toLowerCase().includes(email));
    } catch (e) {
      report.unknown.push({ commitmentId: c.commitmentId, reason: 'gmail_error', detail: e instanceof Error ? e.message : String(e) });
      continue;
    }
    if (found.length === 0) continue;
    const m = [...found].sort((a, b) => a.internalDate.getTime() - b.internalDate.getTime())[0];
    const t = await transitionCommitment(prisma, { commitmentId: c.commitmentId, to: 'done', proof: { kind: 'mailbox_sent', id: m.id, note: `Followed up outside GAP on ${dayLabel(nyDay(m.internalDate), input.now)} ("${m.subject}"); found in Sent.` }, actor, now: input.now });
    if (t.ok) report.reconciled += 1;
  }
  return report;
}
