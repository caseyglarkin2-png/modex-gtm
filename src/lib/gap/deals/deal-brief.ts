/**
 * DEAL BRIEF v0 (Phase 2 F2/F3, 2026-09-28): what GAP knows about an account
 * that already has an open HubSpot deal, read-only.
 *
 * Every section is filled ONLY from human-confirmed buyer truth:
 *
 *   CURRENT STATE          current_state BIDs
 *   PROBLEM                business_problem BIDs
 *   ROOT CAUSE             root_cause BIDs
 *   BUSINESS IMPACT        impact, metric and priority BIDs
 *   DESIRED FUTURE STATE   future_state BIDs
 *   SOLUTION REQUIREMENTS  constraint BIDs
 *   STAKEHOLDERS           who said the BIDs, plus the HubSpot deal contacts (count)
 *   BUYER COMMITMENTS      confirmed meeting_accepted outcomes (meetings included)
 *   CONTRADICTIONS         a confirmed problem vs a rejected one, buyer
 *                          objections, and public facts that disagree
 *   UNKNOWNS               every empty truth section, shown as UNKNOWN
 *
 * A BID is truth when a human confirmed it and no later row corrects it
 * (bid/select.ts). AI-extracted candidates and unconfirmed corrections never
 * appear. Nothing here is inferred: an empty section says UNKNOWN.
 *
 * The NEXT LEARNING OBJECTIVE is Casey's: the newest `deal.learning_objective`
 * audit row on the account, else the one he typed when recording a meeting
 * (capture.meeting), else a deterministic suggestion aimed at the first
 * unknown, labelled as a suggestion. Storage is the append-only audit ledger
 * (no new table). Nothing here writes to HubSpot.
 */
import { selectConfirmedBids } from '../bid/select';
import { wordingOf } from '../bid/wording';
import { CAPTURE_MEETING } from '../capture/store';
import { loadEvidenceInbox } from '../research/inbox';
import { TRUTH_SECTIONS, type TruthSection } from './sections';
import { ACCOUNT_LEVEL, type ScopeRead } from './scope';

export { TRUTH_SECTIONS, SECTION_TITLE, type TruthSection } from './sections';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const DEAL_OBJECTIVE = 'deal.learning_objective' as const;
export const OBJECTIVE_MAX = 240;

const SECTION_OF_BID: Record<string, TruthSection> = {
  current_state: 'current_state',
  business_problem: 'problem',
  root_cause: 'root_cause',
  impact: 'business_impact',
  metric: 'business_impact',
  priority: 'business_impact',
  future_state: 'future_state',
  constraint: 'requirements',
};

/** The suggestion for each unknown, in the order a discovery conversation needs them. */
const SUGGESTION_ORDER: TruthSection[] = ['problem', 'current_state', 'root_cause', 'business_impact', 'future_state', 'requirements'];
const SUGGESTION: Record<TruthSection, string> = {
  problem: 'Learn the problem in their words: what breaks in their yards, and how often?',
  current_state: 'Learn how their yards run today: how trailers are checked in, found and moved.',
  root_cause: 'Learn why it happens: what causes the waiting, in their words.',
  business_impact: 'Learn what it costs them: dwell hours, detention, or production capacity lost.',
  future_state: 'Learn what good looks like to them, and by when.',
  requirements: 'Learn what any solution must fit: systems, sites, security and approvals.',
};
const ALL_KNOWN_SUGGESTION = 'Every section has buyer truth. Learn who else must agree before anything changes.';

/** R51: the truth sections no confirmed BID of these types fills, in the order a discovery conversation needs them. */
export function unknownSectionsOfTypes(types: readonly string[]): TruthSection[] {
  const known = new Set(types.map((t) => SECTION_OF_BID[t]).filter(Boolean));
  return SUGGESTION_ORDER.filter((s) => !known.has(s));
}

/** R51: the discovery question for each unknown section (the brief's own suggestions), in conversation order. */
export function openQuestionsFor(unknowns: readonly TruthSection[]): string[] {
  const qs = SUGGESTION_ORDER.filter((s) => unknowns.includes(s)).map((s) => SUGGESTION[s]);
  return qs.length ? qs : [ALL_KNOWN_SUGGESTION];
}

