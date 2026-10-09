/**
 * THE REFRESHED-PLAN PREVIEW (seller acceptance follow-up, 2026-10-09). READ ONLY.
 *
 *   npx tsx scripts/gap/preview-refreshed-plan.ts [--out docs/gap/REFRESHED_PLAN_PREVIEW_2026-10-09.md] [--top 10]
 *
 * Runs the one day builder, the plan composition, the assignment builder and the intelligence ranker against the
 * database the environment names (production, when the operator hands it the production variables) and writes what
 * GAP WOULD plan now beside what it DID plan (the stored plan rows for the day), with the evidence, the preparation and
 * the coverage per item. Every external action is disabled: the Prisma client is wrapped so that every write (create,
 * update, upsert, delete, executeRaw) is intercepted, logged and answered with a stub; nothing is sent, drafted,
 * enrolled, queued or written; no model is called (the loaders call none). The intercepted writes are listed at the
 * end of the receipt as proof. The receipt refuses to write itself when any text shaped like a secret is in it.
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { loadWorkDay } from '../../src/lib/gap/work/load-day';
import { decisionIdsFromCandidates, itemsForDay, loadDayPlan, loadPreviousPlan, markCarried, type DayPlan, type PlanItem } from '../../src/lib/gap/work/plan';
import { buildAssignment } from '../../src/lib/gap/work/assignment';
import * as assignmentModule from '../../src/lib/gap/work/assignment';
import { loadIntelligence } from '../../src/lib/gap/work/intel';
import { loadInDealsSummary } from '../../src/lib/gap/deals/in-deals';
import { dealCoverageFrom } from '../../src/lib/gap/work/deal-coverage';
import { nyDay } from '../../src/lib/gap/work/dates';
import type { WorkCard } from '../../src/lib/gap/work/list';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };
const OUT = arg('--out') ?? 'docs/gap/REFRESHED_PLAN_PREVIEW_2026-10-09.md';
const TOP = Number(arg('--top') ?? 10);
const WRITE_METHODS = new Set(['create', 'createMany', 'createManyAndReturn', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany']);

/** A Prisma client whose writes are intercepted: reads pass through, writes are logged and answered with a stub. */
function readOnly(real: PrismaClient): { client: unknown; writes: string[] } {
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
            // The stub answers the row the caller would have written (an upsert's create merged with its update), so a
            // reader of the returned row (the in-deals summary cache) sees what production would see.
            return { id: `readonly_${n}`, created_at: new Date(), updated_at: new Date(), ...(args.where ?? {}), ...(args.data ?? {}), ...(args.create ?? {}), ...(args.update ?? {}) };
          };
        }
        return Reflect.get(t, prop);
      },
    });
  const client: unknown = new Proxy(real as unknown as Record<string, unknown>, {
    get(t, prop) {
      const key = String(prop);
      if (key === '$transaction') {
        return async (fnOrArray: unknown) => (typeof fnOrArray === 'function' ? (fnOrArray as (tx: unknown) => Promise<unknown>)(client) : Promise.all(fnOrArray as Promise<unknown>[]));
      }
      if (key === '$executeRaw' || key === '$executeRawUnsafe') {
        return async () => { n += 1; writes.push(key); return 0; };
      }
      const v = Reflect.get(t, prop);
      if (v && typeof v === 'object' && !key.startsWith('$') && !key.startsWith('_') && typeof (v as Record<string, unknown>).findMany === 'function') return modelProxy(key, v as Record<string, unknown>);
      return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(t) : v;
    },
  });
  return { client, writes };
}

