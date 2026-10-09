/**
 * THE INTELLIGENCE BROWSE (intelligence wiring, IW05, 2026-10-09). Server only; read only.
 *
 * Every retained piece of intelligence is reachable here: the Work panel reads a bounded pool (shares, the strong
 * classes, the newest) and ranks it for the day; this is the COMPLETE pool, newest first, paged deterministically
 * over (created_at desc, id desc) with an opaque cursor, so a row with the same timestamp as its neighbours is never
 * skipped and never repeated. Filters: the producer (an import's `submitted_by`), the origin, the kind (signals or
 * live Pounce triggers, each with its own cursor), the account (a resolved name or the producer's hint), decided or
 * not (Casey's feedback on the row, or a prospect.decision ledger row for its key; an expired skip is undecided, the
 * same rule the Work panel applies), the archive (report containers and rejected rows are hidden unless asked for,
 * then shown flagged) and a day floor on created_at.
 *
 * The models read: gapSignal, pounceTrigger, gapAuditEvent (the decisions) and account (whether a trigger's company is
 * a GAP account). Nothing here decides, drafts, posts, fetches or calls a model; imported text is data, cut for an
 * excerpt and otherwise handed back as it is.
 */
import { importOf, producerLabel, REPORT_ARCHIVE_CLASS, type IntelSource, type IntelSourceRecordId } from './intelligence-record';
import { HISTORICAL_DAYS, isDateOnly, loadDecided, SKIP_DAYS, truthOfSignal } from '../work/intel';
import type { TruthLabel } from '../work/truth-text';
import { nyDayAt } from '../work/dates';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const BROWSE_LIMIT = 50;
export const BROWSE_LIMIT_MAX = 200;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export type BrowseKind = 'signal' | 'trigger';
export type BrowseDecided = 'undecided' | 'decided' | 'all';

export interface BrowseFilters {
  /** Matches `submitted_by = 'import:<producer>'` (signals only). */
  producer?: string;
  /** The signal origin (casey_share, discovery, report_import, ...); signals only. */
  origin?: string;
  /** signal (default) or trigger (Pounce rows, their own cursor). */
  kind?: BrowseKind;
  /** Case-insensitive equals on the resolved account name OR the producer's hint. */
  account?: string;
  /** all (default), undecided, decided. */
  decided?: BrowseDecided;
  /** false (default): report containers and rejected rows are left out; true: included and flagged. */
  archive?: boolean;
  /** YYYY-MM-DD: rows created on or after that New York day. */
  since?: string;
}

export interface BrowseItem {
  key: string;
  id: string;
  kind: BrowseKind;
  title: string;
  url: string | null;
  origin: string;
  producer: string | null;
  producerLabel: string | null;
  producerItemId: string | null;
  producerRunId: string | null;
  /** metadata.import.kind: development, engagement, observation, report. */
  recordKind: string | null;
  /** The first 400 characters of the imported passage, cut at a sentence end; null when there is no passage. */
  excerpt: string | null;
  sources: IntelSource[];
  sourceRecordIds: IntelSourceRecordId[];
  eventDate: string | null;
  reportedOn: string | null;
  publishedAt: string | null;
  /** The stored published_at is a calendar day, not an instant. */
  publishedDateOnly: boolean;
  importedAt: string;
  accountName: string | null;
  accountHint: string | null;
  resolution: string | null;
  relevance: string | null;
  categories: string[];
  truth: TruthLabel;
  feedback: string | null;
  decided: boolean;
  archived: boolean;
  producerStatus: string | null;
  uncertainty: string | null;
  interpretation: string | null;
  /** A count only: the drafted posts stay in the archive view, never executed. */
  suggestions: number;
  revisions: number;
}

export interface BrowseResult {
  items: BrowseItem[];
  /** The count for the applied filters (the cursor does not narrow it). */
  total: number;
  next: string | null;
  applied: BrowseFilters;
}

export interface BrowseOptions {
  now: Date;
  limit?: number;
  cursor?: string | null;
  filters?: BrowseFilters;
}

export class BrowseCursorError extends Error {
  constructor() {
    super('invalid_cursor');
    this.name = 'BrowseCursorError';
  }
}

