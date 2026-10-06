/**
 * WORK LIST (account-first UX, UX-08, Direction A): the accounts that need the seller, ONE card each, in the
 * existing NEXT UP order (reply, follow up, ready, decide, research) with the lanes as filters and counts.
 *
 * Not a second state engine: the cards are projected from the candidates the cockpit already builds
 * (routing/next-up.ts), the account motions it already reads, the In Deals summary it already shows, and the reply
 * class decided before anything ranks (replies/classify.ts). Each card answers: account, why now, state, next person,
 * next action, blocker. Rules pinned by tests/unit/gap/work-list.test.ts:
 *
 *   - one card per account: its highest-ranked work; a reply at the account (human, opt-out, bounce) IS the card,
 *     whatever else the lanes hold (a review one-off never erases yesterday's "stop")
 *   - replies are classified first: only a HUMAN reply heads the list; an opt-out is "Opted out: record it" and
 *     ranks after RESEARCH (quick admin, never cold work, never at the head); an automatic reply is not work
 *     (dropped); a bounce is research (find a working address)
 *   - the one canonical pursuit state, when the workspace or the warmer read it recently (pursuit/summary.ts),
 *     overrides the cockpit lane's state, person and rank on the card (FedEx: READY with Glen, not research)
 *   - an account in a deal, or whose opportunity truth is UNKNOWN, is never a cold action: it lists under In a deal
 *     with "work it from the deal" (or the HubSpot caution), last
 *   - counts are the filtered contents, never a separate tally (N4)
 */
import { accountHref } from '../account-intel/href';
import { classifyReply, type ReplyClassKind } from '../replies/classify';
import { LANE_RANK, type NextCandidate } from '../routing/next-up';
import type { PursuitSummary } from '../pursuit/summary';
import type { PursuitStateKind } from '../pursuit/state';
import { outcomeLine, type WorkOutcome } from './outcome';
import { MOTION_UNLOCK_BUSINESS_DAYS } from '../motion/account-motion';
import type { CockpitLane } from '@/components/gap/gap-cockpit';

export type WorkStateKind = 'replied' | 'opted_out' | 'bounced' | 'follow_up' | 'ready' | 'decide' | 'research' | 'in_deal' | 'unknown_deal' | 'held';

export interface WorkCard {
  accountName: string;
  /** The account workspace, carrying the Work order (`?from=work&i=n`) so the workspace can offer Next account. */
  href: string;
  lane: CockpitLane;
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
}

export interface WorkInput {
  now: Date;
  /** Every NEXT UP candidate (all lanes), from buildNextUpCandidates. */
  candidates: readonly NextCandidate[];
  /** Undispositioned replies, the raw rows (classified here). */
  replies: ReadonlyArray<{ accountName: string; contactEmail: string; subject: string | null; snippet: string; receivedAt: string }>;
  /** The account motions the cockpit read (primary and next per account). */
  motions: ReadonlyArray<{ accountName: string; state: string; primary: { name: string; title: string | null } | null; next: { name: string; title: string | null; unlock: string } | null }>;
  /** The In Deals summary: complete, or unavailable (then nothing is claimed about deals). */
  inDeals: { status: 'complete' | 'unavailable'; accounts: ReadonlyArray<{ accountName: string; deals: ReadonlyArray<{ name: string | null; stage: string }> }> };
  /** Accounts a current card holds for an open deal or an UNKNOWN opportunity read (never a cold action). */
  held: ReadonlyMap<string, 'active_opportunity' | 'opportunity_unknown'>;
  /** Fresh canonical pursuit summaries by account (pursuit/summary.ts), when any. */
  summaries?: ReadonlyMap<string, PursuitSummary>;
  /**
   * What the database alone says per account, read on every load (no HubSpot, no process memory): whether a usable
   * (sendable, grounded, open) thesis exists, and the recorded chosen person. A cold load is the normal state, so a
   * cold card must not contradict the workspace: a recorded choice with a usable thesis is READY; a cold-touch lane
   * card with no usable thesis is research (nothing to open on), never "choose who".
   */
  dbState?: ReadonlyMap<string, { sendable: boolean; chosen: { name: string; title: string | null } | null }>;
  /**
   * R14: what the seller recorded on an account (work/outcome.ts): a snoozed account leaves Work until its date
   * (listed under `snoozed`); a skipped or logged-outside-GAP account drops to the end for today with its line. A
   * reply or an opt-out is never hidden by an outcome: the buyer's own move outranks the seller's note.
   */
  outcomes?: ReadonlyMap<string, WorkOutcome>;
  /**
   * R14: accounts with a proven GAP first touch or an outstanding GAP draft in the window (the send ledger alone),
   * with the person when known. An in-motion account is on Work as a motion in flight (never a cold READY, never
   * dropped because its card was acted), ranked with the follow-ups.
   */
  inMotion?: ReadonlyMap<string, { state: 'sent' | 'drafted'; at: string; person: { name: string; title: string | null } | null }>;
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
};

