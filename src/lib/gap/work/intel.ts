/**
 * THE INTELLIGENCE READER (I01, GAP OS prospecting first, 2026-10-08; Casey's course correction). Server only.
 *
 * The day's intelligence selection from what GAP already holds, for Casey to decide on. Nothing here is gated by age,
 * by research, by a missing contact or by a missing account: an item's usefulness is Casey's call. What is shown
 * truthfully: the source, when it was published and when GAP observed it, what the ledger proves about it (a
 * historical observation, a verified fact, an unverified present-day status, contradicted), the account when known.
 * Three kinds of item:
 *
 *   signal    a captured story at a known account (discovery, a Casey share), undecided (feedback null), one per
 *             event, any age; Casey's shares first, then outreach candidates, leadership and risk by score, then
 *             research leads and account context that carry a theme
 *   trigger   a live Pounce trigger, matched to a GAP account or not (an industry or other-company development is
 *             intelligence before it is an account)
 *   person    someone who wrote to the mailbox and went quiet (previously contacted, a response, no live
 *             opportunity): a prospect worth reengaging, with the account the thread or the persona names
 *
 * The only things left out: an item Casey already decided (feedback set; a skip comes back after SKIP_DAYS), a
 * rejected signal, a dismissed trigger, automated and own-domain senders, and a person at an account in an open
 * deal (worked from the deal). Execution safety is downstream and unchanged.
 */
import { AUTO_REPLY_SUBJECT, FREEMAIL_DOMAINS, OWN_DOMAINS } from '../replies/domains';
import { coverageFromNames, dealsAt, dealWords, type DealCoverage } from './deal-coverage';
import { EMPTY_FAMILY, resolvePersonAccount, sameFamily, tieBreakFamily, type FamilyFacts, type PersonAccount, type PersonVia } from './person-identity';
import { sameIdea } from '../context/same-idea';
import { classifyPurpose, reengageEligible, type ReengageVerdict } from '../context/purpose';
import { classifyMailType } from '../context/thread-context';
import type { Purpose } from '../context/commercial-context';
import { peopleState, type PersonState, type StateEvent } from './people-state';
import { loadOverrides, overrideFor, relationshipOverride, type ClassificationOverride } from '../context/classification-overrides';
import type { IdentityContext } from '../identity/resolve';
import { loadIdentityContext } from '../identity/service';
import { signalStatus } from '../signals/intake';
import { TRUTH_TEXT, type TruthLabel } from './truth-text';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const SKIP_DAYS = 30;
/** The line between a recent report and a historical observation: a LABEL, never a gate. */
export const HISTORICAL_DAYS = 45;
export const QUIET_DAYS = 14;
export const INTEL_LIMIT = 12;
export const REENGAGE_LIMIT = 8;
/** I02: the decision row for a trigger or a person (signals keep theirs on the signal). */
export const PROSPECT_DECISION = 'prospect.decision' as const;
export const DECISIONS = ['pursue', 'explore', 'save', 'skip', 'dismiss', 'more'] as const;
export type Decision = (typeof DECISIONS)[number];

// The truth label words live in the client-safe `./truth-text` (the panel imports them there; this module is server-only).
export { TRUTH_TEXT, type TruthLabel } from './truth-text';

export interface IntelItem {
  kind: 'signal' | 'trigger' | 'person';
  id: string;
  /** `<kind>:<id>`: the decision key the routes and the links carry. */
  key: string;
  title: string;
  /** The source domain or name, when known. */
  source: string | null;
  url: string | null;
  publishedAt: string | null;
  observedAt: string;
  truth: TruthLabel;
  /** One seller line: what it is, when, and why it may matter. */
  line: string;
  accountName: string | null;
  /** A trigger's company when it is not a GAP account, a person's domain: shown as "no account yet". */
  accountHint: string | null;
  relevance: string | null;
  categories: string[];
  /** A person's name and title when GAP holds them; C02/C05: how the account was placed, and the open deals there. */
  person: { email: string; name: string | null; title: string | null; lastWroteAt: string; messages: number; via?: string | null; ambiguous?: boolean; deals?: Array<{ id: string | null; name: string | null; stage: string; nextStep: string | null }> } | null;
  /** C04: the opportunity standing, explicit: open (a complete CRM read found a deal), none (a complete read found none), unknown (no complete read). */
  opportunity?: 'open' | 'none' | 'unknown';
  /** C10: the two-sided state, when the seller's Sent was read for this person (quiet basis, the next meeting). */
  state?: { quietDays: number | null; quietBasis: string; nextMeetingAt: string | null; lastOutboundAt: string | null; /** C57 F3: when their newest answerable message has no send of ours after it. */ answerOwedSince?: string | null };
  /** C09/C11: the re-engage verdict's review note, when the purposes asked for one. */
  review?: string;
  /** C29: the publication value is a date (no time of day), shown as that calendar day. */
  publishedDateOnly?: boolean;
  /** C30: other reports of the same event at the same account, each with its source (the citations are kept; one slot is used). */
  alsoReported?: Array<{ id: string; source: string | null; url: string | null; publishedAt: string | null }>;
  /** C30: every signal id in the cluster (the head first); a decision on the head covers them. */
  clusterIds?: string[];
  /** I05: the person's account is in an open deal: shown and labelled (work it from the deal), never dropped. */
  inDeal?: boolean;
  /** C5 (2026-10-09): the accounts that claim this person's domain or name when no deal settles it; the line says it instead of "no account yet". */
  ambiguousAmong?: string[];
  ambiguityLine?: string;
  decisions: readonly Decision[];
  /** How it ranked, for the test and the page. */
  rank: number;
}

const NOISE_SENDER = /(^|[._-])(no-?reply|noreply|donotreply|rewards|reserv|notification|newsletter|mailer|billing|account|support|info|news|marketing|hello|team)@/i;
/** C29: a value stored at exactly midnight UTC is a DATE, not an instant (an EDGAR filing date): it is that calendar day everywhere. */
export const isDateOnly = (d: Date | string): boolean => {
  const t = new Date(d);
  return t.getUTCHours() === 0 && t.getUTCMinutes() === 0 && t.getUTCSeconds() === 0 && t.getUTCMilliseconds() === 0;
};
const dayText = (d: Date | string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: isDateOnly(d) ? 'UTC' : 'America/New_York' });
const domainOf = (email: string) => (email.split('@')[1] ?? '').toLowerCase();

