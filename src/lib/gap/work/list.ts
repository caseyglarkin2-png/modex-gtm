/**
 * WORK LIST (account-first UX, UX-08; ranked by commercial obligations, GAP OS execution recovery R41, 2026-10-06):
 * the accounts that need the seller TODAY, one card each, every independently due obligation visible on its card,
 * in the order the buyer's obligations put them:
 *
 *   1 commitment   a buyer commitment due today (the seller promised a deliverable, the buyer asked for something)
 *   2 reply        an actionable reply (a person wrote back; a referral to decide on)
 *   3 meeting      a meeting within 24 hours (prepare it)
 *   then the executable work, ranked by the EVIDENCE each card carries (seller acceptance A2, 2026-10-09, evidenceRank
 *   below: an answer owed, open-deal context, something prepared, a prior reply, the seller's priority, deal hygiene,
 *   a decision to review, a cold follow-up with no reply ever), not by the lane alone; the lanes themselves are
 *   4 deal         opportunity work: an open deal with a step due
 *   5 follow_up    a follow-up due (the interval passed with no reply; a reminder came back)
 *   6 ready        prepared prospecting (a first touch ready; a GAP draft to send or discard)
 *   7 review       a proposal to review (decide the angle)
 *   8 research     research (and a failed address; and an account whose only news is a person back from an
 *                  out-of-office notice, A1: availability, never an obligation)
 *   then the admin (an opt-out to record), the seller's own "not today" (skipped, logged elsewhere) and the holds (in a
 *   deal with nothing due, HubSpot unknown), never a cold action.
 *
 * Inside a tier the order is explainable and said on the card (`rankWhy`): the due time, then the newest buyer
 * activity, then the seller's explicit priority (work/priority.ts), then the lane's own order. Waiting work (a first
 * touch out and its follow-up not due, an obligation due on a later day, something blocked) is NOT a card: it is the
 * Waiting footer, counted, so "needs you" counts only what needs the seller today. A snoozed item leaves until its date
 * or until the buyer moves. The counts are the contents (N4): needs you = the cards that need the seller; research,
 * holds and the seller's own set-asides stay listed after them, under PARKED, counted apart (batch item 8: a hold or a
 * research card is never "needs you"); the footers list what they count.
 *
 * Not a second state engine: the cards are projected from the cockpit's candidates, the account motions, the In Deals
 * summary, the reply class (replies/classify.ts), the canonical pursuit summaries (whose actionable result wins over
 * a lane card), the ledger's touches, the seller's outcomes and the commitments (work/commitment-model.ts). Pinned by
 * tests/unit/gap/work-list.test.ts and tests/unit/gap/work-rank.test.ts.
 */
import { cutWords } from '../story/touches';
import { accountHref, isCockpitLaneHref, packHref, recordReplyHref } from '../account-intel/href';
import { classifyReply, HUMAN_REPLY_LABEL, type ReplyClassKind } from '../replies/classify';
import { prepareReply, type ReplyPrep } from '../replies/prepare';
import type { FollowUpPlan } from '../execution/follow-up-plan';
import { LANE_RANK, type NextCandidate } from '../routing/next-up';
import { hubspotCompanySearchUrl } from '../routing/seller-action';
import type { PursuitSummary } from '../pursuit/summary';
import type { PursuitStateKind } from '../pursuit/state';
import { outcomeLine, type WorkOutcome } from './outcome-model';
import { MOTION_UNLOCK_BUSINESS_DAYS } from '../motion/account-motion';
import { buyerMoves, commitmentPhase, commitmentTier, KIND_TEXT, skippedAtClosureOf, type Commitment, type CommitmentKind, type SkippedAtClosure, TERMINAL_STATUSES } from './commitment-model';
import { addDays, dayLabel, isDay, nyDay, nyDayAt } from './dates';
import { clipAtSentence } from './briefing';
import { stalledSignals } from '../deals/stalled';
import { closedDealLabel, type ClosedDealRef } from '../deals/scope';
import type { OpportunityHold } from './opportunity-holds';
import { isReplyKindClass, REPLY_KIND_WORDS } from '../capture/reply-kind';
import type { CockpitLane } from '@/components/gap/gap-cockpit';

export type WorkStateKind = 'replied' | 'opted_out' | 'bounced' | 'follow_up' | 'ready' | 'decide' | 'research' | 'in_deal' | 'unknown_deal' | 'held' | 'committed' | 'meeting';
export type WorkTier = 'commitment' | 'reply' | 'meeting' | 'deal' | 'follow_up' | 'ready' | 'review' | 'research' | 'admin' | 'later' | 'held';
export const TIER_RANK: Record<WorkTier, number> = { commitment: 0, reply: 1, meeting: 2, deal: 3, follow_up: 4, ready: 5, review: 6, research: 7, admin: 7.5, later: 8, held: 9 };
/**
 * I04 / I05 (Casey's course correction, 2026-10-08, and the review): the day is for new conversations. A deal card whose
 * ONLY move is hygiene (a passed close date, no activity: no due obligation, no HubSpot next step) ranks after the
 * prospect follow-ups and the prepared first touches; a deal card carrying a due commitment or a next step keeps the
 * deal tier's place (a real commitment coming due stays prominent, the mandate's section 5).
 */
export const DEAL_HYGIENE_RANK = TIER_RANK.ready + 0.5;
/**
 * Batch item 8: the tiers that do not need the seller today (research, a hold, the seller's own set-aside). Their cards
 * stay listed, after every card that needs the seller and under their own heading, and never count in "needs you".
 */
export const PARKED_TIERS: ReadonlySet<WorkTier> = new Set<WorkTier>(['research', 'later', 'held']);
/**
 * X15a: an untriaged reply older than this no longer leads the day (the live page led with June and August replies);
 * it ranks as admin, "An old reply to triage", still listed. The same window as ANSWER_OWED_DAYS.
 */
export const REPLY_TRIAGE_DAYS = 14;
/** Does this card need the seller today? Its tier, else (a card built outside workDay) the tier its state places it in. */
export function needsYouCard(c: { tier?: WorkTier; stateKind: WorkStateKind }): boolean {
  return !PARKED_TIERS.has(c.tier ?? STATE_TIER[c.stateKind]);
}
/** The Work filters: the analyst lanes plus "due" (buyer commitments, meetings and deal steps due today). */
export type WorkLane = CockpitLane | 'commitments';

export interface WorkObligation {
  /** The commitment id, or `meeting:<account>:<at>` for a meeting on the calendar. */
  key: string;
  commitmentId: string | null;
  kind: CommitmentKind | 'meeting';
  tier: WorkTier;
  title: string;
  /** The phase in words: "Due today", "Overdue since Oct 9", "Back today", "Meeting tomorrow 10:00". */
  line: string;
  dueAt: string | null;
  dueDay: string | null;
  person: { name: string | null; email: string | null } | null;
  basis: string | null;
  /** Where the work runs, when the account page is not the place. */
  href: string | null;
  label: string | null;
  /** A commitment record: the seller can mark it done, snooze it or skip it from the card. */
  canComplete: boolean;
  /** R50: the opportunity it belongs to ("Deal: Kroger yard pilot"), or null for account-level work. */
  scope?: string | null;
  /** R51: the meeting's prepared starting point (objective and the first open question), when one was prepared. */
  prep?: string | null;
  /** R63-A S11: the meeting itself, so the card can mark it prepared. */
  meeting?: { at: string; what: string } | null;
  /** Batch item 8: what proves it done (a plan milestone's own proof), asked when the seller marks it done. */
  proofNeeded?: string | null;
  /** Sprint 5 review (R55): on a reopened deal's next step, what its closure skipped (each restorable). */
  skippedAtClosure?: Array<SkippedAtClosure & { restored: boolean }>;
}

export interface WaitingItem {
  key: string;
  accountName: string;
  kind: CommitmentKind | 'motion' | 'meeting';
  title: string;
  line: string;
  dueDay: string | null;
  commitmentId: string | null;
}

export interface WorkCard {
  accountName: string;
  /** The account workspace, carrying the Work order (`?from=work&i=n`) so the workspace can offer Next account. */
  href: string;
  lane: WorkLane;
  stateKind: WorkStateKind;
  /** The seller words for the state ("Someone replied", "Ready for a first touch", "In a deal"). */
  state: string;
  /** Why this account deserves attention now, one sentence. */
  why: string;
  /** The next person (the motion's primary, or who wrote), when one is named. */
  person: { name: string; title: string | null } | null;
  /** The next action and where it runs; null when the only move is to open the account. */
  next: { label: string; href: string } | null;
  blocker: string | null;
  /** R10: how far GAP prepared the move, when the workspace said (ready, under_review, incomplete, none). */
  preparation?: 'ready' | 'under_review' | 'incomplete' | 'none' | null;
  /** R14: the seller's recorded outcome on this account, when it still holds (skipped today, logged outside GAP). */
  outcome?: { kind: WorkOutcome['kind']; line: string; until: string } | null;
  /** Position in the Work order (0-based), frozen into the href. */
  index: number;
  /** Where the state came from: the canonical pursuit read (fresh), or the cockpit's lanes. */
  source: 'pursuit' | 'cockpit';
  /** R41: the tier that placed the card, and why it sits where it does, in words. */
  tier?: WorkTier;
  rankWhy?: string;
  /** R41: every obligation due today at this account, each separately (two due commitments stay two). */
  obligations?: WorkObligation[];
  /** R41: the seller's explicit priority on the account. */
  priority?: { reason: string; by: string; at: string } | null;
  /** R42: the incoming message this card is about and its prepared notes (never copy, never a send). */
  reply?: ReplyPrep | null;
  /** R44: Capture, opened with the account, person, deal and conversation this card is about already filled in. */
  capture?: { href: string; label: string } | null;
  /** R55: stalled-deal suggestions on an in-deal card (overdue obligations, no recent activity, a passed close date). */
  stalled?: string[];
  /** R63-A S4: a recorded reply whose answer is owed (its action is the prepared answer, never Capture again). */
  answerOwed?: boolean;
  /** X15c: the next step HubSpot carries on the deal (hs_next_step), when one is set: the card leads with it. */
  dealNextStep?: string | null;
  /** X17: the card's own move in words, when it is not its state (a deal's next step): the plan item's title. */
  move?: string;
  /**
   * Seller acceptance A1 (2026-10-09): a person's out-of-office notice whose return day has passed is availability
   * information, never an obligation and never a priority: it rides on the account's card, said with its date.
   */
  availability?: { who: string; email: string | null; returnedDay: string; line: string };
  /**
   * Seller acceptance A3: this card was built from the account's top obligation alone (its state IS that obligation),
   * so the plan carries the obligation's item and never a second item for the card's own move.
   */
  ownMoveIsObligation?: boolean;
  /** Seller acceptance A2: the evidence that placed the card after the buyer-obligation tiers, in words. */
  evidence?: { rank: number; why: string };
  /** Seller acceptance A2 addendum: an angle GAP prepared for a person at this account (WorkInput.preparedAngles). */
  preparedAngle?: { who: string; line: string } | null;
  /** Knowledge program C2 (2026-10-09): what the vault holds on the account (WorkInput.knowledge), so the assignment can print the next action. */
  knowledge?: AccountKnowledge | null;
}

