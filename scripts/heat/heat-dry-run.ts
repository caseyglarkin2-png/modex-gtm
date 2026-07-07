/**
 * Account Heat Score — DRY-RUN driver.
 *
 * Pulls the real signals (READ-ONLY), rolls contact/deck/web signals UP to the
 * account, computes heat for every TAM-in company via the shared compute module
 * (src/lib/revops/heat/heat-score.ts — no logic fork), ranks them, and writes the
 * TOP 60 to a .md + .json in the scratchpad.
 *
 *   NO HUBSPOT WRITES. NO MUTATIONS. This script cannot write — it never calls a
 *   POST/PATCH against HubSpot. The writer lives in heat-writer.ts, gated behind
 *   a flag that this loop does not set.
 *
 * Run:  npx tsx scripts/heat/heat-dry-run.ts
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { heatScore, tierNumber, type HeatSignals, type HeatResult } from '../../src/lib/revops/heat/heat-score';

const ROOT = process.cwd(); // run from repo root: npx tsx scripts/heat/heat-dry-run.ts
const OUT_DIR =
  'C:/Users/casey/AppData/Local/Temp/claude/C--Users-casey-Desktop/c28d1654-1631-4555-8b07-e8a8e651992f/scratchpad';
const DECK_CSV = 'C:/Users/casey/Downloads/carousel-deck-visitors-2026-06-11.csv';

const env = readFileSync(join(ROOT, '.env.local'), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
if (!TOKEN) {
  console.error('no HUBSPOT_ACCESS_TOKEN in .env.local');
  process.exit(1);
}
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** POST with 429-aware retry + a courteous throttle (HubSpot secondly limit). */
async function hsPost(url: string, body: unknown, tries = 6): Promise<any> {
  for (let attempt = 0; attempt < tries; attempt++) {
    const res = await fetch(url, { method: 'POST', headers: H, body: JSON.stringify(body) });
    if (res.ok) return res.json();
    if (res.status === 429) { await sleep(1000 * (attempt + 1)); continue; }
    console.error('HS POST fail', res.status, (await res.text()).slice(0, 160));
    return null;
  }
  console.error('HS POST gave up after 429 retries:', url);
  return null;
}

// ---------------------------------------------------------------------------
// /for page views — REAL, pulled live from PostHog (project 466410) 2026-07-07:
//   for_page_view over 180d, internal traffic excluded, $host ILIKE '%yardflow%',
//   grouped by for_slug.  { views, visitors } per for_slug.
// To refresh: rerun the execute-sql in the heat-score task notes and paste here.
// ---------------------------------------------------------------------------
const FOR_VIEWS: Record<string, { views: number; visitors: number }> = {
  kroger: { views: 60, visitors: 1 },
  crowley: { views: 51, visitors: 16 },
  dannon: { views: 36, visitors: 6 },
  'mondelez-international': { views: 9, visitors: 4 },
  'the-home-depot': { views: 9, visitors: 2 },
  'smithfield-foods': { views: 8, visitors: 1 },
  'general-motors': { views: 8, visitors: 3 },
  target: { views: 6, visitors: 2 },
  nfi: { views: 5, visitors: 2 },
  'boston-beer-company': { views: 4, visitors: 2 },
  pepsico: { views: 4, visitors: 3 },
  'acme-foods': { views: 3, visitors: 1 },
  'nestle-usa': { views: 3, visitors: 1 },
  gxo: { views: 2, visitors: 1 },
  'coca-cola': { views: 2, visitors: 2 },
  walmart: { views: 2, visitors: 2 },
  'tyson-foods': { views: 2, visitors: 1 },
  'performance-food-group': { views: 2, visitors: 2 },
  fedex: { views: 2, visitors: 1 },
  'keurig-dr-pepper': { views: 1, visitors: 1 },
  'tractor-supply': { views: 1, visitors: 1 },
  'georgia-pacific': { views: 1, visitors: 1 },
  'ab-inbev': { views: 1, visitors: 1 },
  'niagara-bottling': { views: 1, visitors: 1 },
  publix: { views: 1, visitors: 1 },
  caterpillar: { views: 1, visitors: 1 },
  'kraft-heinz': { views: 1, visitors: 1 },
};

