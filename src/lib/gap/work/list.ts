/**
 * WORK LIST (account-first UX, UX-08, Direction A): the accounts that need the seller, ONE card each, in the
 * existing NEXT UP order (reply, follow up, ready, decide, research) with the lanes as filters and counts.
 *
 * Not a second state engine: the cards are projected from the candidates the cockpit already builds
 * (routing/next-up.ts), the account motions it already reads, the In Deals summary it already shows, and the reply
 * class decided before anything ranks (replies/classify.ts). Each card answers: account, why now, state, next person,
 * next action, blocker. Rules pinned by tests/unit/gap/work-list.test.ts:
 *
 *   - one card per account: its highest-ranked work
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
import type { CockpitLane } from '@/components/gap/gap-cockpit';

export type WorkStateKind = 'replied' | 'opted_out' | 'bounced' | 'follow_up' | 'ready' | 'decide' | 'research' | 'in_deal' | 'unknown_deal';

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
};

/** The rank a classified reply takes: a human reply first of all; an opt-out after READY; a bounce with research. */
const REPLY_RANK: Record<ReplyClassKind, number | null> = { human: LANE_RANK.replies, opt_out: LANE_RANK.research + 0.5, bounce: LANE_RANK.research, out_of_office: null };

/** The canonical pursuit state's rank and card words (contract 5.1 order: reply, hold, follow up, in motion, ready, choose, research). */
const PURSUIT_RANK: Record<PursuitStateKind, number> = { replied: 0, opted_out: LANE_RANK.research + 0.5, in_deal: LANE_RANK.deals, held: LANE_RANK.deals - 0.5, follow_up_due: 1, in_motion: 1.5, ready: 2, choose_person: 2.5, research: 4, idle: 4.5 };
const PURSUIT_KIND: Record<PursuitStateKind, WorkStateKind> = { replied: 'replied', opted_out: 'opted_out', in_deal: 'in_deal', held: 'unknown_deal', follow_up_due: 'follow_up', in_motion: 'ready', ready: 'ready', choose_person: 'ready', research: 'research', idle: 'research' };
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

  // Replies, classified before they rank (the candidates' reply rows are replaced by these).
  const repliedAccounts = new Set<string>();
  for (const r of i.replies) {
    if (!r.accountName) continue;
    const c = classifyReply({ snippet: r.snippet, subject: r.subject, from: r.contactEmail });
    const rank = REPLY_RANK[c.kind];
    if (rank === null) continue; // an automatic reply is not work
    repliedAccounts.add(r.accountName);
    const kind: WorkStateKind = c.kind === 'human' ? 'replied' : c.kind === 'opt_out' ? 'opted_out' : 'bounced';
    const quote = (r.subject ?? r.snippet).replace(/\s+/g, ' ').trim().slice(0, 90);
    offer({
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
        blocker: c.kind === 'human' ? 'No cold email to anyone here until it is recorded.' : null,
      },
    });
  }

  for (const c of i.candidates) {
    if (!c.accountName || c.failsGate || c.lane === 'replies' || c.lane === 'deals') continue;
    if (i.held.has(c.accountName)) continue; // never a cold action on a held account
    const kind: WorkStateKind = c.lane === 'follow_up' ? 'follow_up' : c.lane === 'ready' ? 'ready' : c.lane === 'review' ? 'decide' : 'research';
    const m = motion.get(c.accountName);
    const p = kind === 'ready' || kind === 'follow_up' ? person(c.accountName) : null;
    offer({
      rank: LANE_RANK[c.lane],
      sortKey: c.sortKey,
      card: {
        accountName: c.accountName,
        lane: c.lane,
        stateKind: kind,
        state: kind === 'ready' && m?.state === 'needs_owner' ? 'Choose who hears this first' : STATE_TEXT[kind],
        why: c.detail,
        person: p,
        next: { label: c.title, href: c.href },
        blocker: repliedAccounts.has(c.accountName) ? null : null,
      },
    });
  }

  // Held accounts: in a deal (the summary) or UNKNOWN (a card's read), last, never a cold action.
  const dealAccounts = new Map(i.inDeals.status === 'complete' ? i.inDeals.accounts.map((a) => [a.accountName, a]) : []);
  for (const [name, a] of dealAccounts) {
    const stages = a.deals.map((d) => `${d.name ? `"${d.name}"` : 'an unnamed deal'} (${d.stage})`).join(', ');
    offer({ rank: LANE_RANK.deals, sortKey: [name], card: { accountName: name, lane: 'deals', stateKind: 'in_deal', state: STATE_TEXT.in_deal, why: `Open HubSpot ${a.deals.length === 1 ? 'deal' : 'deals'}: ${stages}.`, person: null, next: { label: 'Open the deal brief', href: `${accountHref(name)}?view=brief` }, blocker: 'No cold first touch while the deal is open: work it from the deal.' } });
  }
  for (const [name, why] of i.held) {
    if (dealAccounts.has(name)) continue;
    const unknown = why === 'opportunity_unknown';
    offer({ rank: LANE_RANK.deals, sortKey: [unknown ? 0 : 1, name], card: { accountName: name, lane: 'deals', stateKind: unknown ? 'unknown_deal' : 'in_deal', state: STATE_TEXT[unknown ? 'unknown_deal' : 'in_deal'], why: unknown ? 'HubSpot could not say whether this account is in a deal: no cold touch until it can.' : 'A current card holds this account for an open deal.', person: null, next: unknown ? null : { label: 'Open the deal brief', href: `${accountHref(name)}?view=brief` }, blocker: unknown ? 'Check HubSpot directly before contacting anyone.' : 'No cold first touch while the deal is open.' } });
  }

  // The canonical pursuit state wins where it is fresh: the card says what the workspace says, and ranks by it.
  for (const [name, s] of i.summaries ?? []) {
    const have = best.get(name);
    if (!have) continue;
    const kind = PURSUIT_KIND[s.state];
    const held = s.state === 'in_deal' || s.state === 'held';
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
        blocker: s.blocker ?? have.card.blocker,
        // A cold action never survives a hold the canonical read found; a cold lane's action stands otherwise.
        next: held && have.card.next && !/deal brief/i.test(have.card.next.label) ? { label: 'Open the deal brief', href: `${accountHref(name)}?view=brief` } : have.card.next,
      },
    });
  }
  const ordered = [...best.values()].sort((a, b) => a.rank - b.rank || cmpKeys(a.sortKey, b.sortKey) || a.card.accountName.localeCompare(b.card.accountName));
  return ordered.map((r, index) => ({ ...r.card, index, source: r.source ?? 'cockpit', href: `${accountHref(r.card.accountName)}?from=work&i=${index}` }));
}

export type WorkFilter = 'all' | CockpitLane;

export const WORK_FILTER_LABEL: Record<WorkFilter, string> = {
  all: 'All',
  replies: 'Replied',
  follow_up: 'Follow up',
  ready: 'Ready',
  review: 'Decide',
  research: 'Research',
  deals: 'In a deal',
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
