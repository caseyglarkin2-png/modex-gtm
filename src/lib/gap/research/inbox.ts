/**
 * The VERIFIED EVIDENCE INBOX (Phase 2 B2, 2026-09-28): what background
 * research (and RESEARCH THIS) found, grouped by account, for Casey to judge.
 *
 *   ready           verified, live outreach facts not yet on any of the
 *                   account's hypotheses and not ignored: exact quote, source,
 *                   date, why it qualifies, freshness
 *   contradictions  verified facts describing the same named site moving both
 *                   ways (shown, never quietly filtered)
 *   rejected        sources research looked at and refused, with the reason
 *   lastRun         the newest research run's outcome, so "nothing found" is
 *                   an explicit answer, not silence
 *   theses          where a fact can be USED: each current thesis at the
 *                   account and the rows USE would touch
 *
 * Read only. USE goes through the existing audited use_evidence operation
 * (rebuild an editable observation, or revise a frozen approved row; never
 * approves). IGNORE appends an `evidence.ignored` audit row (research history
 * is never deleted). Nothing here creates, approves or activates anything.
 */
import { outreachFactRefusal } from './evidence-gate';
import { sellerRelevance, type SellerRelevance } from './continuity';
import { hostBelongsToAccount } from './providers';
import { classifyFact, detectConflicts, normalizeForMatch } from './facts';
import { loadThesisGroups } from '../hypothesis/thesis-groups';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const EVIDENCE_IGNORED = 'evidence.ignored' as const;
/** How far back verified facts and rejected sources are shown. */
export const INBOX_WINDOW_MS = 45 * 86_400_000;
const DAY = 86_400_000;

export interface InboxFact {
  signalId: string;
  quote: string;
  sourceTitle: string;
  sourceUrl: string | null;
  publishedAt: string;
  retrievedAt: string | null;
  why: string;
  expiresAt: string | null;
  daysLeft: number | null;
  runId: string | null;
  onThesis: boolean;
  /** Where the fact comes from and why it is current: the source, and the newer source that confirmed it still holds. */
  chain: SourceChain;
  /** Seller usefulness for a first touch (NOT truth: every fact here is equally verified). */
  relevance: SellerRelevance;
}

export interface ChainLink {
  label: string;
  url: string | null;
  date: string;
}

export interface SourceChain {
  /** PRIMARY SOURCE (the company's own page or filing) or SOURCE (a report). */
  kind: 'primary' | 'secondary';
  source: ChainLink;
  /** A newer, independent source confirming the ongoing program still operates. */
  currentness: ChainLink | null;
  others: ChainLink[];
  /** 'ongoing_state' facts are current until the corroborated clock; others until their own. */
  basis: 'publication' | 'corroborated';
}

/** The button a USE on this thesis would be, named by what the server will do. */
export type UseLabel = 'USE IN DRAFT' | 'USE & CREATE REVISION' | 'USE FOR THIS THESIS';

export interface InboxThesis {
  fingerprint: string;
  problemFamily: string;
  summary: string;
  people: number;
  /** Rows USE would touch: editable drafts and approved rows that need a revision. */
  usableIds: string[];
  /** Server-derived: what USE does here. Null when no row can take evidence (all approved and ready, or in use). */
  useLabel: UseLabel | null;
}

export interface InboxAccount {
  accountName: string;
  ready: InboxFact[];
  contradictions: Array<{ site: string; facts: InboxFact[] }>;
  rejected: Array<{ url: string; reason: string; at: string }>;
  lastRun: { at: string; outcome: string; runId: string; background: boolean; notes: string[] } | null;
  theses: InboxThesis[];
  /** The fact most worth Casey's judgment first (seller relevance), or null when only context remains. */
  bestSignalId: string | null;
  /** One deterministic next step for this account. */
  next: string;
}

const CHANGE_WORD: Record<string, string> = {
  opening: 'a site opening',
  closure: 'a site closure',
  expansion: 'an expansion',
  automation: 'an automation program',
  acquisition: 'an acquisition',
  relocation: 'a relocation',
  investment: 'a change to the physical network',
};

function whyItQualifies(excerpt: string, retrievedAt: string | null): string {
  const change = classifyFact(excerpt).change;
  return `States ${CHANGE_WORD[change] ?? 'a physical network change'}; the quote was found word for word at the source${retrievedAt ? ` on ${retrievedAt.slice(0, 10)}` : ''}.`;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
};