const normName = (s: string): string =>
  (s || '')
    .toLowerCase()
    .replace(/[.,]/g, '')
    .replace(/\b(inc|llc|corp|corporation|co|company|the|usa|us|group|holdings|international|ltd|na)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const normDomain = (d: string): string =>
  (d || '').toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

// ---------------------------------------------------------------------------
// 1) demo-pack index: dock doors + slug per account (for fit + /for join)
// ---------------------------------------------------------------------------
interface Pack {
  slug: string;
  displayName: string;
  dockDoors: number;
}
function loadPacks(): Pack[] {
  const dir = join(ROOT, 'public', 'demo-packs');
  const packs: Pack[] = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    try {
      const p = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      const slug = p?.account?.slug ?? f.replace(/\.json$/, '');
      const displayName = p?.account?.displayName ?? slug;
      const docks =
        p?.network?.totals?.dockDoors ??
        (p?.network?.sites ?? []).reduce(
          (n: number, s: { yardMetrics?: { dockDoorCount?: number } }) => n + (s?.yardMetrics?.dockDoorCount ?? 0),
          0,
        );
      packs.push({ slug, displayName, dockDoors: docks || 0 });
    } catch {
      /* skip bad pack */
    }
  }
  return packs;
}

// ---------------------------------------------------------------------------
// 2) deck engagement per domain (sum views, count visitors, max last_viewed)
// ---------------------------------------------------------------------------
interface Deck {
  views: number;
  visitors: number;
  lastViewed: string;
}
function loadDeck(): Map<string, Deck> {
  const raw = readFileSync(DECK_CSV, 'utf8');
  const lines = raw.split(/\r?\n/).slice(1).filter((l) => l.trim());
  const byDomain = new Map<string, Deck>();
  for (const line of lines) {
    // CSV with quoted fields: name,email,company_domain,views,last_viewed_utc,contact_id
    const cols = line.match(/("([^"]*)"|[^,]*)(,|$)/g)?.map((c) => c.replace(/^,?"?|"?,?$/g, '').replace(/^"|"$/g, '')) ?? [];
    const domain = normDomain(cols[2] || '');
    const views = parseInt(cols[3] || '0', 10) || 0;
    const lastViewed = (cols[4] || '').trim();
    if (!domain) continue;
    const cur = byDomain.get(domain) ?? { views: 0, visitors: 0, lastViewed: '' };
    cur.views += views;
    cur.visitors += 1;
    if (lastViewed > cur.lastViewed) cur.lastViewed = lastViewed;
    byDomain.set(domain, cur);
  }
  return byDomain;
}

// ---------------------------------------------------------------------------
// 3) HubSpot reads (READ-ONLY)
// ---------------------------------------------------------------------------
interface Company {
  id: string;
  name: string;
  domain: string;
  tam: string;
  tamTier: string;
  intentScore: number;
  lastIntentAt: string;
  triggerScore: number;
  lastTriggerAt: string;
}
const CO_PROPS = [
  'name', 'domain', 'yardflow_tam', 'tam_tier',
  'intent_score', 'last_intent_at', 'trigger_score', 'last_trigger_at',
];
async function fetchTamCompanies(): Promise<Company[]> {
  const out: Company[] = [];
  let after: string | undefined;
  for (;;) {
    const body = {
      filterGroups: [{ filters: [{ propertyName: 'yardflow_tam', operator: 'EQ', value: 'in' }] }],
      properties: CO_PROPS,
      limit: 100,
      ...(after ? { after } : {}),
    };
    const j = await hsPost('https://api.hubapi.com/crm/v3/objects/companies/search', body);
    if (!j) break;
    await sleep(120); // throttle under the secondly limit
    for (const r of j.results ?? []) {
      const p = r.properties ?? {};
      out.push({
        id: r.id,
        name: p.name || '',
        domain: normDomain(p.domain || ''),
        tam: p.yardflow_tam || '',
        tamTier: p.tam_tier || '',
        intentScore: parseInt(p.intent_score || '0', 10) || 0,
        lastIntentAt: p.last_intent_at || '',
        triggerScore: parseInt(p.trigger_score || '0', 10) || 0,
        lastTriggerAt: p.last_trigger_at || '',
      });
    }
    after = j.paging?.next?.after;
    if (!after) break;
    if (out.length >= 10000) break; // search API hard cap
  }
  return out;
}

