/**
 * Stabilization C: the source ledger's remaining gaps. A redirect-stored claim gets a real publisher page or loses
 * its outreach eligibility (never deleted); legacy sources get provenance only; a too-short proposal keeps its page.
 */
import { describe, expect, it, vi } from 'vitest';
import { resolveRedirectFact } from '@/lib/gap/research/resolve-redirect';
import { factUrl, liveFactFailure } from '@/lib/gap/research/claim-rules';
import { parseWebCandidates } from '@/lib/gap/research/providers';
import { loadAccountSources } from '@/lib/gap/sources/account-sources';

const NOW = new Date('2026-10-01T12:00:00Z');
const QUOTE = 'Kroger plans to close three older distribution facilities in the region and consolidate them into a new center.';
const REDIRECT = 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZ';
const fact = { evidence_text: QUOTE, evidence_url: REDIRECT, account_name: 'Kroger' };

describe('C2: redirect-stored claims', () => {
  it('the redirect lands on the publisher page that holds the claim verbatim: that page becomes its link', async () => {
    const follow = vi.fn(async () => ({ finalUrl: 'https://www.grocerydive.com/news/kroger-closing/1', text: `Kroger news. ${QUOTE} More.` }));
    expect(await resolveRedirectFact(fact, { follow })).toEqual({ resolved: true, canonicalUrl: 'https://www.grocerydive.com/news/kroger-closing/1', via: 'redirect' });
  });
  it('a page that does not hold the exact words is not the source; the grounded search may find the one that does', async () => {
    const follow = vi.fn(async (u: string) => (u === REDIRECT ? { finalUrl: 'https://example.com/other', text: 'Kroger something else entirely.' } : { finalUrl: u, text: `Kroger. ${QUOTE}` }));
    const search = vi.fn(async () => ['https://www.supermarketnews.com/kroger-dc']);
    expect(await resolveRedirectFact(fact, { follow, search })).toEqual({ resolved: true, canonicalUrl: 'https://www.supermarketnews.com/kroger-dc', via: 'search' });
  });
  it('an expired redirect with no findable publisher stays unresolved (outreach eligibility withdrawn, nothing deleted)', async () => {
    const follow = vi.fn(async () => { throw new Error('fetch 404'); });
    expect(await resolveRedirectFact(fact, { follow, search: async () => [] })).toEqual({ resolved: false, reason: 'redirect_unresolved' });
  });
  it('a resolved claim links its publisher page everywhere and is eligible again; the frozen quote is untouched', () => {
    const row = { evidence_url: REDIRECT, metadata: { verified: 'excerpt_found_at_source', canonicalUrl: 'https://www.grocerydive.com/news/kroger-closing/1' } };
    expect(factUrl(row)).toBe('https://www.grocerydive.com/news/kroger-closing/1');
    expect(liveFactFailure(QUOTE, 'Kroger', factUrl(row))).toBeNull();
    expect(liveFactFailure(QUOTE, 'Kroger', REDIRECT)).toBe('redirect_unresolved');
  });
  it('an unresolved redirect claim shows as COULD NOT VERIFY, not eligible, with the reason', async () => {
    const prisma = {
      researchRun: { findMany: vi.fn(async () => []) },
      gapSignal: { findMany: vi.fn(async () => []) },
      prospectingSignal: { findMany: vi.fn(async () => [{ id: 'f1', title: 't', evidence_text: QUOTE, evidence_url: REDIRECT, observed_at: new Date('2025-12-10'), freshness_expires_at: null, updated_at: NOW, metadata: { verified: 'failed_recheck', recheck: { reason: 'redirect_unresolved' } } }]) },
    };
    const s = await loadAccountSources(prisma as never, 'Kroger', { now: NOW });
    expect(s.items[0]).toMatchObject({ verification: 'COULD_NOT_VERIFY', outreach: 'NOT_ELIGIBLE', publisher: 'search redirect' });
    expect(s.items[0].reason).toBe('failed a later recheck: stored on a search-redirect link; the original publisher page could not be confirmed');
  });
});

