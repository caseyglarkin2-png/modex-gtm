/**
 * THE RECURRING CLAWD IMPORT (intelligence wiring, IW07 on a schedule, 2026-10-09). Server only.
 *
 * Reads the Clawd signal hunter's read-only export (`GET /api/yardflow/signals/export`, builder B's endpoint on the
 * control plane) from the cursor the last `intelligence.imported` ledger row recorded, in bounded pages (at most
 * MAX_PAGES of PAGE_LIMIT per run), with one retry on a network failure, including the retained low-score candidates,
 * and hands each page to `importIntelligenceBatch` with the page's cursor and the producer's state. A failure writes
 * a `failed` ledger row (health and the briefing's coverage paragraph show it) and ends the run; the next run resumes
 * from the last good cursor. Nothing here posts to Slack, writes HubSpot, queues research, drafts or sends.
 */
import { CLAWD_PRODUCER, mapClawdPage, type ClawdExportPage } from './clawd-export';
import { importIntelligenceBatch, type ImportResult } from './intelligence-import';
import { INTEL_IMPORTED_EVENT } from './intelligence-record';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const CLAWD_IMPORT_MAX_PAGES = 3;
export const CLAWD_IMPORT_PAGE_LIMIT = 200;
export const CLAWD_IMPORT_TIMEOUT_MS = 20_000;

export interface ClawdImportInput {
  now: Date;
  baseUrl: string;
  token: string;
  maxPages?: number;
  pageLimit?: number;
  candidates?: boolean;
  minRelevance?: number;
  actor?: string;
  /** Tests inject the fetch; the default is the global fetch with a timeout. */
  fetchImpl?: typeof fetch;
  retryDelayMs?: number;
}

export type ClawdImportResult =
  | { ok: true; pages: number; items: number; mapped: number; skipped: number; accepted: number; duplicates: number; revised: number; invalid: number; cursorFrom: string | null; cursorTo: string | null; more: boolean }
  | { ok: false; error: string; kind: 'auth' | 'network' | 'shape'; pages: number; cursorFrom: string | null; ledgerId: string | null };

export class ClawdExportError extends Error {
  constructor(message: string, readonly kind: 'auth' | 'network' | 'shape') {
    super(message);
  }
}

/** The cursor the newest ledger row for the producer recorded, or null for the start. */
export async function storedClawdCursor(prisma: PrismaLike): Promise<string | null> {
  if (typeof prisma?.gapAuditEvent?.findFirst !== 'function') return null;
  const row: { payload: unknown } | null = await prisma.gapAuditEvent.findFirst({ where: { kind: INTEL_IMPORTED_EVENT, subject_type: 'producer', subject_id: CLAWD_PRODUCER }, orderBy: [{ created_at: 'desc' }], select: { payload: true } }).catch(() => null);
  const p = row?.payload && typeof row.payload === 'object' ? (row.payload as Record<string, unknown>) : null;
  return typeof p?.cursor === 'string' && p.cursor ? p.cursor : null;
}

async function fetchPage(input: ClawdImportInput, after: string | null): Promise<ClawdExportPage> {
  const url = new URL(`${input.baseUrl.replace(/\/$/, '')}/api/yardflow/signals/export`);
  url.searchParams.set('limit', String(input.pageLimit ?? CLAWD_IMPORT_PAGE_LIMIT));
  if (after) url.searchParams.set('after', after);
  if ((input.minRelevance ?? 0) > 0) url.searchParams.set('min_relevance', String(input.minRelevance));
  if (input.candidates !== false) url.searchParams.set('include', 'candidates');
  const f = input.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLAWD_IMPORT_TIMEOUT_MS);
  let res: Response;
  try {
    res = await f(url.toString(), { headers: { Authorization: `Bearer ${input.token}`, Accept: 'application/json' }, signal: controller.signal });
  } catch (e) {
    throw new ClawdExportError(`network: ${e instanceof Error ? e.message : String(e)}`, 'network');
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 401 || res.status === 403) throw new ClawdExportError(`the export refused the token (${res.status})`, 'auth');
  if (!res.ok) throw new ClawdExportError(`the export answered ${res.status}`, 'network');
  const body = (await res.json().catch(() => null)) as ClawdExportPage | null;
  if (!body || !Array.isArray(body.items)) throw new ClawdExportError('the export answered without items', 'shape');
  return { items: body.items, next: typeof body.next === 'string' && body.next ? body.next : null, count: body.items.length, source: String(body.source ?? '') };
}

