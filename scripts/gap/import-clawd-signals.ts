/**
 * IMPORT CLAWD'S STORED SIGNALS INTO GAP (intelligence wiring, IW10, 2026-10-09). DRY RUN BY DEFAULT.
 *
 *   npx tsx scripts/gap/import-clawd-signals.ts                      (reads pages, prints the counts and a sample, writes nothing)
 *   npx tsx scripts/gap/import-clawd-signals.ts --from <cursor>      (start at a cursor instead of the ledger's)
 *   npx tsx scripts/gap/import-clawd-signals.ts --max 3              (pages per run; default 5)
 *   npx tsx scripts/gap/import-clawd-signals.ts --min-relevance 40   (the export's filter; default 0, no threshold)
 *   npx tsx scripts/gap/import-clawd-signals.ts --candidates         (include the hunter's kept below-40 candidates)
 *   npx tsx scripts/gap/import-clawd-signals.ts --apply              (imports; needs GAP_RECONCILE_APPLY=yes and
 *                                                                     GAP_RECONCILE_HOST equal to the DATABASE_URL host)
 *
 * Pages GET <CLAWD_BASE_URL>/api/yardflow/signals/export (Bearer MC_API_TOKEN, never printed) from the cursor on the
 * newest `intelligence.imported` ledger row for clawd_signal_hunter (payload.cursor), maps each item through the pure
 * mapper (src/lib/gap/signals/clawd-export.ts) and, under --apply, imports page by page through importIntelligenceBatch
 * with that page's `next` as the cursor, so a run that stops mid-way resumes from the last page that landed. A network
 * or auth failure writes a `producerState.status = 'failed'` ledger row ONLY under --apply (so health shows it); a dry
 * run prints the failure and stops. Relevance is a label on the record, never a gate here. Imported text is data.
 */
import { PrismaClient } from '@prisma/client';
import { CLAWD_PRODUCER, mapClawdPage, type ClawdExportPage } from '../../src/lib/gap/signals/clawd-export';
import { importIntelligenceBatch } from '../../src/lib/gap/signals/intelligence-import';
import { INTEL_IMPORTED_EVENT, type IntelligenceRecordInput } from '../../src/lib/gap/signals/intelligence-record';

const DEFAULT_BASE_URL = 'https://clawd-control-plane-production.up.railway.app';
const PAGE_LIMIT = 200;
const FETCH_TIMEOUT_MS = 30_000;

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
};
const APPLY = process.argv.includes('--apply');
const CANDIDATES = process.argv.includes('--candidates');
const MAX_PAGES = Number(arg('--max') ?? 5);
const MIN_RELEVANCE = Number(arg('--min-relevance') ?? 0);
const FROM = arg('--from');
const BASE_URL = (process.env.CLAWD_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, '');

class ExportFetchError extends Error {
  constructor(message: string, readonly kind: 'auth' | 'network' | 'shape') {
    super(message);
  }
}

async function fetchPage(after: string | null): Promise<ClawdExportPage> {
  const token = process.env.MC_API_TOKEN;
  if (!token) throw new ExportFetchError('MC_API_TOKEN is not set', 'auth');
  const url = new URL(`${BASE_URL}/api/yardflow/signals/export`);
  url.searchParams.set('limit', String(PAGE_LIMIT));
  if (after) url.searchParams.set('after', after);
  if (MIN_RELEVANCE > 0) url.searchParams.set('min_relevance', String(MIN_RELEVANCE));
  if (CANDIDATES) url.searchParams.set('include', 'candidates');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, signal: controller.signal });
  } catch (e) {
    throw new ExportFetchError(`network: ${e instanceof Error ? e.message : String(e)}`, 'network');
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 401 || res.status === 403) throw new ExportFetchError(`auth refused (${res.status})`, 'auth');
  if (!res.ok) throw new ExportFetchError(`export answered ${res.status}`, 'network');
  const body = (await res.json().catch(() => null)) as ClawdExportPage | null;
  if (!body || !Array.isArray(body.items)) throw new ExportFetchError('export answered without items', 'shape');
  return { items: body.items, next: typeof body.next === 'string' && body.next ? body.next : null, count: body.items.length, source: String(body.source ?? '') };
}

async function storedCursor(prisma: PrismaClient): Promise<string | null> {
  const row: { payload: unknown } | null = await prisma.gapAuditEvent.findFirst({
    where: { kind: INTEL_IMPORTED_EVENT, subject_type: 'producer', subject_id: CLAWD_PRODUCER },
    orderBy: [{ created_at: 'desc' }],
    select: { payload: true },
  });
  const p = row?.payload && typeof row.payload === 'object' ? (row.payload as Record<string, unknown>) : null;
  return typeof p?.cursor === 'string' && p.cursor ? p.cursor : null;
}

async function writeFailedRow(prisma: PrismaClient, cursor: string | null, runId: string, detail: string, now: Date): Promise<string | null> {
  const payload = { runId, runIds: [runId], cursor, accepted: 0, duplicates: 0, revised: 0, invalid: 0, reportedOnFrom: null, reportedOnTo: null, producerState: { status: 'failed', detail }, at: now.toISOString() };
  const row: { id: string } | null = await prisma.gapAuditEvent.create({ data: { kind: INTEL_IMPORTED_EVENT, actor: 'script:import-clawd-signals', subject_type: 'producer', subject_id: CLAWD_PRODUCER, payload }, select: { id: true } }).catch(() => null);
  return row?.id ?? null;
}