/**
 * Knowledge program C2 (2026-10-09): the vault's account summary as ranking evidence, folded by the day loader from the
 * account's knowledge notes (load-day.ts accountKnowledgeOf): the newest conversation held (a meeting note, a Fireflies
 * capture), how many, and the account note's own next action, its due day and when the account was last touched.
 */
export interface AccountKnowledge {
  lastConversationAt: string | null;
  conversations: number;
  nextAction: string | null;
  /** A New York day ('2026-10-15'), or null when the note names none. */
  nextActionDue: string | null;
  lastTouched: string | null;
}

/** C2: a conversation this recent is relationship history (the same evidence level as a prior reply). */
export const KNOWLEDGE_CONVERSATION_DAYS = 30;
/** C2: a vault next action due within this many days (or past) is deal context. */
export const KNOWLEDGE_NEXT_ACTION_DAYS = 7;

export interface WorkInput {
  now: Date;
  /** Every NEXT UP candidate (all lanes), from buildNextUpCandidates. */
  candidates: readonly NextCandidate[];
  /** Undispositioned replies, the raw rows (classified here; twins already collapsed by the reply list). */
  replies: ReadonlyArray<{ accountName: string; contactEmail: string; subject: string | null; snippet: string; receivedAt: string; id?: string; threadId?: string | null; fromName?: string | null; personaId?: number | null; hubspotContactId?: string | null; /** R63-A S4: what they said is recorded; the answer is still owed. */ recorded?: boolean }>;
  /** R42: the GAP mailbox, for the thread link on a reply card. */
  mailbox?: string | null;
  /** The account motions the cockpit read (primary and next per account). */
  motions: ReadonlyArray<{ accountName: string; state: string; primary: { name: string; title: string | null } | null; next: { name: string; title: string | null; unlock: string } | null }>;
  /** The In Deals summary: complete, or unavailable (then nothing is claimed about deals). */
  inDeals: { status: 'complete' | 'unavailable'; /** C01: when HubSpot was read, so a consumer can say so. */ checkedAt?: string | null; accounts: ReadonlyArray<{ accountName: string; /** C57 F7 (C03): the other names the deal is recorded under, so the Work page folds aliases as the briefing does. */ alsoRecordedAs?: string[]; deals: ReadonlyArray<{ id?: string; name: string | null; stage: string; lastActivityAt?: string | null; closeDate?: string | null; /** X15c: HubSpot hs_next_step, when set. */ nextStep?: string | null; contactIds?: readonly string[] }> }> };
  /** Accounts a current card holds for an open deal or an UNKNOWN opportunity read (never a cold action). */
  held: ReadonlyMap<string, 'active_opportunity' | 'opportunity_unknown'>;
  /**
   * R63-B S12: what the gate's own opportunity read says for the accounts Work would offer cold work
   * (work/opportunity-holds.ts): a closed deal (a customer, or parked after a loss), an open deal the In Deals summary
   * missed, or HubSpot not answering. Each holds the account in the workspace's words, never a first touch.
   */
  opportunityHolds?: ReadonlyMap<string, OpportunityHold>;
  /**
   * R63-A B3: the account's recorded conversation (motion/load.ts loadAccountConversations, the account page's own
   * reader; DB only), with the person's name when GAP holds it. A conversation holds every cold-work card (ready, decide)
   * the way the page's approach does: a "no" or a do not contact stops outreach, anything else is worked from that
   * conversation, never a cold first touch. Today and the tomorrow preview read the same rule.
   */
  conversations?: ReadonlyMap<string, { who: string; name?: string | null; responseClass: string; at: string }>;
  /** Fresh canonical pursuit summaries by account (pursuit/summary.ts), when any. */
  summaries?: ReadonlyMap<string, PursuitSummary>;
  /**
   * What the database alone says per account, read on every load (no HubSpot, no process memory): whether a usable
   * (sendable, grounded, open) thesis exists, and the recorded chosen person.
   */
  dbState?: ReadonlyMap<string, { sendable: boolean; chosen: { name: string; title: string | null } | null }>;
  /** R14: what the seller recorded on an account (work/outcome.ts). */
  outcomes?: ReadonlyMap<string, WorkOutcome>;
  /** R14: accounts with a proven GAP first touch or an outstanding GAP draft in the window (the send ledger alone). */
  inMotion?: ReadonlyMap<string, { state: 'sent' | 'drafted'; at: string; person: { name: string; title: string | null } | null }>;
  /** R40/R41: every commitment at the Work accounts (and beyond), as stored; the phase is read here at `now`. */
  commitments?: readonly Commitment[];
  /** R41: meetings on the calendar (the Meeting table), any within the next 24 hours become an obligation. */
  meetings?: ReadonlyArray<{ accountName: string; at: string; what: string; personaId?: number | null; meetingId?: number; dealId?: string | null }>;
  /** R51: meetings on the calendar that were canceled (Work stops asking to prepare them, and says so). */
  canceledMeetings?: ReadonlyArray<{ accountName: string; at: string; what: string; meetingId: number; dealId?: string | null }>;
  /** R51: each meeting's prepared starting point and where its preparation lives, by meeting id. */
  meetingPreps?: ReadonlyMap<number, { prep: string; href: string }>;
  /** R63-A S11: the meetings marked prepared (their key on Work); they no longer need the seller. */
  preparedMeetings?: ReadonlySet<string>;
  /** R41: the seller's explicit priority per account (work/priority.ts). */
  priorities?: ReadonlyMap<string, { reason: string; by: string; at: string }>;
  /** R43: the plan for each follow-up due today, by commitment id (execution/follow-up-plan.ts). */
  followUpPlans?: ReadonlyMap<string, FollowUpPlan>;
  /** Sprint 5 review: the deals GAP recorded as closed (deals/closure.ts), by HubSpot id, so a row on one is named. */
  closedDeals?: ReadonlyMap<string, ClosedDealRef>;
  /**
   * Seller acceptance A2 addendum (2026-10-09): the angles GAP prepared, by account (a develop_angle task that succeeded
   * for a person placed at the account; the day loader reads them from the placed pursued items). Evidence that
   * something is prepared: an open deal with a prepared angle ranks above a stalled deal with nothing prepared.
   */
  preparedAngles?: ReadonlyMap<string, { who: string; line: string }>;
  /**
   * Knowledge program C2 (2026-10-09): the vault's account summaries by account name (the day loader folds them from
   * Builder A's knowledge reader; absent or unread is none). Evidence: a conversation within KNOWLEDGE_CONVERSATION_DAYS
   * ranks as relationship history; a next action due within KNOWLEDGE_NEXT_ACTION_DAYS or past ranks as deal context;
   * both are named in rankWhy, and the card carries the summary so the assignment can print the next action.
   */
  knowledge?: ReadonlyMap<string, AccountKnowledge>;
}

export interface WorkDay {
  cards: WorkCard[];
  /** Not today: the obligations waiting on someone or due on a later day, and the first touches out. Counted, not cards. */
  waiting: WaitingItem[];
  /** Put away by the seller until a date (accounts and obligations). */
  snoozed: Array<{ key: string; accountName: string; line: string; until: string }>;
  /**
   * needsYou: the cards that need the seller; parked: the research, held and set-aside cards listed after them;
   * availability (A1): the people back from an out-of-office notice, carried on their cards and never an obligation
   * (optional in the type so a plan recorded before it still reads; workDay always sets it).
   */
  counts: { needsYou: number; parked: number; obligationsDue: number; waiting: number; snoozed: number; availability?: number };
}

const STATE_TEXT: Record<WorkStateKind, string> = {
  replied: 'Someone replied',
  opted_out: 'Opted out',
  bounced: 'Address failed',
  follow_up: 'Follow up due',
  ready: 'Ready for a first touch',
  decide: 'Decide the angle',
  research: 'Research',
  in_deal: 'In a deal',
  unknown_deal: 'Held: HubSpot could not be checked',
  held: 'Held',
  committed: 'Due to the buyer',
  meeting: 'Meeting to prepare',
};

/** The action a pursuit-sourced card offers when the summary predates the actionable result (R10). */
function pursuitAction(state: PursuitStateKind, accountName: string, stateLine = ''): { label: string; href: string } | null {
  const page = accountHref(accountName);
  if (state === 'ready' && /^Relationship-led/.test(stateLine)) return { label: 'Log the warm touch', href: `/gap/capture?account=${encodeURIComponent(accountName)}` };
  switch (state) {
    // R60: a reply is read and recorded on its own account, never in the all-replies lane.
    case 'replied':
      return { label: 'Open the reply', href: recordReplyHref(accountName) };
    case 'opted_out':
      return { label: 'Record the opt-out', href: recordReplyHref(accountName) };
    case 'in_deal':
      return { label: 'Open the deal brief', href: `${page}?view=brief` };
    case 'held':
      return null;
    case 'follow_up_due':
      return { label: 'Open the follow-up', href: page };
    case 'in_motion':
      return { label: 'Open the account', href: page };
    case 'ready':
      return { label: 'Prepare the first touch', href: page };
    case 'choose_person':
      return { label: 'Choose who hears this first', href: `${page}#people-stack-heading` };
    case 'research':
      return { label: 'Open the research plan', href: `${page}?view=sources#research-plan` };
    default:
      return { label: 'Open the account', href: page };
  }
}

/** The hold a reply card states on its own; the reply panel and the card's sentence already say it (R60: said once). */
export const GENERIC_REPLY_BLOCKERS: ReadonlySet<string> = new Set([
  'A reply is waiting to be recorded.',
  'They asked not to be contacted: record it.',
]);

/** The rank a classified reply takes: a human reply first of all; an opt-out after READY; a bounce with research. */
const REPLY_RANK: Record<ReplyClassKind, number | null> = { human: LANE_RANK.replies, opt_out: LANE_RANK.research + 0.5, bounce: LANE_RANK.research, out_of_office: null };