export interface BriefBidRow {
  id: string;
  type: string;
  raw_buyer_language: string;
  normalized_summary: string | null;
  contact_email: string;
  source: string;
  human_confirmed: boolean;
  confirmed_by: string | null;
  confirmed_at: Date | string | null;
  supersedes_id: string | null;
  captured_at: Date | string;
  /** R50: `scope` names the deal, division or site the words belong to. */
  metadata?: unknown;
}

export interface BriefDispositionRow {
  id: string;
  /** The thesis the outcome was about: a contradiction needs the SAME problem confirmed and rejected. */
  hypothesis_id?: string | null;
  response_class: string;
  contact_email: string;
  buyer_language: string | null;
  next_best_action: string | null;
  human_confirmed: boolean;
  confirmed_by: string | null;
  confirmed_at: Date | string | null;
  created_at: Date | string;
}

export interface ObjectiveRow {
  text: string;
  by: string;
  at: string;
}

export interface BriefEntry {
  bidId: string;
  quote: string;
  summary: string | null;
  who: string;
  source: string;
  confirmedBy: string | null;
  at: string;
  /** R50: on a per-deal brief, "account-level" for words not tied to this deal (this deal's own carry no tag). */
  scope?: string | null;
  /** R63-A S5: what the seller noted they said (shown without quotation marks), not their own words. */
  noted?: boolean;
}

/**
 * R63-A N3: who confirmed a statement, by name ("confirmed by casey@freightroll.com" put an address where a name
 * belongs): the person on record, else the address's own name ("casey@..." is Casey), never the address.
 */
export function actorName(address: string | null | undefined, people: ReadonlyMap<string, { name?: string | null }> = new Map()): string | null {
  const a = (address ?? '').trim();
  if (!a) return null;
  if (!a.includes('@')) return a;
  const onRecord = people.get(a.toLowerCase())?.name?.trim();
  if (onRecord) return onRecord;
  const parts = a.split('@')[0].split(/[._-]+/).filter((p) => p && !/\d/.test(p));
  return parts.length ? parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ') : a;
}

export interface DealBrief {
  accountName: string;
  /** R50: the deal this brief is about; null = every confirmed word at the account. */
  deal?: { id: string; name: string | null } | null;
  sections: Record<TruthSection, BriefEntry[]>;
  stakeholders: Array<{ who: string; title: string | null; email: string }>;
  dealContacts: number;
  commitments: Array<{ what: string; who: string; at: string; confirmedBy: string | null; next: string | null }>;
  contradictions: string[];
  unknowns: TruthSection[];
  known: number;
  objective: ({ owned: true; from: 'set' | 'meeting' } & ObjectiveRow) | { text: string; owned: false };
}

