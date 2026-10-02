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
    const r = await runGroundedDiscovery(prisma as never, { now: NOW, accounts: 1 }, { ask, profiles: async () => [profile('PepsiCo')] });
    expect(r.accounts[0]).toMatchObject({ proposed: 5, kept: 2, captured: 2, mayBeRelevant: 1, dropped: { notCited: 1, garbage: 2 }, classes: [...SOURCE_CLASS_BUNDLES[0]] });
    expect(rows.map((x) => [x.resolution_basis, x.origin, x.research_status ?? 'none', x.published_at ?? null])).toEqual([
      ['grounded_discovery', 'discovery', 'none', null],
      ['grounded_discovery', 'discovery', 'none', null],
    ]);
    expect(rows[1].metadata).toMatchObject({ grounded: { cls: 'vendor or customer case study', claimedDate: '2026-09-10', mayBeRelevant: true } });
    expect(audit[0]).toMatchObject({ kind: 'signal.grounded_discovery', subject_id: 'PepsiCo' });
    expect(prisma.pounceTrigger.create).not.toHaveBeenCalled();
  });

  it("an account's turns rotate through every bundle; a failed search is not a turn", async () => {
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
