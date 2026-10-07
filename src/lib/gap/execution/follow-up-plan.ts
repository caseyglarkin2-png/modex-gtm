/**
 * THE FOLLOW-UP PLAN (GAP OS execution recovery, R43, 2026-10-06). Pure and client-safe.
 *
 * What a follow-up obligation offers, read off the PERSON's actual execution history (person-history.ts: every
 * proven send, every Gmail draft and its fate, every send whose outcome is unknown) and the obligation's due day:
 *
 *   held             a reply, an opt-out, an open deal or an unreadable deal state stands: no follow-up, said why
 *   outcome_unknown  a send of the next touch was started and its answer was lost: check Gmail Sent, never resend
 *   complete         the next touch already went out (the sweep closes the obligation)
 *   draft_saved      a Gmail draft of the next touch is SAVED, not sent: send or delete it in Gmail (a draft is never
 *                    counted as a send)
 *   wait             not due yet: the justified wait, with the interval and the last touch
 *   prepare          due, and the family has copy for the next step: the existing card and seller-send preview
 *   by_hand          due, and the family has no follow-up copy (every seeded family is single-touch today): follow
 *                    up by hand in the thread; GAP reconciles it from the mailbox's Sent folder
 *
 * The send gates re-run everything at the click (prepareSellerEmail); this only says what to do and why.
 */
import type { Commitment } from '../work/commitment-model';
import { commitmentPhase } from '../work/commitment-model';
import { dayLabel, nyDay } from '../work/dates';
import { packHref } from '../account-intel/href';

export type FollowUpAction = 'held' | 'outcome_unknown' | 'complete' | 'draft_saved' | 'wait' | 'prepare' | 'by_hand';

export interface FollowUpHistory {
  sent: ReadonlyArray<{ stepIndex: number; sentAt: string; subject: string; senderIdentity: string | null; gmailThreadId: string | null; gmailSentMessageId: string }>;
  drafts: ReadonlyArray<{ fate: 'drafted' | 'sent' | 'discarded'; drafted: { stepIndex?: number; createdAt: string; gmailDraftId: string } }>;
  unresolvedClaims: ReadonlyArray<{ stepIndex: number | null; claimedAt: string }>;
}

export interface FollowUpHold {
  kind: 'reply' | 'opt_out' | 'deal' | 'unknown_deal';
  detail: string;
}

export interface FollowUpPlan {
  action: FollowUpAction;
  /** One seller sentence. */
  line: string;
  href: string | null;
  label: string | null;
  /** The touch the follow-up follows (the newest proven send), when there is one. */
  lastTouch: { stepIndex: number; at: string; subject: string; from: string | null; threadId: string | null } | null;
  /** The touch this follow-up is (0-based step). */
  nextStep: number;
}

const gmail = (mailbox: string | null, hash: string) => `https://mail.google.com/mail/u/0/${mailbox ? `?authuser=${encodeURIComponent(mailbox)}` : ''}#${hash}`;

export function planFollowUp(i: { commitment: Commitment; history: FollowUpHistory; nextStepHasCopy: boolean; hold: FollowUpHold | null; now: Date; mailbox: string | null }): FollowUpPlan {
  const c = i.commitment;
  const nextStep = c.detail?.stepIndex ?? 1;
  const who = c.person?.name ?? c.person?.email ?? 'them';
  const last = [...i.history.sent].sort((a, b) => b.stepIndex - a.stepIndex || b.sentAt.localeCompare(a.sentAt))[0] ?? null;
  const lastTouch = last ? { stepIndex: last.stepIndex, at: last.sentAt, subject: last.subject, from: last.senderIdentity, threadId: last.gmailThreadId } : null;
  const base = { lastTouch, nextStep };
  const touch = `touch ${nextStep + 1}`;
  if (i.hold) return { ...base, action: 'held', line: `${i.hold.detail} No follow-up while it stands.`, href: null, label: null };
  const claim = i.history.unresolvedClaims.find((x) => x.stepIndex === null || x.stepIndex === nextStep);
  if (claim) {
    return { ...base, action: 'outcome_unknown', line: `A send of ${touch} to ${who} was started ${dayLabel(nyDay(claim.claimedAt), i.now)} and its outcome is not recorded. Check Gmail Sent; GAP will not send it twice.`, href: gmail(i.mailbox, 'sent'), label: 'Check Gmail Sent' };
  }
  const already = i.history.sent.find((s) => s.stepIndex >= nextStep);
  if (already) return { ...base, action: 'complete', line: `Touch ${already.stepIndex + 1} went out ${dayLabel(nyDay(already.sentAt), i.now)}.`, href: null, label: null };
  const saved = i.history.drafts.find((d) => d.fate === 'drafted' && (d.drafted.stepIndex ?? 0) === nextStep);
  if (saved) {
    return { ...base, action: 'draft_saved', line: `A Gmail draft of ${touch} is saved, not sent (${dayLabel(nyDay(saved.drafted.createdAt), i.now)}). Send or delete it in Gmail; GAP counts it only once Gmail shows it sent.`, href: gmail(i.mailbox, 'drafts'), label: 'Open Gmail drafts' };
  }
  const phase = commitmentPhase(c, i.now);
  if (phase.phase !== 'due') {
    const when = phase.dueDay ? dayLabel(phase.dueDay, i.now) : 'later';
    return { ...base, action: 'wait', line: `Wait until ${when}: no reply from ${who} yet${lastTouch ? ` since touch ${lastTouch.stepIndex + 1} on ${dayLabel(nyDay(lastTouch.at), i.now)}` : ''}, and the follow-up interval has not passed.`, href: null, label: null };
  }
  if (i.nextStepHasCopy && c.detail?.decisionId) {
    return { ...base, action: 'prepare', line: `${touch[0].toUpperCase()}${touch.slice(1)} is due: the prepared follow-up goes in the same thread after the final check.`, href: packHref(c.detail.decisionId), label: `Prepare ${touch}` };
  }
  const thread = lastTouch?.threadId ? gmail(i.mailbox, `all/${encodeURIComponent(lastTouch.threadId)}`) : gmail(i.mailbox, `search/${encodeURIComponent(`to:"${c.person?.email ?? ''}"`)}`);
  return { ...base, action: 'by_hand', line: `${touch[0].toUpperCase()}${touch.slice(1)} is due and this family has no follow-up copy yet: follow up by hand in the thread, then mark it done (GAP also finds it in Sent).`, href: thread, label: 'Follow up in Gmail' };
}