/** Roll up SQL/MQL contact counts per company via the qualification verdict. */
async function fetchQualRollup(): Promise<{ map: Map<string, { sql: number; mql: number }>; mqlCapped: boolean }> {
  const byCompany = new Map<string, { sql: number; mql: number }>();
  let mqlCapped = false;
  for (const verdict of ['sql', 'mql'] as const) {
    let after: string | undefined;
    let seen = 0;
    for (;;) {
      const body = {
        filterGroups: [{ filters: [{ propertyName: 'yardflow_qual_verdict', operator: 'EQ', value: verdict }] }],
        properties: ['associatedcompanyid'],
        limit: 100,
        ...(after ? { after } : {}),
      };
      const j = await hsPost('https://api.hubapi.com/crm/v3/objects/contacts/search', body);
      if (!j) { if (verdict === 'mql' && seen >= 9900) mqlCapped = true; break; }
      await sleep(120);
      for (const r of j.results ?? []) {
        seen++;
        const cid = r.properties?.associatedcompanyid;
        if (!cid) continue;
        const cur = byCompany.get(cid) ?? { sql: 0, mql: 0 };
        cur[verdict] += 1;
        byCompany.set(cid, cur);
      }
      after = j.paging?.next?.after;
      if (!after) break;
      if (seen >= 9900) { if (verdict === 'mql') mqlCapped = true; break; } // Search API 10k hard cap
    }
  }
  return { map: byCompany, mqlCapped };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  console.error('loading packs + deck CSV…');
  const packs = loadPacks();
  const packByName = new Map<string, Pack>();
  for (const p of packs) packByName.set(normName(p.displayName), p);
  const deck = loadDeck();

  console.error('fetching TAM-in companies (read-only)…');
  const companies = await fetchTamCompanies();
  console.error(`  ${companies.length} TAM-in companies`);

  console.error('rolling up SQL/MQL contacts (read-only)…');
  const { map: qual, mqlCapped } = await fetchQualRollup();
  const totalSql = [...qual.values()].reduce((a, q) => a + q.sql, 0);
  const totalMql = [...qual.values()].reduce((a, q) => a + q.mql, 0);
  console.error(`  ${totalSql} SQL + ${totalMql} MQL contacts across ${qual.size} companies${mqlCapped ? ' (MQL capped at Search API 10k limit — Tier-3 counts are a floor)' : ''}`);

  // build a for_slug -> company resolver: prefer pack match, fall back to name-from-slug
  const companyByName = new Map<string, Company>();
  for (const c of companies) if (c.name) companyByName.set(normName(c.name), c);

  const now = Date.now();
  let deckMatched = 0;
  let forMatched = 0;
  const scored: Array<{ c: Company; slug: string; r: HeatResult; s: HeatSignals }> = [];

  for (const c of companies) {
    const pack = packByName.get(normName(c.name));
    const slug = pack?.slug ?? '';
    const q = qual.get(c.id) ?? { sql: 0, mql: 0 };
    const d = c.domain ? deck.get(c.domain) : undefined;
    if (d) deckMatched++;

    // /for views: by pack slug if it exists in FOR_VIEWS, else by name-derived slug
    let fv = slug ? FOR_VIEWS[slug] : undefined;
    if (!fv) {
      // try any FOR_VIEWS slug whose name-form matches this company
      for (const [fslug, v] of Object.entries(FOR_VIEWS)) {
        if (normName(fslug.replace(/-/g, ' ')) === normName(c.name)) { fv = v; break; }
      }
    }
    if (fv) forMatched++;

    const signals: HeatSignals = {
      name: c.name,
      domain: c.domain,
      slug,
      tam: c.tam,
      tamTier: c.tamTier,
      dockDoors: pack?.dockDoors,
      intentScore: c.intentScore,
      lastIntentAt: c.lastIntentAt,
      sqlCount: q.sql,
      mqlCount: q.mql,
      pounceScore: c.triggerScore,
      lastTriggerAt: c.lastTriggerAt,
      deckViews: d?.views,
      deckVisitors: d?.visitors,
      deckLastViewedAt: d?.lastViewed,
      forViews: fv?.views,
    };
    const r = heatScore(signals, now);
    scored.push({ c, slug, r, s: signals });
  }

  scored.sort((a, b) => b.r.heat - a.r.heat || b.r.base - a.r.base);
  console.error(`deck domains matched to TAM companies: ${deckMatched}; /for slugs matched: ${forMatched}`);

  const tierCounts = { tier1: 0, tier2: 0, tier3: 0, tier4: 0 } as Record<string, number>;
  for (const s of scored) tierCounts[s.r.tier]++;

  const top = scored.slice(0, 60);

  // ---- JSON ----
  const json = {
    generatedAt: new Date().toISOString(),
    mode: 'DRY_RUN',
    hubspotWrites: 0,
    tamInCompanies: companies.length,
    mqlCappedAt10k: mqlCapped,
    tierCounts,
    weights: { intent: 55, qual: 45, pounce: 30, deck: 25, web: 25, saturationK: 70, halflifeDays: 14 },
    top: top.map((x, i) => ({
      rank: i + 1,
      company: x.c.name,
      domain: x.c.domain,
      slug: x.slug,
      heat: x.r.heat,
      tier: tierNumber(x.r.tier),
      tierLabel: x.r.tier,
      cadence: x.r.cadence,
      reason: x.r.reason,
      fit: x.r.fit,
      base: x.r.base,
      points: x.r.points,
      signals: {
        intentScore: x.s.intentScore,
        sqlCount: x.s.sqlCount,
        mqlCount: x.s.mqlCount,
        pounceScore: x.s.pounceScore,
        deckViews: x.s.deckViews ?? 0,
        deckVisitors: x.s.deckVisitors ?? 0,
        forViews: x.s.forViews ?? 0,
        dockDoors: x.s.dockDoors ?? null,
        tamTier: x.s.tamTier,
      },
      breakdown: x.r.breakdown,
    })),
  };
  writeFileSync(join(OUT_DIR, 'heat-score-ranked.json'), JSON.stringify(json, null, 2));

  // ---- Markdown ----
  const md: string[] = [];
  md.push('# YardFlow Account Heat Score — dry-run ranking');
  md.push('');
  md.push(`Generated ${json.generatedAt} · **DRY RUN — 0 HubSpot writes**`);
  md.push('');
  md.push(`TAM-in accounts scored: **${companies.length}**. Tiers: ` +
    `Tier1 ${tierCounts.tier1} · Tier2 ${tierCounts.tier2} · Tier3 ${tierCounts.tier3} · Tier4 ${tierCounts.tier4}.`);
  md.push('');
  md.push('Weights (max points): intent 55 · qual 45 · pounce 30 · deck 25 · web 25. ' +
    'base = 100·(1−e^(−points/70)), then ×fit (0.30–1.00). Time-stamped signals decay e^(−ageDays/14).');
  md.push('');
  md.push('| # | Account | Heat | Tier | Cadence | intent | SQL/MQL | pounce | deck (v/ppl) | /for | docks | fit | why |');
  md.push('|--:|---|--:|:--:|---|--:|:--:|--:|:--:|--:|--:|--:|---|');
  top.forEach((x, i) => {
    const s = x.s;
    md.push(
      `| ${i + 1} | ${x.c.name} | **${x.r.heat}** | T${tierNumber(x.r.tier)} | ${x.r.cadence.split(' — ')[0]} | ` +
        `${s.intentScore || 0} | ${s.sqlCount || 0}/${s.mqlCount || 0} | ${s.pounceScore || 0} | ` +
        `${s.deckViews || 0}/${s.deckVisitors || 0} | ${s.forViews || 0} | ${s.dockDoors ?? '—'} | ${x.r.fit} | ${x.r.reason} |`,
    );
  });
  md.push('');
  md.push('## Notes');
  md.push('- **Read-only.** No `yardflow_heat` / `yardflow_heat_tier` were written. The writer (`heat-writer.ts`) is gated behind `--apply` + `HEAT_WRITE_ENABLED=1`, neither set here.');
  md.push('- `/for` views are live from PostHog (project 466410, 180d, internal excluded); deck engagement from the May-12 carousel blast CSV (decays out by July); SQL/MQL rolled up from `yardflow_qual_verdict`.');
  md.push('- Account-level `intent_score`/`trigger_score` are sparse (7 + 1 companies), so most heat comes from rolled-up contact + deck + web signals — exactly what this engine is for.');
  if (mqlCapped) md.push('- **MQL rollup hit the HubSpot Search API 10,000-result cap** — Tier-3 MQL counts are a FLOOR, not exact. SQL (146) and intent are complete. Shard by createdate to get exact MQL if needed.');
  writeFileSync(join(OUT_DIR, 'heat-score-ranked.md'), md.join('\n'));

  console.error(`\nWROTE ${join(OUT_DIR, 'heat-score-ranked.md')}`);
  console.error(`WROTE ${join(OUT_DIR, 'heat-score-ranked.json')}`);
  console.error('\nTOP 15:');
  top.slice(0, 15).forEach((x, i) =>
    console.error(`  ${String(i + 1).padStart(2)}. ${x.c.name.padEnd(28)} heat ${String(x.r.heat).padStart(3)}  T${tierNumber(x.r.tier)}  ${x.r.reason}`),
  );
  console.error('\nHUBSPOT WRITES THIS RUN: 0 (dry-run).');
}

main().catch((e) => { console.error(e); process.exit(1); });
