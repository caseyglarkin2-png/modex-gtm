/**
 * Build the Tier-1 outreach send-queue: near-reference prospects whose company
 * already has a REAL email in our Persona records (no inference, ~zero bounce
 * risk), one best contact per company, excluding anyone we've already emailed.
 *
 * Output: a CSV (machine) + a Markdown pack (human / hand-off to the Gmail agent)
 * under output/prospect-discovery/. Run:
 *   npx tsx scripts/discovery/build-send-queue.ts [maxCompanies] [maxDistanceMi]
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { loadLatestScored, buildCuratedRows } from '@/lib/discovery/data';
import { rankWorklist, DEFAULT_WEIGHTS } from '@/lib/discovery/scoring';
import { buildOutreach } from '@/lib/discovery/outreach';
import { REFERENCE_SITES } from '@/lib/discovery/reference-sites';

/** City, state of the nearest live YardFlow (Primo) site — the proximity-hook anchor. */
function nearestLiveSite(nearestPrimoName: string): string {
  const s = REFERENCE_SITES.find((r) => r.name === nearestPrimoName);
  return s ? `${s.city}, ${s.state}` : '';
}

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

const MAX_COMPANIES = Number(process.argv[2] ?? 40);
const MAX_MI = Number(process.argv[3] ?? 50);
const DATE = '2026-06-05';

const FREE = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'me.com', 'live.com', 'msn.com', 'comcast.net', 'verizon.net']);
const GENERIC = new Set(['the', 'and', 'inc', 'llc', 'corp', 'company', 'co', 'group', 'logistics', 'distribution', 'warehouse', 'transport', 'transportation', 'services', 'supply', 'chain', 'foods', 'food', 'north', 'america', 'us', 'usa', 'international']);
const companyKey = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const brandToken = (s: string) => companyKey(s).split(' ').find((w) => w.length >= 3 && !GENERIC.has(w)) ?? null;

// Rows that aren't real truck yards — retail/parcel storefronts slip through Places.
const STOREFRONT_RE = /drop ?box|\bstore\b|kiosk|locker|kinko|onsite|on-site|service ?point|access ?point|print|retail|ship ?center|office\b|notary|mailbox/i;

const FUNC_RE = /logistic|supply chain|transport|distribution|warehouse|yard|fleet|dock|freight|procure|^operations|of operations|network/i;
const NEG_RE = /\bit\b|information tech|human resource|\bhr\b|finance|account(ing|s)|legal|counsel|marketing|\bsales\b|recruit|talent|communicat|brand|software|engineer(ing)?\b|data|analytics|security/i;
const SENIOR_RE = /chief|c[a-z]o\b|\bvp\b|vice president|head of|director|senior|\bsr\b|owner|founder|president/i;
function relevance(p: { title: string | null; function: string | null; seniority: string | null }): number {
  const text = `${p.title ?? ''} ${p.function ?? ''}`;
  let s = 0;
  if (FUNC_RE.test(text)) s += 10;        // logistics / supply chain / yard relevance (required)
  if (NEG_RE.test(text)) s -= 9;          // IT / HR / finance / sales etc. — wrong owner for a yard pitch
  if (SENIOR_RE.test(`${text} ${p.seniority ?? ''}`)) s += 5;
  return s;
}
const MIN_RELEVANCE = 10; // must be genuinely logistics/ops, not just any known contact

function csvCell(v: string): string {
  return `"${String(v).replace(/"/g, '""')}"`;
}

