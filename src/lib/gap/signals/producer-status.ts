/**
 * PRODUCER STATUS (intelligence wiring, IW13, 2026-10-09). Server only; read only.
 *
 * The continuing sync, visible: one status per intelligence producer GAP knows (INTEL_PRODUCERS) or has ever heard
 * from (an `intelligence.imported` ledger row), read from the ledger the import writes and the rows it stored. The
 * state is said in words a seller can act on: current (the newest import is within the producer's cadence plus a
 * day), stalled since a date (older than that; never "zero results"), failed (the producer's own last run said so)
 * or never imported. The vault rides along as a pseudo-producer read from the `knowledge.vault_synced` rows the
 * local push and the cron write, so the briefing's one coverage paragraph (`producerStatusLine`) says every source
 * it read and every source it did not. Nothing here imports, fetches or calls anything.
 */
import { INTEL_IMPORTED_EVENT, INTEL_PRODUCERS, REPORT_ARCHIVE_CLASS, producerLabel } from './intelligence-record';
import { VAULT_SYNCED_KIND } from '../knowledge/vault-sync';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type ProducerState = 'current' | 'stale' | 'never' | 'failed';
export type ProducerRunStatus = 'ok' | 'partial' | 'failed';

export interface ProducerStatus {
  producer: string;
  label: string;
  cadenceDays: number;
  /** ISO instant of the newest import ledger row (its `at`, else its created_at); null when never. */
  lastImportAt: string | null;
  lastRunId: string | null;
  /** The newest report date the last import covered (YYYY-MM-DD). */
  lastReportedOn: string | null;
  lastCounts: { accepted: number; revised: number; duplicates: number; invalid: number } | null;
  lastProducerState: { status: ProducerRunStatus; detail: string | null } | null;
  /** The newest cursor the producer's export reached (a paged export); null when none was recorded. */
  cursor: string | null;
  /** Items retained from this producer (report containers excluded). */
  totalItems: number;
  /** Report containers retained (the archive). */
  totalReports: number;
  state: ProducerState;
  /** One sentence in words. */
  line: string;
}

export const VAULT_PRODUCER = 'vault';
export const VAULT_LABEL = 'the vault';
/** The vault's librarian pushes daily; the cron ticks twice an hour once its token is set. */
export const VAULT_CADENCE_DAYS = 1;
/** A producer the ledger names but INTEL_PRODUCERS does not: judged weekly until someone records its cadence. */
export const UNKNOWN_PRODUCER_CADENCE_DAYS = 7;
const LEDGER_PAGE = 500;

const DATE_WORDS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' };
/** "Oct 9, 2026" for an instant, on the seller's calendar. */
export const dayWords = (d: Date | string): string => new Date(d).toLocaleDateString('en-US', DATE_WORDS);
/** "Oct 9, 2026" for a YYYY-MM-DD value, no time zone shift. */
export const dateOnlyWords = (d: string): string => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day, 12)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};
const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

type LedgerRow = { subject_id: string; actor?: string | null; payload: unknown; created_at: Date | string };

function stateOf(lastAt: string | null, cadenceDays: number, failed: boolean, now: Date): ProducerState {
  if (!lastAt) return 'never';
  if (failed) return 'failed';
  return now.getTime() - new Date(lastAt).getTime() > (cadenceDays + 1) * 86_400_000 ? 'stale' : 'current';
}

function importLine(s: Omit<ProducerStatus, 'line'>): string {
  if (s.state === 'never') return `${s.label}: never imported.`;
  const counts = `${plural(s.totalReports, 'report')}, ${plural(s.totalItems, 'item')}${s.lastReportedOn ? `, reports through ${dateOnlyWords(s.lastReportedOn)}` : ''}`;
  const last = `last import ${dayWords(s.lastImportAt!)} (${counts})`;
  if (s.state === 'failed') return `${s.label}: ${last}; the last run failed${s.lastProducerState?.detail ? ` (${s.lastProducerState.detail})` : ''}.`;
  if (s.state === 'stale') return `${s.label}: ${last}; stalled since ${dayWords(s.lastImportAt!)}.`;
  const partial = s.lastProducerState?.status === 'partial' ? `; the last run was partial${s.lastProducerState.detail ? ` (${s.lastProducerState.detail})` : ''}` : '';
  return `${s.label}: ${last}${partial}; current.`;
}

