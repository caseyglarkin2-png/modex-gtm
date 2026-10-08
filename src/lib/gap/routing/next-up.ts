/**
 * NEXT UP v2 (Phase 2 C5, 2026-09-28): the best next minute of Casey's time,
 * by deterministic rules (no score):
 *
 *   1. buyer replies, oldest waiting first
 *   2. due follow-ups, most overdue first
 *   3. READY account motions (the primary only): soonest primary-fact expiry,
 *      then account tier, then oldest ready
 *   4. review decisions: most people unlocked, then tier
 *   5. research: most people unlocked, then freshest trigger, then tier
 *
 * Hard constraints: at most ONE item per account (the highest-ranked one);
 * never an account held by an open deal or whose opportunity truth is
 * UNKNOWN; never an item the caller marked as failing its actionability gate.
 * Pure: the page builds the candidates, this orders and filters them.
 */
import { displayName } from '../people/display-name';
import { accountHref, recordReplyHref } from '../account-intel/href';
import type { CockpitLane, NextUpItem } from '@/components/gap/gap-cockpit';

export const LANE_RANK: Record<CockpitLane, number> = { replies: 0, follow_up: 1, ready: 2, review: 3, research: 4, deals: 5 };

export interface NextCandidate extends NextUpItem {
  /** Null for work not tied to one account (never deduped away). */
  accountName: string | null;
  /** Lexicographic ascending within the lane; build it from the lane's rules. */
  sortKey: Array<number | string>;
  /** The obvious action would fail its gate right now (e.g. a thesis not in use): never picked. */
  failsGate?: boolean;
}

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

/** Tier rank: "Tier 1" -> 1; unknown last. */
export function tierKey(tier: string | null | undefined): number {
  const m = String(tier ?? '').match(/(\d+)/);
  return m ? Number(m[1]) : 9;
}

/** An ISO time as a sortable number (missing sorts last). */
export function timeKey(iso: string | Date | null | undefined, missing = Number.MAX_SAFE_INTEGER): number {
  if (!iso) return missing;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? missing : t;
}

