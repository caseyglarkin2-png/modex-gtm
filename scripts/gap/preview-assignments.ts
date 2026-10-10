/**
 * THE ASSIGNMENT PACKETS PREVIEW (the Gmail action UI audit, GUI-01 and GUI-12, 2026-10-10). READ ONLY against production.
 *
 *   npx tsx scripts/gap/preview-assignments.ts [--accounts "Kenco,The Boston Beer Company,PepsiCo,Walmart Inc.,Keurig Dr Pepper"]
 *       [--out docs/gap/ASSIGNMENT_PACKETS_PREVIEW_2026-10-10.md] [--html docs/gap/ASSIGNMENT_PACKETS_PREVIEW_2026-10-10.html]
 *
 * Renders, with the deployed renderer (work/assignment.ts buildAssignment) and the stored plan of the day, the
 * assignment email each named account's plan item would receive (text and HTML), plus one information-only
 * intelligence item as the briefing prints it, so the audit's defects can be checked against what the seller would
 * actually read. Every production write is intercepted (the same proxy as the briefing preview); nothing is sent,
 * drafted, enrolled, queued or stored; the receipt refuses to write itself when any text shaped like a secret is in it.
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { buildAssignment } from '../../src/lib/gap/work/assignment';
import { loadDayPlan, type DayPlan, type PlanItem } from '../../src/lib/gap/work/plan';
import { renderBriefing } from '../../src/lib/gap/work/briefing';
import { defaultIntel } from '../../src/lib/gap/work/briefing-send';
import { loadInDealsSummary } from '../../src/lib/gap/deals/in-deals';
import { nyDay } from '../../src/lib/gap/work/dates';
import { accountHref } from '../../src/lib/gap/account-intel/href';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };
const ACCOUNTS = (arg('--accounts') ?? 'Kenco,The Boston Beer Company,PepsiCo,Walmart Inc.,Keurig Dr Pepper').split(',').map((s) => s.trim()).filter(Boolean);
const OUT = arg('--out') ?? 'docs/gap/ASSIGNMENT_PACKETS_PREVIEW_2026-10-10.md';
const HTML = arg('--html') ?? 'docs/gap/ASSIGNMENT_PACKETS_PREVIEW_2026-10-10.html';
const BASE = 'https://modex-gtm.vercel.app';
const WRITE_METHODS = new Set(['create', 'createMany', 'createManyAndReturn', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany']);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function readOnly(real: PrismaClient): { client: Any; writes: string[] } {
  const writes: string[] = [];
  let n = 0;
  const modelProxy = (model: string, target: Record<string, unknown>) => new Proxy(target, { get(t, prop) { const key = String(prop); if (WRITE_METHODS.has(key)) return async (args: Any = {}) => { n += 1; writes.push(`${model}.${key}`); if (key.endsWith('Many')) return { count: 0 }; return { id: `readonly_${n}`, created_at: new Date(), updated_at: new Date(), ...(args.where ?? {}), ...(args.data ?? {}), ...(args.create ?? {}), ...(args.update ?? {}) }; }; return Reflect.get(t, prop); } });
  const client: Any = new Proxy(real as unknown as Record<string, unknown>, { get(t, prop) { const key = String(prop); if (key === '$transaction') return async (f: unknown) => (typeof f === 'function' ? (f as (tx: unknown) => Promise<unknown>)(client) : Promise.all(f as Promise<unknown>[])); if (key === '$executeRaw' || key === '$executeRawUnsafe') return async () => { n += 1; writes.push(key); return 0; }; const v = Reflect.get(t, prop); if (v && typeof v === 'object' && !key.startsWith('$') && !key.startsWith('_') && typeof (v as Record<string, unknown>).findMany === 'function') return modelProxy(key, v as Record<string, unknown>); return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(t) : v; } });
  return { client, writes };
}
const SECRET_SHAPES = [/AIza[0-9A-Za-z_-]{20,}/, /sk-[A-Za-z0-9]{16,}/, /postgres(ql)?:\/\//, /BEGIN PRIVATE KEY/, /ya29\.[A-Za-z0-9_-]{20,}/, /1\/\/[A-Za-z0-9_-]{30,}/, /Bearer [A-Za-z0-9._-]{20,}/];
const guard = (text: string, what: string) => { for (const s of SECRET_SHAPES) if (s.test(text)) throw new Error(`refusing to write ${what}: a value shaped like a secret (${s}) is in it`); };
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('connection_limit', '2');
  const realClient = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  const { client: prisma, writes } = readOnly(realClient);
  const now = new Date();
  const day = nyDay(now);
  const L: string[] = [];
  const H: string[] = [];
  try {
    const plan: DayPlan | null = await loadDayPlan(prisma, day).catch(() => null);
    if (!plan) throw new Error(`no stored plan for ${day}`);
    L.push('# Assignment packets preview (the Gmail action UI audit, October 10, 2026)', '');
    L.push(`STATUS: RECEIPT. Rendered ${now.toISOString()} with the deployed renderer against production, READ ONLY (every write intercepted, listed at the end). The stored plan of ${day}: revision ${plan.revision ?? 0}, ${plan.items.length} items, planned ${plan.plannedAt}. Each packet below is the assignment email the item would receive (its subject, text and HTML), followed by one information-only intelligence item as the briefing prints it. Nothing was sent.`, '');
    H.push(`<h1>Assignment packets preview (October 10, 2026)</h1><p style="color:#666">Read only; the stored plan of ${esc(day)}, revision ${plan.revision ?? 0}.</p>`);
    const found: Array<{ account: string; item: PlanItem | null }> = ACCOUNTS.map((a) => ({ account: a, item: plan.items.find((it) => it.accountName.toLowerCase() === a.toLowerCase()) ?? plan.items.find((it) => it.accountName.toLowerCase().includes(a.toLowerCase().split(' ')[0])) ?? null }));
    L.push('## The plan, in order', '', '| # | Account | Kind | Title | Person |', '|---|---|---|---|---|');
    plan.items.forEach((it, i) => L.push(`| ${i + 1} | ${it.accountName} | ${it.kind} | ${it.title.replace(/\|/g, '/')} | ${it.person?.name ?? ''} |`));
    L.push('');
    for (const f of found) {
      L.push(`## ${f.account}`, '');
      if (!f.item) { L.push(`No plan item at ${f.account} today (the account is not on the day's list).`, ''); H.push(`<h2>${esc(f.account)}</h2><p>No plan item today.</p>`); continue; }
      const built = await buildAssignment(prisma, { plan, item: f.item, revision: plan.revision ?? 0, baseUrl: BASE, actionSecret: null, commandsEnabled: true, now }).catch((e) => ({ subject: '(failed)', text: `(assignment could not be built: ${e instanceof Error ? e.message : String(e)})`, html: '', contentHash: '', prepared: { kind: 'none' as const }, move: '', hold: null }));
      L.push(`Item ${f.item.rank + 1} of ${plan.items.length}: ${f.item.kind}, ${f.item.title}. Prepared: ${built.prepared.kind}${built.hold ? ` (held: ${built.hold.reason})` : ''}.`, '', `Subject: ${built.subject}`, '', '```text', built.text, '```', '');
      H.push(`<h2>${esc(f.account)}</h2><p style="color:#666">${esc(built.subject)}</p><div style="border:1px solid #ddd;padding:12px;max-width:640px">${built.html || `<pre>${esc(built.text)}</pre>`}</div>`);
    }
    // The information-only item: the newest imported record with substance, as the briefing prints it (no plan).
    const summary = await loadInDealsSummary(prisma, { now }).catch(() => null);
    const intel = await defaultIntel(prisma, now, { inDeals: async () => summary });
    const one = [...(intel.reports ?? []), ...intel.signals].find((s) => s.substance && s.substance.producer !== 'clawd_signal_hunter') ?? (intel.reports ?? [])[0] ?? intel.signals[0] ?? null;
    if (one) {
      const links = { start: `${BASE}/gap/`, work: `${BASE}/gap/`, item: (it: PlanItem) => `${BASE}${it.href}`, decide: () => null, account: (name: string) => `${BASE}${accountHref(name)}/`, intelligence: `${BASE}/gap/intelligence/` };
      const only = { ...intel, signals: one.kind === 'signal' && !one.substance ? [one] : [], reports: one.substance ? [one] : [], knowledge: [], triggers: [], people: [], pursued: [], totals: { signals: 0, triggers: 0, people: 0, reports: 1, knowledge: 0 } };
      const r = renderBriefing({ plan: { ...plan, items: [] }, dayToken: 'preview', links, commandsEnabled: false, legacyDigest: false, intel: only }, now);
      const section = r.text.split('\n').slice(r.text.split('\n').findIndex((l) => l.startsWith('Intelligence worth a look'))).join('\n').split('\n\nNothing on the list')[0];
      L.push('## An information-only signal, as the briefing prints it', '', '```text', section, '```', '');
      H.push(`<h2>An information-only signal</h2><div style="border:1px solid #ddd;padding:12px;max-width:640px">${r.html}</div>`);
    }
    L.push('## Intercepted production writes (proof of read-only)', '', writes.length ? writes.map((w) => `- ${w}`).join('\n') : '- none', '', '<!-- verified:2026-10-10 -->');
    const md = L.join('\n');
    guard(md, OUT);
    const html = `<!doctype html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Assignment packets preview</title></head><body style="font-family:system-ui,sans-serif;line-height:1.45;padding:12px">${H.join('\n')}</body></html>\n`;
    guard(html, HTML);
    writeFileSync(OUT, `${md}\n`);
    writeFileSync(HTML, html);
    console.log(`wrote ${OUT} and ${HTML}: ${found.filter((f) => f.item).length} of ${found.length} accounts on the plan; ${writes.length} intercepted writes`);
  } finally {
    await realClient.$disconnect().catch(() => undefined);
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