const SECRET_SHAPES = [/AIza[0-9A-Za-z_-]{20,}/, /sk-[A-Za-z0-9]{16,}/, /postgres(ql)?:\/\//, /BEGIN PRIVATE KEY/, /[0-9a-f]{64}/i, /ya29\.[A-Za-z0-9_-]{20,}/, /1\/\/[A-Za-z0-9_-]{30,}/];
const esc = (s: string | null | undefined) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
const section = (text: string, head: string): string[] => {
  const lines = text.split('\n');
  const i = lines.findIndex((l) => l.startsWith(head));
  if (i < 0) return [];
  const out: string[] = [];
  for (const l of lines.slice(i + 1)) { if (!l.trim()) break; out.push(l.trim()); }
  return out;
};
const line = (text: string, head: string): string | null => text.split('\n').find((l) => l.startsWith(head))?.slice(head.length).trim() ?? null;

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set (the runner hands the production variables to this process; nothing is printed)');
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('connection_limit', '2');
  const real = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  const { client, writes } = readOnly(real);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma = client as any;
  const now = new Date();
  const day = nyDay(now);
  const L: string[] = [];
  try {
    const t0 = Date.now();
    const load = await loadWorkDay(prisma, { lane: false, preview: false, fresh: true, now });
    const decisionIds = decisionIdsFromCandidates(load.data.workInput.candidates);
    const previous = await loadPreviousPlan(prisma, day, { now }).catch(() => null);
    const refreshed: PlanItem[] = markCarried(itemsForDay(load.day, day, { decisionIds }), previous);
    const stored: DayPlan | null = await loadDayPlan(prisma, day).catch(() => null);
    const cardsByAccount = new Map<string, WorkCard>(load.cards.map((c) => [c.accountName, c]));
    const plan: DayPlan = { day, plannedAt: now.toISOString(), items: refreshed, counts: load.day.counts, fresh: false };
    // Builder B's assignability (merged later): read when exported, else every item is assignable.
    const assignable = (assignmentModule as unknown as { assignable?: (p: unknown, plan: DayPlan, item: PlanItem) => Promise<{ ok: boolean; reason?: string } | boolean> }).assignable;
    const top: Array<{ item: PlanItem; card: WorkCard | undefined; prepared: string; why: string; know: string[]; move: string | null; coverage: string | null; held: string | null }> = [];
    for (const item of refreshed.slice(0, TOP)) {
      const built = await buildAssignment(prisma, { plan, item, revision: 0, baseUrl: 'https://modex-gtm.vercel.app', actionSecret: null, commandsEnabled: false, now }).catch((e) => ({ text: `(assignment could not be built: ${e instanceof Error ? e.message : String(e)})`, prepared: { kind: 'none' as const }, subject: '', html: '', contentHash: '' }));
      const a = assignable ? await assignable(prisma, plan, item).catch(() => null) : null;
      const held = a === null ? null : typeof a === 'boolean' ? (a ? null : 'held') : a.ok ? null : (a.reason ?? 'held');
      top.push({
        item,
        card: cardsByAccount.get(item.accountName),
        prepared: built.prepared.kind === 'email' ? `an email to ${built.prepared.to ?? 'the person'}, subject "${built.prepared.subject}"` : 'nothing prepared',
        why: line(built.text, 'Why now:') ?? item.why,
        know: section(built.text, 'What we know:'),
        move: line(built.text, 'The move:'),
        coverage: line(built.text, 'Not read this time:') ?? line(built.text, 'Partly read:'),
        held,
      });
    }
    const summary = await loadInDealsSummary(prisma, { now }).catch(() => null);
    const intel = await loadIntelligence(prisma, { now, coverage: dealCoverageFrom(summary) }).catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
    const ms = Date.now() - t0;

    L.push('# Refreshed-plan preview (seller acceptance follow-up, October 9, 2026)');
    L.push('');
    L.push(`STATUS: PREVIEW, generated ${now.toISOString()} by scripts/gap/preview-refreshed-plan.ts against the database the environment named, READ ONLY (every write intercepted; the list is in section 7). Nothing was sent, drafted, queued or written. Not a plan GAP made: the day's stored plan is unchanged until an operator refreshes it.`);
    L.push('<!-- verified:2026-10-09 -->');
    L.push('');
    L.push('## 1. What GAP planned (the stored plan for the day)');
    L.push('');
    if (!stored) L.push('No stored plan for this day.');
    else {
      L.push(`Stored plan for ${stored.day}, written ${stored.plannedAt}${(stored as { revision?: number }).revision ? `, revision ${(stored as { revision?: number }).revision}` : ''}: ${stored.items.length} items.`);
      L.push('');
      L.push('| # | Account | Kind | Title | Why |');
      L.push('|---|---|---|---|---|');
      for (const it of stored.items) L.push(`| ${it.rank + 1} | ${esc(it.accountName)} | ${it.kind} | ${esc(it.title)} | ${esc(it.why).slice(0, 140)} |`);
    }
    L.push('');
    L.push(`## 2. What GAP would plan now (${refreshed.length} items; the top ${Math.min(TOP, refreshed.length)} with their evidence)`);
    L.push('');
    L.push('| # | Account | Kind | Title | Ranked here because | Prepared | Held |');
    L.push('|---|---|---|---|---|---|---|');
    for (const t of top) L.push(`| ${t.item.rank + 1} | ${esc(t.item.accountName)} | ${t.item.kind} | ${esc(t.item.title)} | ${esc(t.card?.rankWhy ?? t.item.why).slice(0, 160)} | ${esc(t.prepared).slice(0, 80)} | ${t.held ?? ''} |`);
    L.push('');
    for (const t of top) {
      L.push(`### ${t.item.rank + 1}. ${t.item.accountName}: ${t.item.title}`);
      L.push('');
      L.push(`- Why now: ${t.why}`);
      if (t.card?.rankWhy) L.push(`- Ranked here because: ${t.card.rankWhy}`);
      const avail = (t.card as { availability?: { line: string } } | undefined)?.availability;
      if (avail) L.push(`- Availability: ${avail.line}`);
      if (t.item.context?.lastExchange) L.push(`- Last exchange: ${t.item.context.lastExchange}`);
      if (t.item.context?.nextAction) L.push(`- Next action on record: ${t.item.context.nextAction}`);
      if (t.item.context?.source) L.push(`- Source: ${t.item.context.source}${t.item.context.date ? ` (${t.item.context.date.slice(0, 10)})` : ''}`);
      if (t.item.carriedFrom) L.push(`- Carried from the ${t.item.carriedFrom} plan.`);
      L.push(`- GAP has prepared: ${t.prepared}.`);
      if (t.move) L.push(`- The move: ${t.move}`);
      if (t.know.length) { L.push('- What we know:'); for (const k of t.know) L.push(`  ${k}`); }
      L.push(`- Coverage: ${t.coverage ?? 'nothing reported as unread by the Ask context (coverage reporting lands with builder C)'}`);
      if (t.held) L.push(`- Held from assignment: ${t.held}`);
      L.push('');
    }
    L.push('## 3. The difference');
    L.push('');
    if (stored) {
      const was = new Map(stored.items.map((i) => [i.key, i]));
      const is = new Map(refreshed.map((i) => [i.key, i]));
      const added = refreshed.filter((i) => !was.has(i.key));
      const removed = stored.items.filter((i) => !is.has(i.key));
      const moved = refreshed.filter((i) => was.has(i.key) && (was.get(i.key)!.rank !== i.rank)).map((i) => ({ i, from: was.get(i.key)!.rank + 1, to: i.rank + 1 }));
      L.push(`Added (${added.length}): ${added.map((i) => `${i.accountName} (${i.kind}: ${i.title})`).join('; ') || 'none'}.`);
      L.push('');
      L.push(`Removed (${removed.length}): ${removed.map((i) => `${i.accountName} (${i.kind}: ${i.title})`).join('; ') || 'none'}.`);
      L.push('');
      L.push(`Moved (${moved.length}): ${moved.map((m) => `${m.i.accountName} ${m.from} to ${m.to}`).join('; ') || 'none'}.`);
    } else L.push('No stored plan to compare with.');
    L.push('');
    L.push('## 4. Southern Glazer\'s, Swire and Kenco, specifically');
    L.push('');
    for (const name of ['Southern Glazer', 'Swire', 'Kenco']) {
      const wasRows = stored?.items.filter((i) => i.accountName.includes(name)) ?? [];
      const isRows = refreshed.filter((i) => i.accountName.includes(name));
      const card = [...cardsByAccount.values()].find((c) => c.accountName.includes(name));
      L.push(`### ${name}`);
      L.push('');
      L.push(`- Stored plan: ${wasRows.length ? wasRows.map((i) => `#${i.rank + 1} ${i.kind} "${i.title}" (${i.why})`).join('; ') : 'not on it'}.`);
      L.push(`- Refreshed: ${isRows.length ? isRows.map((i) => `#${i.rank + 1} ${i.kind} "${i.title}" (${i.why})`).join('; ') : 'not an item'}.`);
      if (card) {
        L.push(`- The card: tier ${card.tier ?? '?'}, state "${card.state}", why "${card.why}"${card.rankWhy ? `, ranked: ${card.rankWhy}` : ''}.`);
        const avail = (card as { availability?: { line: string } }).availability;
        if (avail) L.push(`- Availability: ${avail.line}`);
      } else L.push('- No card today (parked or absent).');
      L.push(`- Parked/snoozed/waiting rows naming it: ${[...load.day.waiting.filter((w) => w.accountName.includes(name)).map((w) => `waiting: ${w.line}`), ...load.day.snoozed.filter((s) => s.accountName.includes(name)).map((s) => `snoozed: ${s.line}`)].join('; ') || 'none'}.`);
      L.push('');
    }
    L.push('### Parked for availability (out-of-office notices whose return day passed; never items)');
    L.push('');
    const parkedAvail = load.cards.filter((c) => (c as { availability?: unknown }).availability || /^Back since/.test(c.state));
    if (!parkedAvail.length) L.push('none');
    for (const c of parkedAvail) {
      const a = (c as { availability?: { line: string } }).availability;
      L.push(`- ${c.accountName}: tier ${c.tier ?? '?'}, "${c.state}"; ${a ? a.line : c.why}`);
    }
    L.push(`Counts: availability ${(load.day.counts as { availability?: number }).availability ?? 'not counted'}, parked ${load.day.counts.parked}.`);
    L.push('');
    L.push('## 5. The intelligence beside the plan');
    L.push('');
    if ('error' in intel) L.push(`The intelligence could not be read: ${intel.error}`);
    else {
      const pursued = intel.pursued ?? [];
      L.push(`Pursued (${pursued.length}):`);
      for (const p of pursued) {
        const px = p as unknown as { placedVia?: string | null; placementChanged?: boolean; placementLine?: string | null; ambiguousAmong?: string[]; ambiguityLine?: string | null; dealLine?: string | null };
        const where = p.accountName ?? (px.ambiguityLine ? `AMBIGUOUS: ${px.ambiguityLine}` : p.accountHint ? `${p.accountHint} (no account yet)` : 'No account yet');
        L.push(`- ${p.title}: ${where}${px.placedVia ? ` (placed via ${px.placedVia})` : ''}${px.dealLine ? `; ${px.dealLine}` : ''}; status ${p.status}; angle: ${p.angle ? esc(p.angle.whyItMatters).slice(0, 160) : 'none'}${px.placementLine ? `; ${px.placementLine}` : ''}`);
      }
      L.push('');
      L.push(`People who wrote in, ranked (${intel.people.length} shown):`);
      for (const p of intel.people.slice(0, 8)) {
        const px = p as unknown as { placedVia?: string | null; ambiguityLine?: string | null; line?: string | null };
        L.push(`- ${p.accountName ?? (px.ambiguityLine ? `AMBIGUOUS: ${px.ambiguityLine}` : p.accountHint ?? 'unplaced')}${px.placedVia ? ` (placed via ${px.placedVia})` : ''}: ${esc(p.title)}; ${esc(px.line ?? '').slice(0, 220)}`);
      }
      L.push('');
      L.push(`Signals ranked (${intel.signals.length} shown): ${intel.signals.slice(0, 6).map((s) => `${s.accountName ?? s.accountHint ?? 'unplaced'}: ${esc(s.title).slice(0, 60)}`).join('; ')}`);
      L.push('');
      L.push(`Selection: ${esc(JSON.stringify((intel as unknown as { selection?: unknown }).selection ?? null)).slice(0, 400)}`);
    }
    L.push('');
    L.push('## 6. Coverage of the read');
    L.push('');
    L.push(`- In-deals read: ${summary?.status ?? 'not read'}${summary && 'checkedAt' in summary && (summary as { checkedAt?: string }).checkedAt ? ` at ${(summary as { checkedAt?: string }).checkedAt}` : ''}; accounts in open deals: ${summary?.status === 'complete' ? summary.accounts.length : 'unknown'}.`);
    L.push(`- Cockpit read at ${load.read.at} (${load.read.fromCache ? 'from cache' : 'fresh'}); counts: ${esc(JSON.stringify(load.day.counts))}; waiting ${load.day.waiting.length}; snoozed ${load.day.snoozed.length}.`);
    L.push(`- GAP mailbox configured for Sent reads: ${process.env.GAP_GMAIL_USER_EMAIL ? 'yes' : 'no (quiet and answer-owed count our side only when it is)'}.`);
    L.push(`- HubSpot token present: ${process.env.HUBSPOT_ACCESS_TOKEN ? 'yes' : 'no'}.`);
    L.push(`- Elapsed: ${ms} ms.`);
    L.push('');
    L.push('## 7. Writes intercepted (proof the run wrote nothing)');
    L.push('');
    L.push(writes.length ? writes.map((w) => `- ${w}`).join('\n') : '- none attempted');
    L.push('');
    const text = L.join('\n');
    for (const re of SECRET_SHAPES) if (re.test(text)) throw new Error(`refusing to write the preview: text shaped like a secret matched ${re}`);
    writeFileSync(OUT, text, 'utf8');
    console.log(`wrote ${OUT}: ${refreshed.length} items, stored ${stored?.items.length ?? 0}, top ${top.length}, writes intercepted ${writes.length}, ${ms} ms`);
  } finally {
    await real.$disconnect().catch(() => undefined);
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