/** `${ISO instant}|${id}` as base64url: opaque to the page, deterministic for the same row. */
export function encodeCursor(at: Date | string, id: string | number): string {
  return Buffer.from(`${new Date(at).toISOString()}|${id}`, 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): { at: Date; id: string } {
  let raw = '';
  try {
    raw = Buffer.from(cursor, 'base64url').toString('utf8');
  } catch {
    throw new BrowseCursorError();
  }
  const bar = raw.lastIndexOf('|');
  if (bar <= 0 || bar === raw.length - 1) throw new BrowseCursorError();
  const at = new Date(raw.slice(0, bar));
  const id = raw.slice(bar + 1);
  if (Number.isNaN(at.getTime()) || !id || /[\s|]/.test(id)) throw new BrowseCursorError();
  return { at, id };
}

/** The first `max` characters of a passage, cut at the last sentence end inside them (else the last word break); whitespace collapsed. */
export function excerptOf(text: string | null | undefined, max = 400): string | null {
  if (typeof text !== 'string') return null;
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return null;
  if (t.length <= max) return t;
  const head = t.slice(0, max);
  let cut = -1;
  const ends = /[.!?]["')\]]?(?=\s|$)/g;
  let m: RegExpExecArray | null;
  while ((m = ends.exec(head))) cut = m.index + m[0].length;
  if (cut >= Math.floor(max / 4)) return head.slice(0, cut).trim();
  const space = head.lastIndexOf(' ');
  return (space > 0 ? head.slice(0, space) : head).trim();
}

export function normalizeBrowseFilters(f: BrowseFilters | undefined): Required<Pick<BrowseFilters, 'kind' | 'decided' | 'archive'>> & BrowseFilters {
  const str = (v: unknown, max: number): string | undefined => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
  const kind: BrowseKind = f?.kind === 'trigger' ? 'trigger' : 'signal';
  const since = str(f?.since, 10);
  return {
    kind,
    decided: f?.decided === 'decided' || f?.decided === 'undecided' ? f.decided : 'all',
    archive: f?.archive === true,
    ...(kind === 'signal' && str(f?.producer, 80) ? { producer: str(f?.producer, 80)!.toLowerCase().replace(/[^a-z0-9_]+/g, '_') } : {}),
    ...(kind === 'signal' && str(f?.origin, 40) ? { origin: str(f?.origin, 40) } : {}),
    ...(str(f?.account, 200) ? { account: str(f?.account, 200) } : {}),
    ...(since && DATE_ONLY.test(since) && !Number.isNaN(Date.parse(`${since}T00:00:00Z`)) ? { since } : {}),
  };
}

const iso = (d: Date | string | null | undefined): string | null => (d ? new Date(d).toISOString() : null);
const cats = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const strOrNull = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

/** Pure: one gap_signals row as a browse item. */
export function signalItem(r: Row, decided: boolean, now: Date): BrowseItem {
  const imp = importOf(r.metadata);
  const submitted = typeof r.submitted_by === 'string' ? r.submitted_by : '';
  const producer = imp?.producer ?? (submitted.startsWith('import:') ? submitted.slice('import:'.length) : null);
  const archived = r.source_class === REPORT_ARCHIVE_CLASS || r.resolution === 'rejected';
  return {
    key: `signal:${r.id}`,
    id: String(r.id),
    kind: 'signal',
    title: strOrNull(r.title) ?? strOrNull(imp?.title) ?? strOrNull(r.url) ?? 'A note',
    url: strOrNull(r.url),
    origin: String(r.origin ?? 'unknown'),
    producer,
    producerLabel: producer ? (imp?.producerLabel ?? producerLabel(producer)) : null,
    producerItemId: imp?.producerItemId ?? null,
    producerRunId: imp?.producerRunId ?? null,
    recordKind: imp?.kind ?? null,
    excerpt: excerptOf(imp?.text),
    sources: Array.isArray(imp?.sources) ? imp.sources : [],
    sourceRecordIds: Array.isArray(imp?.sourceRecordIds) ? imp.sourceRecordIds : [],
    eventDate: imp?.eventDate ?? null,
    reportedOn: imp?.reportedOn ?? null,
    publishedAt: iso(r.published_at),
    publishedDateOnly: !!r.published_at && isDateOnly(r.published_at),
    importedAt: imp?.importedAt ?? new Date(r.created_at).toISOString(),
    accountName: strOrNull(r.account_name),
    accountHint: r.account_name ? null : strOrNull(r.account_hint) ?? imp?.accountHint ?? null,
    resolution: strOrNull(r.resolution),
    relevance: strOrNull(r.relevance),
    categories: cats(r.categories),
    truth: truthOfSignal({ research_status: r.research_status, published_at: r.published_at, created_at: r.created_at }, now),
    feedback: strOrNull(r.feedback),
    decided,
    archived,
    producerStatus: imp?.producerStatus ?? null,
    uncertainty: imp?.uncertainty ?? null,
    interpretation: imp?.interpretation ?? null,
    suggestions: Array.isArray(imp?.suggestions) ? imp.suggestions.length : 0,
    revisions: Array.isArray(imp?.revisions) ? imp.revisions.length : 0,
  };
}

/** Pure: one pounce_triggers row as a browse item (the same truth rule the Work panel's rankTriggers applies). */
export function triggerItem(t: Row, known: string | null, decided: boolean, now: Date): BrowseItem {
  const at = new Date(t.published_at ?? t.first_seen_at).getTime();
  const truth: TruthLabel = now.getTime() - at > HISTORICAL_DAYS * 86_400_000 ? 'historical_observation' : 'unverified_status';
  return {
    key: `trigger:${t.id}`,
    id: String(t.id),
    kind: 'trigger',
    title: strOrNull(t.title) ?? strOrNull(t.url) ?? 'A trigger',
    url: strOrNull(t.url),
    origin: 'pounce',
    producer: null,
    producerLabel: null,
    producerItemId: null,
    producerRunId: null,
    recordKind: null,
    excerpt: null,
    sources: t.url ? [{ url: String(t.url), publisher: strOrNull(t.source), label: null }] : [],
    sourceRecordIds: [],
    eventDate: null,
    reportedOn: null,
    publishedAt: iso(t.published_at),
    publishedDateOnly: !!t.published_at && isDateOnly(t.published_at),
    importedAt: new Date(t.first_seen_at).toISOString(),
    accountName: known,
    accountHint: known ? null : strOrNull(t.account_name),
    resolution: null,
    relevance: null,
    categories: cats(t.categories),
    truth,
    feedback: null,
    decided,
    archived: t.dismissed === true,
    producerStatus: null,
    uncertainty: null,
    interpretation: null,
    suggestions: 0,
    revisions: 0,
  };
}

export async function browseIntelligence(prisma: PrismaLike, opts: BrowseOptions): Promise<BrowseResult> {
  const asked = typeof opts.limit === 'number' && Number.isFinite(opts.limit) ? Math.floor(opts.limit) : BROWSE_LIMIT;
  const limit = Math.min(Math.max(asked, 1), BROWSE_LIMIT_MAX);
  const f = normalizeBrowseFilters(opts.filters);
  const cursor = opts.cursor ? decodeCursor(opts.cursor) : null;
  const decided = await loadDecided(prisma, opts.now);
  const since = f.since ? nyDayAt(f.since, 0) : null;
  return f.kind === 'trigger' ? browseTriggers(prisma, { now: opts.now, limit, cursor, f, decided, since }) : browseSignals(prisma, { now: opts.now, limit, cursor, f, decided, since });
}

type Page = { now: Date; limit: number; cursor: { at: Date; id: string } | null; f: ReturnType<typeof normalizeBrowseFilters>; decided: ReadonlySet<string>; since: Date | null };

async function browseSignals(prisma: PrismaLike, p: Page): Promise<BrowseResult> {
  const and: Row[] = [];
  if (p.f.producer) and.push({ submitted_by: `import:${p.f.producer}` });
  if (p.f.origin) and.push({ origin: p.f.origin });
  if (p.f.account) and.push({ OR: [{ account_name: { equals: p.f.account, mode: 'insensitive' } }, { account_hint: { equals: p.f.account, mode: 'insensitive' } }] });
  if (!p.f.archive) and.push({ source_class: { not: REPORT_ARCHIVE_CLASS } }, { resolution: { not: 'rejected' } });
  if (p.since) and.push({ created_at: { gte: p.since } });
  // The Work panel's rule (rankSignals): feedback decides, except a skip older than SKIP_DAYS; a prospect.decision ledger row decides too.
  const skippedUntil = new Date(p.now.getTime() - SKIP_DAYS * 86_400_000);
  const ledgerIds = [...p.decided].filter((k) => k.startsWith('signal:')).map((k) => k.slice('signal:'.length));
  if (p.f.decided === 'decided') and.push({ OR: [{ feedback: { not: null, notIn: ['skip'] } }, { feedback: 'skip', OR: [{ feedback_at: null }, { feedback_at: { gte: skippedUntil } }] }, ...(ledgerIds.length ? [{ id: { in: ledgerIds } }] : [])] });
  if (p.f.decided === 'undecided') and.push({ OR: [{ feedback: null }, { feedback: 'skip', feedback_at: { lt: skippedUntil } }] }, ...(ledgerIds.length ? [{ id: { notIn: ledgerIds } }] : []));
  const where = { AND: and };
  const pageWhere = { AND: [...and, ...(p.cursor ? [{ OR: [{ created_at: { lt: p.cursor.at } }, { created_at: { equals: p.cursor.at }, id: { lt: p.cursor.id } }] }] : [])] };
  const [rows, total]: [Row[], number] = await Promise.all([
    prisma.gapSignal.findMany({ where: pageWhere, orderBy: [{ created_at: 'desc' }, { id: 'desc' }], take: p.limit + 1 }),
    prisma.gapSignal.count({ where }),
  ]);
  const page = rows.slice(0, p.limit);
  const isDecided = (r: Row) => (!!r.feedback && !(r.feedback === 'skip' && r.feedback_at && new Date(r.feedback_at).getTime() < skippedUntil.getTime())) || p.decided.has(`signal:${r.id}`);
  const last = page[page.length - 1];
  return { items: page.map((r) => signalItem(r, isDecided(r), p.now)), total, next: rows.length > p.limit && last ? encodeCursor(last.created_at, last.id) : null, applied: p.f };
}

async function browseTriggers(prisma: PrismaLike, p: Page): Promise<BrowseResult> {
  const and: Row[] = [];
  if (p.f.account) and.push({ account_name: { equals: p.f.account, mode: 'insensitive' } });
  if (!p.f.archive) and.push({ dismissed: false });
  if (p.since) and.push({ first_seen_at: { gte: p.since } });
  const ledgerIds = [...p.decided].filter((k) => k.startsWith('trigger:')).map((k) => Number(k.slice('trigger:'.length))).filter((n) => Number.isInteger(n));
  if (p.f.decided === 'decided') and.push({ id: { in: ledgerIds } });
  if (p.f.decided === 'undecided' && ledgerIds.length) and.push({ id: { notIn: ledgerIds } });
  const where = { AND: and };
  const cursorId = p.cursor ? Number(p.cursor.id) : null;
  if (p.cursor && !Number.isInteger(cursorId)) throw new BrowseCursorError();
  const pageWhere = { AND: [...and, ...(p.cursor ? [{ OR: [{ first_seen_at: { lt: p.cursor.at } }, { first_seen_at: { equals: p.cursor.at }, id: { lt: cursorId } }] }] : [])] };
  const [rows, total]: [Row[], number] = await Promise.all([
    prisma.pounceTrigger.findMany({ where: pageWhere, orderBy: [{ first_seen_at: 'desc' }, { id: 'desc' }], take: p.limit + 1 }),
    prisma.pounceTrigger.count({ where }),
  ]);
  const page = rows.slice(0, p.limit);
  const names = [...new Set(page.map((t) => String(t.account_name ?? '')).filter(Boolean))];
  const known: Array<{ name: string }> = names.length && typeof prisma?.account?.findMany === 'function' ? await prisma.account.findMany({ where: { name: { in: names, mode: 'insensitive' } }, select: { name: true } }).catch(() => []) : [];
  const knownOf = (name: string) => known.find((k) => k.name.toLowerCase() === name.toLowerCase())?.name ?? null;
  const last = page[page.length - 1];
  return { items: page.map((t) => triggerItem(t, knownOf(String(t.account_name ?? '')), p.decided.has(`trigger:${t.id}`), p.now)), total, next: rows.length > p.limit && last ? encodeCursor(last.first_seen_at, last.id) : null, applied: p.f };
}