async function fetchWithRetry(input: ClawdImportInput, after: string | null): Promise<ClawdExportPage> {
  try {
    return await fetchPage(input, after);
  } catch (e) {
    if (e instanceof ClawdExportError && e.kind === 'network') {
      await new Promise((r) => setTimeout(r, input.retryDelayMs ?? 1500));
      return fetchPage(input, after);
    }
    throw e;
  }
}

export async function runClawdImport(prisma: PrismaLike, input: ClawdImportInput): Promise<ClawdImportResult> {
  const actor = input.actor ?? 'cron:gap-clawd-import';
  const maxPages = Math.max(1, input.maxPages ?? CLAWD_IMPORT_MAX_PAGES);
  const cursorFrom = await storedClawdCursor(prisma);
  const runId = `clawd-export:${input.now.toISOString()}`;
  let after = cursorFrom;
  let pages = 0;
  let items = 0;
  let mapped = 0;
  let skipped = 0;
  const totals = { accepted: 0, duplicates: 0, revised: 0, invalid: 0 };
  let more = false;
  let lastCursor = cursorFrom;
  for (let i = 0; i < maxPages; i += 1) {
    let page: ClawdExportPage;
    try {
      page = await fetchWithRetry(input, after);
    } catch (e) {
      const err = e instanceof ClawdExportError ? e : new ClawdExportError(e instanceof Error ? e.message : String(e), 'network');
      const payload = { runId, runIds: [runId], cursor: lastCursor, accepted: totals.accepted, duplicates: totals.duplicates, revised: totals.revised, invalid: totals.invalid, reportedOnFrom: null, reportedOnTo: null, producerState: { status: 'failed', detail: err.message.slice(0, 300) }, at: input.now.toISOString() };
      const row: { id: string } | null = typeof prisma?.gapAuditEvent?.create === 'function' ? await prisma.gapAuditEvent.create({ data: { kind: INTEL_IMPORTED_EVENT, actor, subject_type: 'producer', subject_id: CLAWD_PRODUCER, payload }, select: { id: true } }).catch(() => null) : null;
      return { ok: false, error: err.message, kind: err.kind, pages, cursorFrom, ledgerId: row?.id ?? null };
    }
    pages += 1;
    items += page.items.length;
    const m = mapClawdPage(page.items, { capturedOn: input.now.toISOString().slice(0, 10), runId });
    mapped += m.records.length;
    skipped += m.skipped;
    // The page's own position when it is the last one (next null): the consumer resumes after it next time.
    const pageCursor = page.next ?? (page.items.length ? lastCursor : lastCursor);
    const r: ImportResult = await importIntelligenceBatch(prisma, { records: m.records, actor, now: input.now, producer: CLAWD_PRODUCER, runId, cursor: page.next ?? pageCursor, producerState: m.skipped ? { status: 'partial', detail: `${m.skipped} item${m.skipped === 1 ? '' : 's'} had no title and no text` } : { status: 'ok' } });
    totals.accepted += r.accepted;
    totals.duplicates += r.duplicates;
    totals.revised += r.revised;
    totals.invalid += r.invalid;
    lastCursor = page.next ?? lastCursor;
    if (!page.next) { more = false; break; }
    after = page.next;
    more = true;
  }
  return { ok: true, pages, items, mapped, skipped, ...totals, cursorFrom, cursorTo: lastCursor, more };
}
