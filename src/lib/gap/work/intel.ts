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
import { signalStatus } from '../signals/intake';

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

export type TruthLabel = 'historical_observation' | 'verified_fact' | 'unverified_status' | 'contradicted';
export const TRUTH_TEXT: Record<TruthLabel, string> = {
  historical_observation: 'Historical observation',
  verified_fact: 'Verified fact',
  unverified_status: 'Unverified present-day status',
  contradicted: 'Contradicted or superseded',
};

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
  /** A person's name and title when GAP holds them. */
  person: { email: string; name: string | null; title: string | null; lastWroteAt: string; messages: number } | null;
  /** I05: the person's account is in an open deal: shown and labelled (work it from the deal), never dropped. */
  inDeal?: boolean;
  decisions: readonly Decision[];
  /** How it ranked, for the test and the page. */
  rank: number;
}

const NOISE_SENDER = /(^|[._-])(no-?reply|noreply|donotreply|rewards|reserv|notification|newsletter|mailer|billing|account|support|info|news|marketing|hello|team)@/i;
const dayText = (d: Date | string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
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
export function rankSignals(rows: readonly SignalRow[], now: Date): IntelItem[] {
  const skippedUntil = now.getTime() - SKIP_DAYS * 86_400_000;
  const byEvent = new Map<string, SignalRow>();
  for (const r of rows) {
    if (r.resolution === 'rejected') continue;
    if (r.feedback && !(r.feedback === 'skip' && r.feedback_at && new Date(r.feedback_at).getTime() < skippedUntil)) continue;
    const k = r.event_id ?? r.id;
    const cur = byEvent.get(k);
    if (!cur || (r.origin === 'casey_share' && cur.origin !== 'casey_share')) byEvent.set(k, r);
  }
  const items = [...byEvent.values()].map((r): IntelItem & { sort: number[] } => {
    const shared = r.origin === 'casey_share' || r.origin === 'conference_note';
    const truth = truthOfSignal(r, now);
    const categories = cats(r.categories);
    const st = signalStatus({ url: r.url, resolution: r.resolution, research_status: r.research_status, feedback: null, origin: r.origin, relevance: r.relevance ?? undefined });
    const when = r.published_at ? `published ${dayText(r.published_at)}` : `observed ${dayText(r.created_at)}`;
    const line = `${shared ? 'You shared it. ' : ''}${r.source_name ?? r.source_class ?? 'a source'}, ${when}. ${TRUTH_TEXT[truth]}.${categories.length ? ` Themes: ${categories.map((c) => c.replace(/_/g, ' ')).join(', ')}.` : ''}${st.status === 'Fact ready' ? ' A verified fact is in Research.' : ''}`;
    return {
      kind: 'signal', id: r.id, key: `signal:${r.id}`, title: r.title ?? r.url ?? 'A note', source: r.source_name ?? (r.url ? (() => { try { return new URL(r.url).hostname.replace(/^www\./, ''); } catch { return null; } })() : null), url: r.url, publishedAt: r.published_at ? new Date(r.published_at).toISOString() : null, observedAt: new Date(r.created_at).toISOString(), truth, line,
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

/** Pure: the people who wrote in and went quiet, one per address, newest last word first. */
export function rankPeople(rows: readonly WriterRow[], personas: readonly PersonaRow[], opts: { now: Date; decided: ReadonlySet<string>; dealAccounts: ReadonlySet<string> | null; unsubscribed: ReadonlySet<string> }): IntelItem[] {
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
    if (w.last.getTime() > quiet) continue;
    if (opts.decided.has(`person:${email}`) || opts.unsubscribed.has(email)) continue;
    const p = personaByEmail.get(email) ?? null;
    if (p?.do_not_contact) continue;
    const account = p?.account_name ?? w.account ?? null;
    // I05: an open deal at the account is said, never a silent drop (the mandate's section 3); execution stays with the deal.
    const inDeal = !!(account && opts.dealAccounts && opts.dealAccounts.has(account));
    const dealWords = opts.dealAccounts ? (inDeal ? 'their account is in an open deal: work it from the deal' : 'no open deal') : 'no open deal on record here';
    const name = p?.name ?? w.name ?? null;
    out.push({
      kind: 'person', id: email, key: `person:${email}`, title: `${name ?? email}${p?.title ? `, ${p.title}` : ''}${account ? ` at ${account}` : ` (${domainOf(email)})`}`, source: 'the mailbox', url: null, publishedAt: null, observedAt: w.last.toISOString(), truth: 'historical_observation',
      line: `Wrote to us ${dayText(w.last)} (${w.n} message${w.n === 1 ? '' : 's'})${w.subject ? `, last about "${w.subject.slice(0, 60)}"` : ''}; ${dealWords}${p ? '' : '; not a GAP contact yet'}. Previously contacted, a response${inDeal ? '' : ', no live opportunity'}.`,
      accountName: account, accountHint: account ? null : domainOf(email), relevance: null, categories: [], person: { email, name, title: p?.title ?? null, lastWroteAt: w.last.toISOString(), messages: w.n }, decisions: DECISIONS, rank: out.length, ...(inDeal ? { inDeal: true } : {}),
    });
  }
  return out.sort((a, b) => b.observedAt.localeCompare(a.observedAt)).map((x, i) => ({ ...x, rank: i }));
}

/** I05: an item Casey pursued (or asked more about): the angle task's state and its result when ready. */
export interface PursuedItem {
  key: string;
  kind: 'signal' | 'trigger' | 'person';
  title: string;
  accountName: string | null;
  accountHint: string | null;
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
}

/** The decided trigger and person keys (the newest decision per key; a skip expires after SKIP_DAYS). */
export async function loadDecided(prisma: PrismaLike, now: Date): Promise<Set<string>> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return new Set();
  const rows: DecisionRow[] = await prisma.gapAuditEvent.findMany({ where: { kind: PROSPECT_DECISION }, orderBy: { created_at: 'desc' }, take: 2000, select: { subject_id: true, payload: true, created_at: true } }).catch(() => []);
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

/** I05: the pursued items from the angle tasks (any state, the task window), newest decision first, one per key. */
export async function loadPursued(prisma: PrismaLike, now: Date): Promise<PursuedItem[]> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return [];
  const { listAgentTasks } = await import('../agents/tasks');
  const tasks = await listAgentTasks(prisma, { now }).catch(() => []);
  const out = new Map<string, PursuedItem>();
  for (const t of tasks.filter((x) => x.kind === 'develop_angle').sort((a, b) => b.queuedAt.localeCompare(a.queuedAt))) {
    if (out.has(t.itemKey) || t.status === 'superseded') continue;
    const input = (t.input ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    const kind = (t.itemKey.split(':')[0] as PursuedItem['kind']) ?? 'signal';
    const r = (t.status === 'succeeded' && t.result && typeof t.result.whyItMatters === 'string' ? t.result : null) as Record<string, unknown> | null;
    const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
    out.set(t.itemKey, {
      key: t.itemKey, kind, title: str(input.title) ?? (kind === 'person' ? `${str(input.name) ?? str(input.email) ?? 'A person'} wrote to us` : 'An item'), accountName: str(input.accountName), accountHint: str(input.accountHint), url: str(input.url),
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
export async function loadIntelligence(prisma: PrismaLike, opts: { now: Date; limit?: number; peopleLimit?: number; dealAccounts?: ReadonlySet<string> | null }): Promise<Intelligence> {
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
  const since = new Date(opts.now.getTime() - 180 * 86_400_000);
  const msgs: Array<{ from_email: string; from_name: string | null; subject: string | null; received_at: Date | string; thread: { account_name: string | null } | null }> = typeof prisma?.inboundMessage?.findMany === 'function'
    ? await prisma.inboundMessage.findMany({ where: { received_at: { gte: since } }, select: { from_email: true, from_name: true, subject: true, received_at: true, thread: { select: { account_name: true } } }, orderBy: { received_at: 'desc' }, take: 2000 }).catch(() => [])
    : [];
  const emails = [...new Set(msgs.map((m) => m.from_email.toLowerCase()))];
  const personas: PersonaRow[] = emails.length && typeof prisma?.persona?.findMany === 'function' ? await prisma.persona.findMany({ where: { email: { in: emails, mode: 'insensitive' } }, select: { id: true, email: true, name: true, title: true, account_name: true, do_not_contact: true } }).catch(() => []) : [];
  const unsub: Array<{ email: string }> = emails.length && typeof prisma?.unsubscribedEmail?.findMany === 'function' ? await prisma.unsubscribedEmail.findMany({ where: { email: { in: emails, mode: 'insensitive' } }, select: { email: true } }).catch(() => []) : [];
  const people = rankPeople(msgs.map((m) => ({ from_email: m.from_email, from_name: m.from_name, subject: m.subject, received_at: m.received_at, thread_account: m.thread?.account_name ?? null })), personas, { now: opts.now, decided, dealAccounts: opts.dealAccounts ?? null, unsubscribed: new Set(unsub.map((u) => u.email.toLowerCase())) });
  const pursued = await loadPursued(prisma, opts.now);
  return { signals: signals.slice(0, limit), triggers: triggers.slice(0, limit), people: people.slice(0, peopleLimit), pursued, totals: { signals: Math.max(signalTotal, signals.length), triggers: triggers.length, people: people.length } };
}