/** The truth label the ledger supports for a signal: the research state says what GAP proved, the dates say when. */
export function truthOfSignal(s: { research_status?: string | null; published_at?: Date | string | null; created_at: Date | string }, now: Date): TruthLabel {
  if (s.research_status === 'contradiction') return 'contradicted';
  if (s.research_status === 'fact_found') return 'verified_fact';
  const at = new Date(s.published_at ?? s.created_at).getTime();
  return now.getTime() - at > HISTORICAL_DAYS * 86_400_000 ? 'historical_observation' : 'unverified_status';
}

const RELEVANCE_RANK: Record<string, number> = { outreach_evidence_candidate: 1, leadership: 2, risk: 2, deal_context: 3, research_lead: 4, account_context: 5 };

type SignalRow = { id: string; url: string | null; title: string | null; source_name: string | null; source_class: string | null; published_at: Date | string | null; created_at: Date | string; origin: string; account_name: string | null; account_hint: string | null; resolution: string; research_status: string; relevance: string | null; categories: unknown; score: number | null; event_id: string | null; feedback: string | null; feedback_at: Date | string | null; note: string | null };
type TriggerRow = { id: number; account_name: string; title: string; url: string; source: string; score: number | null; categories: unknown; published_at: Date | string | null; first_seen_at: Date | string; dismissed: boolean };
type DecisionRow = { subject_id: string; payload: unknown; created_at: Date | string };

const cats = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** Pure: the signals' selection and order. */
/** C30: reports of one event arrive within days of each other; the same words months apart are a new event. */
export const CLUSTER_DAYS = 14;

export function rankSignals(rows: readonly SignalRow[], now: Date): IntelItem[] {
  const skippedUntil = now.getTime() - SKIP_DAYS * 86_400_000;
  const decided = (r: SignalRow) => !!r.feedback && !(r.feedback === 'skip' && r.feedback_at && new Date(r.feedback_at).getTime() < skippedUntil);
  const byEvent = new Map<string, SignalRow>();
  const decidedEvents = new Set<string>();
  for (const r of rows) {
    if (r.resolution === 'rejected') continue;
    const k = r.event_id ?? r.id;
    if (decided(r)) { decidedEvents.add(k); continue; }
    const cur = byEvent.get(k);
    if (!cur || (r.origin === 'casey_share' && cur.origin !== 'casey_share')) byEvent.set(k, r);
  }
  for (const k of decidedEvents) byEvent.delete(k);
  // C30: related reports of one event at one account (the same idea in the title, published within CLUSTER_DAYS of each
  // other) are one item with every source kept; distinct launches or expansions stay separate (sameIdea is strict), and a
  // recurring title months apart (a 10-Q each quarter) is a new event. A decision on any member covers the cluster.
  const at = (r: SignalRow) => new Date(r.published_at ?? r.created_at).getTime();
  const near = (a: SignalRow, b: SignalRow) => Math.abs(at(a) - at(b)) <= CLUSTER_DAYS * 86_400_000;
  const heads: SignalRow[] = [];
  const members = new Map<string, SignalRow[]>();
  const decidedTitles = rows.filter((r) => r.resolution !== 'rejected' && decided(r));
  outer: for (const r of [...byEvent.values()]) {
    const acct = (r.account_name ?? r.account_hint ?? '').trim();
    const title = r.title ?? '';
    if (acct && title) {
      for (const h of heads) {
        if ((h.account_name ?? h.account_hint ?? '').trim().toLowerCase() === acct.toLowerCase() && h.title && near(h, r) && sameIdea(h.title, title, acct)) { members.get(h.id)!.push(r); continue outer; }
      }
      if (decidedTitles.some((d) => (d.account_name ?? d.account_hint ?? '').trim().toLowerCase() === acct.toLowerCase() && d.title && near(d, r) && sameIdea(d.title, title, acct))) continue;
    }
    heads.push(r);
    members.set(r.id, []);
  }
  const items = heads.map((r): IntelItem & { sort: number[] } => {
    const also = members.get(r.id) ?? [];
    const shared = r.origin === 'casey_share' || r.origin === 'conference_note';
    const truth = truthOfSignal(r, now);
    const categories = cats(r.categories);
    const st = signalStatus({ url: r.url, resolution: r.resolution, research_status: r.research_status, feedback: null, origin: r.origin, relevance: r.relevance ?? undefined });
    const when = r.published_at ? `published ${dayText(r.published_at)}` : `observed ${dayText(r.created_at)}`;
    const hostOf = (u: string | null) => (u ? (() => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; } })() : null);
    const line = `${shared ? 'You shared it. ' : ''}${r.source_name ?? r.source_class ?? 'a source'}, ${when}. ${TRUTH_TEXT[truth]}.${categories.length ? ` Themes: ${categories.map((c) => c.replace(/_/g, ' ')).join(', ')}.` : ''}${st.status === 'Fact ready' ? ' A verified fact is in Research.' : ''}${also.length ? ` Also reported by ${also.map((a) => a.source_name ?? hostOf(a.url) ?? 'another source').join(', ')}.` : ''}`;
    return {
      kind: 'signal', id: r.id, key: `signal:${r.id}`, title: r.title ?? r.url ?? 'A note', source: r.source_name ?? hostOf(r.url), url: r.url, publishedAt: r.published_at ? new Date(r.published_at).toISOString() : null, observedAt: new Date(r.created_at).toISOString(), truth, line,
      ...(r.published_at && isDateOnly(r.published_at) ? { publishedDateOnly: true } : {}),
      ...(also.length ? { alsoReported: also.map((a) => ({ id: a.id, source: a.source_name ?? hostOf(a.url), url: a.url, publishedAt: a.published_at ? new Date(a.published_at).toISOString() : null })), clusterIds: [r.id, ...also.map((a) => a.id)] } : {}),
      accountName: r.account_name, accountHint: r.account_name ? null : r.account_hint, relevance: r.relevance, categories, person: null, decisions: DECISIONS, rank: 0,
      sort: [shared ? 0 : 1, RELEVANCE_RANK[r.relevance ?? ''] ?? 6, categories.length ? 0 : 1, -(r.score ?? 0), -new Date(r.published_at ?? r.created_at).getTime()],
    };
  });
  items.sort((a, b) => { for (let i = 0; i < a.sort.length; i += 1) { if (a.sort[i] !== b.sort[i]) return a.sort[i] - b.sort[i]; } return 0; });
  return items.map((x, i) => { const { sort: _s, ...rest } = x; void _s; return { ...rest, rank: i }; });
}

