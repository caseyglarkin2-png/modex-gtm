/**
 * Build a Tier-1 outreach send-queue WAVE: near-reference prospects whose company
 * already has a REAL email in our Persona records (no inference, low bounce risk),
 * the best logistics/ops contacts per company, excluding everyone we've already
 * emailed AND every company already taken by a prior wave.
 *
 * Each run auto-advances: it reads every prior send-queue-*.csv in the output dir
 * and excludes those emails + companies, so "give me the next N" just works.
 *
 * Output: a CSV (machine) + a Markdown pack (human / hand-off to the Gmail agent)
 * under output/prospect-discovery/. Run:
 *   npx tsx scripts/discovery/build-send-queue.ts \
 *     [--max-people 100] [--per-company 2] [--max-companies 50] \
 *     [--max-mi 50] [--date 2026-06-05] [--suffix wave2]
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { loadLatestScored, buildCuratedRows } from '@/lib/discovery/data';
import { rankWorklist, DEFAULT_WEIGHTS } from '@/lib/discovery/scoring';
import { buildOutreach } from '@/lib/discovery/outreach';
import { REFERENCE_SITES } from '@/lib/discovery/reference-sites';

// --- args -------------------------------------------------------------------
function flag(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const MAX_PEOPLE = Number(flag('max-people', '100'));
const PER_COMPANY = Number(flag('per-company', '2'));
const MAX_COMPANIES = Number(flag('max-companies', '50'));
const MAX_MI = Number(flag('max-mi', '50'));
const DATE = flag('date', '2026-06-05');
const SUFFIX = flag('suffix', 'wave2');

// --- env: DATABASE_URL from process.env, else the repo-root .env.local ---
function resolveDbUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const p of ['.env.local', 'C:/Users/casey/modex-gtm/.env.local']) {
    try {
      const line = fs.readFileSync(p, 'utf8').split('\n').find((l) => l.startsWith('DATABASE_URL='));
      if (line) return line.slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
    } catch { /* try next */ }
  }
  throw new Error('DATABASE_URL not found (set env or .env.local)');
}
const dbUrl = resolveDbUrl();
process.env.NEXT_PUBLIC_APP_URL ??= 'https://modex-gtm.vercel.app';
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

const FREE = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'me.com', 'live.com', 'msn.com', 'comcast.net', 'verizon.net']);
const GENERIC = new Set(['the', 'and', 'inc', 'llc', 'corp', 'company', 'co', 'group', 'logistics', 'distribution', 'warehouse', 'transport', 'transportation', 'services', 'supply', 'chain', 'foods', 'food', 'north', 'america', 'us', 'usa', 'international']);
const companyKey = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const brandToken = (s: string) => companyKey(s).split(' ').find((w) => w.length >= 3 && !GENERIC.has(w)) ?? null;
/** Non-generic company tokens length>=4 — used to sanity-check the email domain. */
const companyTokens = (s: string) => companyKey(s).split(' ').filter((w) => w.length >= 4 && !GENERIC.has(w));

// Rows that aren't real truck yards — retail/parcel storefronts slip through Places.
const STOREFRONT_RE = /drop ?box|\bstore\b|kiosk|locker|kinko|onsite|on-site|service ?point|access ?point|print|retail|ship ?center|office\b|notary|mailbox/i;

const FUNC_RE = /logistic|supply chain|transport|distribution|warehouse|yard|fleet|dock|freight|procure|^operations|of operations|network/i;
const NEG_RE = /\bit\b|information tech|human resource|\bhr\b|finance|account(ing|s)|legal|counsel|marketing|\bsales\b|recruit|talent|communicat|brand|software|engineer(ing)?\b|data|analytics|security/i;
const SENIOR_RE = /chief|c[a-z]o\b|\bvp\b|vice president|head of|director|senior|\bsr\b|owner|founder|president/i;
// Foreign-region owners (e.g. "director ASIA supply chain", "DHL Supply Chain CEE")
// are the wrong contact for a US live-site pitch — demote hard so a US peer wins.
const REGION_NEG_RE = /\b(emea|apac|asia|asian|europe|european|\bcee\b|latam|china|chinese|india|mexico|canada|canadian|\buk\b|britain|brazil|germany|japan|korea|australia|africa)\b/i;
function relevance(p: { title: string | null; function: string | null; seniority: string | null }): number {
  const text = `${p.title ?? ''} ${p.function ?? ''}`;
  let s = 0;
  if (FUNC_RE.test(text)) s += 10;        // logistics / supply chain / yard relevance (required)
  if (NEG_RE.test(text)) s -= 9;          // IT / HR / finance / sales etc. — wrong owner for a yard pitch
  if (SENIOR_RE.test(`${text} ${p.seniority ?? ''}`)) s += 5;
  if (REGION_NEG_RE.test(text)) s -= 8;   // foreign-region exec — wrong geography for a US live-site pitch
  return s;
}
const MIN_RELEVANCE = 10; // must be genuinely logistics/ops, not just any known contact

