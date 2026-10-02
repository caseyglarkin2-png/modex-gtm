/**
 * Stabilization D: the automatic source aperture beyond news. One grounded question per account per turn, rotating
 * through source-class bundles; only CITED pages are captured; captured pages are signals, never facts, never queued;
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
  it('captures only pages the search cited; drops redirects and market chatter; keeps a page that does not name the account as MAY BE RELEVANT; queues nothing', async () => {
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
      ['grounded_discovery', 'discovery', 'none'],
      ['grounded_discovery', 'discovery', 'none'],
    ]);
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
    expect(audit).toHaveLength(0);
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