/** The canonical pursuit state's rank and card words (contract 5.1 order: reply, hold, follow up, in motion, ready, choose, research). */
const PURSUIT_RANK: Record<PursuitStateKind, number> = { replied: 0, opted_out: LANE_RANK.research + 0.5, in_deal: LANE_RANK.deals, held: LANE_RANK.deals - 0.5, follow_up_due: 1, in_motion: 1.5, ready: 2, choose_person: 2.5, research: 4, idle: 4.5 };
const PURSUIT_KIND: Record<PursuitStateKind, WorkStateKind> = { replied: 'replied', opted_out: 'opted_out', in_deal: 'in_deal', held: 'held', follow_up_due: 'follow_up', in_motion: 'ready', ready: 'ready', choose_person: 'ready', research: 'research', idle: 'research' };
const PURSUIT_LANE: Record<PursuitStateKind, CockpitLane> = { replied: 'replies', opted_out: 'replies', in_deal: 'deals', held: 'deals', follow_up_due: 'follow_up', in_motion: 'ready', ready: 'ready', choose_person: 'ready', research: 'research', idle: 'research' };

/** The tier a card's own state places it in (before any obligation). */
const STATE_TIER: Record<WorkStateKind, WorkTier> = { replied: 'reply', opted_out: 'admin', bounced: 'research', follow_up: 'follow_up', ready: 'ready', decide: 'review', research: 'research', in_deal: 'held', unknown_deal: 'held', held: 'held', committed: 'commitment', meeting: 'meeting' };
const TIER_LANE: Partial<Record<WorkTier, WorkLane>> = { commitment: 'commitments', meeting: 'commitments', deal: 'commitments', follow_up: 'follow_up', reply: 'replies' };

const TIER_WHY: Record<WorkTier, string> = {
  commitment: 'A buyer commitment is due',
  reply: 'A buyer replied',
  meeting: 'A meeting within 24 hours',
  deal: 'An open deal has a step due',
  follow_up: 'A follow-up is due',
  ready: 'A prepared first touch',
  review: 'A proposal to review',
  research: 'Research',
  admin: 'Admin: record it',
  later: 'You set it aside for today',
  held: 'Held: nothing cold here',
};

function cmpKeys(a: Array<number | string>, b: Array<number | string>): number {
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const x = a[i];
    const y = b[i];
    if (x === y) continue;
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    if (typeof x === 'number' && typeof y === 'number') return x - y;
    return String(x).localeCompare(String(y));
  }
  return 0;
}

const day = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
const time = (s: string) => new Date(s).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

interface Ranked {
  rank: number;
  sortKey: Array<number | string>;
  card: Omit<WorkCard, 'href' | 'index' | 'source'>;
  source?: 'pursuit' | 'cockpit';
}

/**
 * C28: a commitment's dates as instants. A date-only value ('2026-05-26', a row written before the instant rule or by
 * hand) is that New York day at the due hour, never UTC midnight (which reads as the evening before in New York, so
 * May 26 became May 25 and a date due tomorrow became due tonight). Instants pass through unchanged.
 */
export function withInstantDates(c: Commitment): Commitment {
  const fix = (v: string | null): string | null => (v && isDay(v) ? nyDayAt(v).toISOString() : v);
  const dueAt = fix(c.dueAt);
  const snoozeUntil = fix(c.snoozeUntil);
  return dueAt === c.dueAt && snoozeUntil === c.snoozeUntil ? c : { ...c, dueAt, snoozeUntil };
}

/**
 * C28: the return date, said as what it is. `due today` for a date that is today; `overdue since <day>` for an open
 * or waiting obligation past its day; `returned on <day>` for a snooze or a reminder whose day passed (a reminder from
 * May 26 read on October 8 is not "back today": it returned on May 26 and has waited since); `scheduled for <day>` for
 * a snooze or a wait on a later day. Follow-ups and buyer promises keep their own words; only the date part moves.
 */
export function describeReturn(c: Commitment, phase: { phase: string; line: string; dueDay: string | null }, now: Date): string {
  const today = nyDay(now);
  const when = (day: string) => dayLabel(day, now);
  const onDay = (day: string) => (/^(today|tomorrow|yesterday)$/.test(when(day)) ? when(day) : `on ${when(day)}`);
  if (c.status === 'snoozed') {
    const untilDay = c.snoozeUntil ?? c.dueAt ? nyDay((c.snoozeUntil ?? c.dueAt) as string) : null;
    if (!untilDay) return phase.line;
    if (phase.phase === 'snoozed') return `Scheduled for ${when(untilDay)}.`;
    if (phase.phase === 'due' && /^Back early/.test(phase.line)) return phase.line;
    if (untilDay === today) return 'Back today (snoozed until today).';
    if (untilDay < today) return `Returned ${onDay(untilDay)}; overdue since then.`;
    return phase.line;
  }
  if (c.status === 'waiting' && phase.phase === 'waiting' && phase.dueDay && phase.dueDay > today) {
    return `Scheduled for ${when(phase.dueDay)}${c.dependency ? `; waiting on ${c.dependency}` : ''}.`;
  }
  if (phase.phase === 'due' && phase.dueDay && c.kind !== 'follow_up' && c.kind !== 'buyer_promise') {
    if (phase.dueDay === today) return 'Due today.';
    if (phase.dueDay < today) return `Overdue since ${when(phase.dueDay)}.`;
  }
  return phase.line;
}

/** C27: the person an obligation is about, as a stable key: the address, else the persona, else the name; null when none. */
export function obligationPersonKey(c: Pick<Commitment, 'person'>): string | null {
  const email = c.person?.email?.trim().toLowerCase();
  if (email) return `email:${email}`;
  if (typeof c.person?.personaId === 'number') return `persona:${c.person.personaId}`;
  const name = c.person?.name?.trim().toLowerCase().replace(/\s+/g, ' ');
  return name ? `name:${name}` : null;
}

/**
 * C27: the durable origin of an obligation: what created it (the originating message, disposition, send, plan step or
 * seller note, by its id) within its relationship scope (the account, the deal, the person). Two rows with one origin
 * are one obligation whatever their titles say; two origins are two obligations whatever their titles say.
 */
export function obligationOriginKey(c: Commitment): string {
  return `${c.accountName}|${c.dealId ?? ''}|${obligationPersonKey(c) ?? ''}|${c.kind}|${c.source.kind}:${c.source.id}`;
}

/**
 * C27: does this obligation fold into another live one? A reminder to come back to a person (derived from their
 * out-of-office notice, their "not now", or the seller's snooze on them) and the follow-up waiting on the same person at
 * the same account and deal are one obligation: the follow-up is the durable one and it renders. The match is the
 * relationship (account, deal, person by address, persona or name), never the title. A reminder that names the
 * commitment it derives from (its source id, or detail.derivedFrom) folds into that one by id. Two different promises
 * to one person never fold: only a reminder folds, and only into a follow-up.
 */
export function foldsInto(c: Commitment, others: readonly Commitment[]): Commitment | null {
  if (c.kind !== 'reminder') return null;
  const live = others.filter((o) => o.commitmentId !== c.commitmentId && !TERMINAL_STATUSES.includes(o.status));
  const derivedFrom = (c.detail as { derivedFrom?: string } | null)?.derivedFrom ?? null;
  const byId = live.find((o) => o.commitmentId === derivedFrom || o.commitmentId === c.source.id);
  if (byId) return byId;
  const person = obligationPersonKey(c);
  if (!person) return null;
  return live.find((o) => o.kind === 'follow_up' && o.accountName === c.accountName && (o.dealId ?? null) === (c.dealId ?? null) && obligationPersonKey(o) === person) ?? null;
}

/**
 * Seller acceptance A1 (Casey, 2026-10-09: "An expired out-of-office notice is availability information, not evidence
 * of buying intent or an automatic top priority"): the reminder GAP derives from a person's out-of-office notice
 * (commitments.ts syncReturnRemindersFromReplies: kind reminder, source reply, basis "Out of office: ..."). Before its
 * return day it is snoozed like any reminder. On or after that day it never becomes a due obligation, a follow-up tier
 * item or a Waiting row: the day carries it as availability on the account's card, and an account with nothing else
 * is parked under research until GAP has an angle. The row itself is untouched (nothing is lost).
 */
export function isAvailabilityReminder(c: Pick<Commitment, 'kind' | 'source' | 'basis'>): boolean {
  return c.kind === 'reminder' && c.source.kind === 'reply' && /^out of office/i.test((c.basis ?? '').trim());
}

/** A2: the tiers ranked by evidence, after the buyer obligations (commitment, reply, meeting) and before the rest. */
export const EVIDENCE_TIERS: ReadonlySet<WorkTier> = new Set<WorkTier>(['deal', 'follow_up', 'ready', 'review']);

/**
 * Seller acceptance A2 (2026-10-09): after the buyer obligations due (commitment, reply, meeting, in that order), the
 * executable work ranks by the EVIDENCE the card already carries, not by its lane alone. The levels, strongest first,
 * each read from the card and its obligations (no new source):
 *
 *   1  a buyer wrote and an answer is owed (card.answerOwed, a reply on the card)
 *   2  open-deal context: a next step, a deal step due, a passed close date with something to act on, or (C2) the
 *      vault's next action due within seven days or past
 *   3  something prepared and ready to send (a ready card, a prepared angle, a follow-up whose plan is prepared)
 *   4  a prior reply from them at any time (a reply on the card, an obligation resting on their words, buyer activity,
 *      or (C2) a conversation held within thirty days by the vault's notes)
 *   5  the seller's standing priority on the account
 *   5.5 deal hygiene alone (a passed close date, nothing prepared, no next step: I04 keeps it after new conversations)
 *   6  a current signal or a decision to review
 *   7  a follow-up on a cold touch with no reply ever (the lowest of the executable)
 *
 * The rank is the levels as a tuple (a present level outranks every absent one below it, and ties fall to the next
 * level), so the order is total and deterministic; `why` names the evidence that placed the card, strongest first.
 */