/** Does the email domain plausibly belong to the company? CRM records sometimes
 *  hold a stale/wrong domain (Red Bull -> redbubble.com). Flag the obvious misses
 *  so the hand-off can re-infer the real address instead of bouncing. */
function domainMatchesCompany(email: string, company: string): boolean {
  const domain = (email.split('@')[1] ?? '').toLowerCase();
  const core = domain.split('.').slice(0, -1).join('').replace(/[^a-z]/g, '');
  if (!core) return false;
  const toks = companyTokens(company);
  if (!toks.length) return true; // nothing meaningful to check against — don't false-flag
  return toks.some((t) => core.includes(t) || t.includes(core));
}

/** City, state of the nearest live YardFlow (Primo) site — the proximity-hook anchor. */
function nearestLiveSite(nearestPrimoName: string): string {
  const s = REFERENCE_SITES.find((r) => r.name === nearestPrimoName);
  return s ? `${s.city}, ${s.state}` : '';
}

function csvCell(v: string): string {
  return `"${String(v).replace(/"/g, '""')}"`;
}

/** Minimal RFC-4180-ish CSV parser (handles quoted fields with embedded newlines). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Read every prior wave CSV: collect already-queued emails + already-taken company tokens. */
function priorWaves(dir: string, selfPath: string): { emails: Set<string>; companies: Set<string> } {
  const emails = new Set<string>();
  const companies = new Set<string>();
  let files: string[] = [];
  try { files = fs.readdirSync(dir).filter((f) => /^send-queue.*\.csv$/.test(f)); } catch { /* none */ }
  for (const f of files) {
    const full = path.join(dir, f);
    if (path.resolve(full) === path.resolve(selfPath)) continue;
    const rows = parseCsv(fs.readFileSync(full, 'utf8'));
    if (rows.length < 2) continue;
    const head = rows[0].map((h) => h.trim().toLowerCase());
    const ti = head.indexOf('to'); const ci = head.indexOf('company');
    for (const r of rows.slice(1)) {
      const email = (r[ti] ?? '').trim().toLowerCase();
      if (email.includes('@')) emails.add(email);
      const tok = brandToken(r[ci] ?? '');
      if (tok) companies.add(tok);
    }
  }
  return { emails, companies };
}