/** One status per known producer and per producer the ledger names, plus the vault; every read soft. */
export async function loadProducerStatus(prisma: PrismaLike, now: Date, opts: { env?: Record<string, string | undefined> } = {}): Promise<ProducerStatus[]> {
  const rows: LedgerRow[] = typeof prisma?.gapAuditEvent?.findMany === 'function' ? await prisma.gapAuditEvent.findMany({ where: { kind: INTEL_IMPORTED_EVENT }, orderBy: { created_at: 'desc' }, take: LEDGER_PAGE, select: { subject_id: true, payload: true, created_at: true } }).catch(() => []) : [];
  const newest = new Map<string, LedgerRow>();
  const cursorOf = new Map<string, string>();
  for (const r of rows) {
    if (!newest.has(r.subject_id)) newest.set(r.subject_id, r);
    const c = (r.payload as { cursor?: unknown } | null)?.cursor;
    if (!cursorOf.has(r.subject_id) && typeof c === 'string' && c) cursorOf.set(r.subject_id, c);
  }
  const producers = [...new Set([...Object.keys(INTEL_PRODUCERS), ...newest.keys()])];
  const count = async (where: Record<string, unknown>): Promise<number> => (typeof prisma?.gapSignal?.count === 'function' ? prisma.gapSignal.count({ where }).catch(() => 0) : 0);
  const out: ProducerStatus[] = [];
  for (const producer of producers) {
    const r = newest.get(producer) ?? null;
    const p = (r?.payload && typeof r.payload === 'object' ? r.payload : {}) as Record<string, unknown>;
    const ps = p.producerState && typeof p.producerState === 'object' ? (p.producerState as { status?: unknown; detail?: unknown }) : null;
    const status: ProducerRunStatus | null = ps?.status === 'failed' || ps?.status === 'partial' || ps?.status === 'ok' ? ps.status : r ? 'ok' : null;
    const [totalItems, totalReports] = await Promise.all([count({ submitted_by: `import:${producer}`, source_class: { not: REPORT_ARCHIVE_CLASS } }), count({ submitted_by: `import:${producer}`, source_class: REPORT_ARCHIVE_CLASS })]);
    const lastImportAt = r ? new Date(typeof p.at === 'string' && !Number.isNaN(Date.parse(p.at)) ? p.at : r.created_at).toISOString() : null;
    const cadenceDays = INTEL_PRODUCERS[producer]?.cadenceDays ?? UNKNOWN_PRODUCER_CADENCE_DAYS;
    const base: Omit<ProducerStatus, 'line'> = {
      producer,
      label: producerLabel(producer),
      cadenceDays,
      lastImportAt,
      lastRunId: typeof p.runId === 'string' ? p.runId : null,
      lastReportedOn: typeof p.reportedOnTo === 'string' ? p.reportedOnTo : null,
      lastCounts: r ? { accepted: n(p.accepted), revised: n(p.revised), duplicates: n(p.duplicates), invalid: n(p.invalid) } : null,
      lastProducerState: status ? { status, detail: typeof ps?.detail === 'string' && ps.detail ? ps.detail.slice(0, 160) : null } : null,
      cursor: cursorOf.get(producer) ?? null,
      totalItems,
      totalReports,
      state: stateOf(lastImportAt, cadenceDays, status === 'failed', now),
    };
    out.push({ ...base, line: importLine(base) });
  }
  out.push(await vaultStatus(prisma, now, opts.env ?? process.env));
  return out;
}

