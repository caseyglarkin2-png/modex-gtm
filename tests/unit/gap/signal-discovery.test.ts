/**
 * GAP Signal Intelligence C: account watch profiles (mechanical, correctable)
 * and bounded rotating discovery that captures SIGNALS only.
 */
import { describe, expect, it, vi } from 'vitest';
import { cleanHeadline, headlineNames, runDiscovery, themesForRun } from '@/lib/gap/signals/discovery';
import { correctWatch, loadWatchProfiles, DEFAULT_THEMES, WATCH_AUDIT } from '@/lib/gap/signals/watch';

const NOW = new Date('2026-09-28T15:00:00.000Z');

describe('watch profiles are generated, not configured', () => {
  function db() {
    return {
      account: {
        findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
          const all = [
            { name: 'PepsiCo', tier: 'Tier 2', priority_band: 'B', parent_brand: 'Pepsi' },
            { name: 'NFI Industries', tier: 'Tier 3', priority_band: 'D', parent_brand: null },
            { name: 'Kroger', tier: 'Tier 3', priority_band: 'D', parent_brand: null },
            { name: 'E2E Boston Beer Company', tier: 'Tier 1', priority_band: 'A', parent_brand: null },
          ];
          if ('OR' in where && Array.isArray(where.OR) && 'priority_band' in (where.OR[0] as object)) return all.filter((a) => ['A', 'B', 'C'].includes(a.priority_band));
          if ('OR' in where) return all.filter((a) => a.name === 'Kroger');
          const names = ((where.name as { in: string[] }) ?? { in: [] }).in;
          return all.filter((a) => names.includes(a.name));
        }),
      },
      prospectingHypothesis: { findMany: vi.fn(async () => [{ account_name: 'PepsiCo', problem_family: 'yard_state_integrity', status: 'active' }]) },
      persona: { groupBy: vi.fn(async () => [{ account_name: 'NFI Industries' }, { account_name: 'gmail.com' }, { account_name: 'Unknown' }]) },
      gapAccountAlias: { findMany: vi.fn(async () => [{ alias: 'PepsiCo Beverages North America', account_name: 'PepsiCo' }]) },
      canonicalAccountLink: { findMany: vi.fn(async () => [{ account_name: 'PepsiCo', canonical_company_id: 'domain:pepsico.com' }]) },
      gapAuditEvent: { findMany: vi.fn(async () => [{ subject_id: 'PepsiCo', payload: { addAliases: ['Frito-Lay North America'], removeAliases: ['Pepsi'] } }]), findFirst: vi.fn(async () => null), create: vi.fn(async () => ({})) },
    };
  }

  it('priority, thesis, audited /for pages and buying committees; fixtures and placeholder rows excluded', async () => {
    const ps = await loadWatchProfiles(db(), { watchlist: async () => [{ slug: 'kroger', name: 'kroger' }] });
    expect(ps.map((p) => [p.accountName, p.reasons])).toEqual([
      ['Kroger', ['audited_for_page']],
      ['NFI Industries', ['buying_committee']],
      ['PepsiCo', ['gap_thesis', 'priority']],
    ]);
    const pep = ps.find((p) => p.accountName === 'PepsiCo')!;
    expect(pep.aliases).toEqual(['PepsiCo Beverages North America', 'Frito-Lay North America']);
    expect(pep.domains).toEqual(['pepsico.com']);
    expect(pep.ticker).toBe('PEP');
    expect(pep.themes[0]).toBe('yard OR dock OR trailer OR fleet OR carrier');
    expect(pep.themes).toEqual(expect.arrayContaining([...DEFAULT_THEMES]));
  });

  it('Casey can add or remove an alias (append-only); an unknown account or an empty correction is refused', async () => {
    const d = db();
    (d.account as unknown as { findFirst: unknown }).findFirst = vi.fn(async ({ where }: { where: { name: { equals: string } } }) => (where.name.equals.toLowerCase() === 'pepsico' ? { name: 'PepsiCo' } : null)) as never;
    expect(await correctWatch(d as never, { accountName: 'Nope', addAliases: ['x y'], actor: 'c' })).toEqual({ ok: false, reason: 'account_not_found' });
    expect(await correctWatch(d as never, { accountName: 'pepsico', actor: 'c' })).toEqual({ ok: false, reason: 'empty' });
    expect(await correctWatch(d as never, { accountName: 'pepsico', addAliases: ['  PBNA  '], actor: 'c' })).toEqual({ ok: true });
    expect(d.gapAuditEvent.create).toHaveBeenCalledWith({ data: { kind: WATCH_AUDIT, actor: 'c', subject_type: 'account', subject_id: 'PepsiCo', payload: { addAliases: ['PBNA'], removeAliases: [] } } });
  });
});