async function main() {
  const output = loadLatestScored();
  if (!output) throw new Error('no scored discovery data');
  const ranked = rankWorklist(buildCuratedRows(output), DEFAULT_WEIGHTS);
  const near = ranked.filter((r) => r.nearestPrimoDistance <= MAX_MI);

  const dir = 'output/prospect-discovery';
  fs.mkdirSync(dir, { recursive: true });
  const csvPath = path.join(dir, `send-queue-${SUFFIX}-${DATE}.csv`);
  const mdPath = path.join(dir, `send-queue-${SUFFIX}-${DATE}.md`);

  const logs = await prisma.emailLog.findMany({ select: { to_email: true } });
  const alreadyEmailed = new Set(logs.map((l) => (l.to_email ?? '').toLowerCase()).filter(Boolean));

  // External exclusion: the Clawd Gmail agent's sends are BCC'd to HubSpot, not to our
  // EmailLog. exclude/already-contacted.txt is grepped from the campaign artifacts.
  let excludedExternal = 0;
  try {
    for (const e of fs.readFileSync('exclude/already-contacted.txt', 'utf8').split('\n')) {
      const addr = e.trim().toLowerCase();
      if (addr.includes('@') && !alreadyEmailed.has(addr)) { alreadyEmailed.add(addr); excludedExternal += 1; }
    }
  } catch { /* no external exclusion list */ }

  // Prior waves: exclude their emails AND their companies, so we advance to the next set.
  const prior = priorWaves(dir, csvPath);
  for (const e of prior.emails) alreadyEmailed.add(e);
  console.log(`excluded — prior campaigns: ${excludedExternal}, prior-wave emails: ${prior.emails.size}, prior-wave companies: ${prior.companies.size}`);

  const seenCompany = new Set<string>(prior.companies); // skip companies already taken by earlier waves
  const seenEmail = new Set<string>();
  type QItem = { row: typeof near[number]; name: string; firstName: string; title: string; email: string; relevance: number; domainOk: boolean };
  const queue: QItem[] = [];
  let companiesPicked = 0, scanned = 0, droppedStorefront = 0;

  for (const row of near) {
    if (companiesPicked >= MAX_COMPANIES || queue.length >= MAX_PEOPLE) break;
    if (row.confidence === 'low' || STOREFRONT_RE.test(row.name)) { droppedStorefront += 1; continue; }
    const token = brandToken(row.name);
    if (!token || seenCompany.has(token)) continue;
    scanned += 1;

    const personas = await prisma.persona.findMany({
      where: { account_name: { contains: token, mode: 'insensitive' }, email: { not: null }, first_name: { not: null } },
      select: { first_name: true, last_name: true, title: true, email: true, seniority: true, function: true },
      take: 80,
    });

    const candidates = personas
      .filter((p) => {
        const email = (p.email ?? '').toLowerCase();
        const domain = email.split('@')[1];
        return email && domain && !FREE.has(domain) && !alreadyEmailed.has(email) && !seenEmail.has(email);
      })
      .map((p) => ({ p, score: relevance(p) }))
      .filter((c) => c.score >= MIN_RELEVANCE)
      .sort((a, b) => b.score - a.score);

    if (!candidates.length) continue;
    seenCompany.add(token);
    companiesPicked += 1;

    for (const { p, score } of candidates.slice(0, PER_COMPANY)) {
      if (queue.length >= MAX_PEOPLE) break;
      const email = (p.email as string).toLowerCase();
      if (seenEmail.has(email)) continue;
      seenEmail.add(email);
      queue.push({
        row,
        name: [p.first_name, p.last_name].filter(Boolean).join(' '),
        firstName: p.first_name as string,
        title: p.title ?? '',
        email,
        relevance: score,
        domainOk: domainMatchesCompany(email, row.name),
      });
    }
  }

  // --- write outputs ---
  const csvRows = [
    ['to', 'contact_name', 'title', 'company', 'facility_city_state', 'distance_mi', 'nearest_live_site', 'email_domain_check', 'starter_subject', 'starter_body'].join(','),
  ];
  const flagged = queue.filter((q) => !q.domainOk);
  const md: string[] = [
    `# Tier-1 outreach data pack (${SUFFIX}) — ${DATE}`,
    '',
    `${queue.length} prospects across ${companiesPicked} companies (up to ${PER_COMPANY} best logistics/ops contacts each). Each is near a LIVE YardFlow (Primo) site, with a known email from our records, deduped against everyone already emailed and every company from earlier waves.`,
    '',
    `Write each email in Casey's voice from the facts below (you own the copy). The \`starter_*\` fields are scaffolding to replace, not final copy.`,
    '',
    flagged.length
      ? `IMPORTANT — ${flagged.length} rows are marked **domain: CHECK**: the email domain in our records does not match the company, so it may be stale (the kind that bounced last wave). For those, re-infer the real address from the company's known format before sending (do not send to the listed address as-is if it looks wrong).`
      : 'All email domains match their company.',
    '',
    '---',
    '',
  ];

  for (const q of queue) {
    const out = buildOutreach(q.row, q.firstName);
    const site = nearestLiveSite(q.row.nearestPrimoName);
    const check = q.domainOk ? 'ok' : 'CHECK (domain != company — re-infer)';
    csvRows.push([
      csvCell(q.email), csvCell(q.name), csvCell(q.title), csvCell(q.row.name),
      csvCell(q.row.cityState), q.row.nearestPrimoDistance.toFixed(1), csvCell(site), csvCell(check),
      csvCell(out.subject), csvCell(out.body),
    ].join(','));
    md.push(
      `## ${q.row.name} — ${q.name}${q.title ? ` (${q.title})` : ''}`,
      `- **To:** ${q.email}${q.domainOk ? '  (known email from our records)' : '  ⚠️ DOMAIN CHECK — this domain does not match the company; re-infer the real address before sending'}`,
      `- **Their facility:** ${q.row.cityState}`,
      `- **Nearest LIVE YardFlow site:** ${site || '(unresolved)'} — **${q.row.nearestPrimoDistance.toFixed(1)} mi away** (the small-world hook)`,
      `- **Starter subject:** ${out.subject}`,
      `- **Image:** drag \`tier1-proof-image.jpg\` where you'd paste the pilot screenshot`,
      '',
      'Starter body (replace with your best cold copy):',
      '```',
      out.body,
      '```',
      '',
      '---',
      '',
    );
  }

  fs.writeFileSync(csvPath, csvRows.join('\n'));
  fs.writeFileSync(mdPath, md.filter((l) => l !== '').join('\n').replace(/\n---\n/g, '\n\n---\n\n'));

  console.log(`storefront/low-confidence rows dropped: ${droppedStorefront}`);
  console.log(`near-reference companies scanned: ${scanned}`);
  console.log(`ready: ${queue.length} people across ${companiesPicked} companies (caps: ${MAX_PEOPLE} people / ${MAX_COMPANIES} companies / ${PER_COMPANY} per co)`);
  console.log(`domain-mismatch rows to re-infer: ${flagged.length}`);
  console.log(`  CSV: ${csvPath}`);
  console.log(`  MD:  ${mdPath}`);
  console.log('\n=== sample (first 5) ===');
  for (const q of queue.slice(0, 5)) console.log(`  ${q.row.name} -> ${q.name} <${q.email}> | ${q.title}${q.domainOk ? '' : '  [DOMAIN CHECK]'}`);
}

main().catch((e) => { console.error('ERR', e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
