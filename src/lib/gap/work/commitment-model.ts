/**
 * COMMITMENTS, the pure model (GAP OS execution recovery, R40, 2026-10-06). Client-safe: Work and the account page
 * render from it; the store (commitments.ts) writes and folds the rows.
 *
 * One durable record per obligation: who owes what to whom by when, at which account, with which person, deal and
 * thread, in which status, waiting on what, and what proved it done. Statuses mean different things and never
 * collapse:
 *
 *   open      the seller owes it now or on its due day
 *   waiting   nothing to do until something happens (their reply, the follow-up interval, a promised delivery)
 *   blocked   cannot be done until a named dependency clears (said in `dependency`)
 *   snoozed   the seller put it away until a date; it returns on that date or when the buyer moves first
 *   done      completed, with proof (the ledger row, the disposition, the capture, the mailbox, or the seller's note)
 *   skipped   deliberately not done, with the reason; never mistaken for done
 *
 * `done` and `skipped` are terminal: nothing reopens them (a refresh, a restart, another instance or the source
 * firing again reads the same newest row). What a seller sees is the PHASE at `now` (commitmentPhase): due today,
 * upcoming, waiting, blocked, snoozed, done or skipped; the stored status never changes by itself.
 */
import { dayLabel, endOfNyDay, nyDay } from './dates';
import { classifyReply } from '../replies/classify';

export const COMMITMENT_EVENT = 'account.commitment' as const;
export const COMMITMENT_STATUSES = ['open', 'waiting', 'blocked', 'snoozed', 'done', 'skipped'] as const;
export type CommitmentStatus = (typeof COMMITMENT_STATUSES)[number];
export const TERMINAL_STATUSES: readonly CommitmentStatus[] = ['done', 'skipped'];

/**
 *   deliverable      the seller owes the buyer something ("send me the dock schedule by Friday")
 *   answer_request   the buyer asked for something (a request_information reply)
 *   prepare_meeting  a meeting the buyer accepted: prepare it
 *   follow_up        a touch went out; follow up when the interval passes without a reply
 *   reminder         come back on a date (a snooze, "not now, try in November", an out-of-office return)
 *   deal_step        the next step on an open deal
 *   buyer_promise    the buyer owes us something ("I'll send the volumes Thursday"); chase it when the day passes
 *   referral         the buyer named someone: decide how to approach them (no cold action until the seller chooses)
 *   task             anything else the seller noted for themself
 */
export const COMMITMENT_KINDS = ['deliverable', 'answer_request', 'prepare_meeting', 'follow_up', 'reminder', 'deal_step', 'buyer_promise', 'referral', 'task'] as const;
export type CommitmentKind = (typeof COMMITMENT_KINDS)[number];

export const PROOF_KINDS = ['ledger', 'disposition', 'capture', 'bid', 'mailbox_sent', 'outcome', 'seller'] as const;
export type ProofKind = (typeof PROOF_KINDS)[number];

export const SOURCE_KINDS = ['bid', 'disposition', 'send', 'snooze', 'capture', 'reply', 'seller'] as const;
export type CommitmentSourceKind = (typeof SOURCE_KINDS)[number];

export interface CommitmentPerson {
  personaId: number | null;
  name: string | null;
  email: string | null;
}

export interface CommitmentProof {
  kind: ProofKind;
  /** The row that proves it (a ledger event, a disposition, a capture, a Gmail message); null for the seller's note. */
  id: string | null;
  note: string | null;
  at: string;
  by: string;
}