const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : '');
const day = (d: Date | string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
const PROBLEM_YES: ReadonlySet<string> = new Set(['problem_confirmed', 'problem_partially_confirmed']);

export function buildDealBrief(input: {
  accountName: string;
  bids: BriefBidRow[];
  dispositions: BriefDispositionRow[];
  evidenceConflicts: Array<{ site: string }>;
  people: Array<{ email: string | null; name: string | null; title: string | null }>;
  dealContacts: number;
  objective: ObjectiveRow | null;
  meetingObjective: ObjectiveRow | null;
  /**
   * R50: a brief for ONE deal: only that deal's words and the account-level ones (tagged), never another deal's.
   * `scopeOf` is the shared scope rule (deals/scope.ts) over the account's open deals.
   */
  deal?: { id: string; name: string | null } | null;
  scopeOf?: (b: BriefBidRow) => ScopeRead;
}): DealBrief {
  const byEmail = new Map(input.people.filter((p) => p.email).map((p) => [String(p.email).toLowerCase(), p]));
  const whoOf = (email: string) => byEmail.get(email.toLowerCase())?.name?.trim() || email;

  // Truth: human-confirmed and not corrected (an unconfirmed correction still removes the old row).
  const all = selectConfirmedBids(input.bids.map((b) => ({ ...b, humanConfirmed: b.human_confirmed === true, supersedesId: b.supersedes_id })));
  // R50: one deal's brief holds that deal's words and the account-level ones (tagged); another deal's never appear.
  const scopeOf = input.deal && input.scopeOf ? input.scopeOf : null;
  const scopeTag = new Map<string, string | null>();
  const truth = scopeOf
    ? all.filter((b) => {
        const s = scopeOf(b);
        if (s.dealId === input.deal!.id) scopeTag.set(b.id, null);
        else if (s.basis === 'none') scopeTag.set(b.id, ACCOUNT_LEVEL);
        else return false;
        return true;
      })
    : all;
  const sections = Object.fromEntries(TRUTH_SECTIONS.map((s) => [s, [] as BriefEntry[]])) as Record<TruthSection, BriefEntry[]>;
  const speakers: string[] = [];
  for (const b of truth) {
    const email = String(b.contact_email ?? '').toLowerCase();
    if (email && !speakers.includes(email)) speakers.push(email);
    const section = SECTION_OF_BID[b.type];
    if (!section) continue;
    const noted = wordingOf(b.metadata, b.raw_buyer_language) === 'noted';
    sections[section].push({ bidId: b.id, quote: b.raw_buyer_language, summary: b.normalized_summary ?? null, who: whoOf(email), source: b.source, confirmedBy: actorName(b.confirmed_by, byEmail), at: iso(b.confirmed_at ?? b.captured_at), ...(scopeOf ? { scope: scopeTag.get(b.id) ?? null } : {}), ...(noted ? { noted: true } : {}) });
  }

  const confirmed = input.dispositions.filter((d) => d.human_confirmed === true);
  const commitments = confirmed
    .filter((d) => d.response_class === 'meeting_accepted')
    .map((d) => ({ what: 'Agreed to a meeting', who: whoOf(d.contact_email), at: iso(d.confirmed_at ?? d.created_at), confirmedBy: actorName(d.confirmed_by, byEmail), next: d.next_best_action?.trim() || null }));

  const contradictions: string[] = [];
  // Review F: only the SAME thesis confirmed and rejected is a contradiction (two different problems are not).
  for (const yes of confirmed.filter((d) => PROBLEM_YES.has(d.response_class))) {
    const no = confirmed.find((d) => d.response_class === 'problem_rejected' && (d.hypothesis_id ?? null) === (yes.hypothesis_id ?? null));
    if (!no) continue;
    const line = `${whoOf(yes.contact_email)} confirmed the problem (${day(yes.confirmed_at ?? yes.created_at)}); ${whoOf(no.contact_email)} rejected it (${day(no.confirmed_at ?? no.created_at)}).`;
    if (!contradictions.includes(line)) contradictions.push(line);
  }
  for (const b of truth) if (b.type === 'objection') contradictions.push(`Objection from ${whoOf(b.contact_email)}: "${b.raw_buyer_language}"`);
  for (const c of input.evidenceConflicts) contradictions.push(`Public facts disagree about ${c.site}.`);

  const unknowns = TRUTH_SECTIONS.filter((s) => sections[s].length === 0);
  const firstUnknown = SUGGESTION_ORDER.find((s) => unknowns.includes(s));
  // Review F: the NEWEST of Casey's objective and his latest meeting objective wins.
  const setWins = !!input.objective && (!input.meetingObjective || input.objective.at >= input.meetingObjective.at);
  const objective: DealBrief['objective'] = input.objective && setWins
    ? { ...input.objective, owned: true, from: 'set' }
    : input.meetingObjective
      ? { ...input.meetingObjective, owned: true, from: 'meeting' }
      : { text: firstUnknown ? SUGGESTION[firstUnknown] : ALL_KNOWN_SUGGESTION, owned: false };

  return {
    accountName: input.accountName,
    deal: input.deal ?? null,
    sections,
    stakeholders: speakers.map((email) => ({ who: whoOf(email), title: byEmail.get(email)?.title ?? null, email })),
    dealContacts: input.dealContacts,
    commitments,
    contradictions,
    unknowns,
    known: TRUTH_SECTIONS.length - unknowns.length,
    objective,
  };
}

/** Truth sections filled per account, from confirmed BIDs (In Deals completeness). */
export function knownSectionsOf(bids: BriefBidRow[]): number {
  const truth = selectConfirmedBids(bids.map((b) => ({ ...b, humanConfirmed: b.human_confirmed === true, supersedesId: b.supersedes_id })));
  return new Set(truth.map((b) => SECTION_OF_BID[b.type]).filter(Boolean)).size;
}

export const BRIEF_BID_SELECT = {
  id: true,
  type: true,
  raw_buyer_language: true,
  normalized_summary: true,
  contact_email: true,
  source: true,
  human_confirmed: true,
  confirmed_by: true,
  confirmed_at: true,
  supersedes_id: true,
  captured_at: true,
  metadata: true,
} as const;

/** Read-only. `conflicts` defaults to the evidence inbox's contradictions for this account. */
export async function loadDealBrief(
  prisma: PrismaLike,
  accountName: string,
  deps: { now: Date; dealContacts?: number; conflicts?: (accountName: string) => Promise<Array<{ site: string }>>; deal?: { id: string; name: string | null } | null; scopeOf?: (b: BriefBidRow) => ScopeRead },
): Promise<DealBrief> {
  const conflicts =
    deps.conflicts ??
    (async (name: string) =>
      (await loadEvidenceInbox(prisma, deps.now, { accounts: [name] }).catch(() => [])).flatMap((a) => (a.accountName === name ? a.contradictions.map((c) => ({ site: c.site })) : [])));
  const [bids, dispositions, people, objectiveRows, meetingRows, evidenceConflicts] = await Promise.all([
    prisma.buyerInputData.findMany({ where: { account_name: accountName }, select: BRIEF_BID_SELECT, orderBy: [{ captured_at: 'asc' }, { id: 'asc' }] }),
    prisma.conversationDisposition.findMany({
      where: { account_name: accountName, human_confirmed: true },
      select: { id: true, hypothesis_id: true, response_class: true, contact_email: true, buyer_language: true, next_best_action: true, human_confirmed: true, confirmed_by: true, confirmed_at: true, created_at: true },
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    }),
    prisma.persona.findMany({ where: { account_name: accountName }, select: { email: true, name: true, title: true } }),
    prisma.gapAuditEvent.findMany({ where: { kind: DEAL_OBJECTIVE, subject_type: 'account', subject_id: accountName }, select: { actor: true, payload: true, created_at: true }, orderBy: { created_at: 'desc' }, take: 1 }),
    prisma.gapAuditEvent.findMany({ where: { kind: CAPTURE_MEETING, payload: { path: ['accountName'], equals: accountName } }, select: { actor: true, payload: true, created_at: true }, orderBy: { created_at: 'desc' }, take: 20 }),
    conflicts(accountName).catch(() => []),
  ]);
  const toObjective = (r: { actor: string; payload: Record<string, unknown>; created_at: Date } | undefined, key: string): ObjectiveRow | null => {
    const text = typeof r?.payload?.[key] === 'string' ? String(r.payload[key]).trim() : '';
    return r && text ? { text, by: r.actor, at: iso(r.created_at) } : null;
  };
  const meeting = (meetingRows as Array<{ actor: string; payload: Record<string, unknown>; created_at: Date }>).find((r) => typeof r.payload?.nextLearningObjective === 'string' && String(r.payload.nextLearningObjective).trim());
  return buildDealBrief({
    accountName,
    bids,
    dispositions,
    evidenceConflicts,
    people,
    dealContacts: deps.dealContacts ?? 0,
    objective: toObjective(objectiveRows[0], 'text'),
    meetingObjective: toObjective(meeting, 'nextLearningObjective'),
    deal: deps.deal ?? null,
    scopeOf: deps.scopeOf,
  });
}

export type ObjectiveRefusal = 'empty' | 'too_long' | 'account_not_found';

/** Record Casey's next learning objective for an account in a deal (append-only; the newest wins). */
export async function setLearningObjective(
  prisma: PrismaLike,
  input: { accountName: string; text: string; actor: string },
): Promise<{ ok: true; objective: ObjectiveRow } | { ok: false; reason: ObjectiveRefusal }> {
  const text = input.text.replace(/\s+/g, ' ').trim();
  if (!text) return { ok: false, reason: 'empty' };
  if (text.length > OBJECTIVE_MAX) return { ok: false, reason: 'too_long' };
  const account = await prisma.account.findUnique({ where: { name: input.accountName }, select: { name: true } });
  if (!account) return { ok: false, reason: 'account_not_found' };
  const row = await prisma.gapAuditEvent.create({
    data: { kind: DEAL_OBJECTIVE, actor: input.actor, subject_type: 'account', subject_id: input.accountName, payload: { text } },
    select: { created_at: true },
  });
  return { ok: true, objective: { text, by: input.actor, at: iso(row?.created_at ?? new Date()) } };
}