/** A source named compactly: the account itself for its own domain, otherwise the publisher's host. */
export function sourceName(url: string | null, accountName: string): string {
  if (!url) return 'source';
  if (hostBelongsToAccount(url, accountName)) return accountName;
  // A search-grounding redirect is a link, not a publisher: never present it as one.
  if (/(^|\.)vertexaisearch\.cloud\.google\.com$/.test(hostOf(url))) return 'search redirect link';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'source';
  }
}

function linkOf(v: unknown, accountName: string): ChainLink | null {
  if (!isObj(v)) return null;
  const url = typeof v.url === 'string' ? v.url : null;
  const date = typeof v.publishedAt === 'string' ? v.publishedAt : null;
  return date ? { label: sourceName(url, accountName), url, date } : null;
}

/** Which verbs USE will run, from the rows it would touch (group members are current work only). */
export function labelForUse(statuses: string[]): UseLabel | null {
  if (statuses.length === 0) return null;
  const drafts = statuses.filter((s) => s === 'draft' || s === 'review_required').length;
  if (drafts === statuses.length) return 'USE IN DRAFT';
  if (drafts === 0) return 'USE & CREATE REVISION';
  return 'USE FOR THIS THESIS';
}

/**
 * The Research lane, account by account: each account's evidence with ONLY that account's thesis cards.
 * Accounts with evidence first (inbox order), then accounts that only have theses waiting (by name).
 */
export function researchSections<C extends { accountName: string }>(inbox: InboxAccount[], cards: C[]): Array<{ account: InboxAccount; cards: C[] }> {
  const byAccount = new Map<string, C[]>();
  for (const c of cards) byAccount.set(c.accountName, [...(byAccount.get(c.accountName) ?? []), c]);
  const known = new Set(inbox.map((a) => a.accountName));
  const thesisOnly = [...byAccount.keys()]
    .filter((n) => !known.has(n))
    .sort((x, y) => x.localeCompare(y))
    .map((n): InboxAccount => ({ accountName: n, ready: [], contradictions: [], rejected: [], lastRun: null, theses: [], bestSignalId: null, next: NO_FACT_YET }));
  return [...inbox, ...thesisOnly].map((account) => ({ account, cards: byAccount.get(account.accountName) ?? [] }));
}

export const NO_FACT_YET = 'No verified fact to use yet. Research keeps looking; nothing to do here now.';

export function nextActionFor(a: Pick<InboxAccount, 'ready' | 'contradictions' | 'theses' | 'bestSignalId' | 'lastRun'>): string {
  if (a.contradictions.length) return 'Resolve the contradiction first: ignore the side you do not believe.';
  const usable = a.theses.filter((t) => t.useLabel);
  if (a.ready.length) {
    const which = a.bestSignalId ? 'the best fact' : 'the verified context';
    if (usable.length === 1) return `Judge ${which}. If it holds, ${usable[0].useLabel}, then review the draft. Nothing is approved for you.`;
    if (usable.length > 1) return `Judge ${which}. If it holds, pick the thesis it supports and use it there, then review the draft.`;
    if (a.theses.length === 0) return `Judge ${which}. If it holds, DRAFT THESIS FROM THIS FACT.`;
    return `Judge ${which}. Every thesis here is approved and in use; a new thesis would start from this fact.`;
  }
  if (a.theses.some((t) => t.useLabel)) return NO_FACT_YET;
  return a.lastRun ? 'Nothing to judge. The last research answer is below.' : 'Nothing to judge.';
}