/** Pure: live triggers, newest first; a company that is not a GAP account is "no account yet". */
export function rankTriggers(rows: readonly TriggerRow[], accountNames: ReadonlySet<string>, decided: ReadonlySet<string>, now: Date): IntelItem[] {
  return rows
    .filter((t) => !t.dismissed && !decided.has(`trigger:${t.id}`))
    .sort((a, b) => new Date(b.published_at ?? b.first_seen_at).getTime() - new Date(a.published_at ?? a.first_seen_at).getTime())
    .map((t, i) => {
      const known = [...accountNames].find((n) => n.toLowerCase() === t.account_name.toLowerCase()) ?? null;
      const truth: TruthLabel = now.getTime() - new Date(t.published_at ?? t.first_seen_at).getTime() > HISTORICAL_DAYS * 86_400_000 ? 'historical_observation' : 'unverified_status';
      const categories = cats(t.categories);
      return {
        kind: 'trigger', id: String(t.id), key: `trigger:${t.id}`, title: t.title, source: t.source, url: t.url, publishedAt: t.published_at ? new Date(t.published_at).toISOString() : null, observedAt: new Date(t.first_seen_at).toISOString(), truth,
        line: `${t.source}, ${t.published_at ? `published ${dayText(t.published_at)}` : `seen ${dayText(t.first_seen_at)}`}. ${TRUTH_TEXT[truth]}.${known ? '' : ` ${t.account_name} is not a GAP account yet.`}${categories.length ? ` Themes: ${categories.map((c) => c.replace(/_/g, ' ')).join(', ')}.` : ''}`,
        accountName: known, accountHint: known ? null : t.account_name, relevance: null, categories, person: null, decisions: DECISIONS, rank: i,
      };
    });
}

type WriterRow = { from_email: string; from_name: string | null; subject: string | null; received_at: Date | string; thread_account: string | null };
type PersonaRow = { id: number; email: string | null; name: string | null; title: string | null; account_name: string | null; do_not_contact?: boolean | null };

/** C5: "May 5" in the current year, "May 5, 2025" otherwise. */
const sinceText = (iso: string, now: Date) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(new Date(iso).getUTCFullYear() === now.getUTCFullYear() ? {} : { year: 'numeric' }), timeZone: 'America/New_York' });

/** C5: the placement after the family tie-break, or the ambiguity said with its names. Pure. */
export function placeAmongFamily(placed: PersonAccount, facts: FamilyFacts | null, coverage: DealCoverage, now: Date): { accountName: string | null; via: PersonVia; ambiguousAmong: string[] | null; ambiguityLine: string | null; familyLine: string | null; tie: ReturnType<typeof tieBreakFamily> } {
  if (!placed.ambiguous || !placed.candidates.length) return { accountName: placed.accountName, via: placed.via, ambiguousAmong: null, ambiguityLine: null, familyLine: null, tie: null };
  const f = facts ?? EMPTY_FAMILY;
  // The name the CRM read records a candidate's deal under (the summary folds a duplicate onto its deal-holding account), null when in no deal.
  const tie = tieBreakFamily(placed.candidates, f, (n) => { const l = dealsAt(coverage, n); return l.inDeal === true ? l.account.accountName : null; });
  if (tie) {
    const dup = tie.kind === 'duplicate' ? `${tie.others.join(' and ')} ${tie.others.length === 1 ? 'is' : 'are'} its open duplicate${tie.others.length === 1 ? '' : 's'}, unmerged` : `${tie.others.join(' and ')} ${tie.others.length === 1 ? 'is' : 'are'} in its family (parent brand), unmerged`;
    return { accountName: tie.accountName, via: 'family_deal', ambiguousAmong: null, ambiguityLine: null, familyLine: `placed at ${tie.accountName}, the family's deal-holding account; ${dup}`, tie };
  }
  const names = placed.candidates;
  const fam = names.length === 2 ? sameFamily(names[0], names[1], f) : null;
  const dupWords = fam?.kind === 'duplicate' ? ` (an open duplicate${fam.since ? ` since ${sinceText(fam.since, now)}` : ''})` : fam?.kind === 'parent_brand' ? ' (one family, parent brand)' : '';
  return { accountName: null, via: null, ambiguousAmong: [...names], ambiguityLine: `${placed.claimed ?? 'this person'} is claimed by ${names.join(' and ')}${dupWords}: choose the account`, familyLine: null, tie: null };
}

/** The reason a duplicate_company conflict carries ("Company collides with: A, B"), as names. */
const collidesWith = (reason: unknown): string[] => (typeof reason === 'string' ? (reason.match(/collides with:\s*(.+)$/i)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean) : []);

/**
 * C5: the accounts' parent brands and their open duplicate_company conflicts, bounded and soft (unread keeps the
 * ambiguity). C5 fix (the production shape): the accounts are matched by name without case; a conflict row that names
 * no account ("Canonical company matches multiple account records.", account_name null) is attributed through its
 * canonical company to every candidate whose canonical link points at that company (one bounded link read).
 */
export async function loadFamilyFacts(prisma: PrismaLike, names: readonly string[]): Promise<FamilyFacts> {
  const list = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (!list.length) return EMPTY_FAMILY;
  const same = (a: string | null | undefined, b: string) => !!a && a.trim().toLowerCase() === b.toLowerCase();
  const nameOf = (raw: string | null | undefined) => list.find((n) => same(raw, n)) ?? null;
  const accounts: Array<{ name: string; parent_brand: string | null }> = typeof prisma?.account?.findMany === 'function' ? await prisma.account.findMany({ where: { name: { in: list, mode: 'insensitive' } }, select: { name: true, parent_brand: true }, take: 50 }).catch(() => []) : [];
  const links: Array<{ account_name: string; canonical_company_id: string }> = typeof prisma?.canonicalAccountLink?.findMany === 'function' ? await prisma.canonicalAccountLink.findMany({ where: { account_name: { in: list, mode: 'insensitive' } }, select: { account_name: true, canonical_company_id: true }, take: 50 }).catch(() => []) : [];
  const companyIds = [...new Set(links.map((l) => l.canonical_company_id).filter(Boolean))];
  const where = { code: 'duplicate_company', status: 'open', OR: [{ account_name: { in: list, mode: 'insensitive' } }, ...(companyIds.length ? [{ canonical_company_id: { in: companyIds } }] : [])] };
  const conflicts: Array<{ account_name: string | null; canonical_company_id: string | null; reason: string | null; created_at: Date | string }> = typeof prisma?.canonicalConflict?.findMany === 'function' ? await prisma.canonicalConflict.findMany({ where, select: { account_name: true, canonical_company_id: true, reason: true, created_at: true }, take: 100 }).catch(() => []) : [];
  const parentBrand = new Map<string, string | null>();
  for (const a of accounts) parentBrand.set(nameOf(a.name) ?? a.name, a.parent_brand ?? null);
  const duplicates = new Map<string, { companyId: string | null; collidesWith: string[]; since: string | null }>();
  const note = (name: string, c: { canonical_company_id: string | null; reason: string | null; created_at: Date | string }) => {
    const since = new Date(c.created_at).toISOString();
    const cur = duplicates.get(name);
    duplicates.set(name, { companyId: cur?.companyId ?? c.canonical_company_id ?? null, collidesWith: [...new Set([...(cur?.collidesWith ?? []), ...collidesWith(c.reason)])], since: cur?.since && cur.since < since ? cur.since : since });
  };
  for (const c of conflicts) {
    const named = nameOf(c.account_name);
    if (named) note(named, c);
    else if (c.canonical_company_id) for (const l of links) if (l.canonical_company_id === c.canonical_company_id) { const n = nameOf(l.account_name); if (n) note(n, c); }
  }
  return { parentBrand, duplicates };
}