export function evidenceRank(
  card: Pick<WorkCard, 'answerOwed' | 'reply' | 'dealNextStep' | 'stalled' | 'stateKind' | 'priority' | 'tier' | 'preparedAngle' | 'knowledge'>,
  obligations: readonly WorkObligation[],
  ctx: { buyerActivityAt?: number | null; /** C2: the clock the knowledge windows are read against (no clock: the knowledge is not read). */ now?: Date | null } = {},
): { rank: number; why: string } {
  // C2: the vault's account summary, read against the clock: a recent conversation, a next action coming due.
  const kn = ctx.now && card.knowledge ? knowledgeEvidence(card.knowledge, ctx.now) : null;
  const theirWords = (o: WorkObligation) => !!o.basis && !/^out of office/i.test(o.basis.trim()) && /^[^"]{1,80}: "/.test(o.basis.trim());
  const stalled = !!card.stalled?.length;
  const stalledWhat = (card.stalled ?? []).some((s) => /close date/i.test(s)) ? 'close date passed' : (card.stalled ?? []).some((s) => /overdue|promised/i.test(s)) ? 'an obligation overdue' : 'no recent activity';
  const dealStep = obligations.some((o) => o.tier === 'deal');
  const preparedFollowUp = obligations.some((o) => o.kind === 'follow_up' && !!o.href && /^Prepare /.test(o.label ?? ''));
  // Prepared means a thing to send exists (a ready first touch, a follow-up whose plan is prepared); the workspace's
  // `preparation` flag is not read here: a deal or follow-up intent reports "ready" by construction (pursuit/actionable.ts).
  const prepared = card.stateKind === 'ready' || preparedFollowUp || !!card.preparedAngle;
  const repliedBefore = !!card.reply || obligations.some(theirWords) || !!(ctx.buyerActivityAt && ctx.buyerActivityAt > 0);
  const priorReply = repliedBefore || !!kn?.conversation;
  const answerOwed = !!card.answerOwed || (!!card.reply && card.stateKind === 'replied');
  const dealContext = !!card.dealNextStep || dealStep || !!kn?.nextAction || (stalled && (prepared || priorReply));
  const hygieneOnly = stalled && !dealContext;
  const decide = card.stateKind === 'decide' || card.tier === 'review';
  const coldFollowUp = (card.stateKind === 'follow_up' || card.tier === 'follow_up') && !priorReply;
  const levels: Array<[boolean, string]> = [
    [answerOwed, 'a buyer wrote and an answer is owed'],
    [dealContext, card.dealNextStep ? 'open deal, next step set' : dealStep ? 'open deal, a step due' : kn?.nextAction ? kn.nextAction : `open deal, ${stalledWhat}`],
    [prepared, card.preparedAngle ? `an angle prepared for ${card.preparedAngle.who}` : card.stateKind === 'ready' ? 'a first touch prepared' : 'angle prepared'],
    [priorReply, repliedBefore ? (kn?.conversation ? `they have replied before; ${kn.conversation}` : 'they have replied before') : (kn?.conversation as string)],
    [!!card.priority, card.priority ? `you prioritized it (${card.priority.reason})` : ''],
    [hygieneOnly, `deal hygiene only (${stalledWhat}, nothing prepared)`],
    [decide, 'a decision to review'],
    [coldFollowUp, 'a follow-up on a cold touch, no reply yet'],
  ];
  let rank = 0;
  for (let k = 0; k < levels.length; k += 1) if (!levels[k][0]) rank += 2 ** (levels.length - 1 - k);
  const why = levels.filter(([on]) => on).map(([, text]) => text).join('; ') || 'no evidence beyond its lane';
  return { rank, why };
}

/**
 * C2: the vault's evidence in words, read at `now`: a conversation held within KNOWLEDGE_CONVERSATION_DAYS ("a
 * conversation Sep 16 (the vault)") and a next action due within KNOWLEDGE_NEXT_ACTION_DAYS or past ("the vault's next
 * action: Regroup with Craig the week of Oct 12, due Oct 15"). An undated next action is context on the card, never
 * evidence; a conversation older than the window is neither.
 */
export function knowledgeEvidence(k: AccountKnowledge, now: Date): { conversation: string | null; nextAction: string | null } {
  const convAt = k.lastConversationAt ? new Date(k.lastConversationAt).getTime() : NaN;
  const recent = Number.isFinite(convAt) && convAt <= now.getTime() && now.getTime() - convAt <= KNOWLEDGE_CONVERSATION_DAYS * 86_400_000;
  const conversation = recent ? `a conversation ${day(k.lastConversationAt as string)} (the vault)` : null;
  const due = k.nextActionDue && isDay(k.nextActionDue) ? k.nextActionDue : null;
  const soon = !!due && due <= addDays(nyDay(now), KNOWLEDGE_NEXT_ACTION_DAYS);
  const nextAction = soon && k.nextAction ? `the vault's next action: ${cutWords(k.nextAction.replace(/\.$/, ''), 140).replace(/\.$/, '')}, due ${dayLabel(due as string, now)}` : null;
  return { conversation, nextAction };
}

/** Where an obligation's work runs (the account page unless a better place exists). */
function obligationAction(c: Commitment): { href: string; label: string } {
  const page = accountHref(c.accountName);
  switch (c.kind) {
    case 'answer_request':
      return { href: page, label: 'Open the account' };
    case 'referral':
      return { href: `${page}#people-stack-heading`, label: `Decide on ${c.person?.name ?? 'the person they named'}` };
    case 'prepare_meeting':
      return c.person?.personaId ? { href: `/gap/call/${c.person.personaId}`, label: 'Prepare the meeting' } : { href: page, label: 'Prepare the meeting' };
    case 'follow_up':
      return c.detail?.decisionId && !c.detail.noFollowUpCopy ? { href: packHref(c.detail.decisionId), label: `Prepare touch ${(c.detail.stepIndex ?? 1) + 1}` } : { href: page, label: 'Open the follow-up' };
    case 'deal_step':
      return { href: `${page}?view=brief`, label: 'Open the deal brief' };
    case 'buyer_promise':
      return { href: page, label: 'Chase it' };
    default:
      return { href: page, label: 'Open the account' };
  }
}

/** Build the day: the cards (needs you), the waiting footer and the snoozed footer, every count their contents. */
/** R63-A S11: a meeting's key on Work (its record's id when it has one, else its account and time). */
export function meetingKeyOf(m: { accountName: string; at: string; meetingId?: number | null }): string {
  return m.meetingId != null ? `meeting:${m.meetingId}` : `meeting:${m.accountName}:${m.at}`;
}

/** R63-A B3: the answers that stop outreach at the account (motion/approach.ts STOP_CLASSES, read the same way). */
const CONVERSATION_STOPS: ReadonlySet<string> = new Set(['do_not_contact', 'meeting_declined', 'problem_rejected', 'not_priority']);

export function workDay(i: WorkInput): WorkDay {
  const motion = new Map(i.motions.map((m) => [m.accountName, m]));
  const person = (account: string) => {
    const m = motion.get(account);
    return m?.primary ? { name: m.primary.name, title: m.primary.title } : null;
  };
  const best = new Map<string, Ranked>();
  const offer = (r: Ranked) => {
    const have = best.get(r.card.accountName);
    if (!have || r.rank < have.rank || (r.rank === have.rank && cmpKeys(r.sortKey, have.sortKey) < 0)) best.set(r.card.accountName, r);
  };
  const waiting: WaitingItem[] = [];
  const motionWaiting = new Map<string, { at: string; person: { name: string; title: string | null } | null }>();

  // Replies, classified before they rank. A reply IS the account's card unless a buyer obligation outranks it.
  const replyCards: Ranked[] = [];
  const offerReply = (r: Ranked) => {
    const have = replyCards.find((x) => x.card.accountName === r.card.accountName);
    if (!have || r.rank < have.rank || (r.rank === have.rank && cmpKeys(r.sortKey, have.sortKey) < 0)) {
      if (have) replyCards.splice(replyCards.indexOf(have), 1);
      replyCards.push(r);
    }
  };
  /** The newest buyer activity per account (a person, not a machine): the second tie-break. */
  const activity = new Map<string, number>();
  for (const r of i.replies) {
    if (!r.accountName) continue;
    const c = classifyReply({ snippet: r.snippet, subject: r.subject, from: r.contactEmail });
    const at = new Date(r.receivedAt).getTime() || 0;
    if (c.kind === 'human' || c.kind === 'opt_out') activity.set(r.accountName, Math.max(activity.get(r.accountName) ?? 0, at));
    const rank = REPLY_RANK[c.kind];
    if (rank === null) continue; // an automatic reply is not work
    const kind: WorkStateKind = c.kind === 'human' ? 'replied' : c.kind === 'opt_out' ? 'opted_out' : 'bounced';
    const quote = (r.subject ?? r.snippet).replace(/\s+/g, ' ').trim().slice(0, 90);
    // R63-A S4: a reply recorded through Capture still owes its answer: "Answer <them>", the prepared answer on the card.
    if (r.recorded && c.kind === 'human') {
      const who = r.fromName?.trim() || r.contactEmail;
      const prep = prepareReply({ id: r.id ?? `${r.contactEmail}:${r.receivedAt}`, from: r.contactEmail, fromName: r.fromName ?? null, subject: r.subject, snippet: r.snippet, receivedAt: r.receivedAt, threadId: r.threadId ?? null, accountName: r.accountName }, { mailbox: i.mailbox ?? null, now: i.now });
      offerReply({
        rank,
        sortKey: [at || Number.MAX_SAFE_INTEGER],
        card: { answerOwed: true, accountName: r.accountName, lane: 'replies', stateKind: 'replied', state: `Answer ${who}`, why: `${who} wrote ${day(r.receivedAt)}: "${quote}". What they said is recorded; the answer is prepared and nothing goes out until you send or copy it.`, person: { name: who, title: null }, next: { label: 'Prepare the answer', href: `${accountHref(r.accountName)}#reply-answer` }, blocker: null, reply: { ...prep, label: 'Recorded; answer them', record: null } },
      });
      continue;
    }
    const humanNext = c.human === 'referral' ? 'Record who they named' : c.human === 'objection' ? 'Record the objection' : 'Read the reply and record what they said';
    offerReply({
      rank,
      sortKey: [at || Number.MAX_SAFE_INTEGER],
      card: {
        accountName: r.accountName,
        lane: c.kind === 'bounce' ? 'research' : 'replies',
        stateKind: kind,
        state: c.human ? HUMAN_REPLY_LABEL[c.human] : STATE_TEXT[kind],
        why: `${r.fromName?.trim() || r.contactEmail} wrote ${day(r.receivedAt)}: "${quote}". ${c.consequence}`,
        person: { name: r.contactEmail, title: null },
        next: { label: c.kind === 'human' ? humanNext : c.kind === 'opt_out' ? 'Record the opt-out' : 'Find a working address', href: c.kind === 'bounce' ? accountHref(r.accountName) : recordReplyHref(r.accountName) },
        blocker: c.kind === 'human' ? 'A reply is waiting to be recorded.' : c.kind === 'opt_out' ? 'They asked not to be contacted: record it.' : null,
        ...(r.fromName?.trim() && c.kind !== 'bounce' ? { person: { name: r.fromName.trim(), title: null } } : {}),
        // R42: the message itself and the prepared notes ride on the card (never copy, never a send).
        reply: prepareReply({ id: r.id ?? `${r.contactEmail}:${r.receivedAt}`, from: r.contactEmail, fromName: r.fromName ?? null, subject: r.subject, snippet: r.snippet, receivedAt: r.receivedAt, threadId: r.threadId ?? null, accountName: r.accountName }, { mailbox: i.mailbox ?? null, now: i.now }),
      },
    });
  }

  const dealAccountNames = new Set(i.inDeals.status === 'complete' ? i.inDeals.accounts.map((a) => a.accountName) : []);
  for (const c of i.candidates) {
    if (!c.accountName || c.failsGate || c.lane === 'replies' || c.lane === 'deals') continue;
    if (i.held.has(c.accountName) || dealAccountNames.has(c.accountName)) continue; // never a cold action on a held account
    let kind: WorkStateKind = c.lane === 'follow_up' ? 'follow_up' : c.lane === 'ready' ? 'ready' : c.lane === 'review' ? 'decide' : 'research';
    const m = motion.get(c.accountName);
    const db = i.dbState?.get(c.accountName);
    // A cold-touch card with no usable thesis is research: nothing to open on, so nobody is asked to choose.
    const noAngle = kind === 'ready' && db !== undefined && !db.sendable;
    if (noAngle) kind = 'research';
    const p = kind === 'ready' || kind === 'follow_up' ? person(c.accountName) : null;
    offer({
      rank: noAngle ? LANE_RANK.research : LANE_RANK[c.lane],
      sortKey: c.sortKey,
      card: {
        accountName: c.accountName,
        lane: noAngle ? 'research' : c.lane,
        stateKind: kind,
        state: noAngle ? 'Research: no usable angle to open on yet' : kind === 'ready' && m?.state === 'needs_owner' ? 'Choose who hears this first' : STATE_TEXT[kind],
        why: noAngle ? 'The people stand; no thesis the send gate would let out grounds a first touch yet.' : c.detail,
        person: p,
        // R60: a card never lands in a cockpit lane (every account's cards, analyst words, no Next account): a lane
        // link opens this account, where NEXT says and holds the move.
        next: noAngle ? { label: 'Open the account', href: accountHref(c.accountName) } : { label: c.title, href: isCockpitLaneHref(c.href) ? accountHref(c.accountName) : c.href },
        blocker: null,
      },
    });
  }
  // The database's own READY: a recorded chosen person with a usable thesis, on every load, however cold the instance.
  for (const [name, db] of i.dbState ?? []) {
    if (!db.chosen || !db.sendable) continue;
    const have = best.get(name);
    if (have && (have.card.stateKind === 'replied' || have.card.stateKind === 'opted_out' || have.card.stateKind === 'follow_up')) continue;
    if (i.held.has(name) || dealAccountNames.has(name)) continue;
    offer({ rank: LANE_RANK.ready, sortKey: [0, name], card: { accountName: name, lane: 'ready', stateKind: 'ready', state: `Ready for a first touch: ${db.chosen.name}`, why: `Prepare the first touch to ${db.chosen.name}.`, person: db.chosen, next: { label: 'Prepare the first touch', href: accountHref(name) }, blocker: null } });
  }
  // R14 / R41: a motion in flight. An outstanding GAP draft is work (send or discard it); a first touch that went out
  // is WAITING (on their reply, then the follow-up's interval), never a card that inflates "needs you".
  for (const [name, m] of i.inMotion ?? []) {
    if (i.held.has(name) || dealAccountNames.has(name)) continue;
    const have = best.get(name);
    if (have && (have.card.stateKind === 'follow_up' || have.rank <= 1)) continue;
    const who = m.person?.name ?? 'the person';
    if (m.state === 'sent') {
      best.delete(name);
      motionWaiting.set(name, { at: m.at, person: m.person });
      continue;
    }
    best.set(name, {
      rank: PURSUIT_RANK.in_motion,
      sortKey: [new Date(m.at).getTime() || 0],
      card: { accountName: name, lane: 'ready', stateKind: 'ready', state: `A GAP draft to ${who} is outstanding`, why: `A GAP draft to ${who} is still in the mailbox: send or discard it before anyone else here is touched.`, person: m.person, next: { label: 'Open the account', href: accountHref(name) }, blocker: null },
    });
  }
  // The reply card wins the account outright (a bounce only when nothing ranks above research).
  for (const r of replyCards) {
    if (r.card.stateKind === 'bounced') offer(r);
    else {
      best.set(r.card.accountName, r);
      motionWaiting.delete(r.card.accountName);
    }
  }

  // Held accounts: in a deal (the summary) or UNKNOWN (a card's read), never a cold action.
  const dealAccounts = new Map(i.inDeals.status === 'complete' ? i.inDeals.accounts.map((a) => [a.accountName, a]) : []);
  // Batch item 8 (R62 matrix): a person who wrote at a held account is the buyer talking (deal work, never cold): the
  // reply stays the account's card, the hold said on it, and the deal's obligations stay on it.
  const talking = new Map(replyCards.filter((r) => r.card.stateKind === 'replied' || r.card.stateKind === 'opted_out').map((r) => [r.card.accountName, r]));
  const keepReply = (name: string, blocker: string): boolean => {
    const r = talking.get(name);
    if (!r) return false;
    best.set(name, { ...r, card: { ...r.card, blocker } });
    motionWaiting.delete(name);
    return true;
  };
  for (const [name, a] of dealAccounts) {
    const stages = a.deals.map((d) => `${d.name ? `"${d.name}"` : 'an unnamed deal'} (${d.stage})`).join(', ');
    if (keepReply(name, `An open HubSpot deal here (${stages}): answer them as deal work, never a cold first touch.`)) continue;
    best.delete(name);
    motionWaiting.delete(name);
    // R55: a stalled deal is deal work (derived from overdue obligations and HubSpot's own dates, never a probability).
    const stalled = a.deals.flatMap((d) => stalledSignals({ now: i.now, deal: { name: d.name, lastActivityAt: d.lastActivityAt ?? null, closeDate: d.closeDate ?? null }, commitments: (i.commitments ?? []).filter((c) => c.accountName === name && !!d.id && c.dealId === d.id) }).map((s) => (a.deals.length > 1 ? `${d.name ?? 'A deal'}: ${s}` : s)));
    // X15c: the buyer's next step (HubSpot hs_next_step) leads the card when one is set; the hygiene line comes second.
    const dealNextStep = a.deals.map((d) => (typeof d.nextStep === 'string' ? d.nextStep.trim() : '')).find(Boolean) ?? null;
    // X17: the step as a phrase (no trailing period, bounded) for the action label and the plan item's title.
    // C32: a long next step is cut at a sentence end or kept whole, never mid-sentence.
    const clipStep = (s: string) => clipAtSentence(s.replace(/\.$/, '').trim(), 160);
    const dealsLine = `Open HubSpot ${a.deals.length === 1 ? 'deal' : 'deals'}: ${stages}.`;
    offer({ rank: LANE_RANK.deals, sortKey: [name], card: { accountName: name, lane: 'deals', stateKind: 'in_deal', state: STATE_TEXT.in_deal, why: dealNextStep ? `Next step on the deal: ${dealNextStep.replace(/\.$/, '')}. ${dealsLine}` : dealsLine, person: null, next: dealNextStep ? { label: `Next step: ${clipStep(dealNextStep)}`, href: `${accountHref(name)}?view=brief` } : { label: 'Open the deal brief', href: `${accountHref(name)}?view=brief` }, blocker: 'No cold first touch while the deal is open: work it from the deal.', ...(stalled.length ? { stalled } : {}), ...(dealNextStep ? { dealNextStep, move: `Next step on the deal: ${clipStep(dealNextStep)}` } : {}) } });
  }
  for (const [name, why] of i.held) {
    if (dealAccounts.has(name)) continue;
    const unknown = why === 'opportunity_unknown';
    if (keepReply(name, unknown ? 'HubSpot could not say whether this account is in a deal: answer them, and no cold touch to anyone here.' : 'A current card holds this account for an open deal: answer them as deal work, never a cold first touch.')) continue;
    best.delete(name);
    motionWaiting.delete(name);
    offer({ rank: LANE_RANK.deals, sortKey: [unknown ? 0 : 1, name], card: { accountName: name, lane: 'deals', stateKind: unknown ? 'unknown_deal' : 'in_deal', state: STATE_TEXT[unknown ? 'unknown_deal' : 'in_deal'], why: unknown ? 'HubSpot could not say whether this account is in a deal: no cold touch until it can.' : 'A current card holds this account for an open deal.', person: null, next: unknown ? null : { label: 'Open the deal brief', href: `${accountHref(name)}?view=brief` }, blocker: unknown ? 'Check HubSpot directly before contacting anyone.' : 'No cold first touch while the deal is open.' } });
  }

  // R63-B S12: the gate's own opportunity read, for the accounts Work would offer cold work. A closed deal holds the
  // account in the closure's words on the first load (before any summary), the same words the page says; an open deal
  // or HubSpot not answering holds it as the routing card would. It speaks over a routing card's "open deal" words.
  for (const [name, h] of i.opportunityHolds ?? []) {
    if (dealAccounts.has(name)) continue;
    const why = h.why;
    if (keepReply(name, h.kind === 'unknown' ? 'HubSpot could not say whether this account is in a deal: answer them, and no cold touch to anyone here.' : `${why} Answer them; no cold touch to anyone here.`)) continue;
    best.delete(name);
    motionWaiting.delete(name);
    if (h.kind === 'closure') {
      offer({ rank: PURSUIT_RANK.held, sortKey: [name], card: { accountName: name, lane: 'deals', stateKind: 'held', state: h.stateLine, why, person: null, next: null, blocker: null } });
    } else if (h.kind === 'unknown') {
      // R63-A S13: an identity hold says itself (its why already names the step), never "check HubSpot" as an outage.
      offer({ rank: LANE_RANK.deals, sortKey: [0, name], card: { accountName: name, lane: 'deals', stateKind: 'unknown_deal', state: h.stateLine ?? STATE_TEXT.unknown_deal, why, person: null, next: h.stateLine ? { label: 'Link it in HubSpot', href: hubspotCompanySearchUrl(name) } : null, blocker: h.stateLine ? null : 'Check HubSpot directly before contacting anyone.' } });
    } else {
      offer({ rank: LANE_RANK.deals, sortKey: [1, name], card: { accountName: name, lane: 'deals', stateKind: 'in_deal', state: STATE_TEXT.in_deal, why, person: null, next: { label: 'Open the deal brief', href: `${accountHref(name)}?view=brief` }, blocker: 'No cold first touch while the deal is open: work it from the deal.' } });
    }
  }

  // R63-A B3: a recorded conversation holds the cold-work cards (a ready first touch, a thesis to decide "ready for
  // outreach"); the replies, deals and research cards are untouched.
  for (const [name, cv] of i.conversations ?? []) {
    const have = best.get(name);
    if (!have || (have.card.stateKind !== 'ready' && have.card.stateKind !== 'decide')) continue;
    const who = cv.name?.trim() || cv.who;
    const on = new Date(cv.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
    const said = isReplyKindClass(cv.responseClass) ? REPLY_KIND_WORDS[cv.responseClass].replace(/^They /, 'they ') : 'a recorded answer';
    const stop = CONVERSATION_STOPS.has(cv.responseClass);
    const card = cv.responseClass === 'do_not_contact'
      ? { state: 'Held: do not contact', why: `Do not contact: ${who} asked not to be contacted (${on}). Nothing goes to them from here.` }
      : stop
        ? { state: `Held: ${who} said no`, why: `${who}: ${said} (${on}). No new outreach; learn from that conversation.` }
        : { state: `Held: in conversation with ${who}`, why: `${who}: ${said} (${on}). Work it from that conversation (answer them, keep what you owe), never a cold first touch.` };
    motionWaiting.delete(name);
    best.set(name, { rank: PURSUIT_RANK.held, sortKey: [name], card: { accountName: name, lane: 'deals', stateKind: 'held', state: card.state, why: card.why, person: null, next: { label: 'Open the account', href: accountHref(name) }, blocker: null } });
  }

  // The canonical pursuit state wins where it is fresh: the card says what the workspace says, and ranks by it.
  for (const [name, s] of i.summaries ?? []) {
    let have = best.get(name);
    // R63-A S4: a recorded reply's answer card says what is owed; a remembered "replied" never relabels it.
    if (have?.card.answerOwed) continue;
    const waitingTouch = motionWaiting.get(name);
    if (!have && !waitingTouch) continue;
    // A first touch moved to Waiting is still the account's card for a newer summary that says something else (a
    // conversation the motion saw, a hold): rebuild its base card so the summary can speak.
    if (!have && waitingTouch && s.state !== 'in_motion' && new Date(s.at).getTime() >= new Date(waitingTouch.at).getTime()) {
      have = { rank: PURSUIT_RANK.in_motion, sortKey: [new Date(waitingTouch.at).getTime() || 0], card: { accountName: name, lane: 'ready', stateKind: 'ready', state: STATE_TEXT.ready, why: '', person: waitingTouch.person, next: null, blocker: null } };
      motionWaiting.delete(name);
    }
    if (have) {
      const holdCard = have.card.stateKind === 'in_deal' || have.card.stateKind === 'unknown_deal' || have.card.stateKind === 'held';
      const summaryHolds = s.state === 'in_deal' || s.state === 'held' || s.state === 'replied' || s.state === 'opted_out';
      if ((have.card.stateKind === 'replied' || have.card.stateKind === 'opted_out') && s.state !== 'replied' && s.state !== 'opted_out') continue;
      if (holdCard && !summaryHolds) continue;
    }
    // R14: a summary read BEFORE the ledger's touch is stale against it: the proven send stands.
    const touch = i.inMotion?.get(name);
    if (touch && new Date(s.at).getTime() < new Date(touch.at).getTime()) continue;
    // R41: the workspace says the first touch is out and nothing is due: waiting, not a card.
    if (s.state === 'in_motion') {
      best.delete(name);
      motionWaiting.set(name, { at: touch?.at ?? s.at, person: s.person });
      continue;
    }
    if (!have) continue;
    const kind = PURSUIT_KIND[s.state];
    // R10 / R45: the workspace's own allowed action (the actionable result) IS the card's action, its absence included
    // (a hold, an in-motion account allow nothing): a lane card never competes with it. The lane mapping only when the
    // summary predates the actionable result. A proposal under review opens the page at the proposal.
    // R60: a summary remembered before the lanes left the seller's path may still hold a lane link: the account's own
    // action stands in for it (never a lane).
    const remembered = s.actionable?.allowed && !isCockpitLaneHref(s.actionable.allowed.href) ? s.actionable.allowed : null;
    const action = s.actionable ? (remembered ? { label: remembered.label, href: /^#/.test(remembered.href) ? `${accountHref(name)}${remembered.href}` : remembered.href } : s.actionable.allowed ? pursuitAction(s.state, name, s.stateLine) : null) : pursuitAction(s.state, name, s.stateLine);
    // R60: a reply card says the hold once (its sentence and the reply panel); a deal's or HubSpot's hold still shows.
    const replyCard = (s.state === 'replied' || s.state === 'opted_out') && !!have.card.reply;
    best.set(name, {
      rank: PURSUIT_RANK[s.state],
      sortKey: have.sortKey,
      source: 'pursuit',
      card: {
        ...have.card,
        lane: PURSUIT_LANE[s.state],
        stateKind: kind,
        state: s.stateLine,
        person: s.person ?? (have.card.stateKind === kind ? have.card.person : null),
        why: s.nextText ?? s.blocker ?? have.card.why,
        blocker: replyCard
          ? have.card.blocker && !GENERIC_REPLY_BLOCKERS.has(have.card.blocker) ? have.card.blocker : null
          : (s.state === 'held' || s.state === 'in_deal' || s.state === 'replied' || s.state === 'opted_out') && (s.blocker ?? have.card.blocker) !== (s.nextText ?? s.blocker ?? have.card.why) ? (s.blocker ?? have.card.blocker) : null,
        next: action,
        preparation: s.actionable?.preparation ?? null,
      },
    });
  }

  // R40 / R41: the obligations. Due today -> on the account's card (a card is made when the account has none, so no
  // task is ever silently omitted); waiting, upcoming or blocked -> the Waiting footer; snoozed -> the Snoozed footer.
  const moved = buyerMoves(i.replies);
  // R51: the calendar's truth, read on every load: a canceled meeting and what is still booked, per account AND deal
  // (a canceled pilot call is not "rebooked" by a meeting on another deal). A meeting with no deal is account-level.
  const live = i.meetings ?? [];
  // Batch item 8: a meeting rebooks only its own scope (the same deal, or account-level for account-level): Ben's walk
  // on the Columbus deal never stands in for Ann's canceled account-level meeting. An untagged meeting is placed on the
  // deal its attendees name before it gets here (work/day-load.ts resolveMeetingDeals).
  const rebooked = (accountName: string, dealId: string | null | undefined) => live.some((m) => m.accountName === accountName && (dealId ? m.dealId === dealId : !m.dealId));
  const canceledFor = (accountName: string, dealId: string | null) => (i.canceledMeetings ?? []).find((m) => m.accountName === accountName && (!dealId || !m.dealId || m.dealId === dealId) && !rebooked(accountName, m.dealId));
  // R50: an obligation bound to a deal says which one (the In Deals summary names the account's open deals).
  const dealLabel = (accountName: string, dealId: string | null): string | null => {
    if (!dealId) return null;
    const d = (i.inDeals.status === 'complete' ? i.inDeals.accounts.find((a) => a.accountName === accountName)?.deals : undefined)?.find((x) => x.id === dealId || (!/^\d+$/.test(dealId) && x.name === dealId));
    // Sprint 5 review: a deal GAP recorded as closed is named with its outcome and date; R60: any other deal no longer
    // among the open deals is said in words, never its HubSpot id; when the open deals were not read, nothing is claimed.
    const was = !d ? i.closedDeals?.get(dealId) : undefined;
    if (was) return closedDealLabel(was);
    if (!d && i.inDeals.status !== 'complete' && /^\d+$/.test(dealId)) return 'Deal: a HubSpot deal (its state was not read this time)';
    return `Deal: ${d?.name ?? (/^\d+$/.test(dealId) ? 'a deal that is no longer open in HubSpot' : dealId)}`;
  };
  const obligations = new Map<string, WorkObligation[]>();
  const snoozed: WorkDay['snoozed'] = [];
  /** A1: the people back from an out-of-office notice, per account (never an obligation, never a Waiting row). */
  const availability = new Map<string, NonNullable<WorkCard['availability']>[]>();
  const outcomeSnoozed = new Set([...(i.outcomes ?? []).values()].filter((o) => o.kind === 'snoozed').map((o) => o.accountName));
  // C28: every date read as an instant in New York (a date-only row never shifts through UTC).
  const commitments = (i.commitments ?? []).map(withInstantDates);
  // C27: one row per durable origin (the same origin recorded twice renders once; the first stands).
  const seenOrigin = new Set<string>();
  for (const c of commitments) {
    const origin = obligationOriginKey(c);
    if (seenOrigin.has(origin)) continue;
    seenOrigin.add(origin);
    const phase = commitmentPhase(c, i.now, moved);
    const p = { ...phase, line: describeReturn(c, phase, i.now) };
    if (p.phase === 'done' || p.phase === 'skipped') continue;
    // C27: a reminder about a person folds into the follow-up waiting on them (by relationship, never by title), in
    // every phase: it is never a second row in Waiting or Snoozed either.
    if (foldsInto(c, commitments)) continue;
    if (p.phase === 'snoozed') {
      // An account snooze is listed once, as the account (its reminder is the same thing).
      if (!(c.source.kind === 'snooze' && outcomeSnoozed.has(c.accountName))) snoozed.push({ key: c.commitmentId, accountName: c.accountName, line: `${c.title}: ${p.line}`, until: c.snoozeUntil ?? c.dueAt ?? '' });
      continue;
    }
    // A1: an out-of-office reminder whose return day came (or whose person wrote first) is availability, not work: it
    // never becomes a due obligation, a follow-up item or a Waiting row. The row stays open; the card says the date.
    if (isAvailabilityReminder(c) && p.phase !== 'upcoming' && p.phase !== 'waiting') {
      const returnedDay = p.dueDay ?? nyDay(c.snoozeUntil ?? c.updatedAt);
      const who = c.person?.name?.trim() || c.person?.email || 'They';
      const since = moved(c, c.updatedAt);
      const back = returnedDay > nyDay(i.now) ? `${who} is out until ${dayLabel(returnedDay, i.now)}` : `${who} returned ${dayLabel(returnedDay, i.now)}`;
      const list = availability.get(c.accountName) ?? [];
      list.push({ who, email: c.person?.email ?? null, returnedDay, line: `${back} (their out-of-office notice); ${since ? `they wrote since: ${since.replace(/\.$/, '')}.` : 'no reply from them since.'}` });
      availability.set(c.accountName, list);
      continue;
    }
    if (p.phase !== 'due') {
      // R52: a plan milestone with no agreed date lives in the deal's plan, never in Waiting (an unknown is no task).
      if (c.detail?.milestone && !c.dueAt) continue;
      waiting.push({ key: c.commitmentId, accountName: c.accountName, kind: c.kind, title: c.title, line: p.line, dueDay: p.dueDay, commitmentId: c.commitmentId });
      continue;
    }
    // R51: a meeting to prepare whose meeting on the calendar was canceled (and none is booked) waits until it is
    // rebooked, said in words; it never asks the seller to prepare a meeting that is not happening.
    const canceledMeeting = c.kind === 'prepare_meeting' && !rebooked(c.accountName, c.dealId) ? canceledFor(c.accountName, c.dealId) : undefined;
    if (canceledMeeting) {
      waiting.push({ key: c.commitmentId, accountName: c.accountName, kind: c.kind, title: c.title, line: `The meeting on the calendar was canceled (${day(canceledMeeting.at)} ${time(canceledMeeting.at)}): nothing to prepare until it is rebooked.`, dueDay: p.dueDay, commitmentId: c.commitmentId });
      continue;
    }
    // R43: a follow-up says what its plan says: prepare it, follow up by hand, a saved draft, an unknown send, a hold.
    const plan = c.kind === 'follow_up' ? i.followUpPlans?.get(c.commitmentId) ?? null : null;
    if (plan?.action === 'complete') continue;
    const action = plan ? (plan.href && plan.label ? { href: plan.href, label: plan.label } : { href: null, label: null }) : obligationAction(c);
    // A snooze coming back keeps the account's own place (it never promotes the account); a held follow-up never
    // promotes a held account either; every other kind ranks.
    const tier: WorkTier = c.source.kind === 'snooze' || plan?.action === 'held' ? 'later' : commitmentTier(c);
    const list = obligations.get(c.accountName) ?? [];
    list.push({ key: c.commitmentId, commitmentId: c.commitmentId, kind: c.kind, tier, title: c.title, line: plan?.line ?? p.line, dueAt: c.dueAt, dueDay: p.dueDay, person: c.person ? { name: c.person.name, email: c.person.email } : null, basis: c.basis, href: action.href, label: action.label, canComplete: true, scope: dealLabel(c.accountName, c.dealId), proofNeeded: c.detail?.proofNeeded ?? null, ...(c.detail?.skippedAtClosure?.length ? { skippedAtClosure: skippedAtClosureOf(c, i.commitments ?? []) } : {}) });
    obligations.set(c.accountName, list);
  }
  const horizon = i.now.getTime() + 24 * 3_600_000;
  for (const m of i.meetings ?? []) {
    const at = new Date(m.at).getTime();
    if (!(at >= i.now.getTime() - 30 * 60_000 && at <= horizon)) continue;
    // R63-A S11: a meeting the seller marked prepared is done for today (it is listed under Done, not as work).
    if (i.preparedMeetings?.has(meetingKeyOf(m))) continue;
    const list = obligations.get(m.accountName) ?? [];
    // R51: the prepared starting point rides on the card; the full preparation is on the account's deal brief.
    const prep = m.meetingId != null ? i.meetingPreps?.get(m.meetingId) ?? null : null;
    list.push({ key: meetingKeyOf(m), commitmentId: null, kind: 'meeting', meeting: { at: m.at, what: m.what }, tier: 'meeting', title: `Meeting ${dayLabel(nyDay(m.at), i.now)} ${time(m.at)}: ${m.what}`, line: 'Prepare it: within 24 hours.', dueAt: m.at, dueDay: nyDay(m.at), person: null, basis: null, href: prep?.href ?? (m.personaId ? `/gap/call/${m.personaId}` : `${accountHref(m.accountName)}?view=brief`), label: 'Prepare the meeting', canComplete: false, prep: prep?.prep ?? null, scope: dealLabel(m.accountName, m.dealId ?? null) });
    obligations.set(m.accountName, list);
  }
  // R51: a canceled meeting is said once, in Waiting (never a meeting to prepare).
  for (const m of i.canceledMeetings ?? []) {
    if (rebooked(m.accountName, m.dealId)) continue;
    const at = new Date(m.at).getTime();
    if (!(at >= i.now.getTime() - 24 * 3_600_000 && at <= i.now.getTime() + 48 * 3_600_000)) continue;
    waiting.push({ key: `meeting-canceled:${m.meetingId}`, accountName: m.accountName, kind: 'meeting', title: `Meeting ${dayLabel(nyDay(m.at), i.now)} ${time(m.at)}: ${m.what}`, line: 'Canceled: nothing to prepare unless it is rebooked.', dueDay: nyDay(m.at), commitmentId: null });
  }
  // A first touch out with no follow-up record waiting: the Waiting footer says it (one line per account).
  const waitingAccounts = new Set(waiting.filter((w) => w.kind === 'follow_up').map((w) => w.accountName));
  for (const [name, m] of motionWaiting) {
    if (obligations.get(name)?.some((o) => o.kind === 'follow_up') || waitingAccounts.has(name)) continue;
    const who = m.person?.name ?? 'the person';
    waiting.push({ key: `motion:${name}`, accountName: name, kind: 'motion', title: `First touch out to ${who}`, line: `Sent ${day(m.at)}; waiting on their reply. The next person unlocks after ${MOTION_UNLOCK_BUSINESS_DAYS} business days without one.`, dueDay: null, commitmentId: null });
  }
  // Accounts whose only work today is an obligation get a card of their own.
  for (const [name, list] of obligations) {
    if (best.has(name)) continue;
    const top = [...list].sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier])[0];
    const stateKind: WorkStateKind = top.tier === 'meeting' ? 'meeting' : top.tier === 'follow_up' || top.tier === 'later' ? 'follow_up' : 'committed';
    // A3: the card's state IS its top obligation, so the plan carries that obligation's item and no second item for the card.
    best.set(name, { rank: 0, sortKey: [name], card: { accountName: name, lane: 'commitments', stateKind, state: `${top.kind === 'meeting' ? 'Meeting' : KIND_TEXT[top.kind]}: ${top.title}`, why: top.line, person: top.person?.name ? { name: top.person.name, title: null } : null, next: top.href && top.label ? { label: top.label, href: top.href } : null, blocker: null, ownMoveIsObligation: true } });
  }
  // A1: availability rides on the account's card when the account has other work; an account with nothing else is
  // PARKED under research (counted apart, never an executable item) until GAP has a supported angle.
  for (const [name, list] of availability) {
    const a = [...list].sort((x, y) => y.returnedDay.localeCompare(x.returnedDay))[0];
    const have = best.get(name);
    if (have) {
      best.set(name, { ...have, card: { ...have.card, availability: a } });
      continue;
    }
    const today = nyDay(i.now);
    const when = a.returnedDay > today ? `Out until ${dayLabel(a.returnedDay, i.now)}` : a.returnedDay === today ? 'Back today' : `Back since ${dayLabel(a.returnedDay, i.now)}`;
    best.set(name, {
      rank: LANE_RANK.research,
      sortKey: [a.returnedDay, name],
      card: { accountName: name, lane: 'research', stateKind: 'research', state: `${when} (out-of-office notice); nothing prepared yet`, why: 'No supported angle yet: GAP researches it; it returns when there is one.', person: { name: a.who, title: null }, next: { label: 'Open the account', href: accountHref(name) }, blocker: null, availability: a },
    });
  }

  // R14: the seller's recorded outcomes. A snoozed account leaves the list (unless a buyer obligation is due there:
  // that is never hidden by a seller note); a skipped or logged one drops to "later" with its line.
  const later = new Set<string>();
  for (const [name, o] of i.outcomes ?? []) {
    const have = best.get(name);
    if (!have) continue;
    if (have.card.stateKind === 'replied' || have.card.stateKind === 'opted_out') continue;
    const due = (obligations.get(name) ?? []).filter((x) => x.tier !== 'later');
    if (o.kind === 'snoozed' && due.length === 0) {
      best.delete(name);
      continue;
    }
    later.add(name);
    best.set(name, { ...have, card: { ...have.card, outcome: { kind: o.kind, line: outcomeLine(o, i.now), until: o.until } } });
  }

  // Tiers, lanes, the obligations on each card, the tie-break keys and the words that explain the position.
  const ranked = [...best.values()].map((r) => {
    const name = r.card.accountName;
    const list = [...(obligations.get(name) ?? [])].sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || String(a.dueAt ?? '').localeCompare(String(b.dueAt ?? '')));
    // X15a: an untriaged reply older than the triage window ranks as admin (never hidden); an owed answer keeps the reply tier.
    const replyAgeDays = r.card.stateKind === 'replied' && !r.card.answerOwed && r.card.reply?.at ? Math.floor((i.now.getTime() - new Date(r.card.reply.at).getTime()) / 86_400_000) : null;
    const oldReply = replyAgeDays !== null && replyAgeDays > REPLY_TRIAGE_DAYS;
    const own: WorkTier = later.has(name) && r.card.stateKind !== 'replied' && r.card.stateKind !== 'opted_out' ? 'later' : oldReply ? 'admin' : (r.card.stalled?.length || r.card.dealNextStep) && r.card.stateKind === 'in_deal' ? 'deal' : STATE_TIER[r.card.stateKind];
    const fromObligation = list.filter((o) => o.tier !== 'later').sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier])[0];
    const tier: WorkTier = fromObligation && TIER_RANK[fromObligation.tier] < TIER_RANK[own] ? fromObligation.tier : own;
    const lane: WorkLane = tier !== own ? TIER_LANE[tier] ?? r.card.lane : r.card.lane;
    // R63-A S1: a reply's day is the message's received date, never another card's sort key ("A buyer replied Dec 31"
    // was a summary-relabelled card's 0); with no message on the card, no day is claimed.
    const replyAt = r.card.reply?.at ? new Date(r.card.reply.at).getTime() : NaN;
    const dueMs = Math.min(...list.filter((o) => o.tier === tier).map((o) => (o.dueAt ? new Date(o.dueAt).getTime() : Number.MAX_SAFE_INTEGER)), tier === 'reply' && Number.isFinite(replyAt) && replyAt > 0 ? replyAt : Number.MAX_SAFE_INTEGER);
    const act = activity.get(name) ?? 0;
    const prio = i.priorities?.get(name) ?? null;
    const oldReplyDays = oldReply ? replyAgeDays : null;
    const hygiene = tier === 'deal' && !fromObligation && !r.card.dealNextStep;
    // A2: the executable tiers rank by the evidence the card carries (its own fields, its obligations, the buyer activity
    // already read), never by the lane alone.
    const preparedAngle = i.preparedAngles?.get(name) ?? null;
    // C2: the vault's summary rides as evidence (a recent conversation, a next action coming due) and onto the card.
    const knowledge = i.knowledge?.get(name) ?? null;
    const evidence = EVIDENCE_TIERS.has(tier) ? evidenceRank({ ...r.card, tier, priority: prio, preparedAngle, knowledge }, list, { buyerActivityAt: act, now: i.now }) : null;
    return { r, tier, lane, list, dueMs, act, prio, oldReplyDays, hygiene, evidence, preparedAngle, knowledge };
  });
  const rankOf = (x: { tier: WorkTier; hygiene: boolean }) => (x.hygiene ? DEAL_HYGIENE_RANK : TIER_RANK[x.tier]);
  // The bands: the buyer obligations due (commitment, reply, meeting, in tier order), then the executable work by its
  // evidence, then the admin, then the parked cards; inside a band the due time, the newest buyer activity, the priority.
  const bandOf = (x: { tier: WorkTier }) => (PARKED_TIERS.has(x.tier) ? 3 : TIER_RANK[x.tier] <= TIER_RANK.meeting ? 0 : EVIDENCE_TIERS.has(x.tier) ? 1 : 2);
  const withinBand = (x: { tier: WorkTier; hygiene: boolean; evidence: { rank: number } | null }) => (x.evidence ? x.evidence.rank : rankOf(x));
  ranked.sort((a, b) => bandOf(a) - bandOf(b) || withinBand(a) - withinBand(b) || a.dueMs - b.dueMs || b.act - a.act || Number(!a.prio) - Number(!b.prio) || a.r.rank - b.r.rank || cmpKeys(a.r.sortKey, b.r.sortKey) || a.r.card.accountName.localeCompare(b.r.card.accountName));
  /** R44: Capture opened from this card: the account, the person who wrote, the deal, the conversation, the source. */
  const replyPersona = new Map(i.replies.filter((r) => r.personaId != null).map((r) => [`${r.accountName}|${r.contactEmail.toLowerCase()}`, r.personaId as number]));
  const replyContact = new Map(i.replies.filter((r) => r.hubspotContactId).map((r) => [`${r.accountName}|${r.contactEmail.toLowerCase()}`, String(r.hubspotContactId)]));
  const captureFor = (card: Omit<WorkCard, 'href' | 'index' | 'source'>, list: WorkObligation[]): { href: string; label: string } => {
    const q = new URLSearchParams({ account: card.accountName });
    // R50: the deal the card's work belongs to (its top obligation's deal, else the account's only open deal), by its
    // HubSpot id so the note's words and obligations bind to that deal; the name rides along for the label.
    const deals = dealAccounts.get(card.accountName)?.deals ?? [];
    const isReply = !!card.reply && !card.answerOwed && (card.stateKind === 'replied' || card.stateKind === 'opted_out');
    // Batch item 8: a reply's words bind to the replier's OWN single deal (else account-level), never to the deal of an
    // obligation that happens to top the card: Ann on the pilot is never logged against Ben's Columbus deal.
    const replier = isReply ? replyContact.get(`${card.accountName}|${card.reply!.from.toLowerCase()}`) ?? null : null;
    const theirs = replier ? deals.filter((d) => (d.contactIds ?? []).includes(replier)) : [];
    const scoped = isReply ? null : list.map((o) => (o.commitmentId ? commitments.find((c) => c.commitmentId === o.commitmentId)?.dealId ?? null : null)).find((x): x is string => !!x);
    const deal = isReply ? (theirs.length === 1 ? theirs[0] : null) : (scoped ? deals.find((d) => d.id === scoped) : null) ?? (deals.length === 1 ? deals[0] : null);
    if (deal?.id) {
      q.set('deal', deal.id);
      if (deal.name) q.set('dealName', deal.name);
    } else if (deal?.name) q.set('deal', deal.name);
    if (isReply && card.reply) {
      const pid = replyPersona.get(`${card.accountName}|${card.reply.from.toLowerCase()}`);
      if (pid) q.set('person', String(pid));
      q.set('context', 'email');
      q.set('from', `reply:${card.reply.messageId}`);
      return { href: `/gap/capture?${q.toString()}`, label: 'Log what they said' };
    }
    const meeting = list.find((o) => o.kind === 'meeting' || o.kind === 'prepare_meeting');
    if (meeting) {
      q.set('context', 'meeting');
      q.set('from', meeting.commitmentId ? `commitment:${meeting.commitmentId}` : `meeting:${card.accountName}`);
      return { href: `/gap/capture?${q.toString()}`, label: 'Log the meeting' };
    }
    q.set('from', `work:${card.accountName}`);
    return { href: `/gap/capture?${q.toString()}`, label: 'Log a conversation' };
  };
  const cards: WorkCard[] = ranked.map(({ r, tier, lane, list, dueMs, act, prio, oldReplyDays, evidence, preparedAngle, knowledge }, index) => {
    const top = list.find((o) => o.tier === tier);
    const phrase = (line: string) => line.replace(/\.$/, '').replace(/^\w/, (ch) => ch.toLowerCase());
    const bits = [top ? `${TIER_WHY[tier]}: ${top.title}${top.dueDay && top.kind !== 'meeting' ? ` (${phrase(top.line)})` : ''}` : tier === 'admin' && oldReplyDays !== null ? `An old reply to triage (${oldReplyDays} days): record what they said or dismiss it` : tier === 'deal' && r.card.dealNextStep ? `The deal's next step: ${r.card.dealNextStep.replace(/\.$/, '')}${r.card.stalled?.length ? ` (stalled: ${phrase(r.card.stalled[0])})` : ''}` : tier === 'deal' && r.card.stalled?.length ? `A stalled deal: ${phrase(r.card.stalled[0])}` : TIER_WHY[tier]];
    if (!top && dueMs < Number.MAX_SAFE_INTEGER && tier === 'reply') bits[0] = `${TIER_WHY.reply} ${day(new Date(dueMs).toISOString())}`;
    else if (act && tier !== 'reply') bits.push(`buyer activity ${day(new Date(act).toISOString())}`);
    if (prio && !evidence) bits.push(`you prioritized it (${prio.reason})`);
    // A1: the availability is said on the card, after what placed it, never as the reason it ranks.
    if (r.card.availability) bits.push(`${r.card.availability.who} is back from an out-of-office notice (${dayLabel(r.card.availability.returnedDay, i.now)}): availability, not a priority`);
    // A2 addendum: the prepared angle is said on the card in the loader's words.
    if (preparedAngle) bits.push(preparedAngle.line.replace(/\.$/, ''));
    // C2: the vault's next action is said on the card (the evidence names it when it is coming due; otherwise it is context, with its due day when it has one).
    const kn = knowledge ? knowledgeEvidence(knowledge, i.now) : null;
    if (knowledge?.nextAction && (!evidence || !kn?.nextAction)) bits.push(`the vault's next action: ${cutWords(knowledge.nextAction.replace(/\.$/, ''), 140).replace(/\.$/, '')}${knowledge.nextActionDue && isDay(knowledge.nextActionDue) ? `, due ${dayLabel(knowledge.nextActionDue, i.now)}` : ''}`);
    if (kn?.conversation && !evidence) bits.push(kn.conversation);
    const capture = captureFor(r.card, list);
    // R60, capture once: a reply card offers ONE entry into Capture, which carries the reply's meaning and the buyer's
    // words in one review; the card's next move and its prepared reply point there, and no second record link shows.
    const replyCard = !!r.card.reply && !r.card.answerOwed && (r.card.stateKind === 'replied' || r.card.stateKind === 'opted_out');
    return {
      ...r.card,
      ...(replyCard ? { next: { label: r.card.stateKind === 'opted_out' ? 'Record the opt-out' : capture.label, href: capture.href }, reply: { ...r.card.reply!, record: null } } : {}),
      lane,
      tier,
      // A2: an executable card says which evidence placed it ("Ranked here: open deal, close date passed; angle prepared").
      rankWhy: `${bits.join('; ')}.${evidence ? ` Ranked here: ${evidence.why}.` : ''}`,
      ...(evidence ? { evidence } : {}),
      ...(preparedAngle ? { preparedAngle } : {}),
      ...(knowledge ? { knowledge } : {}),
      obligations: list,
      priority: prio,
      capture: replyCard ? null : capture,
      index,
      source: r.source ?? 'cockpit',
      href: `${accountHref(r.card.accountName)}?from=work&i=${index}`,
    };
  });
  for (const [, o] of i.outcomes ?? []) {
    if (o.kind === 'snoozed' && !cards.some((c) => c.accountName === o.accountName)) snoozed.push({ key: `outcome:${o.accountName}`, accountName: o.accountName, line: outcomeLine(o, i.now), until: o.until });
  }
  snoozed.sort((a, b) => a.until.localeCompare(b.until) || a.accountName.localeCompare(b.accountName));
  waiting.sort((a, b) => String(a.dueDay ?? '9999').localeCompare(String(b.dueDay ?? '9999')) || a.accountName.localeCompare(b.accountName));
  const needs = cards.filter(needsYouCard).length;
  const availabilityCount = [...availability.values()].reduce((n, l) => n + l.length, 0);
  return { cards, waiting, snoozed, counts: { needsYou: needs, parked: cards.length - needs, obligationsDue: cards.reduce((n, c) => n + (c.obligations?.length ?? 0), 0), waiting: waiting.length, snoozed: snoozed.length, availability: availabilityCount } };
}

