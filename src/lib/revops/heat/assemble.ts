/**
 * Server-side heat signal assembly — the read-only ranked-accounts surface.
 *
 * The dry-run driver (scripts/heat/heat-dry-run.ts) sweeps all 6,900 TAM-in
 * companies with local-machine inputs (a Downloads deck CSV, a hand-pasted
 * PostHog map). This module is the serverless-safe subset that powers
 * GET /api/intel/export/heat for clawd's morning brief:
 *
 *   candidates = TAM-in companies with a live signal
 *     (account intent_score > 0 OR trigger_score > 0 OR >= 1 SQL contact)
 *   + /for views from our own Prisma MicrositeEngagement rows (30d)
 *   + fit inferred from tam_tier (no audited dock doors here; fitMultiplier
 *     already handles that fallback)
 *
 * HONESTY CONTRACT: components we cannot assemble server-side are OMITTED and
 * declared in the payload (`componentsOmitted: ['deck', 'mql']`), never faked.
 * Rankings here are therefore a floor built from live signals only. The
 * compute itself is the shared heat-score module — no logic fork — and this
 * path performs ZERO HubSpot writes (the writer stays gated in scripts/heat).
 */
import { prisma } from '@/lib/prisma';
import { getHubSpotClient, withHubSpotRetry, isHubSpotConfigured } from '@/lib/hubspot/client';
import { heatScore, tierNumber, type HeatSignals } from './heat-score';

export interface HeatAccount {
  name: string;
  hubspotCompanyId: string;
  slug: string | null;
  heat: number;
  tier: number;
  tierLabel: string;
  reason: string;
  drivers: string[];
}

export interface HeatExport {
  accounts: HeatAccount[];
  computedAt: string;
  componentsOmitted: string[];
  candidateCount: number;
}

const CO_PROPS = [
  'name',
  'domain',
  'yardflow_tam',
  'tam_tier',
  'intent_score',
  'last_intent_at',
  'trigger_score',
  'last_trigger_at',
];

interface CandidateCompany {
  id: string;
  name: string;
  tam: string;
  tamTier: string;
  intentScore: number;
  lastIntentAt: string;
  triggerScore: number;
  lastTriggerAt: string;
}

function mapCompany(r: { id: string; properties?: Record<string, string | null> }): CandidateCompany {
  const p = r.properties ?? {};
  return {
    id: r.id,
    name: p.name || '',
    tam: p.yardflow_tam || '',
    tamTier: p.tam_tier || '',
    intentScore: parseInt(p.intent_score || '0', 10) || 0,
    lastIntentAt: p.last_intent_at || '',
    triggerScore: parseInt(p.trigger_score || '0', 10) || 0,
    lastTriggerAt: p.last_trigger_at || '',
  };
}

/** TAM-in companies with account-level intent or trigger signal (one search, OR groups). */
async function fetchSignalCompanies(): Promise<CandidateCompany[]> {
  const client = getHubSpotClient();
  const out: CandidateCompany[] = [];
  let after: string | undefined;
  for (let page = 0; page < 5; page++) {
    const res = await withHubSpotRetry(() =>
      client.crm.companies.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              { propertyName: 'yardflow_tam', operator: 'EQ', value: 'in' },
              { propertyName: 'intent_score', operator: 'GT', value: '0' },
            ],
          },
          {
            filters: [
              { propertyName: 'yardflow_tam', operator: 'EQ', value: 'in' },
              { propertyName: 'trigger_score', operator: 'GT', value: '0' },
            ],
          },
        ],
        properties: CO_PROPS,
        limit: 100,
        ...(after ? { after } : {}),
      } as Parameters<typeof client.crm.companies.searchApi.doSearch>[0]),
    );
    for (const r of res.results ?? []) out.push(mapCompany(r as never));
    after = res.paging?.next?.after;
    if (!after) break;
  }
  return out;
}

interface SqlRoll {
  sqlCount: number;
  lastActMs: number;
}

/** SQL contacts rolled up per company id. One paged contacts search. */
async function fetchSqlRollup(): Promise<Map<string, SqlRoll>> {
  const client = getHubSpotClient();
  const byCompany = new Map<string, SqlRoll>();
  let after: string | undefined;
  for (let page = 0; page < 10; page++) {
    const res = await withHubSpotRetry(() =>
      client.crm.contacts.searchApi.doSearch({
        filterGroups: [
          { filters: [{ propertyName: 'yardflow_qual_verdict', operator: 'EQ', value: 'sql' }] },
        ],
        properties: ['associatedcompanyid', 'hs_last_sales_activity_timestamp'],
        limit: 100,
        ...(after ? { after } : {}),
      } as Parameters<typeof client.crm.contacts.searchApi.doSearch>[0]),
    );
    for (const r of res.results ?? []) {
      const cid = (r.properties as Record<string, string | null>)?.associatedcompanyid;
      if (!cid) continue;
      const cur = byCompany.get(cid) ?? { sqlCount: 0, lastActMs: 0 };
      cur.sqlCount += 1;
      const ts = (r.properties as Record<string, string | null>)?.hs_last_sales_activity_timestamp;
      const ms = ts ? Date.parse(ts) : NaN;
      if (!Number.isNaN(ms) && ms > cur.lastActMs) cur.lastActMs = ms;
      byCompany.set(cid, cur);
    }
    after = res.paging?.next?.after;
    if (!after) break;
  }
  return byCompany;
}