export interface Commitment {
  commitmentId: string;
  accountName: string;
  kind: CommitmentKind;
  /** The seller words: "Send Ann the dock schedule template". */
  title: string;
  /** The words it rests on, verbatim, with the speaker when known ("Ann: can you send me ... by Friday?"). */
  basis: string | null;
  /** Who owes it (the seller who owns the account). */
  owner: string;
  /** When it is due (an instant; a date-only obligation is due at 9 am New York that day), or null. */
  dueAt: string | null;
  person: CommitmentPerson | null;
  dealId: string | null;
  /** The Gmail thread or inbound message it belongs to, when there is one. */
  threadId: string | null;
  status: CommitmentStatus;
  snoozeUntil: string | null;
  /** What it waits on or is blocked by, in words. */
  dependency: string | null;
  proof: CommitmentProof | null;
  /** Why it was skipped. */
  reason: string | null;
  /** What created it; the commitment id is derived from this, so the same source can never make a second one. */
  source: { kind: CommitmentSourceKind; id: string };
  /** Facts the surfaces need: the follow-up step and card, whether a copy family exists for it, an ambiguous date. */
  detail: { stepIndex?: number; decisionId?: string; noFollowUpCopy?: boolean; ambiguousDate?: string; meetingAt?: string } | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type CommitmentPhase = 'due' | 'upcoming' | 'waiting' | 'blocked' | 'snoozed' | 'done' | 'skipped';

export interface PhaseRead {
  phase: CommitmentPhase;
  /** One seller sentence: "Due today", "Due Oct 9", "Back Oct 9", "Waiting on Ann's reply; follow up Oct 12". */
  line: string;
  /** The New York day it is due, when it has a due time. */
  dueDay: string | null;
  /** A snoozed or waiting item came back early because the buyer moved. */
  returnedEarly: boolean;
}

/** What the buyer did since a commitment was set, per account or person (the reader supplies it; null = nothing). */
export type BuyerMoveSince = (c: Commitment, since: string) => string | null;

const who = (c: Commitment) => c.person?.name ?? c.person?.email ?? 'them';

/**
 * "The buyer moved since" from the replies a surface already holds: a person (a reply or an opt-out, never an
 * automatic notice or a bounce) at the commitment's account after `since`. Work and the account page read it the
 * same way, so a snooze returns early and a follow-up blocks on the same reply everywhere.
 */
export function buyerMoves(replies: ReadonlyArray<{ accountName: string; contactEmail: string; subject: string | null; snippet: string; receivedAt: string }>): BuyerMoveSince {
  const at = new Map<string, Array<{ at: number; who: string }>>();
  for (const r of replies) {
    const k = classifyReply({ snippet: r.snippet, subject: r.subject, from: r.contactEmail }).kind;
    if (k !== 'human' && k !== 'opt_out') continue;
    const list = at.get(r.accountName) ?? [];
    list.push({ at: new Date(r.receivedAt).getTime() || 0, who: r.contactEmail });
    at.set(r.accountName, list);
  }
  return (c, since) => {
    const t = new Date(since).getTime();
    const hit = (at.get(c.accountName) ?? []).filter((r) => r.at > t).sort((a, b) => b.at - a.at)[0];
    return hit ? `${hit.who} replied ${new Date(hit.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}.` : null;
  };
}

/**
 * The phase of a commitment at `now`. Due means due before the end of the New York day. A snooze returns on its date
 * or when the buyer moved after it was set; a follow-up the buyer answered is blocked by the answer (reply first,
 * never a cold follow-up); a buyer promise past its day becomes a chase.
 */
export function commitmentPhase(c: Commitment, now: Date, buyerMovedSince: BuyerMoveSince = () => null): PhaseRead {
  const dueDay = c.dueAt ? nyDay(c.dueAt) : null;
  const eod = endOfNyDay(now).getTime();
  const dueNow = !c.dueAt || new Date(c.dueAt).getTime() < eod;
  const when = dueDay ? dayLabel(dueDay, now) : null;
  const base = { dueDay, returnedEarly: false };
  if (c.status === 'done') return { ...base, phase: 'done', line: `Done${c.proof ? ` ${dayLabel(nyDay(c.proof.at), now)}` : ''}.` };
  if (c.status === 'skipped') return { ...base, phase: 'skipped', line: `Skipped${c.reason ? ` (${c.reason})` : ''}.` };
  if (c.kind === 'follow_up') {
    const moved = buyerMovedSince(c, c.createdAt);
    if (moved) return { ...base, phase: 'blocked', line: `${moved} Answer that, not a follow-up.` };
  }
  if (c.status === 'blocked') return { ...base, phase: 'blocked', line: `Blocked: ${c.dependency ?? 'a dependency'}.` };
  if (c.status === 'snoozed') {
    const until = c.snoozeUntil ?? c.dueAt;
    if (until && new Date(until).getTime() <= now.getTime()) return { ...base, phase: 'due', line: `Back today (snoozed until ${dayLabel(nyDay(until), now)}).` };
    const moved = buyerMovedSince(c, c.updatedAt);
    if (moved) return { ...base, phase: 'due', line: `Back early: ${moved}`, returnedEarly: true };
    return { ...base, phase: 'snoozed', line: until ? `Snoozed until ${dayLabel(nyDay(until), now)}.` : 'Snoozed.' };
  }
  if (c.status === 'waiting') {
    if (c.dueAt && dueNow) {
      if (c.kind === 'buyer_promise') return { ...base, phase: 'due', line: `${who(c)} promised it by ${when}; it has not arrived. Chase it.` };
      if (c.kind === 'follow_up') return { ...base, phase: 'due', line: `Follow-up due ${when === 'today' ? 'today' : `since ${when}`}: no reply from ${who(c)}.` };
      return { ...base, phase: 'due', line: `Due ${when}.` };
    }
    return { ...base, phase: 'waiting', line: `Waiting${c.dependency ? ` on ${c.dependency}` : ''}${when ? `; ${c.kind === 'follow_up' ? 'follow up' : 'due'} ${when}` : ''}.` };
  }
  // open
  if (dueNow) return { ...base, phase: 'due', line: c.dueAt ? (when === 'today' ? 'Due today.' : `Overdue since ${when}.`) : 'Due now.' };
  return { ...base, phase: 'upcoming', line: `Due ${when}.` };
}

/**
 * Where a due commitment ranks on Work (R41): a buyer commitment first of all, then the reply handling it belongs
 * to, a meeting to prepare, the deal's next step, then the follow-up class (follow-ups, reminders, chases, tasks).
 */
export type CommitmentTier = 'commitment' | 'reply' | 'meeting' | 'deal' | 'follow_up';
export function commitmentTier(c: Commitment): CommitmentTier {
  switch (c.kind) {
    case 'deliverable':
    case 'answer_request':
      return 'commitment';
    case 'referral':
      return 'reply';
    case 'prepare_meeting':
      return 'meeting';
    case 'deal_step':
      return 'deal';
    default:
      return c.dealId ? 'deal' : 'follow_up';
  }
}

/** Is this a buyer-facing obligation (the Today summary's "outstanding buyer commitments")? */
export const isBuyerCommitment = (c: Commitment): boolean => c.kind === 'deliverable' || c.kind === 'answer_request' || c.kind === 'buyer_promise' || c.kind === 'prepare_meeting' || c.kind === 'deal_step';

export const KIND_TEXT: Record<CommitmentKind, string> = {
  deliverable: 'Promised to the buyer',
  answer_request: 'They asked',
  prepare_meeting: 'Meeting to prepare',
  follow_up: 'Follow-up',
  reminder: 'Reminder',
  deal_step: 'Deal step',
  buyer_promise: 'They promised',
  referral: 'They named someone',
  task: 'Your task',
};
