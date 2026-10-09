/**
 * THE INTELLIGENCE BRIEFING PREVIEW (intelligence wiring, IW14, 2026-10-09). READ ONLY against production.
 *
 *   npx tsx scripts/gap/preview-intelligence-briefing.ts [--fixture tests/fixtures/gap/intelligence-import-2026-10-09.json]
 *       [--out docs/gap/INTELLIGENCE_BRIEFING_PREVIEW_2026-10-09.md] [--html docs/gap/INTELLIGENCE_BRIEFING_PREVIEW_2026-10-09.html]
 *
 * The complete trace, producer -> record -> reader -> HTML/text email, on real data without a production write:
 *   1. the production client is wrapped so every write is intercepted and logged (preview-refreshed-plan.ts's proxy)
 *   2. the fixture's records are imported into an IN-MEMORY overlay (the test ledger database seeded with production's
 *      account names, aliases and canonical links, so the account resolver runs as it would)
 *   3. a hybrid client answers gap_signals and the import ledger from BOTH the overlay and production (merged, sorted
 *      by the query's own order, cut at its take), everything else from production
 *   4. the stored plan for the day, the intelligence (defaultIntel: the same reader the cron uses) and the renderer
 *      produce the email; the receipt says what the digest selected, what it omitted, which sources were read and
 *      which were not, and lists the intercepted writes as proof that nothing was sent, drafted, queued or stored.
 * The receipt refuses to write itself when any text shaped like a secret is in it.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { ledgerDb } from '../../tests/unit/gap/fixtures/ledger-db';
import { sortBy } from '../../tests/unit/gap/fixtures/where';
import { importIntelligenceBatch } from '../../src/lib/gap/signals/intelligence-import';
import { INTEL_IMPORTED_EVENT, producerLabel } from '../../src/lib/gap/signals/intelligence-record';
import { defaultIntel } from '../../src/lib/gap/work/briefing-send';
import { renderBriefing } from '../../src/lib/gap/work/briefing';
import { loadDayPlan, planDay, type DayPlan, type PlanItem } from '../../src/lib/gap/work/plan';
import { loadWorkDay } from '../../src/lib/gap/work/load-day';
import { loadInDealsSummary } from '../../src/lib/gap/deals/in-deals';
import { nyDay } from '../../src/lib/gap/work/dates';
import { accountHref } from '../../src/lib/gap/account-intel/href';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };
const FIXTURE = arg('--fixture') ?? 'tests/fixtures/gap/intelligence-import-2026-10-09.json';
const OUT = arg('--out') ?? 'docs/gap/INTELLIGENCE_BRIEFING_PREVIEW_2026-10-09.md';
const HTML = arg('--html') ?? 'docs/gap/INTELLIGENCE_BRIEFING_PREVIEW_2026-10-09.html';
const BASE = 'https://modex-gtm.vercel.app';
const WRITE_METHODS = new Set(['create', 'createMany', 'createManyAndReturn', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany']);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function readOnly(real: PrismaClient): { client: Any; writes: string[] } {
  const writes: string[] = [];
  let n = 0;
  const modelProxy = (model: string, target: Record<string, unknown>) =>
    new Proxy(target, {
      get(t, prop) {
        const key = String(prop);
        if (WRITE_METHODS.has(key)) {
          return async (args: { data?: Record<string, unknown>; create?: Record<string, unknown>; update?: Record<string, unknown>; where?: Record<string, unknown> } = {}) => {
            n += 1;
            writes.push(`${model}.${key}`);
            if (key.endsWith('Many')) return { count: 0 };
            return { id: `readonly_${n}`, created_at: new Date(), updated_at: new Date(), ...(args.where ?? {}), ...(args.data ?? {}), ...(args.create ?? {}), ...(args.update ?? {}) };
          };
        }
        return Reflect.get(t, prop);
      },
    });
  const client: Any = new Proxy(real as unknown as Record<string, unknown>, {
    get(t, prop) {
      const key = String(prop);
      if (key === '$transaction') return async (fnOrArray: unknown) => (typeof fnOrArray === 'function' ? (fnOrArray as (tx: unknown) => Promise<unknown>)(client) : Promise.all(fnOrArray as Promise<unknown>[]));
      if (key === '$executeRaw' || key === '$executeRawUnsafe') return async () => { n += 1; writes.push(key); return 0; };
      const v = Reflect.get(t, prop);
      if (v && typeof v === 'object' && !key.startsWith('$') && !key.startsWith('_') && typeof (v as Record<string, unknown>).findMany === 'function') return modelProxy(key, v as Record<string, unknown>);
      return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(t) : v;
    },
  });
  return { client, writes };
}

/** The overlay's rows and production's, merged by id, ordered by the query's own orderBy, cut at its take. */
function hybrid(real: Any, mem: Any, models: readonly string[]): Any {
  const merged = (model: string) => ({
    findMany: async (args: { where?: Any; orderBy?: Any; take?: number; skip?: number; select?: Any } = {}) => {
      const { take, skip, ...rest } = args;
      const [a, b] = await Promise.all([mem[model].findMany({ ...rest }), real[model].findMany({ ...rest })]);
      const rows = [...new Map([...a, ...b].map((r: Any) => [r.id, r])).values()];
      return sortBy(rows, args.orderBy).slice(skip ?? 0, (skip ?? 0) + (take ?? rows.length));
    },
    count: async (args: Any = {}) => (await mem[model].count(args)) + (await real[model].count(args)),
    findUnique: async (args: Any) => (await mem[model].findUnique(args)) ?? (await real[model].findUnique(args)),
    findFirst: async (args: Any) => (await mem[model].findFirst(args)) ?? (await real[model].findFirst(args)),
  });
  const views = Object.fromEntries(models.map((m) => [m, merged(m)]));
  return new Proxy(real, { get(t, prop) { const k = String(prop); return k in views ? views[k] : Reflect.get(t, prop); } });
}