export async function loadEvidenceInbox(prisma: PrismaLike, now: Date, opts: { accounts?: string[] } = {}): Promise<InboxAccount[]> {
  const since = new Date(now.getTime() - INBOX_WINDOW_MS);
  const accountFilter = opts.accounts?.length ? { account_name: { in: opts.accounts } } : {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw rows from a narrow select
  const signals: Array<Record<string, any>> = await prisma.prospectingSignal.findMany({
    where: { ...accountFilter, source_kind: 'evidence_record', ingested_at: { gte: since }, metadata: { path: ['verified'], equals: 'excerpt_found_at_source' } },
    select: { id: true, account_name: true, source_kind: true, source_type: true, title: true, evidence_text: true, evidence_url: true, external_ok: true, observed_at: true, freshness_expires_at: true, metadata: true },
    orderBy: [{ observed_at: 'desc' }, { id: 'asc' }],
    take: 500,
  });
  const ids = signals.map((s) => s.id);
  const [ignoredRows, linkRows, runs] = await Promise.all([
    ids.length ? prisma.gapAuditEvent.findMany({ where: { kind: EVIDENCE_IGNORED, subject_type: 'prospecting_signal', subject_id: { in: ids } }, select: { subject_id: true } }) : [],
    ids.length ? prisma.hypothesisSignal.findMany({ where: { signal_id: { in: ids } }, select: { signal_id: true } }) : [],
    prisma.researchRun.findMany({
      where: { ...accountFilter, created_at: { gte: since }, run_key: { startsWith: 'gap_research:' } },
      select: { id: true, account_name: true, created_at: true, provider_status: true },
      orderBy: { created_at: 'desc' },
      take: 300,
    }),
  ]);
  const ignored = new Set((ignoredRows as Array<{ subject_id: string }>).map((r) => r.subject_id));
  const linked = new Set((linkRows as Array<{ signal_id: string }>).map((r) => r.signal_id));

  const accounts = new Map<string, InboxAccount>();
  const acct = (name: string) => {
    let a = accounts.get(name);
    if (!a) {
      a = { accountName: name, ready: [], contradictions: [], rejected: [], lastRun: null, theses: [], bestSignalId: null, next: '' };
      accounts.set(name, a);
    }
    return a;
  };

  const factsByAccount = new Map<string, InboxFact[]>();
  // Evidence continuity: a live continuation shows ONE fact with its chain; the rows it folds in (the
  // original, other copies of the same story, the corroborating report) are shown inside that chain.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw rows from a narrow select
  const live = (s: Record<string, any>) => !ignored.has(s.id) && !(s.freshness_expires_at && new Date(s.freshness_expires_at).getTime() <= now.getTime()) && !outreachFactRefusal(s as never, s.account_name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw rows from a narrow select
  const newestContinuation = new Map<string, Record<string, any>>();
  for (const s of signals) {
    const k = isObj(s.metadata) && isObj(s.metadata.continuity) ? s.metadata.continuity : null;
    if (!k || k.kind !== 'ongoing_state' || !isObj(k.primary) || !live(s)) continue;
    const pid = String(k.primary.signalId);
    const prev = newestContinuation.get(pid);
    if (!prev || new Date(s.freshness_expires_at).getTime() > new Date(prev.freshness_expires_at).getTime()) newestContinuation.set(pid, s);
  }
  const folded = new Set<string>();
  for (const [pid, c] of newestContinuation) {
    folded.add(pid);
    const k = c.metadata.continuity;
    if (isObj(k.currentness) && k.currentness.signalId) folded.add(String(k.currentness.signalId));
    for (const o of Array.isArray(k.otherSources) ? k.otherSources : []) if (isObj(o) && o.signalId) folded.add(String(o.signalId));
  }
  for (const s of signals) {
    const k = isObj(s.metadata) && isObj(s.metadata.continuity) ? s.metadata.continuity : null;
    if (k && k.kind === 'ongoing_state' && isObj(k.primary) && newestContinuation.get(String(k.primary.signalId))?.id !== s.id) folded.add(s.id);
  }
  for (const s of signals) {
    if (ignored.has(s.id) || folded.has(s.id)) continue;
    const exp = s.freshness_expires_at ? new Date(s.freshness_expires_at) : null;
    if (exp && exp.getTime() <= now.getTime()) continue;
    if (outreachFactRefusal(s as never, s.account_name)) continue;
    const meta = isObj(s.metadata) ? s.metadata : {};
    const retrievedAt = typeof meta.retrievedAt === 'string' ? meta.retrievedAt : null;
    const k = isObj(meta.continuity) && meta.continuity.kind === 'ongoing_state' ? meta.continuity : null;
    const chain: SourceChain = {
      kind: s.source_type === 'public_primary' ? 'primary' : 'secondary',
      source: { label: sourceName(s.evidence_url ?? null, s.account_name), url: s.evidence_url ?? null, date: new Date(s.observed_at).toISOString() },
      currentness: k ? linkOf(k.currentness, s.account_name) : null,
      others: k && Array.isArray(k.otherSources) ? k.otherSources.map((o: unknown) => linkOf(o, s.account_name)).filter((x: ChainLink | null): x is ChainLink => !!x && x.url !== s.evidence_url) : [],
      basis: k ? 'corroborated' : 'publication',
    };
    const f: InboxFact = {
      signalId: s.id,
      quote: String(s.evidence_text ?? ''),
      sourceTitle: String(s.title ?? ''),
      sourceUrl: s.evidence_url ?? null,
      publishedAt: new Date(s.observed_at).toISOString(),
      retrievedAt,
      why: whyItQualifies(String(s.evidence_text ?? ''), retrievedAt),
      expiresAt: exp ? exp.toISOString() : null,
      daysLeft: exp ? Math.ceil((exp.getTime() - now.getTime()) / DAY) : null,
      runId: typeof meta.researchRunId === 'string' ? meta.researchRunId : null,
      onThesis: linked.has(s.id),
      chain,
      relevance: sellerRelevance(String(s.evidence_text ?? '')),
    };
    factsByAccount.set(s.account_name, [...(factsByAccount.get(s.account_name) ?? []), f]);
  }
  for (const [name, facts] of factsByAccount) {
    const a = acct(name);
    const conflicts = detectConflicts(facts.map((f) => ({ id: f.signalId, excerpt: f.quote, change: classifyFact(f.quote).change })));
    a.contradictions = conflicts.map((c) => ({ site: c.site, facts: facts.filter((f) => c.ids.includes(f.signalId)) }));
    // Review B2: a contradicted fact is never "ready". It shows under its contradiction,
    // where Casey ignores the side he does not believe; the other side then becomes ready.
    const contradicted = new Set(conflicts.flatMap((c) => c.ids));
    // Truth is not usefulness: every ready fact is equally verified; the most seller-relevant comes first.
    // Among equally relevant facts: confirmed current by a newer source first, then the company's own
    // source, then the newest. The same sentence stored twice (two links to one story) is shown once.
    const seenQuote = new Set<string>();
    a.ready = facts
      .filter((f) => !f.onThesis && !contradicted.has(f.signalId))
      .sort(
        (x, y) =>
          x.relevance.rank - y.relevance.rank ||
          Number(y.chain.basis === 'corroborated') - Number(x.chain.basis === 'corroborated') ||
          Number(y.chain.kind === 'primary') - Number(x.chain.kind === 'primary') ||
          y.publishedAt.localeCompare(x.publishedAt) ||
          x.signalId.localeCompare(y.signalId),
      )
      .filter((f) => {
        const k = normalizeForMatch(f.quote);
        if (seenQuote.has(k)) return false;
        seenQuote.add(k);
        return true;
      });
    a.bestSignalId = a.ready[0]?.relevance.bucket === 'best' ? a.ready[0].signalId : null;
  }

  for (const r of runs as Array<{ id: string; account_name: string; created_at: Date; provider_status: unknown }>) {
    const ps = isObj(r.provider_status) ? r.provider_status : {};
    const result = isObj(ps.result) ? ps.result : {};
    const rejected = Array.isArray(result.rejected) ? (result.rejected as Array<{ url?: unknown; reason?: unknown }>) : [];
    const a = acct(r.account_name);
    if (!a.lastRun) {
      a.lastRun = {
        at: new Date(r.created_at).toISOString(),
        outcome: String(ps.outcome ?? 'unknown'),
        runId: r.id,
        background: ps.purpose === 'gap_background_research',
        notes: Array.isArray(ps.notes) ? (ps.notes as unknown[]).map(String).slice(0, 4) : [],
      };
    }
    for (const x of rejected) {
      const url = String(x.url ?? '');
      if (!url || a.rejected.some((y) => y.url === url)) continue;
      a.rejected.push({ url, reason: String(x.reason ?? 'rejected'), at: new Date(r.created_at).toISOString() });
    }
  }

  const names = [...accounts.keys()];
  if (names.length) {
    const groups = await loadThesisGroups(prisma, { account_name: { in: names } }, { singletons: true, now });
    for (const g of groups) {
      const a = accounts.get(g.accountName);
      if (!a) continue;
      const usable = g.members.filter((m) => m.status === 'draft' || m.status === 'review_required' || (m.status === 'approved' && m.next === 'revise'));
      a.theses.push({
        fingerprint: g.fingerprint,
        problemFamily: g.problemFamily,
        summary: String(g.members[0]?.problem_hypothesis ?? '').slice(0, 160),
        people: g.members.length,
        usableIds: usable.map((m) => m.id),
        useLabel: labelForUse(usable.map((m) => m.status)),
      });
    }
  }
  for (const a of accounts.values()) a.next = nextActionFor(a);

  // Accounts with something to judge first: ready facts, then contradictions, then explicit research answers.
  return [...accounts.values()]
    .filter((a) => a.ready.length || a.contradictions.length || a.rejected.length || a.lastRun)
    .sort((x, y) => y.ready.length - x.ready.length || y.contradictions.length - x.contradictions.length || x.accountName.localeCompare(y.accountName));
}