describe('C3: legacy provenance', () => {
  it('a legacy run record shows the backfilled title, date and publisher; its states are unchanged', async () => {
    const run = { id: 'r1', account_name: 'Kroger', created_at: new Date('2026-09-01'), provider_status: { result: { rejected: [{ url: 'https://news.example/k', reason: 'describes_past_event' }], provenance: { 'https://news.example/k': { title: 'Kroger to consolidate DCs', publishedAt: '2026-08-20T00:00:00.000Z', publisher: 'Grocery Dive' } } } } };
    const prisma = { researchRun: { findMany: vi.fn(async () => [run]) }, gapSignal: { findMany: vi.fn(async () => []) }, prospectingSignal: { findMany: vi.fn(async () => []) } };
    const s = await loadAccountSources(prisma as never, 'Kroger', { now: NOW });
    expect(s.items[0]).toMatchObject({ title: 'Kroger to consolidate DCs', publishedAt: '2026-08-20T00:00:00.000Z', publisher: 'Grocery Dive', verification: 'UNCHECKED', outreach: 'NOT_ELIGIBLE' });
  });
  it('without a backfill the provenance reads unknown, never invented', async () => {
    const run = { id: 'r1', account_name: 'Kroger', created_at: new Date('2026-09-01'), provider_status: { result: { rejected: [{ url: 'https://news.example/k', reason: 'describes_past_event' }] } } };
    const prisma = { researchRun: { findMany: vi.fn(async () => [run]) }, gapSignal: { findMany: vi.fn(async () => []) }, prospectingSignal: { findMany: vi.fn(async () => []) } };
    const s = await loadAccountSources(prisma as never, 'Kroger', { now: NOW });
    expect(s.items[0]).toMatchObject({ title: null, publishedAt: null, publisher: 'news.example' });
  });
});

describe('C4: a too-short proposal keeps its page', () => {
  it('parsing keeps a short-sentence proposal, marked short (a source, never a candidate fact)', () => {
    const parsed = parseWebCandidates('[{"url":"https://news.example/a","title":"A","date":"2026-09-01","excerpt":"Kroger opens DC."},{"url":"https://news.example/b","title":"B","date":"2026-09-01","excerpt":"Kroger plans to build a new distribution center in Kentucky this year."}]');
    expect(parsed.map((p) => [p.url, p.short])).toEqual([['https://news.example/a', true], ['https://news.example/b', false]]);
  });
  it('a research run records the short proposal as a source with its reason', async () => {
    const { runEvidenceResearch } = await import('@/lib/gap/research/run');
    const runs: Array<Record<string, unknown>> = [];
    const prisma = {
      researchRun: { create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => { runs.push({ id: 'run1', ...data }); return { id: 'run1' }; }), update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => Object.assign(runs[0], data)) },
      gapAuditEvent: { create: vi.fn(async () => ({ id: 'a' })), findMany: vi.fn(async () => []) },
      prospectingSignal: { findMany: vi.fn(async () => []), update: vi.fn() },
    };
    const r = await runEvidenceResearch(
      prisma as never,
      { accountName: 'Kroger', personaId: null, hypothesisId: null, problemFamily: null, decisionId: null, actor: 't', now: NOW, seekCurrentness: false },
      { edgar: async () => ({ candidates: [], note: 'off' }), web: async () => ({ candidates: [], note: 'one short', pageResults: [{ url: 'https://news.example/a', title: 'A', publishedAt: null, outcome: 'read' as const, sentences: 0, reason: 'excerpt_too_short' }] }) as never, sourcePages: false },
    );
    expect(r.sources).toEqual([expect.objectContaining({ url: 'https://news.example/a', title: 'A', reason: 'excerpt_too_short', status: 'not_verified' })]);
  });
});