async function main() {
  const output = loadLatestScored();
  if (!output) throw new Error('no scored discovery data');
  const ranked = rankWorklist(buildCuratedRows(output), DEFAULT_WEIGHTS);
  const near = ranked.filter((r) => r.nearestPrimoDistance <= MAX_MI);

  const logs = await prisma.emailLog.findMany({ select: { to_email: true } });
  const alreadyEmailed = new Set(logs.map((l) => (l.to_email ?? '').toLowerCase()).filter(Boolean));

  // Also exclude anyone the Clawd Gmail agent already emailed (its sends are BCC'd to
  // HubSpot, not written to our EmailLog). exclude/already-contacted.txt is grepped
  // from the campaign artifacts (allentown-*.csv/.md). gitignored (PII).
  let excludedExternal = 0;
  try {
    for (const e of fs.readFileSync('exclude/already-contacted.txt', 'utf8').split('\n')) {
      const addr = e.trim().toLowerCase();
      if (addr.includes('@') && !alreadyEmailed.has(addr)) { alreadyEmailed.add(addr); excludedExternal += 1; }
    }
  } catch { /* no external exclusion list */ }
  console.log(`excluded from prior campaigns (agent sends): ${excludedExternal}`);

  const seenCompany = new Set<string>();
  const seenEmail = new Set<string>();
  type QItem = { row: typeof near[number]; name: string; firstName: string; title: string; email: string; relevance: number };
  const queue: QItem[] = [];
  let scanned = 0;

  let droppedStorefront = 0;
  for (const row of near) {
    if (queue.length >= MAX_COMPANIES) break;
    if (row.confidence === 'low' || STOREFRONT_RE.test(row.name)) { droppedStorefront += 1; continue; }
    const token = brandToken(row.name);
    if (!token || seenCompany.has(token)) continue;
    scanned += 1;

    const personas = await prisma.persona.findMany({
      where: { account_name: { contains: token, mode: 'insensitive' }, email: { not: null }, first_name: { not: null } },
      select: { first_name: true, last_name: true, title: true, email: true, seniority: true, function: true },
      take: 60,
    });

    const candidates = personas
      .filter((p) => {
        const email = (p.email ?? '').toLowerCase();
        const domain = email.split('@')[1];
        return email && domain && !FREE.has(domain) && !alreadyEmailed.has(email) && !seenEmail.has(email);
      })
      .map((p) => ({ p, score: relevance(p) }))
      .sort((a, b) => b.score - a.score);

    if (!candidates.length || candidates[0].score < MIN_RELEVANCE) continue;
    const best = candidates[0].p;
    const email = (best.email as string).toLowerCase();
    seenCompany.add(token);
    seenEmail.add(email);
    queue.push({
      row,
      name: [best.first_name, best.last_name].filter(Boolean).join(' '),
      firstName: best.first_name as string,
      title: best.title ?? '',
      email,
      relevance: candidates[0].score,
    });
  }

  // --- write outputs ---
  const dir = 'output/prospect-discovery';
  fs.mkdirSync(dir, { recursive: true });
  const csvRows = [
    ['to', 'contact_name', 'title', 'company', 'facility_city_state', 'distance_mi', 'nearest_live_site', 'email_confidence', 'starter_subject', 'starter_body'].join(','),
  ];
  const md: string[] = [
    `# Tier-1 outreach data pack — ${DATE}`,
    '',
    `${queue.length} prospects: each is near a LIVE YardFlow (Primo) site, with a REAL known email from our records (not inferred — low bounce risk), one best logistics/ops contact per company, deduped against everyone already emailed.`,
    '',
    'Write each email in Casey\'s voice from the facts below (the agent owns the copy). The `starter_*` fields are scaffolding to replace, not final copy.',
    '',
    '---',
    '',
  ];

  for (const q of queue) {
    const out = buildOutreach(q.row, q.firstName);
    const site = nearestLiveSite(q.row.nearestPrimoName);
    csvRows.push([
      csvCell(q.email), csvCell(q.name), csvCell(q.title), csvCell(q.row.name),
      csvCell(q.row.cityState), q.row.nearestPrimoDistance.toFixed(1), csvCell(site), 'known (records)',
      csvCell(out.subject), csvCell(out.body),
    ].join(','));
    md.push(
      `## ${q.row.name} — ${q.name}${q.title ? ` (${q.title})` : ''}`,
      `- **To:** ${q.email}  (known email from our records)`,
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

  const csvPath = path.join(dir, `send-queue-tier1-${DATE}.csv`);
  const mdPath = path.join(dir, `send-queue-tier1-${DATE}.md`);
  fs.writeFileSync(csvPath, csvRows.join('\n'));
  fs.writeFileSync(mdPath, md.filter((l) => l !== '').join('\n').replace(/\n---\n/g, '\n\n---\n\n'));

  console.log(`storefront/low-confidence rows dropped: ${droppedStorefront}`);
  console.log(`near-reference companies scanned: ${scanned}`);
  console.log(`Tier-1 ready emails written: ${queue.length} (cap ${MAX_COMPANIES})`);
  console.log(`  CSV: ${csvPath}`);
  console.log(`  MD:  ${mdPath}`);
  console.log('\n=== sample (first 3) ===');
  for (const q of queue.slice(0, 3)) console.log(`  ${q.row.name} -> ${q.name} <${q.email}> | ${q.title}`);
}

main().catch((e) => { console.error('ERR', e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