/** Pure: the people who wrote in and went quiet, one per address, newest last word first. */
export function rankPeople(rows: readonly WriterRow[], personas: readonly PersonaRow[], opts: { now: Date; decided: ReadonlySet<string>; /** C5: the family facts for the ambiguous candidates (null: not read; the ambiguity stands). */ family?: FamilyFacts | null; /** C01/C04: the deal coverage (the in-deals read with its status); `dealAccounts` is the older names-only form. */ coverage?: DealCoverage; dealAccounts?: ReadonlySet<string> | null; unsubscribed: ReadonlySet<string>; /** C02/C03: the identity context the opportunity resolver uses (aliases, verified domains); null places by persona and thread only. */ identity?: IdentityContext | null; /** C02: HubSpot company ids by sender address, when a contact read carried them. */ contactCompanies?: ReadonlyMap<string, readonly string[]>; /** C10: the two-sided state per address (built from the inbound rows and the seller's Sent); a person with one is judged by it, not by the inbound date alone. */ states?: ReadonlyMap<string, PersonState> | null; /** C09/C11: the re-engage verdict per address; an ineligible sender is out, a review note rides along. */ verdicts?: ReadonlyMap<string, ReengageVerdict> | null; /** Whether the seller's Sent was read for this list at all (false says so on every line; undefined says nothing, for the older callers). */ sentRead?: boolean; /** Addresses whose Sent read failed: judged by the inbound date, said so. */ sentFailed?: ReadonlySet<string> }): IntelItem[] {
  const coverage = opts.coverage ?? coverageFromNames(opts.dealAccounts ?? null);
  const byEmail = new Map<string, { last: Date; n: number; name: string | null; account: string | null; subject: string | null }>();
  for (const r of rows) {
    const email = r.from_email.trim().toLowerCase();
    const d = domainOf(email);
    if (!email.includes('@') || OWN_DOMAINS.has(d) || FREEMAIL_DOMAINS.has(d) || NOISE_SENDER.test(email) || AUTO_REPLY_SUBJECT.test(r.subject ?? '')) continue;
    const at = new Date(r.received_at);
    const cur = byEmail.get(email);
    if (!cur) byEmail.set(email, { last: at, n: 1, name: r.from_name, account: r.thread_account, subject: r.subject });
    else { cur.n += 1; if (at > cur.last) { cur.last = at; cur.name = r.from_name ?? cur.name; cur.subject = r.subject ?? cur.subject; } if (!cur.account && r.thread_account) cur.account = r.thread_account; }
  }
  const quiet = opts.now.getTime() - QUIET_DAYS * 86_400_000;
  const personaByEmail = new Map(personas.filter((p) => p.email).map((p) => [String(p.email).toLowerCase(), p]));
  const out: IntelItem[] = [];
  for (const [email, w] of byEmail) {
    const st = opts.states?.get(email) ?? null;
    // C57 F3 (C10 vs C35): an owed answer with no disposition on record would vanish from both lists; the person stays here, said as owed.
    const owed = !!st && st.answerOwed.owed;
    if (st) {
      // C10: a person we wrote to after their message, or who has a meeting ahead, is not quiet; an owed writer is listed as owed.
      if (!owed && !st.quiet.quiet) continue;
    } else if (w.last.getTime() > quiet) continue;
    if (opts.decided.has(`person:${email}`) || opts.unsubscribed.has(email)) continue;
    const verdict = opts.verdicts?.get(email) ?? null;
    if (verdict && !verdict.eligible) continue;
    const p = personaByEmail.get(email) ?? null;
    if (p?.do_not_contact) continue;
    // C02/C03: placed through the identity machinery (persona, the CRM contact's company, the thread, the domain); ambiguous stays unplaced.
    const placed = resolvePersonAccount({ email, persona: p, threadAccount: w.account, identity: opts.identity ?? null, hubspotCompanyIds: opts.contactCompanies?.get(email) ?? [] });
    // C5: a family's deal-holding account settles an ambiguous domain; otherwise the claim is said with its names.
    const among = placeAmongFamily(placed, opts.family ?? null, coverage, opts.now);
    const account = among.accountName;
    // I05 + C04: an open deal at the account is said, never a silent drop; a negative only under a complete CRM read.
    const lookup = dealsAt(coverage, account);
    const inDeal = lookup.inDeal === true;
    const words = dealWords(coverage, lookup);
    const name = p?.name ?? w.name ?? null;
    out.push({
      kind: 'person', id: email, key: `person:${email}`, title: `${name ?? email}${p?.title ? `, ${p.title}` : ''}${account ? ` at ${account}` : ` (${domainOf(email)})`}`, source: 'the mailbox', url: null, publishedAt: null, observedAt: w.last.toISOString(), truth: 'historical_observation',
      line: `Wrote to us ${dayText(w.last)} (${w.n} message${w.n === 1 ? '' : 's'})${w.subject ? `, last about "${w.subject.slice(0, 60)}"` : ''}; ${words}${p ? '' : '; not a GAP contact yet'}${among.ambiguityLine ? `; ${among.ambiguityLine}` : among.familyLine ? `; ${among.familyLine}` : ''}. Previously contacted, a response.${st ? (owed ? ` An answer is owed since ${dayText(st.answerOwed.since ?? w.last)}: ${st.answerOwed.basis}.` : ` ${st.quiet.basis.charAt(0).toUpperCase()}${st.quiet.basis.slice(1)}.`) : opts.sentFailed?.has(email) ? ' Our Sent could not be read for them, so a reply of ours may exist.' : opts.sentRead === false ? ' Our Sent was not read for this list, so a reply of ours may exist.' : opts.sentRead === true ? ' Our Sent was not read for them, so a reply of ours may exist.' : ''}${verdict?.review ? ` Review before outreach: ${verdict.reason}.` : ''}`,
      accountName: account, accountHint: account ? null : domainOf(email), relevance: null, categories: [],
      person: { email, name, title: p?.title ?? null, lastWroteAt: w.last.toISOString(), messages: w.n, via: among.via, ambiguous: !!among.ambiguousAmong, ...(lookup.inDeal === true ? { deals: lookup.account.deals.map((d) => ({ id: d.id, name: d.name, stage: d.stage, nextStep: d.nextStep })) } : {}) },
      ...(among.ambiguousAmong ? { ambiguousAmong: among.ambiguousAmong, ambiguityLine: among.ambiguityLine ?? undefined } : {}),
      opportunity: lookup.inDeal === true ? 'open' : lookup.inDeal === false ? 'none' : 'unknown',
      ...(st ? { state: { quietDays: st.quiet.days, quietBasis: st.quiet.basis, nextMeetingAt: st.nextMeetingAt, lastOutboundAt: st.lastOutboundAt, answerOwedSince: owed ? st.answerOwed.since : null } } : {}),
      ...(verdict?.review ? { review: verdict.reason } : {}),
      decisions: DECISIONS, rank: out.length, ...(inDeal ? { inDeal: true } : {}),
    });
  }
  return out.sort((a, b) => b.observedAt.localeCompare(a.observedAt)).map((x, i) => ({ ...x, rank: i }));
}