/** The cards alone (the order Work shows). */
export function buildWorkList(i: WorkInput): WorkCard[] {
  return workDay(i).cards;
}

/** R14: the accounts snoozed out of Work, with their lines, for the list's footer. */
export function snoozedWork(outcomes: ReadonlyMap<string, WorkOutcome> | undefined, cards: readonly WorkCard[], now: Date): Array<{ accountName: string; line: string; until: string }> {
  const shown = new Set(cards.map((c) => c.accountName));
  return [...(outcomes ?? []).values()].filter((o) => o.kind === 'snoozed' && !shown.has(o.accountName)).sort((a, b) => a.until.localeCompare(b.until)).map((o) => ({ accountName: o.accountName, line: outcomeLine(o, now), until: o.until }));
}

export type WorkFilter = 'all' | WorkLane;

export const WORK_FILTER_LABEL: Record<WorkFilter, string> = {
  all: 'All',
  commitments: 'Due',
  replies: 'Replied',
  follow_up: 'Follow up',
  ready: 'Ready',
  review: 'Decide',
  research: 'Research',
  deals: 'Held or in a deal',
};
export const WORK_FILTERS: readonly WorkFilter[] = ['all', 'commitments', 'replies', 'follow_up', 'ready', 'review', 'research', 'deals'];

/** The chip counts ARE the filtered contents (N4). */
export function workCounts(cards: readonly WorkCard[]): Record<WorkFilter, number> {
  const out = { all: cards.length, commitments: 0, replies: 0, follow_up: 0, ready: 0, review: 0, research: 0, deals: 0 };
  for (const c of cards) out[c.lane] += 1;
  return out;
}

/** The lane filter and a name search, together; the Work order is kept. */
export function filterWork(cards: readonly WorkCard[], filter: WorkFilter, query: string): WorkCard[] {
  const q = query.trim().toLowerCase();
  return cards.filter((c) => (filter === 'all' || c.lane === filter) && (!q || c.accountName.toLowerCase().includes(q)));
}