const SECRET_SHAPES = [/AIza[0-9A-Za-z_-]{20,}/, /sk-[A-Za-z0-9]{16,}/, /postgres(ql)?:\/\//, /BEGIN PRIVATE KEY/, /ya29\.[A-Za-z0-9_-]{20,}/, /1\/\/[A-Za-z0-9_-]{30,}/, /Bearer [A-Za-z0-9._-]{20,}/];
const guard = (text: string, what: string) => { for (const s of SECRET_SHAPES) if (s.test(text)) throw new Error(`refusing to write ${what}: a value shaped like a secret (${s}) is in it`); };

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set (the runner hands the production variables to this process; nothing is printed)');
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('connection_limit', '2');
  const realClient = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  const { client: real, writes } = readOnly(realClient);
  const now = new Date();
  const day = nyDay(now);
  const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8')) as { capturedOn: string; sources: Array<{ producer: string; title: string; distinctReports: number; reports: Array<{ reportedOn: string; items: number }> }>; skippedCaptures: Array<{ producer: string; id: string; chars: number }>; records: unknown[] };
  const L: string[] = [];
  try {
    const t0 = Date.now();
    // 2. The overlay: production's account universe for the resolver, no signals, no ledger; then the import into it.
    const [accounts, aliases, links, companies] = await Promise.all([
      real.account.findMany({ select: { name: true, parent_brand: true, hubspot_company_id: true }, take: 5000 }),
      real.gapAccountAlias.findMany({ take: 5000 }).catch(() => []),
      real.canonicalAccountLink.findMany({ take: 5000 }).catch(() => []),
      real.canonicalCompany.findMany({ take: 5000 }).catch(() => []),
    ]);
    const mem = ledgerDb({ accounts, aliases, links, companies, signals: [], audit: [] }).client() as Any;
    const imported = await importIntelligenceBatch(mem, { records: fixture.records, actor: 'preview-harness', now });
    const overlayRows: Any[] = await mem.gapSignal.findMany({});
    // 3. The hybrid: signals and the import ledger from both; everything else production, read only.
    const prisma = hybrid(real, mem, ['gapSignal', 'gapAuditEvent']);
    // 4. The plan (the stored day, else planned read-only through the day builder), the intelligence, the email.
    const stored: DayPlan | null = await loadDayPlan(prisma, day).catch(() => null);
    const plan: DayPlan = stored ?? (await planDay(prisma, { now, load: async () => { const l = await loadWorkDay(prisma, { lane: false, preview: false, fresh: true, now }); return { day: l.day, candidates: l.data.workInput.candidates } as Any; } }, 'preview-harness'));
    const summary = await loadInDealsSummary(prisma, { now }).catch(() => null);
    const inventory = fixture.sources.map((s) => `${producerLabel(s.producer)} (${s.distinctReports} report${s.distinctReports === 1 ? '' : 's'}, ${s.reports.reduce((n, r) => n + r.items, 0)} items, through ${s.reports[s.reports.length - 1]?.reportedOn ?? '?'})`);
    // IW13: the same coverage paragraph the cron prints (the producer status over the overlay's import ledger and
    // production's vault ledger), plus what this process alone cannot read.
    const { loadProducerStatus, producerStatusLine } = await import('../../src/lib/gap/signals/producer-status');
    const statuses = await loadProducerStatus(prisma, now);
    const coverage = {
      sources: `${producerStatusLine(statuses)} The briefs' records were imported into this preview from the captured snapshots of ${fixture.capturedOn} (${inventory.join('; ')}).`,
      unavailable: 'our Gmail Sent (this process has no sender credential; production reads it).',
    };
    const intel = await defaultIntel(prisma, now, { inDeals: async () => summary, coverage: async () => coverage });
    const dayLinks = {
      start: `${BASE}/gap/`, work: `${BASE}/gap/`, item: (it: PlanItem) => `${BASE}${it.href}`, decide: () => null,
      account: (name: string) => `${BASE}${accountHref(name)}/`, deal: (name: string) => `${BASE}${accountHref(name)}/?view=brief`, intelligence: `${BASE}/gap/intelligence/`,
    };
    const rendered = renderBriefing({ plan, dayToken: 'preview', links: dayLinks, commandsEnabled: true, legacyDigest: false, intel, resend: false }, now);
    const ms = Date.now() - t0;
    const shown = [...intel.signals, ...intel.triggers, ...intel.people].filter((i) => rendered.digest.keys.includes(i.key));
    const byProducer = new Map<string, number>();
    for (const r of overlayRows) { const p = String(r.submitted_by ?? '').replace(/^import:/, ''); byProducer.set(p, (byProducer.get(p) ?? 0) + 1); }
    const importLedger: Any[] = await mem.gapAuditEvent.findMany({ where: { kind: INTEL_IMPORTED_EVENT } });

    L.push('# Intelligence briefing preview (intelligence wiring, October 9, 2026)');
    L.push('');
    L.push(`STATUS: RECEIPT. Rendered ${now.toISOString()} (${day} New York) in ${ms} ms against production data, READ ONLY: the fixture's records were imported into an in-memory overlay (never the production table), the intelligence was read from the overlay and production together, and every production write was intercepted (listed at the end). Nothing was sent, drafted, enrolled, queued or stored. The plan is ${stored ? `the stored day (revision ${stored.revision ?? 0}, planned ${stored.plannedAt})` : 'planned read-only by the day builder'}; Gmail Sent is not read by this process.`);
    L.push('');
    L.push('## The import (into the overlay)');
    L.push('');
    L.push(`- ${imported.accepted} accepted, ${imported.duplicates} duplicates, ${imported.revised} revised, ${imported.invalid} invalid of ${fixture.records.length} records; by producer: ${[...byProducer.entries()].map(([p, n]) => `${producerLabel(p)} ${n}`).join(', ')}.`);
    for (const l of importLedger) L.push(`- ledger ${INTEL_IMPORTED_EVENT} for ${producerLabel(l.subject_id)}: accepted ${l.payload.accepted}, invalid ${l.payload.invalid}, reports ${l.payload.reportedOnFrom} to ${l.payload.reportedOnTo}.`);
    if (imported.invalid) L.push(`- invalid: ${imported.items.filter((i) => i.outcome === 'invalid').slice(0, 10).map((i) => `#${i.index} ${i.producerItemId ?? '?'} (${i.reason})`).join('; ')}.`);
    const resolved = overlayRows.filter((r) => r.resolution === 'resolved').length;
    const ambiguous = overlayRows.filter((r) => r.resolution === 'ambiguous').length;
    L.push(`- account placement by the existing resolver: ${resolved} resolved, ${ambiguous} ambiguous, ${overlayRows.length - resolved - ambiguous} with no account (kept and shown as such).`);
    L.push('');
    L.push('## Sources: included and unavailable');
    L.push('');
    L.push('| Source | In this preview | How |');
    L.push('|---|---|---|');
    for (const s of fixture.sources) L.push(`| ${producerLabel(s.producer)} | included | ${s.distinctReports} reports through ${s.reports[s.reports.length - 1]?.reportedOn ?? '?'}, from the captured snapshot (a bounded thread read); ${s.reports.reduce((n, r) => n + r.items, 0)} items |`);
    L.push(`| GAP's own signals (discovery, shares, Pounce) | included | production rows, ${intel.totals.signals} undecided in all, ${intel.totals.triggers} live triggers |`);
    L.push(`| HubSpot deals (coverage) | ${summary ? `included (${summary.status})` : 'not read'} | the in-deals summary the day builds |`);
    L.push('| Clawd signal hunter | unavailable | no export endpoint on the producer yet (IW07 prepared, not deployed) |');
    L.push('| The vault (calls, meetings, next actions) | not in this digest | on the account stories and the people state since the knowledge program; a digest projection is IW06 |');
    L.push('| Gmail Sent | not read | this process has no GAP sender credential; production reads it |');
    L.push(`| Skipped captures | n/a | ${fixture.skippedCaptures.map((c) => `${producerLabel(c.producer)} ${c.id.slice(0, 12)} (${c.chars} chars, not a report)`).join('; ')} |`);
    L.push('');
    L.push('## The digest');
    L.push('');
    L.push(`- Shown ${rendered.digest.keys.length} (${rendered.digest.breakdown.reports} from the briefs, ${rendered.digest.breakdown.found} GAP found, ${rendered.digest.breakdown.triggers} triggers; ${intel.people.length} people), ${rendered.digest.omitted} omitted and reachable on the Intelligence page; ${rendered.digest.rotated} rotated.`);
    L.push(`- Subject: ${rendered.subject}`);
    L.push('');
    L.push('| Key | Producer | Account | Title | Truth |');
    L.push('|---|---|---|---|---|');
    for (const s of shown) L.push(`| ${s.key} | ${s.substance?.producerLabel ?? (s.kind === 'person' ? 'inbound' : s.source ?? '')} | ${s.accountName ?? (s.ambiguousAmong?.length ? `claimed by ${s.ambiguousAmong.join(' and ')}` : s.accountHint ? `${s.accountHint} (no account yet)` : 'no account yet')} | ${s.title.replace(/\|/g, '/')} | ${s.truth} |`);
    L.push('');
    L.push('## The email, as text');
    L.push('');
    L.push('```text');
    L.push(rendered.text);
    L.push('```');
    L.push('');
    L.push(`The HTML body is beside this receipt: ${HTML}.`);
    L.push('');
    // IW14: the named checks of the integrated replay, each a PASS or FAIL in words (never a claim without the check).
    const has = (s: string) => rendered.text.includes(s) && rendered.html.includes(s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
    const peopleEmails = intel.people.map((p) => p.id.toLowerCase());
    const overlayById = (producerItemId: string) => overlayRows.find((r) => String(r.metadata?.import?.producerItemId ?? '') === producerItemId);
    const subzero = overlayById('2026-10-08#250520610151');
    const worldMarket = overlayById('2026-10-08#252589576372');
    const kodiak = overlayById('2026-10-09#1');
    const checks: Array<[string, boolean, string]> = [
      ['Kodiak: the development and the supervised-operation caveat are in the text and the HTML', has('A safety driver remains behind the wheel; truck count, frequency, customers, and performance are undisclosed.') && has('HIGH on the supervised operation; LOW on driverless timing and scale'), kodiak ? `row ${kodiak.id}, resolution ${kodiak.resolution}` : 'no Kodiak row'],
      ['7-Eleven: the uncertainty survives in the overlay (what was not named)', !!overlayById('2026-10-09#2')?.metadata?.import?.text?.includes('No function, site, partner, budget, or deadline was named.'), overlayById('2026-10-09#2') ? `row ${overlayById('2026-10-09#2')!.id}` : 'no row'],
      ['Sub-Zero: the engagement record carries contact 250520610151 and engagement 118262547717', !!subzero && JSON.stringify(subzero.metadata?.import?.sourceRecordIds ?? []).includes('118262547717'), subzero ? `row ${subzero.id}, account ${subzero.account_name ?? 'none'} (${subzero.resolution})` : 'no row'],
      ['World Market: the record keeps "company association is not verified" and stays unresolved or ambiguous as the resolver says', !!worldMarket && String(worldMarket.metadata?.import?.uncertainty ?? '').includes('not verified'), worldMarket ? `row ${worldMarket.id}, account ${worldMarket.account_name ?? 'none'} (${worldMarket.resolution})` : 'no row'],
      ['Southern Glazer\'s: the May out-of-office writer is not a prospect to reengage (availability, parked), and not an intelligence item', !peopleEmails.some((e) => /sgws\.com|southernglazers/.test(e)) && !rendered.text.toLowerCase().includes('southern glazer'), `people listed: ${peopleEmails.length}`],
      ['Nothing imported became a plan item or an obligation', plan.items.every((it) => !it.key.startsWith('signal:')), `${plan.items.length} plan items`],
      ['No production write', writes.filter((w) => !w.startsWith('systemConfig.')).length === 0, writes.length ? writes.join(', ') : 'none'],
      ['Approval bindings untouched (no assignment, no approval row written)', !writes.some((w) => /gapAuditEvent|gapCompile|routingDecision/.test(w)), writes.join(', ') || 'none'],
    ];
    L.push('## Named checks (IW14)');
    L.push('');
    for (const [name, ok, detail] of checks) L.push(`- ${ok ? 'PASS' : 'FAIL'}: ${name} (${detail}).`);
    L.push('');
    L.push('## Intercepted production writes (proof of read-only)');
    L.push('');
    L.push(writes.length ? writes.map((w) => `- ${w}`).join('\n') : '- none');
    L.push('');
    L.push('<!-- verified:2026-10-09 -->');
    const md = L.join('\n');
    guard(md, OUT);
    guard(rendered.html, HTML);
    writeFileSync(OUT, `${md}\n`);
    writeFileSync(HTML, `<!doctype html>\n<html><head><meta charset="utf-8"><title>${rendered.subject.replace(/</g, '&lt;')}</title></head><body>${rendered.html}</body></html>\n`);
    console.log(`wrote ${OUT} and ${HTML}: ${rendered.digest.keys.length} shown, ${rendered.digest.omitted} omitted; ${writes.length} intercepted writes; ${imported.accepted} records imported into the overlay`);
  } finally {
    await realClient.$disconnect().catch(() => undefined);
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