/** The vault as a pseudo-producer: the newest knowledge.vault_synced row (the local push or the cron) and the notes held. */
async function vaultStatus(prisma: PrismaLike, now: Date, env: Record<string, string | undefined>): Promise<ProducerStatus> {
  const row: LedgerRow | null = typeof prisma?.gapAuditEvent?.findFirst === 'function' ? await prisma.gapAuditEvent.findFirst({ where: { kind: VAULT_SYNCED_KIND }, orderBy: { created_at: 'desc' }, select: { subject_id: true, actor: true, payload: true, created_at: true } }).catch(() => null) : null;
  const notes: number = typeof prisma?.gapKnowledgeNote?.count === 'function' ? await prisma.gapKnowledgeNote.count().catch(() => 0) : 0;
  const p = (row?.payload && typeof row.payload === 'object' ? row.payload : {}) as Record<string, unknown>;
  const counts = p.counts && typeof p.counts === 'object' ? (p.counts as Record<string, unknown>) : null;
  const tokenSet = !!env.GAP_VAULT_GITHUB_TOKEN?.trim();
  const local = !!row && (String(row.actor ?? '').startsWith('casey:') || String(row.subject_id ?? '').startsWith('local:'));
  const failed = !!row && p.ok === false;
  const lastImportAt = row ? new Date(row.created_at).toISOString() : null;
  const state = stateOf(lastImportAt, VAULT_CADENCE_DAYS, failed, now);
  const base: Omit<ProducerStatus, 'line'> = {
    producer: VAULT_PRODUCER,
    label: VAULT_LABEL,
    cadenceDays: VAULT_CADENCE_DAYS,
    lastImportAt,
    lastRunId: typeof p.commitSha === 'string' ? p.commitSha : null,
    lastReportedOn: typeof p.commitAt === 'string' && !Number.isNaN(Date.parse(p.commitAt)) ? p.commitAt.slice(0, 10) : null,
    lastCounts: row ? { accepted: n(counts?.written), revised: 0, duplicates: n(counts?.unchangedByGitSha) + n(counts?.unchangedBySha), invalid: Array.isArray(counts?.errors) ? counts.errors.length : n(counts?.errors) } : null,
    lastProducerState: row ? { status: failed ? 'failed' : n(counts?.remaining) > 0 ? 'partial' : 'ok', detail: typeof p.error === 'string' && p.error ? p.error.slice(0, 160) : null } : null,
    cursor: typeof p.etag === 'string' ? p.etag : null,
    totalItems: notes,
    totalReports: 0,
    state,
  };
  let line: string;
  if (!row) line = `${VAULT_LABEL}: never synced${tokenSet ? '' : '; the cron waits for its GitHub token'}.`;
  else if (failed) line = `${VAULT_LABEL}: the last sync failed ${dayWords(lastImportAt!)}${base.lastProducerState?.detail ? ` (${base.lastProducerState.detail})` : ''} (${plural(notes, 'note')} held).`;
  else if (local) line = `${VAULT_LABEL}: synced ${dayWords(lastImportAt!)} (${plural(notes, 'note')}) by the local push; ${tokenSet ? 'the cron has not run yet' : 'the cron waits for its GitHub token'}${state === 'stale' ? `; stalled since ${dayWords(lastImportAt!)}` : ''}.`;
  else line = `${VAULT_LABEL}: synced ${dayWords(lastImportAt!)} (${plural(notes, 'note')}) by the cron${p.skipped === 'unchanged' ? ', unchanged' : counts ? `, ${n(counts.written)} written, ${n(counts.remaining)} remaining` : ''}${state === 'stale' ? `; stalled since ${dayWords(lastImportAt!)}` : ''}.`;
  return { ...base, line };
}

/** The short form of one status, for the coverage paragraph. */
export function producerShort(s: ProducerStatus): string {
  const unit = s.producer === VAULT_PRODUCER ? 'note' : 'item';
  switch (s.state) {
    case 'current':
      return `${s.label} ${dayWords(s.lastImportAt!)} (${plural(s.totalItems, unit)})`;
    case 'stale':
      return `${s.label}: stalled since ${dayWords(s.lastImportAt!)}`;
    case 'failed':
      return `${s.label}: failed ${dayWords(s.lastImportAt!)}`;
    default:
      return `${s.label}: never ${s.producer === VAULT_PRODUCER ? 'synced' : 'imported'}`;
  }
}

/** The one coverage paragraph the briefing prints: what was read, then what was not. */
export function producerStatusLine(statuses: readonly ProducerStatus[]): string {
  const read = statuses.filter((s) => s.state === 'current').map(producerShort);
  const notRead = statuses.filter((s) => s.state !== 'current').map(producerShort);
  const first = read.length ? `Sources: ${read.join('; ')}.` : 'Sources: none read this time.';
  return notRead.length ? `${first} Not read this time: ${notRead.join('; ')}.` : first;
}