/** How a pursued person was placed at an account (the identity machinery's path, in four words; C5 adds the family's deal-holding account). */
export type PlacedVia = 'persona' | 'crm_contact' | 'alias' | 'domain' | 'family_deal';

/** I05: an item Casey pursued (or asked more about): the angle task's state and its result when ready. */
export interface PursuedItem {
  key: string;
  /** C24: the develop_angle task the angle came from; the promotion control posts it. */
  taskId: string;
  /** C57 P2-8: a person item's writer (the reply's recipient); null for a signal or a trigger. */
  writer: { email: string; name: string | null } | null;
  kind: 'signal' | 'trigger' | 'person';
  title: string;
  accountName: string | null;
  accountHint: string | null;
  /**
   * Seller acceptance (2026-10-09): a person is placed at READ time through the same identity path the people ranker
   * uses (persona, the CRM contact's company, the thread's account, the verified domain; freemail never places), so a
   * task whose input predates the identity fix (October 9: five Kenco pursues carried accountName null although
   * kencogroup.com is Kenco's verified domain) is no longer shown under "No account yet". `placementChanged` says the
   * placement differs from what the task carried; the line tells the seller the angle was developed before it.
   * loadPursued always sets the four; they are optional so an older literal (the briefing test's) still types.
   */
  placedVia?: PlacedVia | null;
  placementChanged?: boolean;
  placementLine?: string | null;
  /** "In an open deal: <deal>" from the day's deal coverage (C01), when the placed account is in one; else null. */
  dealLine?: string | null;
  /** C5: the accounts that claim the person's domain or name when no deal settles it, and the line that says it instead of "no account yet". */
  ambiguousAmong?: string[];
  ambiguityLine?: string | null;
  url: string | null;
  decision: string;
  decidedAt: string;
  status: 'in_progress' | 'ready' | 'failed';
  error: string | null;
  angle: { whyItMatters: string; starters: string[]; roles: string[]; accounts: string[]; peopleNamed: Array<{ personaId: number; name: string | null; title: string | null }>; proposedAction: string; caveat: string | null; sourceLine: string; warnings?: string[] } | null;
}

export interface Intelligence {
  signals: IntelItem[];
  triggers: IntelItem[];
  people: IntelItem[];
  /** I05: what Casey pursued, with the angle when it is ready (the review's finding 2: a pursued item never vanishes). */
  pursued: PursuedItem[];
  /** How many undecided items the selection was cut from, so the shortage or the depth is said truthfully. */
  totals: { signals: number; triggers: number; people: number };
  /** C34: how the selection was made (the pulls and windows in words), whether more exists beyond it, and the page shown. */
  selection: { signals: string; people: string; moreSignals: boolean; morePeople: boolean; skipSignals: number; skipPeople: number; peopleWindowDays: number; peopleIntakeTruncated: boolean };
}

/** The decided trigger and person keys (the newest decision per key; a skip expires after SKIP_DAYS). */
export const DECIDED_PAGE = 2000;

export async function loadDecided(prisma: PrismaLike, now: Date): Promise<Set<string>> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return new Set();
  // C34: every decision row is read, a page at a time; a capped read would let a skipped or dismissed item resurface.
  const rows: DecisionRow[] = [];
  for (let skip = 0; skip < DECIDED_PAGE * 50; skip += DECIDED_PAGE) {
    const page: DecisionRow[] = await prisma.gapAuditEvent.findMany({ where: { kind: PROSPECT_DECISION }, orderBy: { created_at: 'desc' }, take: DECIDED_PAGE, skip, select: { subject_id: true, payload: true, created_at: true } }).catch(() => []);
    rows.push(...page);
    if (page.length < DECIDED_PAGE) break;
  }
  const newest = new Map<string, DecisionRow>();
  for (const r of rows) if (!newest.has(r.subject_id)) newest.set(r.subject_id, r);
  const out = new Set<string>();
  for (const [key, r] of newest) {
    const d = (r.payload && typeof r.payload === 'object' ? (r.payload as { decision?: string }).decision : undefined) ?? '';
    if (d === 'skip' && now.getTime() - new Date(r.created_at).getTime() > SKIP_DAYS * 86_400_000) continue;
    if (d === 'explore' || d === 'more') continue;
    out.add(key);
  }
  return out;
}

/** The identity path in the four words the pursued item carries; null when nothing placed the person. */
export const placedViaOf = (v: PersonVia | string | null | undefined): PlacedVia | null =>
  v === 'persona' ? 'persona' : v === 'hubspot_contact' || v === 'hubspot_company_id' ? 'crm_contact' : v === 'alias' || v === 'normalized' ? 'alias' : v === 'domain' ? 'domain' : v === 'family_deal' ? 'family_deal' : null;

const PLACED_BY: Record<PlacedVia, string> = { persona: 'by the GAP contact record', crm_contact: "by the CRM contact's company", alias: "by the thread's account name", domain: 'by its verified domain', family_deal: "as the family's deal-holding account" };