function sample(records: IntelligenceRecordInput[]): void {
  for (const r of records.slice(0, 10)) {
    const dates = `event ${r.eventDate ?? 'none'}, reported ${r.reportedOn} (${r.reportedOnBasis})`;
    console.log(`  ${r.title || '(no title)'} | ${r.producerStatus} | ${dates}`);
  }
}

async function main() {
  if (!Number.isFinite(MAX_PAGES) || MAX_PAGES <= 0) throw new Error('--max must be a positive number');
  if (!Number.isFinite(MIN_RELEVANCE) || MIN_RELEVANCE < 0) throw new Error('--min-relevance must be zero or more');
  let prisma: PrismaClient | null = null;
  if (APPLY || !FROM) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set (the ledger holds the cursor; pass --from to skip it)');
    const url = new URL(process.env.DATABASE_URL);
    if (APPLY) {
      if (process.env.GAP_RECONCILE_APPLY !== 'yes') throw new Error('--apply needs GAP_RECONCILE_APPLY=yes');
      if (!process.env.GAP_RECONCILE_HOST || url.hostname !== process.env.GAP_RECONCILE_HOST) throw new Error('--apply needs GAP_RECONCILE_HOST equal to the database host');
    }
    url.searchParams.set('connection_limit', '1');
    prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  }
  const now = new Date();
  const capturedOn = now.toISOString().slice(0, 10);
  const runId = `clawd-export:${now.toISOString()}`;
  try {
    let cursor: string | null = FROM ?? (prisma ? await storedCursor(prisma) : null);
    console.log(`${APPLY ? 'APPLY' : 'DRY RUN'}: ${BASE_URL} from ${cursor ?? 'the start'}, up to ${MAX_PAGES} pages${MIN_RELEVANCE > 0 ? `, min_relevance ${MIN_RELEVANCE}` : ''}${CANDIDATES ? ', with candidates' : ''}`);

    let pages = 0;
    let items = 0;
    let mapped = 0;
    let skipped = 0;
    let candidates = 0;
    const totals = { accepted: 0, duplicates: 0, revised: 0, invalid: 0 };
    const shown: IntelligenceRecordInput[] = [];
    while (pages < MAX_PAGES) {
      let page: ClawdExportPage;
      try {
        page = await fetchPage(cursor);
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        if (APPLY && prisma) {
          const id = await writeFailedRow(prisma, cursor, runId, `page ${pages + 1}: ${detail}`, new Date());
          console.log(`FAILED at page ${pages + 1} (${detail}); ledger row ${id ?? 'not written'}; ${pages} page(s) landed before it`);
        } else {
          console.log(`FAILED at page ${pages + 1}: ${detail}; nothing written (dry run)`);
        }
        process.exitCode = 1;
        return;
      }
      pages += 1;
      items += page.items.length;
      candidates += page.items.filter((i) => i.candidate === true).length;
      const m = mapClawdPage(page.items, { capturedOn, runId });
      mapped += m.records.length;
      skipped += m.skipped;
      if (shown.length < 10) shown.push(...m.records.slice(0, 10 - shown.length));
      if (APPLY && prisma && m.records.length) {
        const r = await importIntelligenceBatch(prisma, {
          records: m.records,
          actor: 'script:import-clawd-signals',
          now: new Date(),
          runId,
          cursor: page.next ?? cursor,
          producer: CLAWD_PRODUCER,
          producerState: pageState(m.records.length, page),
        });
        totals.accepted += r.accepted;
        totals.duplicates += r.duplicates;
        totals.revised += r.revised;
        totals.invalid += r.invalid;
        console.log(`  page ${pages}: ${page.items.length} items, accepted ${r.accepted}, duplicates ${r.duplicates}, revised ${r.revised}, invalid ${r.invalid}; ledger ${r.runs[0]?.ledgerId ?? 'none'}`);
      } else {
        console.log(`  page ${pages}: ${page.items.length} items, ${m.records.length} mapped, ${m.skipped} skipped${page.next ? '' : ' (last page)'}`);
      }
      if (!page.next) { cursor = page.next; break; }
      cursor = page.next;
    }
    console.log(`${APPLY ? 'IMPORTED' : 'WOULD IMPORT'}: ${pages} page(s), ${items} items, ${mapped} mapped, ${skipped} skipped (no title or text), ${candidates} candidate(s)${APPLY ? `; accepted ${totals.accepted}, duplicates ${totals.duplicates}, revised ${totals.revised}, invalid ${totals.invalid}` : ''}`);
    console.log(cursor ? `next cursor: ${cursor}` : 'no next cursor: the export is read to its end');
    if (shown.length) { console.log('sample:'); sample(shown); }
  } finally {
    await prisma?.$disconnect().catch(() => undefined);
  }
}

/** The producer's own account of a page: ok when every item mapped, partial when some had no title or text. */
function pageState(mappedCount: number, page: ClawdExportPage): { status: 'ok' | 'partial'; detail?: string } {
  return mappedCount === page.items.length ? { status: 'ok' } : { status: 'partial', detail: `${page.items.length - mappedCount} item(s) had no title or text` };
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
