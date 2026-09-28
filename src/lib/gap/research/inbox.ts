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
import { classifyFact, detectConflicts } from './facts';
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
}

export interface InboxThesis {
  fingerprint: string;
  problemFamily: string;
  summary: string;
  people: number;
  /** Rows USE would touch: editable drafts and approved rows that need a revision. */
  usableIds: string[];
}

export interface InboxAccount {
  accountName: string;
  ready: InboxFact[];
  contradictions: Array<{ site: string; facts: InboxFact[] }>;
  rejected: Array<{ url: string; reason: string; at: string }>;
  lastRun: { at: string; outcome: string; runId: string; background: boolean; notes: string[] } | null;
  theses: InboxThesis[];
}

const CHANGE_WORD: Record<string, string> = {
  opening: 'a site opening',
  closure: 'a site closure',
  expansion: 'an expansion',
  automation: 'an automation program',
  acquisition: 'an acquisition',
  relocation: 'a relocation',
  investment: 'a network investment',
};

function whyItQualifies(excerpt: string, retrievedAt: string | null): string {
  const change = classifyFact(excerpt).change;
  return `States ${CHANGE_WORD[change] ?? 'a physical network change'}; the quote was found word for word at the source${retrievedAt ? ` on ${retrievedAt.slice(0, 10)}` : ''}.`;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export async function loadEvidenceInbox(prisma: PrismaLike, now: Date, opts: { accounts?: string[] } = {}): Promise<InboxAccount[]> {
  const since = new Date(now.getTime() - INBOX_WINDOW_MS);
  const accountFilter = opts.accounts?.length ? { account_name: { in: opts.accounts } } : {};
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
      a = { accountName: name, ready: [], contradictions: [], rejected: [], lastRun: null, theses: [] };
      accounts.set(name, a);
    }
    return a;
  };

  const factsByAccount = new Map<string, InboxFact[]>();
  for (const s of signals) {
    if (ignored.has(s.id)) continue;
    const exp = s.freshness_expires_at ? new Date(s.freshness_expires_at) : null;
    if (exp && exp.getTime() <= now.getTime()) continue;
    if (outreachFactRefusal(s as never, s.account_name)) continue;
    const meta = isObj(s.metadata) ? s.metadata : {};
    const retrievedAt = typeof meta.retrievedAt === 'string' ? meta.retrievedAt : null;
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
    a.ready = facts.filter((f) => !f.onThesis && !contradicted.has(f.signalId));
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
      });
    }
  }

  // Accounts with something to judge first: ready facts, then contradictions, then explicit research answers.
  return [...accounts.values()]
    .filter((a) => a.ready.length || a.contradictions.length || a.rejected.length || a.lastRun)
    .sort((x, y) => y.ready.length - x.ready.length || y.contradictions.length - x.contradictions.length || x.accountName.localeCompare(y.accountName));
}
