/**
 * KNOWN VERSUS USED: the knowledge coverage audit (GAP OS knowledge program, 2026-10-09). READ ONLY.
 *
 *   npx tsx scripts/gap/knowledge-coverage-audit.ts [--vault <dir>] [--out docs/gap/KNOWLEDGE_COVERAGE_AUDIT_2026-10-09.md]
 *
 * For every account in an open deal (the in-deals read) and every account of a person who wrote in (the intelligence
 * ranker's people), the audit counts what each source HOLDS (the vault's account note with its next action, its
 * meeting notes, its Fireflies calls by participant domain, its people notes; GAP's placed inbound; our Sent through
 * the GAP sender when configured; HubSpot's notes, calls, meetings and logged emails on the open deals) against what
 * GAP USES on the account today (the Ask context's story lines, buyer words and coverage line, the same composition
 * the assignment prints). Every write on the Prisma client is intercepted (none expected: the Ask context reads).
 * HubSpot is read through the associations endpoints only. Nothing is sent, drafted or queued; no model is called.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { loadInDealsSummary } from '../../src/lib/gap/deals/in-deals';
import { dealCoverageFrom } from '../../src/lib/gap/work/deal-coverage';
import { loadIntelligence } from '../../src/lib/gap/work/intel';
import { buildAskContext } from '../../src/lib/gap/ask/context';
import { gapGmailSender } from '../../src/lib/gap/execution/gap-sender';
import { listSentTo } from '../../src/lib/email/gmail-inbox';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };
const VAULT = arg('--vault') ?? 'C:/Users/casey/Documents/Obsidian/YardFlow-GTM-Obsidian-Vault';
const OUT = arg('--out') ?? 'docs/gap/KNOWLEDGE_COVERAGE_AUDIT_2026-10-09.md';
const WRITE_METHODS = new Set(['create', 'createMany', 'createManyAndReturn', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany']);
const DAY_MS = 86_400_000;

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
            return { id: `readonly_${n}`, created_at: new Date(), updated_at: new Date(), ...(args.where ?? {}), ...(args.data ?? {}), ...(args.create ?? {}), ...(args.update ?? {}) };
          };
        }
        return Reflect.get(t, prop);
      },
    });
  const client: unknown = new Proxy(real as unknown as Record<string, unknown>, {
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

interface Note { path: string; kind: string; fm: Record<string, string>; body: string; date: string | null; participants: string[] }
function parseNote(path: string, text: string): Note {
  const fm: Record<string, string> = {};
  let body = text;
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (m) {
    for (const line of m[1].split(/\r?\n/)) { const k = /^([A-Za-z_]+):\s*(.*)$/.exec(line); if (k) fm[k[1]] = k[2].trim(); }
    body = text.slice(m[0].length);
  }
  const base = path.split('/').pop() ?? path;
  const date = fm.date ?? fm.captured ?? (/^(\d{4}-\d{2}-\d{2})/.exec(base)?.[1] ?? null);
  const participants = [...new Set([...(fm.participants ?? '').split(/[,\s]+/), ...(body.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [])].map((s) => s.trim().toLowerCase()).filter((s) => /@/.test(s)))];
  const folder = path.split('/')[0];
  const kind = fm.type ?? (folder === '02_Accounts' ? 'account' : folder === '03_People' ? 'person' : folder === '04_Deals' ? 'deal' : folder === '05_Meetings' ? 'meeting' : 'raw');
  return { path, kind, fm, body, date, participants };
}
function readVault(): Note[] {
  const out: Note[] = [];
  for (const folder of ['00_Inbox/raw', '02_Accounts', '03_People', '04_Deals', '05_Meetings']) {
    const dir = join(VAULT, folder);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) if (f.endsWith('.md')) out.push(parseNote(`${folder}/${f}`, readFileSync(join(dir, f), 'utf8')));
  }
  return out;
}
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\b(inc|llc|co|corp|corporation|company|usa|the)\b/g, '').replace(/\s+/g, ' ').trim();
const esc = (s: string | null | undefined) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
const SECRET_SHAPES = [/AIza[0-9A-Za-z_-]{20,}/, /sk-[A-Za-z0-9]{16,}/, /postgres(ql)?:\/\//, /BEGIN PRIVATE KEY/, /ya29\.[A-Za-z0-9_-]{20,}/];

async function hubspotCounts(dealIds: string[], token: string | undefined): Promise<Record<string, number | 'not_read'>> {
  const kinds = ['notes', 'calls', 'meetings', 'emails'];
  const out: Record<string, number | 'not_read'> = {};
  if (!token) { for (const k of kinds) out[k] = 'not_read'; return out; }
  for (const k of kinds) {
    let total = 0;
    for (const id of dealIds) {
      try {
        const r = await fetch(`https://api.hubapi.com/crm/v4/objects/deals/${id}/associations/${k}?limit=100`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) });
        if (!r.ok) { out[k] = 'not_read'; break; }
        const j = (await r.json()) as { results?: unknown[] };
        total += (j.results ?? []).length;
      } catch { out[k] = 'not_read'; break; }
    }
    if (out[k] !== 'not_read') out[k] = total;
  }
  return out;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set (the runner hands the production variables to this process)');
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('connection_limit', '2');
  const real = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  const { client, writes } = readOnly(real);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma = client as any;
  const now = new Date();
  const t0 = Date.now();
  try {
    const vault = readVault();
    const accountsVault = vault.filter((n) => n.kind === 'account');
    const summary = await loadInDealsSummary(prisma, { now }).catch(() => null);
    const coverage = dealCoverageFrom(summary);
    const intel = await loadIntelligence(prisma, { now, coverage }).catch(() => null);
    const dealAccounts = summary?.status === 'complete' ? summary.accounts : [];
    const peopleAccounts = [...new Set((intel?.people ?? []).map((p) => p.accountName).filter((x): x is string => !!x))];
    const names = [...new Set([...dealAccounts.map((a) => a.accountName), ...peopleAccounts])];
    const accountRows: Array<{ name: string; aliases: string[] }> = await Promise.all(names.map(async (name) => ({ name, aliases: (await prisma.gapAccountAlias.findMany({ where: { account_name: name }, select: { alias: true } }).catch(() => [])).map((a: { alias: string }) => a.alias) })));
    const sender = gapGmailSender();
    const token = process.env.HUBSPOT_ACCESS_TOKEN?.trim();
    const rows: string[] = [];
    const totals = { accounts: 0, vaultNote: 0, nextAction: 0, meetingNotes: 0, calls: 0, callsUsed: 0, inbound: 0, sent: 0, sentNotRead: 0, hsEngagements: 0, storiesWithCall: 0, storiesWithNextAction: 0, coverageSaysVault: 0 };
    for (const a of accountRows) {
      totals.accounts += 1;
      const keys = [a.name, ...a.aliases].map(norm);
      const note = accountsVault.find((n) => keys.includes(norm(n.fm.company ?? n.path.replace(/^02_Accounts\//, '').replace(/\.md$/, ''))) || keys.some((k) => norm(n.path).includes(k)));
      const domain = (note?.fm.domain ?? '').toLowerCase() || null;
      const domains = new Set([domain, ...(await prisma.persona.findMany({ where: { account_name: a.name }, select: { email: true } }).catch(() => [])).map((p: { email: string | null }) => (p.email ?? '').split('@')[1]?.toLowerCase())].filter((d): d is string => !!d && !/^(gmail|yahoo|outlook|hotmail)\.com$/.test(d)));
      const meetings = vault.filter((n) => n.kind === 'meeting' && keys.some((k) => norm(n.fm.account ?? n.path).includes(k)));
      const calls = vault.filter((n) => n.kind === 'raw' && (n.fm.source === 'fireflies' || /call/.test(n.path)) && n.participants.some((p) => [...domains].some((d) => p.endsWith(`@${d}`))));
      const people = vault.filter((n) => n.kind === 'person' && (keys.some((k) => norm(n.body.slice(0, 600)).includes(k)) || n.participants.some((p) => [...domains].some((d) => p.endsWith(`@${d}`)))));
      const inbound = await prisma.inboundMessage.count({ where: { OR: [...domains].map((d) => ({ from_email: { endsWith: `@${d}`, mode: 'insensitive' } })), received_at: { gte: new Date(now.getTime() - 180 * DAY_MS) } } }).catch(() => 0);
      const personaEmails: string[] = (await prisma.persona.findMany({ where: { account_name: a.name }, select: { email: true } }).catch(() => [])).map((p: { email: string | null }) => p.email).filter((e: string | null): e is string => !!e);
      let sent: number | 'not_read' = 'not_read';
      if (sender && personaEmails.length) {
        try { let c = 0; for (const e of personaEmails.slice(0, 6)) c += (await listSentTo(sender, e, Math.floor((now.getTime() - 180 * DAY_MS) / 1000), Math.floor(now.getTime() / 1000))).length; sent = c; } catch { sent = 'not_read'; }
      }
      const dealIds = dealAccounts.find((d) => d.accountName === a.name)?.deals.map((d) => d.id).filter((x): x is string => !!x) ?? [];
      const hs = dealIds.length ? await hubspotCounts(dealIds, token) : { notes: 0, calls: 0, meetings: 0, emails: 0 };
      const ctx = await buildAskContext(prisma, a.name, now).catch(() => null);
      const storyText = [...(ctx?.story ?? []).flatMap((s) => s.lines.map((l) => l.text)), ...((ctx as { sellerNote?: { lines: string[] } | null } | null)?.sellerNote?.lines ?? [])].join(' | ');
      const buyerSaid = (ctx?.buyerSaid ?? []).length;
      const storyHasCall = /\b(call|meeting|met|discovery|demo)\b/i.test(storyText);
      const storyHasNext = !!note?.fm.next_action && storyText.toLowerCase().includes(note.fm.next_action.slice(0, 30).toLowerCase());
      const cov = (ctx as { coverageLine?: string | null } | null)?.coverageLine ?? null;
      const hsSum = Object.values(hs).reduce<number>((s, v) => s + (typeof v === 'number' ? v : 0), 0);
      if (note) totals.vaultNote += 1;
      if (note?.fm.next_action) totals.nextAction += 1;
      totals.meetingNotes += meetings.length;
      totals.calls += calls.length;
      if (calls.length && storyHasCall) totals.callsUsed += 1;
      totals.inbound += inbound;
      if (typeof sent === 'number') totals.sent += sent; else totals.sentNotRead += 1;
      totals.hsEngagements += hsSum;
      if (storyHasCall) totals.storiesWithCall += 1;
      if (storyHasNext) totals.storiesWithNextAction += 1;
      if (cov && /the vault \((synced|read|[0-9]+ calls)/i.test(cov)) totals.coverageSaysVault += 1;
      const lastCall = calls.map((c) => c.date ?? '').sort().pop() || '';
      const lastMeeting = meetings.map((c) => c.date ?? '').sort().pop() || '';
      rows.push(`| ${esc(a.name)} | ${note ? 'yes' : 'no'}${note?.fm.next_action ? ` (next action due ${note.fm.next_action_due || 'undated'})` : ''} | ${meetings.length}${lastMeeting ? ` (last ${lastMeeting})` : ''} | ${calls.length}${lastCall ? ` (last ${lastCall})` : ''} | ${people.length} | ${inbound} | ${sent} | ${Object.entries(hs).map(([k, v]) => `${k} ${v}`).join(', ')} | ${(ctx?.story ?? []).reduce((s, x) => s + x.lines.length, 0)} lines, ${buyerSaid} buyer words${storyHasCall ? ', a call or meeting named' : ', no call or meeting named'}${note?.fm.next_action ? storyHasNext ? ', the vault next action named' : ', the vault next action NOT named' : ''} | ${esc(cov).slice(0, 140)} |`);
    }
    const ms = Date.now() - t0;
    const L: string[] = [];
    L.push('# Known versus used: the knowledge coverage audit (October 9, 2026)');
    L.push('');
    L.push(`STATUS: AUDIT, generated ${now.toISOString()} by scripts/gap/knowledge-coverage-audit.ts, READ ONLY (every Prisma write intercepted; HubSpot read through the associations endpoints only; the vault read from the local folder on the operator's machine, which production cannot read). Baseline for the knowledge program; regenerate rather than edit.`);
    L.push('<!-- verified:2026-10-09 -->');
    L.push('');
    L.push(`Accounts audited: ${totals.accounts} (${dealAccounts.length} in open deals under a ${summary?.status ?? 'not read'} CRM read, plus the accounts of the people who wrote in). Vault: ${vault.length} notes read (${accountsVault.length} account notes, ${vault.filter((n) => n.kind === 'meeting').length} meeting notes, ${vault.filter((n) => n.kind === 'raw').length} raw captures of which ${vault.filter((n) => n.fm.source === 'fireflies').length} are Fireflies calls). GAP sender configured for the Sent read: ${sender ? 'yes' : 'no'}. HubSpot token present: ${token ? 'yes' : 'no'}.`);
    L.push('');
    L.push('## The table');
    L.push('');
    L.push('KNOWN (what the sources hold) | USED (what the Ask context, the same composition the assignment prints, says today)');
    L.push('');
    L.push('| Account | Vault account note | Vault meeting notes | Fireflies calls (by participant domain) | Vault people notes | GAP inbound (180 d) | Our Sent (180 d) | HubSpot engagements on the open deals | The story today | Coverage line today |');
    L.push('|---|---|---|---|---|---|---|---|---|---|');
    L.push(...rows);
    L.push('');
    L.push('## Totals');
    L.push('');
    L.push(`- Accounts with a vault account note: ${totals.vaultNote} of ${totals.accounts}; with a vault next action: ${totals.nextAction}; stories that name that next action today: ${totals.storiesWithNextAction}.`);
    L.push(`- Vault meeting notes on these accounts: ${totals.meetingNotes}; Fireflies calls: ${totals.calls}; accounts whose story names any call or meeting today: ${totals.storiesWithCall} (of ${totals.accounts}); accounts with calls whose story names one: ${totals.callsUsed}.`);
    L.push(`- GAP inbound in 180 days: ${totals.inbound}; our Sent in 180 days: ${totals.sent} counted, ${totals.sentNotRead} accounts not read (${sender ? 'a read failed' : 'no GAP sender in this run'}); HubSpot engagements on the open deals: ${totals.hsEngagements}.`);
    L.push(`- Coverage lines that say the vault was read: ${totals.coverageSaysVault} of ${totals.accounts}.`);
    L.push(`- Elapsed ${ms} ms. Writes intercepted: ${writes.length ? writes.join(', ') : 'none'}.`);
    L.push('');
    const text = L.join('\n');
    for (const re of SECRET_SHAPES) if (re.test(text)) throw new Error(`refusing to write: text shaped like a secret matched ${re}`);
    writeFileSync(OUT, text, 'utf8');
    console.log(`wrote ${OUT}: ${totals.accounts} accounts, vault note ${totals.vaultNote}, calls ${totals.calls} (used ${totals.callsUsed}), meetings ${totals.meetingNotes}, sent ${totals.sent} (+${totals.sentNotRead} not read), hs ${totals.hsEngagements}, ${ms} ms, writes ${writes.length}`);
  } finally {
    await real.$disconnect().catch(() => undefined);
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.stack : String(e)); process.exit(1); });