export interface PursuedOpts {
  /** C02/C03: the identity context (read from the database when absent and the client has the tables). */
  identity?: IdentityContext | null;
  /** C01: the deal coverage; absent is "not read" and no deal line is said. */
  coverage?: DealCoverage;
  /** The persona by lowercased address and the thread's account by address, when the caller already read them (loadIntelligence does); a missing address is read here, one bounded row each. */
  personas?: ReadonlyMap<string, PersonaRow>;
  threadAccounts?: ReadonlyMap<string, string | null>;
  /** C5: the family facts the caller already read for the ambiguous candidates; the ones it lacks are read here, one bounded query each. */
  family?: FamilyFacts | null;
}

/**
 * I05: the pursued items from the angle tasks (any state, the task window), newest decision first, one per key.
 * Seller acceptance (2026-10-09): a person whose task carries no account is placed here through resolvePersonAccount
 * (the same path the people ranker takes; no new sources: the persona and the thread the loader already holds, read
 * one row each when it does not), the deal coverage says whether the placed account is in an open deal, and nothing
 * is queued: the line asks the seller to Pursue again so the angle is developed with the placement.
 */
export async function loadPursued(prisma: PrismaLike, now: Date, opts: PursuedOpts = {}): Promise<PursuedItem[]> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return [];
  const { listAgentTasks } = await import('../agents/tasks');
  const tasks = await listAgentTasks(prisma, { now }).catch(() => []);
  const coverage = opts.coverage ?? coverageFromNames(null);
  const identity: IdentityContext | null = opts.identity !== undefined ? opts.identity : typeof prisma?.canonicalCompany?.findMany === 'function' && typeof prisma?.gapAccountAlias?.findMany === 'function' ? await loadIdentityContext(prisma).catch(() => null) : null;
  const personaFor = async (email: string): Promise<PersonaRow | null> => {
    if (opts.personas?.has(email)) return opts.personas.get(email) ?? null;
    if (typeof prisma?.persona?.findFirst !== 'function') return null;
    return prisma.persona.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true, email: true, name: true, title: true, account_name: true, do_not_contact: true } }).catch(() => null);
  };
  const threadAccountFor = async (email: string): Promise<string | null> => {
    if (opts.threadAccounts?.has(email)) return opts.threadAccounts.get(email) ?? null;
    if (typeof prisma?.inboundMessage?.findFirst !== 'function') return null;
    const last = await prisma.inboundMessage.findFirst({ where: { from_email: { equals: email, mode: 'insensitive' } }, orderBy: { received_at: 'desc' }, include: { thread: { select: { account_name: true } } } }).catch(() => null);
    return last?.thread?.account_name ?? null;
  };
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  // Pass 1: the newest task per key and, for a person the task left unplaced, the identity path's answer.
  const heads: Array<{ t: (typeof tasks)[number]; input: Record<string, unknown>; kind: PursuedItem['kind']; email: string | null; placed: PersonAccount | null }> = [];
  const seen = new Set<string>();
  for (const t of tasks.filter((x) => x.kind === 'develop_angle').sort((a, b) => b.queuedAt.localeCompare(a.queuedAt))) {
    if (seen.has(t.itemKey) || t.status === 'superseded') continue;
    seen.add(t.itemKey);
    const input = (t.input ?? {}) as Record<string, unknown>;
    const kind = (t.itemKey.split(':')[0] as PursuedItem['kind']) ?? 'signal';
    const email = kind === 'person' ? (str(input.email) ?? t.itemKey.slice('person:'.length)).toLowerCase() : null;
    const placed = !str(input.accountName) && email ? resolvePersonAccount({ email, persona: await personaFor(email), threadAccount: await threadAccountFor(email), identity, hubspotCompanyIds: [] }) : null;
    heads.push({ t, input, kind, email, placed });
  }
  // C5: the family facts for every ambiguous candidate not already supplied (one bounded query each; soft).
  const wanted = [...new Set(heads.flatMap((h) => h.placed?.candidates ?? []))].filter((n) => !opts.family || (!opts.family.parentBrand.has(n) && !opts.family.duplicates.has(n)));
  const extra = wanted.length ? await loadFamilyFacts(prisma, wanted) : EMPTY_FAMILY;
  const family: FamilyFacts = { parentBrand: new Map([...(opts.family?.parentBrand ?? []), ...extra.parentBrand]), duplicates: new Map([...(opts.family?.duplicates ?? []), ...extra.duplicates]) };
  const out = new Map<string, PursuedItem>();
  for (const { t, input, kind, email, placed } of heads) {
    const r = (t.status === 'succeeded' && t.result && typeof t.result.whyItMatters === 'string' ? t.result : null) as Record<string, unknown> | null;
    // The placement: what the task carried when it carried one; else the identity path at read time (a person only), the family tie-break over an ambiguous domain, else the ambiguity said.
    let accountName = str(input.accountName);
    let accountHint = str(input.accountHint);
    let placedVia: PlacedVia | null = accountName ? placedViaOf(str(input.resolvedVia)) : null;
    let placementChanged = false;
    let familyLine: string | null = null;
    let ambiguousAmong: string[] | undefined;
    let ambiguityLine: string | null = null;
    if (placed) {
      const among = placeAmongFamily(placed, family, coverage, now);
      if (among.accountName) {
        accountName = among.accountName;
        accountHint = null;
        placedVia = placedViaOf(among.via);
        placementChanged = true;
        familyLine = among.familyLine;
      } else if (among.ambiguousAmong) {
        ambiguousAmong = among.ambiguousAmong;
        ambiguityLine = among.ambiguityLine;
      }
    }
    const lookup = dealsAt(coverage, accountName);
    const dealLine = lookup.inDeal === true ? `In an open deal: ${lookup.account.deals.map((d) => d.name).filter((n): n is string => !!n).join(', ') || lookup.account.accountName}` : null;
    const placementLine = placementChanged && accountName ? `${familyLine ? `${familyLine.charAt(0).toUpperCase()}${familyLine.slice(1)}` : `Placed at ${accountName} ${PLACED_BY[placedVia ?? 'domain']} after the identity fix`}; the angle was developed before placement, so Pursue again to develop it ${lookup.inDeal === true ? 'as deal work' : 'at the account'}` : null;
    out.set(t.itemKey, {
      key: t.itemKey, taskId: t.id, kind, writer: email ? { email, name: str(input.name) } : null, title: str(input.title) ?? (kind === 'person' ? `${str(input.name) ?? str(input.email) ?? 'A person'} wrote to us` : 'An item'), accountName, accountHint, url: str(input.url),
      placedVia, placementChanged, placementLine, dealLine, ...(ambiguousAmong ? { ambiguousAmong, ambiguityLine } : {}),
      decision: str(input.decision) ?? t.request, decidedAt: t.queuedAt,
      status: r ? 'ready' : t.status === 'failed' ? 'failed' : 'in_progress', error: t.status === 'failed' ? t.lastError : null,
      angle: r ? { whyItMatters: String(r.whyItMatters), starters: strs(r.starters), roles: strs(r.roles), accounts: strs(r.accounts), peopleNamed: Array.isArray(r.peopleNamed) ? (r.peopleNamed as Array<{ personaId: number; name: string | null; title: string | null }>) : [], proposedAction: String(r.proposedAction ?? 'research'), caveat: str(r.caveat), sourceLine: String(r.sourceLine ?? ''), warnings: strs(r.warnings) } : null,
    });
  }
  return [...out.values()];
}