/** The action a pursuit-sourced card offers: the workspace carries the real control, so the card points there. */
function pursuitAction(state: PursuitStateKind, accountName: string, stateLine = ''): { label: string; href: string } | null {
  const page = accountHref(accountName);
  // A relationship-led account's move is the warm touch, as the workspace says (never "Prepare the first touch").
  if (state === 'ready' && /^Relationship-led/.test(stateLine)) return { label: 'Log the warm touch', href: `/gap/capture?account=${encodeURIComponent(accountName)}` };
  switch (state) {
    case 'replied':
      return { label: 'Open the reply', href: '/gap?lane=replies' };
    case 'opted_out':
      return { label: 'Record the opt-out', href: '/gap?lane=replies' };
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

/** The rank a classified reply takes: a human reply first of all; an opt-out after READY; a bounce with research. */
const REPLY_RANK: Record<ReplyClassKind, number | null> = { human: LANE_RANK.replies, opt_out: LANE_RANK.research + 0.5, bounce: LANE_RANK.research, out_of_office: null };

/** The canonical pursuit state's rank and card words (contract 5.1 order: reply, hold, follow up, in motion, ready, choose, research). */
const PURSUIT_RANK: Record<PursuitStateKind, number> = { replied: 0, opted_out: LANE_RANK.research + 0.5, in_deal: LANE_RANK.deals, held: LANE_RANK.deals - 0.5, follow_up_due: 1, in_motion: 1.5, ready: 2, choose_person: 2.5, research: 4, idle: 4.5 };
const PURSUIT_KIND: Record<PursuitStateKind, WorkStateKind> = { replied: 'replied', opted_out: 'opted_out', in_deal: 'in_deal', held: 'held', follow_up_due: 'follow_up', in_motion: 'ready', ready: 'ready', choose_person: 'ready', research: 'research', idle: 'research' };
const PURSUIT_LANE: Record<PursuitStateKind, CockpitLane> = { replied: 'replies', opted_out: 'replies', in_deal: 'deals', held: 'deals', follow_up_due: 'follow_up', in_motion: 'ready', ready: 'ready', choose_person: 'ready', research: 'research', idle: 'research' };

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

interface Ranked {
  rank: number;
  sortKey: Array<number | string>;
  card: Omit<WorkCard, 'href' | 'index' | 'source'>;
  source?: 'pursuit' | 'cockpit';
}

export function buildWorkList(i: WorkInput): WorkCard[] {
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

  // Replies, classified before they rank. A reply IS the account's card: it is collected here and set after the
  // lanes, so a review one-off or a research chore never erases it (Walmart's "stop" read "Decide the angle").
  const replyCards: Ranked[] = [];
  const offerReply = (r: Ranked) => {
    const have = replyCards.find((x) => x.card.accountName === r.card.accountName);
    if (!have || r.rank < have.rank || (r.rank === have.rank && cmpKeys(r.sortKey, have.sortKey) < 0)) {
      if (have) replyCards.splice(replyCards.indexOf(have), 1);
      replyCards.push(r);
    }
  };
  for (const r of i.replies) {
    if (!r.accountName) continue;
    const c = classifyReply({ snippet: r.snippet, subject: r.subject, from: r.contactEmail });
    const rank = REPLY_RANK[c.kind];
    if (rank === null) continue; // an automatic reply is not work
    const kind: WorkStateKind = c.kind === 'human' ? 'replied' : c.kind === 'opt_out' ? 'opted_out' : 'bounced';
    const quote = (r.subject ?? r.snippet).replace(/\s+/g, ' ').trim().slice(0, 90);
    offerReply({
      rank,
      sortKey: [new Date(r.receivedAt).getTime() || Number.MAX_SAFE_INTEGER],
      card: {
        accountName: r.accountName,
        lane: c.kind === 'bounce' ? 'research' : 'replies',
        stateKind: kind,
        state: STATE_TEXT[kind],
        why: `${r.contactEmail} wrote ${day(r.receivedAt)}: "${quote}". ${c.consequence}`,
        person: { name: r.contactEmail, title: null },
        next: { label: c.kind === 'human' ? 'Read the reply and record what they said' : c.kind === 'opt_out' ? 'Record the opt-out' : 'Find a working address', href: c.kind === 'bounce' ? accountHref(r.accountName) : '/gap?lane=replies' },
        blocker: c.kind === 'human' ? 'No cold email to anyone here until it is recorded.' : c.kind === 'opt_out' ? 'They asked not to be contacted: no cold work here until it is recorded.' : null,
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
        next: noAngle ? { label: 'Open the account', href: accountHref(c.accountName) } : { label: c.title, href: c.href },
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
  // R14: a motion in flight (the ledger's proven send or outstanding draft) is the account's card unless a reply, a
  // hold or a follow-up outranks it; it replaces any cold READY the lanes or the database offered.
  for (const [name, m] of i.inMotion ?? []) {
    if (i.held.has(name) || dealAccountNames.has(name)) continue;
    const have = best.get(name);
    if (have && (have.card.stateKind === 'follow_up' || have.rank <= 1)) continue;
    const who = m.person?.name ?? 'the person';
    best.set(name, {
      rank: PURSUIT_RANK.in_motion,
      sortKey: [new Date(m.at).getTime() || 0],
      card: {
        accountName: name,
        lane: 'ready',
        stateKind: 'ready',
        state: m.state === 'sent' ? `First touch in motion: ${who}` : `A GAP draft to ${who} is outstanding`,
        why: m.state === 'sent' ? `${who} got the first touch on ${day(m.at)}. The next person unlocks after ${MOTION_UNLOCK_BUSINESS_DAYS} business days without a response.` : `A GAP draft to ${who} is still in the mailbox: send or discard it before anyone else here is touched.`,
        person: m.person,
        next: { label: 'Open the account', href: accountHref(name) },
        blocker: null,
      },
    });
  }
  // The reply card wins the account outright (a bounce only when nothing ranks above research).
  for (const r of replyCards) {
    if (r.card.stateKind === 'bounced') offer(r);
    else best.set(r.card.accountName, r);
  }

  // Held accounts: in a deal (the summary) or UNKNOWN (a card's read), last, never a cold action. The hold card IS
  // the account's card: a research chore at a deal account never outranks it (Kraft Heinz read "Judge 1 verified fact").
  const dealAccounts = new Map(i.inDeals.status === 'complete' ? i.inDeals.accounts.map((a) => [a.accountName, a]) : []);
  for (const [name, a] of dealAccounts) {
    const stages = a.deals.map((d) => `${d.name ? `"${d.name}"` : 'an unnamed deal'} (${d.stage})`).join(', ');
    best.delete(name);
    offer({ rank: LANE_RANK.deals, sortKey: [name], card: { accountName: name, lane: 'deals', stateKind: 'in_deal', state: STATE_TEXT.in_deal, why: `Open HubSpot ${a.deals.length === 1 ? 'deal' : 'deals'}: ${stages}.`, person: null, next: { label: 'Open the deal brief', href: `${accountHref(name)}?view=brief` }, blocker: 'No cold first touch while the deal is open: work it from the deal.' } });
  }
  for (const [name, why] of i.held) {
    if (dealAccounts.has(name)) continue;
    const unknown = why === 'opportunity_unknown';
    best.delete(name);
    offer({ rank: LANE_RANK.deals, sortKey: [unknown ? 0 : 1, name], card: { accountName: name, lane: 'deals', stateKind: unknown ? 'unknown_deal' : 'in_deal', state: STATE_TEXT[unknown ? 'unknown_deal' : 'in_deal'], why: unknown ? 'HubSpot could not say whether this account is in a deal: no cold touch until it can.' : 'A current card holds this account for an open deal.', person: null, next: unknown ? null : { label: 'Open the deal brief', href: `${accountHref(name)}?view=brief` }, blocker: unknown ? 'Check HubSpot directly before contacting anyone.' : 'No cold first touch while the deal is open.' } });
  }

  // The canonical pursuit state wins where it is fresh: the card says what the workspace says, and ranks by it.
  for (const [name, s] of i.summaries ?? []) {
    const have = best.get(name);
    if (!have) continue;
    // A reply that landed after the summary was read is never overwritten by it: the reply card stands unless the
    // summary itself says replied or opted out. A hold (a deal, an unknown or held read) is never lifted by a summary
    // either, unless the summary is itself a hold: a stale READY must never turn a held card into a cold action.
    const holdCard = have.card.stateKind === 'in_deal' || have.card.stateKind === 'unknown_deal' || have.card.stateKind === 'held';
    const summaryHolds = s.state === 'in_deal' || s.state === 'held' || s.state === 'replied' || s.state === 'opted_out';
    if ((have.card.stateKind === 'replied' || have.card.stateKind === 'opted_out') && s.state !== 'replied' && s.state !== 'opted_out') continue;
    if (holdCard && !summaryHolds) continue;
    // R14: a summary read BEFORE the ledger's touch is stale against it: the proven send stands (a READY summary from
    // ten minutes ago must not say "prepare the first touch" over a touch that went out since).
    const touch = i.inMotion?.get(name);
    if (touch && new Date(s.at).getTime() < new Date(touch.at).getTime()) continue;
    const kind = PURSUIT_KIND[s.state];
    // R10: the workspace's own allowed action (the actionable result) is the card's action; the lane mapping only
    // when the summary predates it. A proposal under review opens the page at the proposal.
    const action = s.actionable?.allowed ? { label: s.actionable.allowed.label, href: /^#/.test(s.actionable.allowed.href) ? `${accountHref(name)}${s.actionable.allowed.href}` : s.actionable.allowed.href } : pursuitAction(s.state, name, s.stateLine);
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
        // The card says what the workspace says, all of it: the why is NEXT, the action is the workspace's control.
        why: s.nextText ?? s.blocker ?? have.card.why,
        // The blocker is said once: never the same sentence as the why.
        blocker: (s.state === 'held' || s.state === 'in_deal' || s.state === 'replied' || s.state === 'opted_out') && (s.blocker ?? have.card.blocker) !== (s.nextText ?? s.blocker ?? have.card.why) ? (s.blocker ?? have.card.blocker) : null,
        next: action,
        preparation: s.actionable?.preparation ?? null,
      },
    });
  }
  // R14: the seller's recorded outcomes. A snoozed account leaves the list; a skipped or logged one drops to the end
  // for today with its line. The buyer's own move (a reply, an opt-out) is never hidden by a seller note.
  const OUTCOME_RANK = LANE_RANK.research + 1;
  for (const [name, o] of i.outcomes ?? []) {
    const have = best.get(name);
    if (!have) continue;
    if (have.card.stateKind === 'replied' || have.card.stateKind === 'opted_out') continue;
    if (o.kind === 'snoozed') {
      best.delete(name);
      continue;
    }
    best.set(name, { ...have, rank: Math.max(have.rank, OUTCOME_RANK), card: { ...have.card, outcome: { kind: o.kind, line: outcomeLine(o, i.now), until: o.until } } });
  }
  const ordered = [...best.values()].sort((a, b) => a.rank - b.rank || cmpKeys(a.sortKey, b.sortKey) || a.card.accountName.localeCompare(b.card.accountName));
  return ordered.map((r, index) => ({ ...r.card, index, source: r.source ?? 'cockpit', href: `${accountHref(r.card.accountName)}?from=work&i=${index}` }));
}

/** R14: the accounts snoozed out of Work, with their lines, for the list's footer. */
export function snoozedWork(outcomes: ReadonlyMap<string, WorkOutcome> | undefined, cards: readonly WorkCard[], now: Date): Array<{ accountName: string; line: string; until: string }> {
  const shown = new Set(cards.map((c) => c.accountName));
  return [...(outcomes ?? []).values()].filter((o) => o.kind === 'snoozed' && !shown.has(o.accountName)).sort((a, b) => a.until.localeCompare(b.until)).map((o) => ({ accountName: o.accountName, line: outcomeLine(o, now), until: o.until }));
}

export type WorkFilter = 'all' | CockpitLane;

export const WORK_FILTER_LABEL: Record<WorkFilter, string> = {
  all: 'All',
  replies: 'Replied',
  follow_up: 'Follow up',
  ready: 'Ready',
  review: 'Decide',
  research: 'Research',
  deals: 'Held or in a deal',
};
export const WORK_FILTERS: readonly WorkFilter[] = ['all', 'replies', 'follow_up', 'ready', 'review', 'research', 'deals'];

/** The chip counts ARE the filtered contents (N4). */
export function workCounts(cards: readonly WorkCard[]): Record<WorkFilter, number> {
  const out = { all: cards.length, replies: 0, follow_up: 0, ready: 0, review: 0, research: 0, deals: 0 };
  for (const c of cards) out[c.lane] += 1;
  return out;
}

/** The lane filter and a name search, together; the Work order is kept. */
export function filterWork(cards: readonly WorkCard[], filter: WorkFilter, query: string): WorkCard[] {
  const q = query.trim().toLowerCase();
  return cards.filter((c) => (filter === 'all' || c.lane === filter) && (!q || c.accountName.toLowerCase().includes(q)));
}