const profile = (name: string) => ({ accountName: name, aliases: [], domains: [], ticker: null, themes: [...DEFAULT_THEMES], tier: null, band: null, reasons: ['priority'] });

function discoveryDb() {
  const rows: Array<Record<string, unknown>> = [];
  return {
    rows,
    prisma: {
      gapAuditEvent: { findMany: vi.fn(async () => [{ subject_id: 'Kroger', created_at: new Date('2026-09-27T00:00:00Z') }]), create: vi.fn(async () => ({})) },
      gapSignal: {
        findUnique: vi.fn(async ({ where }: { where: { url_hash: string } }) => rows.find((r) => r.url_hash === where.url_hash) ?? null),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const r = { id: `s${rows.length + 1}`, ...data };
          rows.push(r);
          return { id: r.id };
        }),
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => Object.assign(rows.find((r) => r.id === where.id)!, data)),
      },
      pounceTrigger: { create: vi.fn() },
      prospectingSignal: { create: vi.fn(), upsert: vi.fn() },
      account: { findMany: vi.fn(async () => [{ name: 'General Mills' }, { name: 'Kroger' }, { name: 'Post Holdings' }, { name: 'PepsiCo' }, { name: 'Frito-Lay' }, { name: 'Walmart' }]) },
      gapAccountAlias: { findMany: vi.fn(async () => []) },
      canonicalAccountLink: { findMany: vi.fn(async () => []) },
    },
  };
}

describe('discovery', () => {
  it('headlines: publisher suffix removed; the account (or an alias) must be named', () => {
    expect(cleanHeadline('PepsiCo opens Texas DC - Supply Chain Dive', 'Supply Chain Dive')).toBe('PepsiCo opens Texas DC');
    const p = { accountName: 'PepsiCo', aliases: ['Frito-Lay North America'] };
    expect(headlineNames('PepsiCo opens Texas DC', p)).toBe(true);
    expect(headlineNames('Frito-Lay North America adds a plant', p)).toBe(true);
    expect(headlineNames('Beverage makers add plants', p)).toBe(false);
  });

  it('themes rotate by day so every theme comes round', () => {
    const p = { themes: ['a', 'b', 'c', 'd', 'e'] };
    const seen = new Set<string>();
    for (let ask = 0; ask < 3; ask += 1) for (const t of themesForRun(p, ask, 2)) seen.add(t);
    expect(seen.size).toBe(5);
    // Two asks never repeat a question.
    expect(themesForRun(p, 0, 2)).not.toEqual(themesForRun(p, 1, 2));
  });

  it('asks the least recently asked accounts first, captures only headlines that name the account and hit the taxonomy, queues the strong ones; nothing else is written', async () => {
    const { prisma, rows } = discoveryDb();
    const news = vi.fn(async (q: string) => ({
      error: null,
      items: q.includes('"General Mills"')
        ? [
            { title: 'General Mills to close two plants and consolidate distribution - Food Dive', url: 'https://news.google.com/rss/articles/A1', source: 'Food Dive', publishedAt: new Date('2026-09-25T00:00:00Z') },
            { title: 'General Mills stock price target raised - MarketBeat', url: 'https://news.google.com/rss/articles/A2', source: 'MarketBeat', publishedAt: new Date('2026-09-25T00:00:00Z') },
            { title: 'Cereal makers face slower demand - Reuters', url: 'https://news.google.com/rss/articles/A3', source: 'Reuters', publishedAt: new Date('2026-09-25T00:00:00Z') },
            { title: 'Post Holdings opens new distribution center in Ohio - Food Dive', url: 'https://news.google.com/rss/articles/A5', source: 'Food Dive', publishedAt: new Date('2026-09-25T00:00:00Z') },
            { title: 'General Mills opens new distribution center - Old News', url: 'https://news.google.com/rss/articles/A4', source: 'Old News', publishedAt: new Date('2026-07-01T00:00:00Z') },
          ]
        : [],
    }));
    const r = await runDiscovery(prisma, { now: NOW, accounts: 1 }, { news, profiles: async () => [profile('Kroger'), profile('General Mills')], sleep: async () => undefined });
    expect(r.accounts.map((a) => a.accountName)).toEqual(['General Mills']);
    expect(news).toHaveBeenCalledTimes(2);
    expect(String(news.mock.calls[0][0])).toMatch(/^"General Mills" \(.+\) when:14d$/);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ title: 'General Mills to close two plants and consolidate distribution', account_name: 'General Mills', resolution: 'resolved', resolution_basis: 'discovery_query', origin: 'discovery', source_name: 'Food Dive' });
    expect(r.accounts[0]).toMatchObject({ items: 10, kept: 1, captured: 1 });
    expect(prisma.pounceTrigger.create).not.toHaveBeenCalled();
    expect(prisma.prospectingSignal.create).not.toHaveBeenCalled();
    expect(prisma.gapAuditEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ kind: 'signal.discovery', subject_id: 'General Mills' }) }));
  });

  it('a strong operational story is queued for research; a repeat is a duplicate, not a new signal', async () => {
    const { prisma, rows } = discoveryDb();
    const item = { title: 'Kroger deploys autonomous trucks and yard automation at new distribution center - FreightWaves', url: 'https://news.google.com/rss/articles/K1', source: 'FreightWaves', publishedAt: new Date('2026-09-26T00:00:00Z') };
    const news = vi.fn(async () => ({ items: [item], error: null }));
    const r1 = await runDiscovery(prisma, { now: NOW, accounts: 1, queriesPerAccount: 1 }, { news, profiles: async () => [profile('Kroger')], sleep: async () => undefined });
    expect(r1.accounts[0]).toMatchObject({ captured: 1, queued: 1 });
    expect(rows[0].research_status).toBe('queued');
    const r2 = await runDiscovery(prisma, { now: NOW, accounts: 1, queriesPerAccount: 1 }, { news, profiles: async () => [profile('Kroger')], sleep: async () => undefined });
    expect(r2.accounts[0]).toMatchObject({ captured: 0, duplicates: 1 });
    expect(rows).toHaveLength(1);
  });

  it('stops starting accounts past the time budget', async () => {
    const { prisma } = discoveryDb();
    let t = 0;
    const r = await runDiscovery(prisma, { now: NOW, accounts: 3, timeBudgetMs: 10, clock: () => (t += 20) }, { news: async () => ({ items: [], error: null }), profiles: async () => [profile('A Co'), profile('B Co'), profile('C Co')], sleep: async () => undefined });
    expect(r.skipped.length).toBeGreaterThan(0);
  });
});

