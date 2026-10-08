/**
 * Stabilization D: the automatic source aperture beyond news. One grounded question per account per turn, rotating
 * through source-class bundles; only CITED pages are captured; captured pages are signals, never facts; a material named
 * page dated by itself is queued for the bounded background research (R25), the rest never;
 * a page whose title does not name the account is MAY BE RELEVANT, kept; social is manual only.
 */
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_THEMES } from '@/lib/gap/signals/watch';
import { SOURCE_CLASS_BUNDLES, SOURCE_CLASS_COVERAGE, parseGroundedPages, runGroundedDiscovery } from '@/lib/gap/signals/grounded-discovery';
import { loadAccountSources } from '@/lib/gap/sources/account-sources';

const NOW = new Date('2026-10-01T12:00:00Z');
const profile = (name: string) => ({ accountName: name, aliases: [], domains: [], ticker: null, themes: [...DEFAULT_THEMES], tier: null, band: null, reasons: ['priority'] });

function db(asked: Array<{ subject_id: string; created_at: Date }> = []) {
  const rows: Array<Record<string, unknown>> = [];
  const audit: Array<Record<string, unknown>> = [];
  const prisma = {
    gapAuditEvent: { findMany: vi.fn(async () => asked), create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => { audit.push(data); return {}; }) },
    gapSignal: {
      findUnique: vi.fn(async ({ where }: { where: { url_hash?: string; id?: string } }) => rows.find((r) => (where.url_hash ? r.url_hash === where.url_hash : r.id === where.id)) ?? null),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => { const r = { id: `s${rows.length + 1}`, metadata: null, ...data }; rows.push(r); return { id: r.id }; }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => Object.assign(rows.find((r) => r.id === where.id)!, data)),
    },
    account: { findMany: vi.fn(async () => [{ name: 'PepsiCo' }]) },
    gapAccountAlias: { findMany: vi.fn(async () => []) },
    canonicalAccountLink: { findMany: vi.fn(async () => []) },
    pounceTrigger: { create: vi.fn() },
  };
  return { prisma, rows, audit };
}