/**
 * The day's intelligence. Soft: an unreadable table reads as empty, said by the totals. The signals come from three
 * bounded pulls through one ranker (the review's finding 5: a newest-first window would be a recency gate): Casey's
 * shares of any age, the strongest classes by score, then the rest newest; the totals are counts of the undecided
 * universe, not of the window. `dealAccounts` null means the deal state was not read: the person lines say so.
 */
export const PEOPLE_WINDOW_DAYS = 180;
export const PEOPLE_INTAKE_MAX = 2000;

export async function loadIntelligence(prisma: PrismaLike, opts: { now: Date; limit?: number; peopleLimit?: number; /** C01: the deal coverage from the in-deals read (its status rides along); `dealAccounts` is the older names-only form. */ coverage?: DealCoverage; dealAccounts?: ReadonlySet<string> | null; /** C02/C03: the identity context; read from the database when absent and the client has the tables. */ identity?: IdentityContext | null; /** C34: the next page of the ranked selection (the Work panel's More), and a wider people window when asked. */ skipSignals?: number; skipPeople?: number; peopleWindowDays?: number; /** C10: the seller's Sent to one recipient (the briefing's Gmail reader); read for the people that would be listed, so quiet and answer owed count both sides. Absent: the inbound date alone, said so. */ listSent?: (recipient: string, afterEpoch: number, beforeEpoch: number) => Promise<Array<{ id: string; threadId: string | null; internalDate: Date; to: string; subject: string }>> }): Promise<Intelligence> {
  const skipSignals = Math.max(0, opts.skipSignals ?? 0);
  const skipPeople = Math.max(0, opts.skipPeople ?? 0);
  const peopleWindowDays = Math.max(1, opts.peopleWindowDays ?? PEOPLE_WINDOW_DAYS);
  const coverage = opts.coverage ?? coverageFromNames(opts.dealAccounts ?? null);
  const identity: IdentityContext | null = opts.identity !== undefined ? opts.identity : typeof prisma?.canonicalCompany?.findMany === 'function' && typeof prisma?.gapAccountAlias?.findMany === 'function' ? await loadIdentityContext(prisma).catch(() => null) : null;
  const limit = opts.limit ?? INTEL_LIMIT;
  const peopleLimit = opts.peopleLimit ?? REENGAGE_LIMIT;
  const decided = await loadDecided(prisma, opts.now);
  const undecided = { OR: [{ feedback: null }, { feedback: 'skip' }], resolution: { not: 'rejected' } };
  const pull = async (where: Record<string, unknown>, orderBy: Array<Record<string, string>>, take: number): Promise<SignalRow[]> => (typeof prisma?.gapSignal?.findMany === 'function' ? prisma.gapSignal.findMany({ where: { ...undecided, ...where }, orderBy, take }).catch(() => []) : []);
  const [shares, strong, rest] = await Promise.all([
    pull({ origin: { in: ['casey_share', 'conference_note'] } }, [{ created_at: 'desc' }], 100),
    pull({ relevance: { in: ['outreach_evidence_candidate', 'leadership', 'risk'] } }, [{ score: 'desc' }, { created_at: 'desc' }], 300),
    pull({}, [{ created_at: 'desc' }], 200),
  ]);
  const signalRows = [...new Map([...shares, ...strong, ...rest].map((r) => [r.id, r])).values()];
  const signals = rankSignals(signalRows, opts.now);
  const signalTotal: number = typeof prisma?.gapSignal?.count === 'function' ? await prisma.gapSignal.count({ where: { feedback: null, resolution: { not: 'rejected' } } }).catch(() => signals.length) : signals.length;
  const triggerRows: TriggerRow[] = typeof prisma?.pounceTrigger?.findMany === 'function' ? await prisma.pounceTrigger.findMany({ where: { dismissed: false }, orderBy: [{ first_seen_at: 'desc' }], take: 200 }).catch(() => []) : [];
  const names: Array<{ name: string }> = triggerRows.length && typeof prisma?.account?.findMany === 'function' ? await prisma.account.findMany({ where: { name: { in: [...new Set(triggerRows.map((t) => t.account_name))], mode: 'insensitive' } }, select: { name: true } }).catch(() => []) : [];
  const triggers = rankTriggers(triggerRows, new Set(names.map((n) => n.name)), decided, opts.now);
  const since = new Date(opts.now.getTime() - peopleWindowDays * 86_400_000);
  const msgs: Array<{ from_email: string; from_name: string | null; subject: string | null; received_at: Date | string; thread: { account_name: string | null } | null }> = typeof prisma?.inboundMessage?.findMany === 'function'
    ? await prisma.inboundMessage.findMany({ where: { received_at: { gte: since } }, select: { id: true, thread_id: true, from_email: true, from_name: true, subject: true, snippet: true, received_at: true, thread: { select: { account_name: true } } }, orderBy: { received_at: 'desc' }, take: PEOPLE_INTAKE_MAX }).catch(() => [])
    : [];
  const emails = [...new Set(msgs.map((m) => m.from_email.toLowerCase()))];
  const personas: PersonaRow[] = emails.length && typeof prisma?.persona?.findMany === 'function' ? await prisma.persona.findMany({ where: { email: { in: emails, mode: 'insensitive' } }, select: { id: true, email: true, name: true, title: true, account_name: true, do_not_contact: true } }).catch(() => []) : [];
  const unsub: Array<{ email: string }> = emails.length && typeof prisma?.unsubscribedEmail?.findMany === 'function' ? await prisma.unsubscribedEmail.findMany({ where: { email: { in: emails, mode: 'insensitive' } }, select: { email: true } }).catch(() => []) : [];
  const unsubscribed = new Set(unsub.map((u) => u.email.toLowerCase()));
  const personaEmails = new Set(personas.filter((p) => p.email).map((p) => String(p.email).toLowerCase()));
  // C09/C11: every inbound message's purpose from its subject and snippet; the sender's re-engage verdict from all of them.
  // C57 F8 (C12): a seller's correction on one message or one thread is applied before the verdict; the machine purpose is kept beside it.
  const overrideIds = [...new Set(msgs.flatMap((m) => [String((m as { id?: unknown }).id ?? ''), String((m as { thread_id?: unknown }).thread_id ?? '')].filter(Boolean)))];
  const overrides = overrideIds.length ? await loadOverrides(prisma, overrideIds).catch(() => new Map<string, ClassificationOverride>()) : new Map<string, ClassificationOverride>();
  const typed = msgs.map((m) => {
    const email = String(m.from_email ?? '').trim().toLowerCase();
    const mail = classifyMailType({ subject: m.subject, from: m.from_email });
    const machine: Purpose = mail.type === 'calendar' ? 'calendar' : classifyPurpose({ from: m.from_email, subject: m.subject, excerpt: (m as { snippet?: string | null }).snippet ?? null, direction: 'inbound', type: mail.type, calendar: mail.calendar }, { knownPerson: personaEmails.has(email) }).purpose;
    const id = String((m as { id?: unknown }).id ?? '');
    const threadId = (m as { thread_id?: string | null }).thread_id ?? null;
    const override = overrideFor({ id, providerIds: id ? [`gmail:${id}`] : [], threadId, purpose: machine }, overrides);
    const purpose: Purpose = override?.purpose ?? machine;
    return { m, email, mail, purpose, machine, threadId };
  });
  const purposesBy = new Map<string, Purpose[]>();
  for (const t of typed) purposesBy.set(t.email, [...(purposesBy.get(t.email) ?? []), t.purpose]);
  const verdicts = new Map<string, ReengageVerdict>();
  for (const [email, purposes] of purposesBy) {
    const threadRel = typed.filter((t) => t.email === email).map((t) => relationshipOverride(t.threadId, overrides)).find((r) => r) ?? null;
    verdicts.set(email, reengageEligible({ purposes, relationship: threadRel ?? (personaEmails.has(email) ? 'prospect' : 'unknown'), optedOut: unsubscribed.has(email) }));
  }
  const writerRows = msgs.map((m) => ({ from_email: m.from_email, from_name: m.from_name, subject: m.subject, received_at: m.received_at, thread_account: m.thread?.account_name ?? null }));
  // C5: the ambiguous candidates of a first pure pass get their family facts (one bounded query each), so a family's deal-holding account can settle them.
  const ambiguousNames = [...new Set(rankPeople(writerRows, personas, { now: opts.now, decided, coverage, identity, unsubscribed, verdicts }).flatMap((i) => i.ambiguousAmong ?? []))];
  const family = ambiguousNames.length ? await loadFamilyFacts(prisma, ambiguousNames) : EMPTY_FAMILY;
  const base = { now: opts.now, decided, coverage, identity, unsubscribed, verdicts, sentRead: !!opts.listSent, family };
  // C10: the seller's Sent is read for the people that would be listed (a bounded number of Gmail reads), and the two-sided state decides quiet and answer owed.
  let states: Map<string, PersonState> | null = null;
  const sentFailed = new Set<string>();
  let sentTargets = 0;
  if (opts.listSent) {
    const first = rankPeople(writerRows, personas, base);
    const targets = first.slice(0, skipPeople + peopleLimit + 5).map((i) => i.id);
    sentTargets = targets.length;
    const events: StateEvent[] = [];
    for (const t of typed) if (targets.includes(t.email)) events.push({ id: String((t.m as { id?: string }).id ?? `${t.email}:${new Date(t.m.received_at).toISOString()}`), at: new Date(t.m.received_at).toISOString(), direction: 'inbound', type: t.mail.type, isDraft: false, from: t.email, to: [], purpose: t.purpose, calendar: t.mail.calendar });
    for (const email of targets) {
      const sent = await opts.listSent(email, Math.floor(since.getTime() / 1000), Math.floor(opts.now.getTime() / 1000)).catch(() => null);
      if (sent === null) { sentFailed.add(email); continue; }
      for (const s of sent) {
        const mail = classifyMailType({ subject: s.subject, from: null });
        events.push({ id: `sent:${s.id}`, at: new Date(s.internalDate).toISOString(), direction: 'outbound', type: mail.type, isDraft: false, from: null, to: [email], purpose: mail.type === 'calendar' ? 'calendar' : 'buyer_conversation', calendar: mail.calendar });
      }
    }
    states = peopleState(events, opts.now);
    for (const email of sentFailed) states.delete(email);
  }
  const people = rankPeople(writerRows, personas, { ...base, states, sentFailed });
  // The pursued items are placed with what this read already holds (the personas and the threads of the window's writers; no new source).
  const threadAccounts = new Map<string, string | null>();
  for (const w of writerRows) { const e = w.from_email.trim().toLowerCase(); if (!threadAccounts.get(e)) threadAccounts.set(e, w.thread_account ?? threadAccounts.get(e) ?? null); }
  const pursued = await loadPursued(prisma, opts.now, { identity, coverage, personas: new Map(personas.filter((p) => p.email).map((p) => [String(p.email).toLowerCase(), p])), threadAccounts, family });
  return {
    signals: signals.slice(skipSignals, skipSignals + limit), triggers: triggers.slice(0, limit), people: people.slice(skipPeople, skipPeople + peopleLimit), pursued,
    totals: { signals: Math.max(signalTotal, signals.length), triggers: triggers.length, people: people.length },
    selection: {
      signals: `ranked from three bounded pulls (your shares, up to 100; the strongest classes by score, up to 300; the rest newest, up to 200) of ${Math.max(signalTotal, signals.length)} undecided; showing ${Math.min(limit, Math.max(0, signals.length - skipSignals))} from ${skipSignals + 1}`,
      people: `people who wrote in the last ${peopleWindowDays} days (up to ${PEOPLE_INTAKE_MAX} messages read${msgs.length >= PEOPLE_INTAKE_MAX ? ', the cap: older writers are not in this list' : ''}); ${opts.listSent ? `our Sent read for the ${sentTargets} who would be listed${sentFailed.size ? ` (${sentFailed.size} read failed)` : ''}` : 'our Sent not read: quiet is judged from their last message alone'}; showing ${Math.min(peopleLimit, Math.max(0, people.length - skipPeople))} of ${people.length} from ${skipPeople + 1}`,
      moreSignals: signals.length > skipSignals + limit, morePeople: people.length > skipPeople + peopleLimit, skipSignals, skipPeople, peopleWindowDays, peopleIntakeTruncated: msgs.length >= PEOPLE_INTAKE_MAX,
    },
  };
}