export function pickNextUpV2(candidates: readonly NextCandidate[], heldAccounts: ReadonlySet<string>, limit = 4): NextUpItem[] {
  const ordered = candidates
    .filter((c) => !c.failsGate)
    .filter((c) => !c.accountName || !heldAccounts.has(c.accountName))
    .slice()
    .sort((a, b) => LANE_RANK[a.lane] - LANE_RANK[b.lane] || cmpKeys(a.sortKey, b.sortKey) || a.title.localeCompare(b.title));
  const seen = new Set<string>();
  const out: NextUpItem[] = [];
  for (const c of ordered) {
    if (c.accountName) {
      if (seen.has(c.accountName)) continue;
      seen.add(c.accountName);
    }
    out.push({ lane: c.lane, title: c.title, detail: c.detail, href: c.href });
    if (out.length >= limit) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Candidate construction (pure): the page gathers, this applies the lane rules.
// ---------------------------------------------------------------------------

type Person = { id: number | null; displayName: string | null; email: string | null; title: string | null };
type Card = { id: string; account: { name: string }; persona: Person; hypothesis?: { id: string } | null; touch?: { dueAt?: string } | null; createdAt: Date | string; ruleId: string };

export interface NextUpInput {
  replies: Array<{ accountName: string; contactEmail: string; subject: string | null; snippet: string; receivedAt: string }>;
  followUps: Card[];
  /** READY cards after account motion (primaries only). */
  ready: Card[];
  /** Primary outreach fact expiry per hypothesis id (ISO), where known. */
  primaryExpiry: ReadonlyMap<string, string | null>;
  reviewGroups: Array<{ accountName: string; people: number }>;
  readyOneOffs: Array<{ accountName: string }>;
  researchGroups: Array<{ accountName: string; people: number; triggerAt?: string | null }>;
  researchCards: Card[];
  /** Verified Evidence Inbox: accounts with facts ready to judge. */
  inbox: Array<{ accountName: string; ready: number; people: number }>;
  tiers: ReadonlyMap<string, string | null>;
  openHref: (lane: 'ready' | 'follow_up', decisionId: string) => string;
}

// Said the way NOW says it (round 5: the cockpit read "Contact michelle schlie").
const who = (p: Person) => (p.displayName ? displayName(p.displayName) : p.email ?? 'someone');

export function buildNextUpCandidates(input: NextUpInput): NextCandidate[] {
  const tier = (a: string) => tierKey(input.tiers.get(a));
  const out: NextCandidate[] = [];
  for (const r of input.replies) {
    out.push({ lane: 'replies', accountName: r.accountName || null, title: `${r.contactEmail} replied`, detail: `${r.accountName}: ${r.subject ?? r.snippet.slice(0, 80)}`, href: r.accountName ? recordReplyHref(r.accountName) : '/gap/replies', sortKey: [timeKey(r.receivedAt)] });
  }
  for (const c of input.followUps) {
    out.push({ lane: 'follow_up', accountName: c.account.name, title: `Follow up with ${who(c.persona)}`, detail: `${c.account.name}. The next touch is due.`, href: input.openHref('follow_up', c.id), sortKey: [timeKey(c.touch?.dueAt ?? null)] });
  }
  for (const c of input.ready) {
    const exp = c.hypothesis ? input.primaryExpiry.get(c.hypothesis.id) ?? null : null;
    out.push({
      lane: 'ready',
      accountName: c.account.name,
      title: `Contact ${who(c.persona)}`,
      detail: `${c.account.name}${c.persona.title ? `, ${c.persona.title}` : ''}.${exp ? ` The fact is usable until ${exp.slice(0, 10)}.` : ''}`,
      href: input.openHref('ready', c.id),
      sortKey: [timeKey(exp), tier(c.account.name), timeKey(c.createdAt)],
    });
  }
  for (const g of input.reviewGroups) {
    // R60: Work's card names the account; the move is said in the seller's words and opens the account, where it lives.
    out.push({ lane: 'review', accountName: g.accountName, title: 'Decide the angle', detail: `${g.people} ${g.people === 1 ? 'person' : 'people'}, ready for outreach.`, href: accountHref(g.accountName), sortKey: [-g.people, tier(g.accountName)] });
  }
  for (const o of input.readyOneOffs) {
    out.push({ lane: 'review', accountName: o.accountName, title: 'Decide the angle', detail: '1 person, ready for outreach.', href: o.accountName ? accountHref(o.accountName) : '/gap', sortKey: [-1, tier(o.accountName)] });
  }
  for (const i of input.inbox) {
    if (i.ready < 1) continue;
    out.push({ lane: 'research', accountName: i.accountName, title: `Judge ${i.ready} verified fact${i.ready === 1 ? '' : 's'}`, detail: 'Found and verified in the background. Use or ignore.', href: accountHref(i.accountName), sortKey: [-Math.max(1, i.people), 0, tier(i.accountName)] });
  }
  for (const g of input.researchGroups) {
    out.push({ lane: 'research', accountName: g.accountName, title: 'Find verified evidence', detail: `${g.people} ${g.people === 1 ? 'person' : 'people'} waiting on it. Not ready for outreach yet.`, href: accountHref(g.accountName), sortKey: [-g.people, -timeKey(g.triggerAt ?? null, 0), tier(g.accountName)] });
  }
  const cardsByAccount = new Map<string, Card[]>();
  for (const c of input.researchCards) cardsByAccount.set(c.account.name, [...(cardsByAccount.get(c.account.name) ?? []), c]);
  for (const [a, cards] of cardsByAccount) {
    out.push({ lane: 'research', accountName: a, title: 'Research the account', detail: `${cards.length} ${cards.length === 1 ? 'person' : 'people'} missing evidence or contact data.`, href: accountHref(a), sortKey: [-cards.length, 0, tier(a)] });
  }
  return out;
}

/** Accounts NEXT UP must never point at: an open deal, opportunity truth UNKNOWN or a corporate-family hold (batch item 7) on any current card. */
export function heldAccountsOf(items: ReadonlyArray<{ account: { name: string }; ruleId: string }>): Set<string> {
  return new Set(items.filter((i) => i.ruleId === 'active_opportunity' || i.ruleId === 'opportunity_unknown' || i.ruleId === 'family_hold').map((i) => i.account.name));
}