describe('grounded source discovery', () => {
  it('captures only pages the search cited; drops redirects and market chatter; keeps a page that does not name the account as MAY BE RELEVANT; a material named page dated by itself is queued for the bounded research (R25), the rest are not', async () => {
    const { prisma, rows, audit } = db();
    const ask = vi.fn(async () => ({
      pages: [
        { url: 'https://jobs.pepsico.com/yard-manager-dallas', title: 'PepsiCo Yard Operations Manager, Dallas DC', cls: 'job posting or hiring', date: '2026-09-20' },
        { url: 'https://www.gatik.ai/news/texas-expansion', title: 'Gatik expands autonomous middle-mile runs in Texas', cls: 'vendor or customer case study', date: '2026-09-10' },
        { url: 'https://made-up.example/never-cited', title: 'PepsiCo something', cls: 'trade press news', date: null },
        { url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/x', title: 'PepsiCo redirect', cls: 'trade press news', date: null },
        { url: 'https://www.marketbeat.com/pep', title: 'PepsiCo (NASDAQ:PEP) Stake Raised by XYZ Capital', cls: 'trade press news', date: null },
      ],
      citations: ['https://jobs.pepsico.com/yard-manager-dallas', 'https://www.gatik.ai/news/texas-expansion', 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/x', 'https://www.marketbeat.com/pep'],
      citedHosts: [],
    }));
    // The page itself is read: its OWN title and article date are what the card carries.
    const fetchPage = vi.fn(async (url: string) =>
      url.includes('jobs.pepsico.com')
        ? { ok: true as const, finalUrl: url, title: 'Yard Operations Manager - Dallas | PepsiCo Careers', publishedAt: new Date('2026-09-21T00:00:00Z') }
        : { ok: true as const, finalUrl: url, title: 'Gatik expands autonomous middle-mile runs in Texas', publishedAt: null },
    );
    const r = await runGroundedDiscovery(prisma as never, { now: NOW, accounts: 1 }, { ask, profiles: async () => [profile('PepsiCo')], fetchPage });
    expect(r.accounts[0]).toMatchObject({ proposed: 5, kept: 2, captured: 2, mayBeRelevant: 1, dropped: { notCited: 1, garbage: 2, dead: 0 }, classes: [...SOURCE_CLASS_BUNDLES[0]] });
    expect(rows[0]).toMatchObject({ title: 'Yard Operations Manager - Dallas | PepsiCo Careers' });
    expect(new Date(String(rows[0].published_at)).toISOString()).toBe('2026-09-21T00:00:00.000Z');
    expect(rows.map((x) => [x.resolution_basis, x.origin, x.research_status ?? 'none'])).toEqual([
      ['grounded_discovery', 'discovery', 'queued'],
      ['grounded_discovery', 'discovery', 'none'],
    ]);
    expect(r.accounts[0].queued).toBe(1);
    expect(rows[1].published_at ?? null).toBeNull();
    expect(rows[1].metadata).toMatchObject({ grounded: { cls: 'vendor or customer case study', claimedDate: '2026-09-10', mayBeRelevant: true } });
    expect(audit[0]).toMatchObject({ kind: 'signal.grounded_discovery', subject_id: 'PepsiCo' });
    expect(prisma.pounceTrigger.create).not.toHaveBeenCalled();
  });

  it('a link that does not answer (a path the search made up) is dropped, never captured', async () => {
    const { prisma, rows } = db();
    const ask = vi.fn(async () => ({ pages: [{ url: 'https://www.pepsico.com/newsroom/made-up-path', title: 'PepsiCo announces a thing', cls: 'company newsroom', date: null }], citations: [], citedHosts: ['pepsico.com'] }));
    const fetchPage = vi.fn(async () => ({ ok: false as const, status: '404' }));
    const r = await runGroundedDiscovery(prisma as never, { now: NOW, accounts: 1 }, { ask, profiles: async () => [profile('PepsiCo')], fetchPage });
    expect(r.accounts[0]).toMatchObject({ captured: 0, dropped: { dead: 1 } });
    expect(rows).toHaveLength(0);
  });

  it('a cited page that BLOCKS the reader (403, bot protection) is kept, labelled unread; only a page that does not exist (404/410) is dropped', async () => {
    const { prisma, rows } = db();
    const ask = vi.fn(async () => ({
      pages: [
        { url: 'https://www.maersk.com/news/articles/2026/09/23/maersk-launches-warehouse', title: 'Maersk launches warehouse in the heart of Germany', cls: 'company newsroom', date: '2026-09-23' },
        { url: 'https://www.businesswire.com/news/home/2026/7-Eleven-Ibotta', title: '7-Eleven and Ibotta join together', cls: 'trade press news', date: '2026-08-03' },
        { url: 'https://www.maersk.com/news/made-up', title: 'Maersk made-up page', cls: 'company newsroom', date: null },
      ],
      citations: [],
      citedHosts: ['maersk.com', 'businesswire.com'],
    }));
    const fetchPage = vi.fn(async (url: string) => (url.includes('made-up') ? { ok: false as const, status: '404' } : url.includes('businesswire') ? { ok: false as const, status: '403' } : { ok: false as const, status: 'fetch failed' }));
    const r = await runGroundedDiscovery(prisma as never, { now: NOW, accounts: 1 }, { ask, profiles: async () => [profile('PepsiCo')], fetchPage });
    expect(r.accounts[0]).toMatchObject({ captured: 2, dropped: { dead: 1 } });
    expect(rows.map((x) => x.title)).toEqual(['Maersk launches warehouse in the heart of Germany', '7-Eleven and Ibotta join together']);
    expect(rows.every((x) => (x.metadata as { grounded?: { unread?: boolean } }).grounded?.unread === true)).toBe(true);
    expect(rows.every((x) => (x.published_at ?? null) === null)).toBe(true);
  });

  it("on the card, an unread page says so: the title is the search's, not the page's", async () => {
    const prisma = {
      researchRun: { findMany: vi.fn(async () => []) },
      prospectingSignal: { findMany: vi.fn(async () => []) },
      gapSignal: { findMany: vi.fn(async () => [{ id: 's9', url: 'https://www.maersk.com/news/x', title: 'Maersk launches warehouse', source_name: null, published_at: null, created_at: NOW, origin: 'discovery', research_status: 'none', categories: [], feedback: null, account_name: 'PepsiCo', resolution_basis: 'grounded_discovery', event_id: null, metadata: { grounded: { cls: 'company newsroom', claimedDate: '2026-09-23', mayBeRelevant: true, unread: true } } }]) },
    };
    const s = await loadAccountSources(prisma as never, 'PepsiCo', { now: NOW });
    expect(s.items[0].reason).toContain("the page blocked GAP's reader, so the title is the search's (unchecked)");
  });

  it('a content failure (no citations) still takes the turn, so one hard account never holds every slot', async () => {
    const { prisma, audit } = db();
    const ask = vi.fn(async () => ({ error: 'gemini no_citations; openai_web unparsable' }));
    await runGroundedDiscovery(prisma as never, { now: NOW, accounts: 1 }, { ask, profiles: async () => [profile('PepsiCo')] });
    expect(audit).toHaveLength(1);
  });

  it("an account's turns rotate through every bundle; a provider outage is not a turn", async () => {
    const asked = [{ subject_id: 'PepsiCo', created_at: new Date('2026-09-30') }, { subject_id: 'PepsiCo', created_at: new Date('2026-09-29') }];
    const { prisma, audit } = db(asked);
    const ask = vi.fn(async () => ({ error: 'gemini quota' }));
    const r = await runGroundedDiscovery(prisma as never, { now: NOW, accounts: 1 }, { ask, profiles: async () => [profile('PepsiCo')] });
    expect(r.accounts[0]).toMatchObject({ classes: [...SOURCE_CLASS_BUNDLES[2]], error: 'gemini quota' });
    // Batch item 10: the outage is recorded (Coverage shows a failed turn, never nothing) and marked transient ...
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ subject_id: 'PepsiCo', payload: { error: 'gemini quota', transient: true } });
    // ... and it is never a turn: the next run asks the SAME bundle again.
    const again = db([{ subject_id: 'PepsiCo', created_at: new Date('2026-10-01'), payload: { error: 'gemini quota', transient: true } } as never, ...asked]);
    const r2 = await runGroundedDiscovery(again.prisma as never, { now: NOW, accounts: 1 }, { ask, profiles: async () => [profile('PepsiCo')] });
    expect(r2.accounts[0].classes).toEqual([...SOURCE_CLASS_BUNDLES[2]]);
  });

  it('batch item 10: an unreadable daily queue budget queues nothing (fail closed), never a fresh day’s worth', async () => {
    const { prisma, rows } = db();
    (prisma.gapSignal as Record<string, unknown>).findMany = vi.fn(async () => { throw new Error('db down'); });
    const pages = [{ url: 'https://pepsico.com/news/a', title: 'PepsiCo opens a new distribution center in Denver', cls: 'company newsroom', date: '2026-09-28' }];
    const ask = vi.fn(async () => ({ pages, citations: pages.map((p) => p.url), citedHosts: ['pepsico.com'] }));
    const fetchPage = vi.fn(async (url: string) => ({ ok: true as const, finalUrl: url, title: pages[0].title, publishedAt: new Date('2026-09-28') }));
    const r = await runGroundedDiscovery(prisma as never, { now: NOW, accounts: 1 }, { ask, profiles: async () => [profile('PepsiCo')], fetchPage: fetchPage as never, priority: async () => new Map() });
    expect(r.accounts[0]).toMatchObject({ captured: 1, queued: 0 });
    expect(rows.filter((x) => x.research_status === 'queued')).toEqual([]);
  });

  it('R25: a material cited page the account is named in, dated by the page itself, is queued for the bounded background research; a MAY BE RELEVANT page, an unread page, a search-dated page and a leadership page are not; the per-run cap holds', async () => {
    const { prisma, rows } = db();
    const pages = [
      { url: 'https://pepsico.com/news/a', title: 'PepsiCo opens a new distribution center in Denver', cls: 'company newsroom', date: '2026-09-28' },
      { url: 'https://pepsico.com/news/b', title: 'PepsiCo to consolidate two plants', cls: 'company newsroom', date: '2026-09-27' },
      { url: 'https://sec.gov/x', title: 'PepsiCo 10-Q', cls: 'SEC filing', date: '2026-09-26' },
      { url: 'https://trade.example/c', title: 'PepsiCo and Gatik expand autonomous freight', cls: 'trade press news', date: '2026-09-25' },
      { url: 'https://trade.example/d', title: 'PepsiCo fleet electrification', cls: 'fleet or transportation change', date: '2026-09-24' },
      { url: 'https://news.example/e', title: 'A bottler in Ohio expands', cls: 'company newsroom', date: '2026-09-23' },
      { url: 'https://news.example/f', title: 'PepsiCo names a new CFO', cls: 'leadership change', date: '2026-09-22' },
      { url: 'https://blocked.example/g', title: 'PepsiCo warehouse automation', cls: 'technology implementation', date: '2026-09-21' },
    ];
    const ask = vi.fn(async () => ({ pages, citations: pages.map((p) => p.url), citedHosts: ['pepsico.com', 'sec.gov', 'trade.example', 'news.example', 'blocked.example'] }));
    const fetchPage = vi.fn(async (url: string) => (url.includes('blocked') ? { ok: false as const, status: '403' } : url.endsWith('/f') ? { ok: true as const, finalUrl: url, title: 'PepsiCo names a new CFO', publishedAt: new Date('2026-09-22') } : url.endsWith('/e') ? { ok: true as const, finalUrl: url, title: 'A bottler in Ohio expands', publishedAt: new Date('2026-09-23') } : { ok: true as const, finalUrl: url, title: pages.find((p) => p.url === url)!.title, publishedAt: url.endsWith('/d') ? null : new Date(pages.find((p) => p.url === url)!.date) }));
    const r = await runGroundedDiscovery(prisma as never, { now: NOW, accounts: 1 }, { ask, profiles: async () => [profile('PepsiCo')], fetchPage: fetchPage as never, priority: async () => new Map() });
    const queued = rows.filter((x) => x.research_status === 'queued').map((x) => x.url);
    // Four material, named, page-dated pages queue (the cap); the search-dated fleet page, the unnamed bottler, the leadership page and the unread page do not.
    expect(queued).toEqual(['https://pepsico.com/news/a', 'https://pepsico.com/news/b', 'https://sec.gov/x', 'https://trade.example/c']);
    expect(r.accounts[0].queued).toBe(4);
    expect(rows.find((x) => x.url === 'https://trade.example/d')?.research_status).toBe('none');
    expect((rows.find((x) => x.url === 'https://pepsico.com/news/a')?.metadata as { grounded: { queuedAt: string } }).grounded.queuedAt).toBe(NOW.toISOString());
  });

  it('R20 follow-up: only the bounded rotating population is asked; an account outside it (news only at the current allowance) never takes a grounded turn, however long since it was asked', async () => {
    // 50 watched, no priorities: the allowance (2 a run x 12 runs x 7 days x 0.85 margin / 4 bundles) carries 35; the last 15 by tier, band, name are news only.
    const watched = Array.from({ length: 50 }, (_, k) => ({ ...profile(`Acct ${String(k).padStart(2, '0')}`), tier: k < 35 ? 'Tier 1' : null }));
    // The news-only accounts were never asked; every rotating account was asked recently: recency alone would pick the news-only ones.
    const asked = watched.slice(0, 35).map((p) => ({ subject_id: p.accountName, created_at: new Date(NOW.getTime() - 3_600_000) }));
    const { prisma } = db(asked);
    const ask = vi.fn(async () => ({ pages: [], citations: [], citedHosts: [] }));
    const r = await runGroundedDiscovery(prisma as never, { now: NOW, accounts: 2 }, { ask, profiles: async () => watched, priority: async () => new Map() });
    expect(r.newsOnly).toBe(15);
    expect(r.accounts.map((a) => a.accountName).every((n) => Number(n.slice(-2)) < 35)).toBe(true);
    expect(r.accounts).toHaveLength(2);
  });

  it('the coverage map is honest: social is manual only', () => {
    expect(SOURCE_CLASS_COVERAGE.find((c) => /linkedin/i.test(c.cls))).toMatchObject({ mode: 'manual_only' });
    expect(SOURCE_CLASS_COVERAGE.filter((c) => c.mode === 'automated').length).toBe(1 + SOURCE_CLASS_BUNDLES.flat().length);
    expect(parseGroundedPages('[{"url":"notaurl","title":"x"},{"url":"https://a.example/b","title":"T","class":"SEC filing","date":"2026-09-01"}]')).toEqual([{ url: 'https://a.example/b', title: 'T', cls: 'SEC filing', date: '2026-09-01' }]);
  });

  it('on the source card it is a signal: found by web search, the search date marked unchecked, may be relevant', async () => {
    const prisma = {
      researchRun: { findMany: vi.fn(async () => []) },
      prospectingSignal: { findMany: vi.fn(async () => []) },
      gapSignal: { findMany: vi.fn(async () => [{ id: 's2', url: 'https://www.gatik.ai/news/texas-expansion', title: 'Gatik expands autonomous middle-mile runs in Texas', source_name: null, published_at: null, created_at: NOW, origin: 'discovery', research_status: 'none', categories: [], feedback: null, account_name: 'PepsiCo', resolution_basis: 'grounded_discovery', event_id: null, metadata: { grounded: { cls: 'vendor or customer case study', claimedDate: '2026-09-10', mayBeRelevant: true } } }]) },
    };
    const s = await loadAccountSources(prisma as never, 'PepsiCo', { now: NOW });
    expect(s.items[0]).toMatchObject({ verification: 'UNCHECKED', outreach: 'NOT_EVALUATED', publishedAt: null });
    expect(s.items[0].reason).toBe("May be relevant: the title does not name PepsiCo. Found by GAP's web search (vendor or customer case study); the search dated it 2026-09-10 (unchecked); not checked yet");
  });
});