describe('review C P1s: attribution', () => {
  it('a headline must be ABOUT the account: it opens with its name; a supplier or rival mention is not the subject', () => {
    const w = { accountName: 'Walmart', aliases: [] };
    expect(headlineNames('Walmart opens automated distribution center in Texas', w)).toBe(true);
    expect(headlineNames("Walmart's new automated DC opens in Texas", w)).toBe(true);
    expect(headlineNames('Walmart supplier Acme opens automated distribution center', w)).toBe(false);
    expect(headlineNames('Autonomous trucks now run Walmart routes', w)).toBe(false);
    expect(headlineNames('SpaceX expands Mars rocket factory', { accountName: 'Mars', aliases: [] })).toBe(false);
  });

  it("a story the resolver attributes to another account is left for that account (a parent story is not the subsidiary's)", async () => {
    const { prisma, rows } = discoveryDb();
    const news = vi.fn(async () => ({ error: null, items: [{ title: 'PepsiCo breaks ground on automated plant - Food Dive', url: 'https://news.google.com/rss/articles/P1', source: 'Food Dive', publishedAt: new Date('2026-09-26T00:00:00Z') }] }));
    const r = await runDiscovery(prisma, { now: NOW, accounts: 1, queriesPerAccount: 1 }, { news, profiles: async () => [{ ...profile('Frito-Lay'), aliases: ['PepsiCo'] }], sleep: async () => undefined });
    expect(rows).toHaveLength(0);
    expect(r.accounts[0].otherAccount).toBe(1);
  });

  it("a rate-limited ask is reported and does not use up the account's turn", async () => {
    const { prisma } = discoveryDb();
    const r = await runDiscovery(prisma, { now: NOW, accounts: 1 }, { news: async () => ({ items: [], error: 'news 429' }), profiles: async () => [profile('Kroger')], sleep: async () => undefined });
    expect(r.accounts[0].errors).toEqual(['news 429', 'news 429']);
    expect(prisma.gapAuditEvent.create).not.toHaveBeenCalled();
  });
});