/** Companies (by id) for SQL rollup ids not already in the candidate set. */
async function fetchCompaniesByIds(ids: string[]): Promise<CandidateCompany[]> {
  if (ids.length === 0) return [];
  const client = getHubSpotClient();
  const out: CandidateCompany[] = [];
  for (let i = 0; i < ids.length && i < 300; i += 100) {
    const batch = ids.slice(i, i + 100);
    const res = await withHubSpotRetry(() =>
      client.crm.companies.batchApi.read({
        inputs: batch.map((id) => ({ id })),
        properties: CO_PROPS,
        propertiesWithHistory: [],
      }),
    );
    for (const r of res.results ?? []) out.push(mapCompany(r as never));
  }
  return out;
}

/** /for page views per account_slug from our own engagement rows (30 days). */
async function fetchForViews(): Promise<Map<string, number>> {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const rows = await prisma.micrositeEngagement.groupBy({
    by: ['account_slug'],
    where: { updated_at: { gte: since }, path: { startsWith: '/for' } },
    _count: { _all: true },
  });
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.account_slug, r._count._all);
  return map;
}

const norm = (s: string): string =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Human driver strings for the brief; every clause traces to a real signal. */
function describeDrivers(s: HeatSignals): string[] {
  const d: string[] = [];
  if ((s.sqlCount ?? 0) > 0) d.push(`${s.sqlCount} SQL contact${(s.sqlCount ?? 0) > 1 ? 's' : ''}`);
  if ((s.intentScore ?? 0) > 0) d.push(`site intent ${s.intentScore}`);
  if ((s.pounceScore ?? 0) > 0) d.push(`pounce trigger ${s.pounceScore}`);
  if ((s.forViews ?? 0) > 0) d.push(`${s.forViews} /for views (30d)`);
  return d;
}

export async function assembleHeatExport(limit = 25): Promise<HeatExport> {
  const computedAt = new Date().toISOString();
  const componentsOmitted = ['deck', 'mql'];

  if (!isHubSpotConfigured()) {
    return { accounts: [], computedAt, componentsOmitted, candidateCount: 0 };
  }

  const [signalCompanies, sqlRoll, forViews] = await Promise.all([
    fetchSignalCompanies(),
    fetchSqlRollup(),
    fetchForViews().catch(() => new Map<string, number>()),
  ]);

  const byId = new Map(signalCompanies.map((c) => [c.id, c]));
  const missingSqlIds = [...sqlRoll.keys()].filter((id) => !byId.has(id));
  const sqlCompanies = await fetchCompaniesByIds(missingSqlIds);
  for (const c of sqlCompanies) {
    if (c.tam === 'in' && !byId.has(c.id)) byId.set(c.id, c);
  }

  // slug resolution for /for views: engagement slugs are kebab account slugs;
  // match by normalized name so "Boston Beer Company" joins "boston-beer-company".
  const forBySlugName = new Map<string, { slug: string; views: number }>();
  for (const [slug, views] of forViews) forBySlugName.set(norm(slug.replace(/-/g, ' ')), { slug, views });

  const now = Date.now();
  const scored = [...byId.values()].map((c) => {
    const q = sqlRoll.get(c.id) ?? { sqlCount: 0, lastActMs: 0 };
    const fv = forBySlugName.get(norm(c.name));
    const signals: HeatSignals = {
      name: c.name,
      domain: '',
      slug: fv?.slug ?? '',
      tam: c.tam,
      tamTier: c.tamTier,
      // no audited dock doors server-side; fitMultiplier infers from tamTier
      intentScore: c.intentScore,
      lastIntentAt: c.lastIntentAt,
      sqlCount: q.sqlCount,
      mqlCount: 0, // omitted (declared in componentsOmitted)
      qualLastActivityAt: q.lastActMs || null,
      pounceScore: c.triggerScore,
      lastTriggerAt: c.lastTriggerAt,
      forViews: fv?.views,
    };
    const r = heatScore(signals, now);
    return { c, signals, r };
  });

  scored.sort((a, b) => b.r.heat - a.r.heat || b.r.base - a.r.base);

  return {
    accounts: scored.slice(0, limit).map(({ c, signals, r }) => ({
      name: c.name,
      hubspotCompanyId: c.id,
      slug: signals.slug || null,
      heat: r.heat,
      tier: tierNumber(r.tier),
      tierLabel: r.tier,
      reason: r.reason,
      drivers: describeDrivers(signals),
    })),
    computedAt,
    componentsOmitted,
    candidateCount: byId.size,
  };
}
