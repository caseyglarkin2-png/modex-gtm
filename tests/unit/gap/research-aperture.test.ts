/**
 * Research aperture (2026-10-01): research maximizes RECALL, execution maximizes PRECISION. A source that fails the
 * outreach-evidence contract is still a source Casey can see, with its provenance and the factual reason it is not
 * outreach evidence. Only objective garbage is dropped. The evidence gate itself is unchanged.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { loadAccountSources, sourceReason } from '@/lib/gap/sources/account-sources';
import { verifyCandidate, verificationContext } from '@/lib/gap/research/run';

const NOW = new Date('2026-10-01T12:00:00Z');
const run = (id: string, at: string, result: Record<string, unknown>) => ({ id, account_name: 'PepsiCo', created_at: new Date(at), provider_status: { outcome: 'insufficient_evidence', result } });
const signal = (over: Record<string, unknown>) => ({
  id: 's1', url: 'https://www.freightwaves.com/news/pepsico-gatik', title: 'PepsiCo and Gatik launch commercial driverless trucking deployment', source_name: 'freightwaves.com',
  published_at: new Date('2026-06-09'), created_at: new Date('2026-09-28'), origin: 'casey_share', source_class: 'news', account_name: 'PepsiCo', resolution: 'resolved',
  research_status: 'fact_found', categories: ['AUTONOMY'], feedback: null, metadata: null, ...over,
});

const fact = (id: string, url: string, quote: string, published: string, expires = '2026-12-01') => ({
  id, title: 't', evidence_text: quote, evidence_url: url, observed_at: new Date(published), freshness_expires_at: new Date(expires), created_at: new Date('2026-09-30'), metadata: { verified: 'excerpt_found_at_source', retrievedAt: '2026-09-30T16:39:00.000Z' },
});
const PEP_FACT = 'PepsiCo will deploy autonomous box trucks to move freight from its distribution centers to retail stores across Texas.';

/** The real columns of a Prisma model: a select naming a column that does not exist fails here, as it does in production. */
const SCHEMA = readFileSync(join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');
function columns(model: string): Set<string> {
  const m = new RegExp(`model ${model} \\{([\\s\\S]*?)\\n\\}`).exec(SCHEMA);
  if (!m) throw new Error(`no model ${model}`);
  return new Set(m[1].split('\n').map((l) => l.trim().split(/\s+/)[0]).filter((w) => /^[a-z_]+$/.test(w)));
}
const checked = (model: string, rows: unknown[] | undefined) =>
  vi.fn(async (q: { select?: Record<string, unknown> }) => {
    const cols = columns(model);
    for (const k of Object.keys(q?.select ?? {})) if (!cols.has(k)) throw new Error(`Unknown field \`${k}\` on ${model}`);
    return rows ?? [];
  });

function prisma(opts: { runs?: unknown[]; signals?: unknown[]; facts?: unknown[]; audit?: unknown[] } = {}) {
  return {
    researchRun: { findMany: checked('ResearchRun', opts.runs) },
    gapSignal: { findMany: checked('GapSignal', opts.signals) },
    prospectingSignal: { findMany: checked('ProspectingSignal', opts.facts) },
    gapAuditEvent: { findMany: vi.fn(async () => opts.audit ?? []) },
  };
}

describe('every plausible source is visible, with provenance and an evidence status', () => {
  it('PepsiCo / Gatik: the primary source, the trade press and the vendor source all show, each with its own admissibility', async () => {
    const p = prisma({
      signals: [
        signal({}),
        signal({ id: 's2', url: 'https://www.pepsico.com/news/press-release/pepsico-and-gatik', title: 'PepsiCo and Gatik announce multi-year agreement to deploy autonomous freight in North America', source_name: 'pepsico.com', published_at: new Date('2026-06-07'), source_class: 'press_release' }),
      ],
      facts: [
        fact('f1', 'https://www.pepsico.com/news/press-release/pepsico-and-gatik', PEP_FACT, '2026-06-07', '2026-09-05'),
        fact('f2', 'https://www.freightwaves.com/news/pepsico-gatik', `${PEP_FACT} `.trim().replace('PepsiCo will', 'PepsiCo plans to'), '2026-06-09', '2026-09-07'),
      ],
      runs: [
        run('r1', '2026-09-30T16:39:00Z', {
          facts: [],
          sources: [
            { url: 'https://gatik.ai/news/pepsico', title: 'Gatik and PepsiCo', publishedAt: '2026-06-09T00:00:00Z', excerpt: '"Driverless trucks deployed in commercial capacity... that is what we are doing with PepsiCo," said Gautam Narang, CEO of Gatik.', excerptKind: 'verbatim', provider: 'signal', status: 'not_verified', reason: 'quoted_third_party' },
          ],
        }),
      ],
    });
    const r = (await loadAccountSources(p as never, 'PepsiCo', { now: NOW })).items;
    const by = (host: string) => r.find((s) => s.publisher === host)!;
    // June claims: verified facts (true at their source), past their freshness window, so not outreach evidence now.
    expect(by('pepsico.com')).toMatchObject({ verification: 'VERIFIED_AT_SOURCE', outreach: 'NOT_ELIGIBLE', reason: 'past its freshness window: true, but not a fresh trigger', publishedAt: '2026-06-07T00:00:00.000Z', freshTrigger: false });
    expect(by('freightwaves.com')).toMatchObject({ verification: 'VERIFIED_AT_SOURCE', outreach: 'NOT_ELIGIBLE', title: 'PepsiCo and Gatik launch commercial driverless trucking deployment' });
    // The vendor's words checked at the page: a verified claim BY GATIK, never PepsiCo's statement.
    expect(by('gatik.ai')).toMatchObject({ verification: 'VERIFIED_AT_SOURCE', outreach: 'NOT_ELIGIBLE', reason: 'said by Gatik, not PepsiCo', attribution: 'Gatik', link: 'https://gatik.ai/news/pepsico' });
    // newest publication first
    expect(r.map((s) => s.publisher)).toEqual(['gatik.ai', 'freightwaves.com', 'pepsico.com']);
  });

  it('counts sources found apart from verified outreach facts ("no verified fact" is not "nothing found")', async () => {
    const p = prisma({ runs: [run('r1', '2026-09-30T16:39:00Z', { facts: [], rejected: [{ url: 'https://news.example/a', reason: 'describes_past_event' }, { url: 'https://news.example/b', reason: 'not_a_physical_operations_fact' }] })] });
    const s = await loadAccountSources(p as never, 'PepsiCo', { now: NOW });
    expect(s).toMatchObject({ sourcesFound: 2, claimsVerified: 0, outreachEligible: 0 });
    // Failed an outreach rule before any check at the page: unchecked, never "false".
    expect(s.items.map((i) => [i.verification, i.outreach])).toEqual([['UNCHECKED', 'NOT_ELIGIBLE'], ['UNCHECKED', 'NOT_ELIGIBLE']]);
  });

  it('an old source is labelled NOT A FRESH TRIGGER with its age, never hidden', async () => {
    const p = prisma({ signals: [signal({ research_status: 'no_usable_fact', published_at: new Date('2026-06-08') })] });
    const [s] = (await loadAccountSources(p as never, 'PepsiCo', { now: NOW })).items;
    expect(s).toMatchObject({ freshTrigger: false, ageDays: 115 });
  });

  it('a search summary is never shown as a quote', async () => {
    const p = prisma({ runs: [run('r1', '2026-09-30T16:39:00Z', { sources: [{ url: 'https://news.example/x', title: 't', publishedAt: '2026-09-20T00:00:00Z', excerpt: 'PepsiCo is expanding its fleet.', excerptKind: 'search_summary', provider: 'web', status: 'not_verified', reason: 'reanchor_too_weak' }] })] });
    const [s] = (await loadAccountSources(p as never, 'PepsiCo', { now: NOW })).items;
    expect(s).toMatchObject({ excerptKind: 'search_summary', verification: 'COULD_NOT_VERIFY', reason: 'the statement was not found word for word at the source' });
  });

  it('a source that could not be fetched is COULD NOT VERIFY, not irrelevant', async () => {
    const p = prisma({ runs: [run('r1', '2026-09-30T16:39:00Z', { rejected: [{ url: 'https://nfiindustries.com/news/x', reason: 'source_unreadable:fetch 403' }] })] });
    const [s] = (await loadAccountSources(p as never, 'PepsiCo', { now: NOW })).items;
    expect(s).toMatchObject({ verification: 'COULD_NOT_VERIFY', outreach: 'NOT_EVALUATED', reason: 'source could not be fetched' });
  });
});

describe('only objective garbage is dropped', () => {
  it('search-redirect links and malformed URLs are dropped (counted); a page that does not use the full name and an ambiguous sentence are surfaced', async () => {
    const p = prisma({
      runs: [run('r1', '2026-09-30T16:39:00Z', { rejected: [
        { url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc', reason: 'source_too_weak' },
        { url: 'not a url', reason: 'no_excerpt' },
        { url: 'https://other.example/a', reason: 'page_does_not_name_account' },
        { url: 'https://news.example/c', reason: 'sentence_does_not_name_account' },
      ] })],
    });
    const s = await loadAccountSources(p as never, 'PepsiCo', { now: NOW });
    expect(s.items.map((i) => i.link).sort()).toEqual(['https://news.example/c', 'https://other.example/a']);
    expect(s.items.find((i) => i.link === 'https://news.example/c')!.reason).toBe('the sentence is not about PepsiCo itself (could be about a partner or rival)');
    expect(s.items.find((i) => i.link === 'https://other.example/a')!.reason).toBe('the page does not name PepsiCo by its full name (it may use a brand or short name)');
    expect(s.dropped).toBe(2);
  });

  it('duplicates of one URL are one source; the verified reading wins', async () => {
    const p = prisma({
      signals: [signal({ url: 'https://www.freightwaves.com/news/pepsico-gatik?utm_source=x' })],
      facts: [fact('f2', 'https://www.freightwaves.com/news/pepsico-gatik', PEP_FACT, '2026-06-09')],
      runs: [run('r1', '2026-09-30T16:39:00Z', { rejected: [{ url: 'https://freightwaves.com/news/pepsico-gatik', reason: 'reanchor_too_weak' }] })],
    });
    const s = await loadAccountSources(p as never, 'PepsiCo', { now: NOW });
    expect(s.items).toHaveLength(1);
    expect(s.items[0]).toMatchObject({ verification: 'VERIFIED_AT_SOURCE', outreach: 'ELIGIBLE' });
  });

  it('a story whose research found a claim never itself claims "verified at source": the claim card says how it held up', async () => {
    const p = prisma({ signals: [signal({})] });
    const [s] = (await loadAccountSources(p as never, 'PepsiCo', { now: NOW })).items;
    expect(s).toMatchObject({ verification: 'UNCHECKED', outreach: 'NOT_EVALUATED', reason: 'research on this story checked a claim (its own card shows whether it held up)' });
  });

  it('Casey ignoring or reassigning a source moves it out of the default view, counted, never deleted', async () => {
    const p = prisma({ signals: [signal({ feedback: 'ignored' }), signal({ id: 's9', url: 'https://news.example/z', feedback: null, research_status: 'none' })] });
    const s = await loadAccountSources(p as never, 'PepsiCo', { now: NOW });
    expect(s.items.map((i) => i.link)).toEqual(['https://news.example/z']);
    expect(s.setAside).toBe(1);
    expect(s.items[0]).toMatchObject({ verification: 'UNCHECKED', outreach: 'NOT_EVALUATED', reason: 'not checked yet' });
  });
});

describe('honest counts and provenance', () => {
  it('a read that fails is an error, never "0 sources found"', async () => {
    const p = prisma();
    p.prospectingSignal.findMany = vi.fn(async () => { throw new Error('db down'); });
    await expect(loadAccountSources(p as never, 'PepsiCo', { now: NOW })).rejects.toThrow('db down');
  });

  it('a stored fact that failed a later recheck stays visible as a source, with the recheck reason', async () => {
    const f = fact('f7', 'https://www.truckingdive.com/news/pepsico-autonomous/822728/', 'Regulation Technology Labor An article from Dive Brief PepsiCo expanding autonomous truck use', '2026-06-15');
    (f.metadata as Record<string, unknown>).verified = 'failed_recheck';
    (f.metadata as Record<string, unknown>).recheck = { reason: 'not_a_physical_operations_fact' };
    const s = await loadAccountSources(prisma({ facts: [f] }) as never, 'PepsiCo', { now: NOW });
    expect(s).toMatchObject({ outreachEligible: 0, claimsVerified: 1 });
    expect(s.items[0]).toMatchObject({ verification: 'VERIFIED_AT_SOURCE', outreach: 'NOT_ELIGIBLE', reason: 'failed a later recheck: no sentence states a physical operations change', publisher: 'truckingdive.com' });
  });

  it('a claim stored on a search-redirect link is never hidden and never outreach evidence: no publisher page to open', async () => {
    const s = await loadAccountSources(prisma({ facts: [fact('f3', 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZ', PEP_FACT, '2026-09-20')] }) as never, 'PepsiCo', { now: NOW });
    expect(s).toMatchObject({ outreachEligible: 0, claimsVerified: 0, dropped: 0 });
    expect(s.items[0]).toMatchObject({ verification: 'COULD_NOT_VERIFY', outreach: 'NOT_ELIGIBLE', publisher: 'search redirect', reason: 'stored on a search-redirect link; the original publisher page could not be confirmed' });
  });

  it("two statements from one page stay two: the speaker belongs to its own quote, never borrowed", async () => {
    const own = '“Gatik is already operating inside our networks and adds capacity to move products for our customers across Texas,” said Jim Farrell, senior vice president of PepsiCo.';
    const third = `"Driverless trucks deployed in commercial capacity, driving across highways and surface streets, that's what we're doing with PepsiCo," said Gautam Narang, CEO of Gatik.`;
    const url = 'https://www.freightwaves.com/news/pepsico-gatik-driverless-trucking-deployment';
    const s = await loadAccountSources(prisma({ facts: [fact('a', url, third, '2026-06-09'), fact('b', url, PEP_FACT, '2026-06-09')] }) as never, 'PepsiCo', { now: NOW });
    expect(s.items).toHaveLength(1);
    expect(s.items[0]).toMatchObject({ verification: 'VERIFIED_AT_SOURCE', outreach: 'ELIGIBLE', attribution: null, excerpt: PEP_FACT });
    expect(s.items[0].alsoOnPage).toEqual([expect.objectContaining({ excerpt: third, verification: 'VERIFIED_AT_SOURCE', outreach: 'NOT_ELIGIBLE', attribution: 'Gatik' })]);
    expect(s).toMatchObject({ claimsVerified: 2, outreachEligible: 1 });
    void own;
  });

  it('a page title that is only its URL is no title', async () => {
    const u = 'https://www.fooddive.com/news/pepsico-layoffs/830548/';
    const s = await loadAccountSources(prisma({ facts: [{ ...fact('f4', u, PEP_FACT, '2026-09-16'), title: u }] }) as never, 'PepsiCo', { now: NOW });
    expect(s.items[0].title).toBeNull();
  });

  it('a news-feed link shows the publisher the feed names, not news.google.com', async () => {
    const s = await loadAccountSources(prisma({ signals: [signal({ url: 'https://news.google.com/rss/articles/CBMi123?oc=5', source_name: 'Food Dive', research_status: 'none' })] }) as never, 'PepsiCo', { now: NOW });
    expect(s.items[0].publisher).toBe('Food Dive');
  });
});

describe('red-team fixes', () => {
  it("Casey's Wrong account holds: the row moved off the account stays set aside, even when a research run saw the same URL", async () => {
    const p = prisma({
      signals: [signal({ url: 'https://news.example/w', account_name: null, research_status: 'none', metadata: { reassignedFrom: 'PepsiCo' } })],
      runs: [run('r1', '2026-09-30T16:39:00Z', { rejected: [{ url: 'https://news.example/w', reason: 'describes_past_event' }] })],
    });
    const s = await loadAccountSources(p as never, 'PepsiCo', { now: NOW });
    expect(s.items).toHaveLength(0);
    expect(s.setAside).toBe(1);
    expect(s.setAsideItems[0].reason).toBe("you marked it as another account's (waiting in Signal intake)");
  });

  it('Ignore never hides a live verified fact (it is counted, so it is shown, marked reviewed)', async () => {
    const url = 'https://www.pepsico.com/n';
    const s = await loadAccountSources(prisma({ signals: [signal({ url, feedback: 'ignored', account_name: 'PepsiCo' })], facts: [fact('f1', url, PEP_FACT, '2026-09-20')] }) as never, 'PepsiCo', { now: NOW });
    expect(s).toMatchObject({ outreachEligible: 1, setAside: 0 });
    expect(s.items[0]).toMatchObject({ outreach: 'ELIGIBLE', reviewed: true });
  });

  it("an ended change is not a verified outreach fact (the brief's live-fact rule)", async () => {
    const f = fact('f5', 'https://news.example/acme', PEP_FACT, '2026-09-01');
    (f.metadata as Record<string, unknown>).continuity = { kind: 'ended' };
    const s = await loadAccountSources(prisma({ facts: [f] }) as never, 'PepsiCo', { now: NOW });
    expect(s).toMatchObject({ outreachEligible: 0, claimsVerified: 1 });
    expect(s.items[0]).toMatchObject({ verification: 'VERIFIED_AT_SOURCE', outreach: 'NOT_ELIGIBLE', reason: 'the change has since ended or was superseded' });
  });

  it('a search summary from another run never appears among the statements on a verified page', async () => {
    const url = 'https://www.pepsico.com/n';
    const s = await loadAccountSources(
      prisma({ facts: [fact('f1', url, PEP_FACT, '2026-09-20')], runs: [run('r2', '2026-09-30T00:00:00Z', { sources: [{ url, title: 't', publishedAt: null, excerpt: 'PepsiCo is adding trucks (model paraphrase).', excerptKind: 'search_summary', provider: 'web', status: 'not_verified', reason: 'excerpt_not_found_at_source' }] })] }) as never,
      'PepsiCo',
      { now: NOW },
    );
    expect(s.items[0].alsoOnPage).toBeUndefined();
  });

  it('a discovery mention is labelled as a third-party story; an undated link sorts by when GAP found it', async () => {
    const s = await loadAccountSources(
      prisma({ signals: [signal({ id: 'm', url: 'https://news.example/gatik', title: 'Gatik expands driverless runs for PepsiCo', research_status: 'none', resolution_basis: 'discovery_mention', published_at: new Date('2026-09-29') }), signal({ id: 'u', url: 'https://news.example/undated', published_at: null, created_at: new Date('2026-10-01T09:00:00Z'), research_status: 'none' }), signal({ id: 'o', url: 'https://news.example/old', published_at: new Date('2023-01-01'), research_status: 'none' })] }) as never,
      'PepsiCo',
      { now: NOW },
    );
    expect(s.items.map((i) => i.link)).toEqual(['https://news.example/undated', 'https://news.example/gatik', 'https://news.example/old']);
    expect(s.items[1].reason).toBe('the headline mentions PepsiCo; the story is about another company');
  });

  it('an undated page research read sorts after dated sources (an undated link Casey shared does not)', async () => {
    const s = await loadAccountSources(
      prisma({
        signals: [signal({ id: 'd', url: 'https://news.example/dated', published_at: new Date('2026-09-10'), research_status: 'none', origin: 'discovery' })],
        runs: [run('r1', '2026-09-30T16:39:00Z', { sources: [{ url: 'https://www.mecalux.com/news/pepsico', title: null, publishedAt: null, excerpt: null, excerptKind: null, provider: 'page', status: 'not_verified', reason: 'no_publication_date' }] })],
      }) as never,
      'PepsiCo',
      { now: NOW },
    );
    expect(s.items.map((i) => i.publisher)).toEqual(['news.example', 'mecalux.com']);
  });

  it('says when older research was not loaded', async () => {
    const runs = Array.from({ length: 25 }, (_, i) => run(`r${i}`, '2026-09-30T00:00:00Z', {}));
    expect((await loadAccountSources(prisma({ runs }) as never, 'PepsiCo', { now: NOW })).partial).toBe(true);
    expect((await loadAccountSources(prisma({}) as never, 'PepsiCo', { now: NOW })).partial).toBe(false);
  });
});

describe('the evidence gate is unchanged', () => {
  it('a third-party quote still fails outreach verification (visibility never loosens the gate)', async () => {
    const quote = '"Our trucks now move freight for PepsiCo across 250 retail locations, and that\'s what we\'re deploying across Texas," said Gautam Narang, CEO of Gatik.';
    const v = await verifyCandidate({ provider: 'signal', url: 'https://gatik.ai/n', title: 'n', publishedAt: new Date('2026-09-01'), excerpt: quote, sourceType: 'public_secondary' }, verificationContext('PepsiCo', async () => `x ${quote} y`));
    expect(v).toMatchObject({ ok: false, reason: 'quoted_third_party' });
  });
  it('a stored fact that is a vendor quoting itself about the account shows as a SOURCE with attribution, never as a verified fact', async () => {
    const quote = `"Our trucks now move freight for PepsiCo across 250 retail locations, and that's what we're deploying across Texas," said Gautam Narang, CEO of Gatik.`;
    const p = prisma({ facts: [fact('f9', 'https://gatik.ai/news/pepsico', quote, '2026-06-09')] });
    const s = await loadAccountSources(p as never, 'PepsiCo', { now: NOW });
    // A verified fact ABOUT WHAT GATIK SAID: true, attributed to Gatik, not PepsiCo's outreach evidence.
    expect(s).toMatchObject({ claimsVerified: 1, outreachEligible: 0 });
    expect(s.items[0]).toMatchObject({ verification: 'VERIFIED_AT_SOURCE', outreach: 'NOT_ELIGIBLE', attribution: 'Gatik', excerptKind: 'verbatim', reason: 'said by Gatik, not PepsiCo' });
  });
  it('reasons are factual words, never "irrelevant"', () => {
    for (const r of ['describes_past_event', 'quoted_third_party', 'not_a_physical_operations_fact', 'reanchor_too_weak', 'source_unreadable:fetch 403', 'no_publication_date', 'no_fact_sentence', 'boilerplate'])
      expect(sourceReason(r, 'PepsiCo')).not.toMatch(/irrelevant/i);
  });
});

describe('a research run keeps every page it looked at', () => {
  it('cited pages with no fact sentence, unreadable pages and rejected candidates are all recorded with provenance', async () => {
    const { runEvidenceResearch } = await import('@/lib/gap/research/run');
    const runs: any[] = [];
    const prisma: any = {
      researchRun: {
        create: vi.fn(async ({ data }: any) => { runs.push({ id: 'run1', ...data }); return { id: 'run1' }; }),
        update: vi.fn(async ({ data }: any) => Object.assign(runs[0], data)),
      },
      gapAuditEvent: { create: vi.fn(async () => ({ id: 'a' })), findMany: vi.fn(async () => []) },
      prospectingSignal: { findMany: vi.fn(async () => []), update: vi.fn() },
    };
    const fetchHtml = async (url: string) => {
      if (url.includes('blocked')) throw new Error('fetch 403');
      return '<html><head><title>PepsiCo investor day recap</title><meta property="article:published_time" content="2026-09-20T00:00:00Z"></head><body><p>PepsiCo held its investor day in New York and discussed brand strategy.</p></body></html>';
    };
    const r = await runEvidenceResearch(
      prisma,
      { accountName: 'PepsiCo', personaId: null, hypothesisId: null, problemFamily: null, decisionId: null, actor: 't', now: NOW, seekCurrentness: false },
      {
        edgar: async () => ({ candidates: [], note: 'off' }),
        web: async () => ({
          candidates: [{ provider: 'web', url: 'https://news.example/pepsico-fleet', title: 'PepsiCo fleet story', publishedAt: new Date('2026-09-15'), excerpt: 'PepsiCo is adding electric trucks to its fleet in California.', sourceType: 'public_secondary' }],
          note: 'one',
          sources: ['https://news.example/pepsico-investor-day', 'https://blocked.example/pepsico'],
        }),
        fetchHtml,
        fetchText: async () => 'A page about something else entirely, long enough to read, that never mentions the company by name.',
      },
    );
    const by = (u: string) => r.sources!.find((s) => s.url === u)!;
    expect(by('https://news.example/pepsico-investor-day')).toMatchObject({ status: 'not_verified', reason: 'no_fact_sentence', title: 'PepsiCo investor day recap', publishedAt: '2026-09-20T00:00:00.000Z' });
    expect(by('https://blocked.example/pepsico')).toMatchObject({ status: 'could_not_verify', reason: 'source_unreadable:fetch 403' });
    expect(by('https://news.example/pepsico-fleet')).toMatchObject({ status: 'not_verified', excerptKind: 'search_summary', title: 'PepsiCo fleet story', excerpt: 'PepsiCo is adding electric trucks to its fleet in California.' });
    // Stored on the run, where the source view reads it; no fact was minted from any of them.
    expect(runs[0].provider_status.result.sources).toHaveLength(3);
    expect(r.facts).toHaveLength(0);
  });
});

describe('red-team: nothing a run read disappears', () => {
  it('EDGAR: a filing with no fact sentence, an unreadable one and one past the read limit are all sources', async () => {
    const { edgarCandidates } = await import('@/lib/gap/research/providers');
    const hit = (n: number) => ({ _id: `0000077476-26-00000${n}:doc${n}.htm`, _source: { file_date: `2026-0${n}-01`, form: '8-K' } });
    const fetchJson = async (url: string) =>
      url.includes('company_tickers') ? { 0: { cik_str: 77476, title: 'PEPSICO INC' } } : { hits: { hits: [1, 2, 3, 4, 5, 6].map(hit) } };
    const fetchText = async (url: string) => {
      if (url.includes('doc6')) throw new Error('fetch 503');
      return 'Item 9.01 Financial Statements and Exhibits. The exhibits listed below are filed herewith. Signatures follow on the next page.';
    };
    const r = await edgarCandidates('PepsiCo', NOW, { fetchJson, fetchText });
    const by = (n: number) => r.pageResults!.find((p) => p.url.endsWith(`doc${n}.htm`))!;
    expect(by(6)).toMatchObject({ outcome: 'unreadable', error: 'fetch 503' });
    expect(by(5)).toMatchObject({ outcome: 'read', sentences: 0, title: 'PEPSICO INC 8-K (filed 2026-05-01)' });
    expect(by(1)).toMatchObject({ outcome: 'not_read' });
    expect(r.pageResults).toHaveLength(6);
  });

  it('a second page carrying the same statement (syndicated copy) is recorded as a source, not swallowed by the dedupe', async () => {
    const { runEvidenceResearch } = await import('@/lib/gap/research/run');
    const runs: any[] = [];
    const recs: any[] = [];
    const sigs: any[] = [];
    const prisma: any = {
      researchRun: { create: vi.fn(async ({ data }: any) => { runs.push({ id: 'run1', ...data }); return { id: 'run1' }; }), update: vi.fn(async ({ data }: any) => Object.assign(runs[0], data)) },
      gapAuditEvent: { create: vi.fn(async () => ({ id: 'a' })), findMany: vi.fn(async () => []) },
      evidenceRecord: {
        upsert: vi.fn(async ({ create }: any) => { const r = { id: `ev${recs.length + 1}`, ...create }; recs.push(r); return r; }),
        findUnique: vi.fn(async () => recs[recs.length - 1]),
        findMany: vi.fn(async () => recs),
      },
      prospectingSignal: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async ({ data }: any) => { const x = { id: `sig${sigs.length + 1}`, ...data }; sigs.push(x); return x; }),
        update: vi.fn(),
        findMany: vi.fn(async () => sigs),
      },
    };
    const sentence = 'PepsiCo plans to build a new distribution center in Texas and close two older warehouses in the region.';
    const cand = (url: string) => ({ provider: 'signal' as const, url, title: 'Story', publishedAt: new Date('2026-09-20'), excerpt: sentence, sourceType: 'public_secondary' as const });
    const r = await runEvidenceResearch(
      prisma,
      { accountName: 'PepsiCo', personaId: null, hypothesisId: null, problemFamily: null, decisionId: null, actor: 't', now: NOW, seekCurrentness: false },
      { edgar: async () => ({ candidates: [], note: 'off' }), web: async () => ({ candidates: [], note: 'off' }), sourcePages: false, extra: async () => ({ candidates: [cand('https://www.pepsico.com/a'), cand('https://www.supplychaindive.com/a')], note: 'two' }), fetchText: async () => sentence },
    );
    expect(r.facts).toHaveLength(1);
    expect(r.sources!.map((x) => [x.url, x.status, x.reason])).toEqual([
      ['https://www.pepsico.com/a', 'verified', null],
      ['https://www.supplychaindive.com/a', 'not_verified', 'same_statement_as_other_source'],
    ]);
  });

  it('a source waiting in Signal intake for its account is refused from the account page, never buried', async () => {
    const { applySourceOp } = await import('@/lib/gap/sources/source-ops');
    const { signalUrlHash, normalizeSignalUrl } = await import('@/lib/gap/signals/intake');
    const row = { id: 's-n', url_hash: signalUrlHash(normalizeSignalUrl('https://news.example/n')!), account_name: null };
    const prisma: any = { account: { findFirst: vi.fn(async () => ({ name: 'PepsiCo' })) }, gapSignal: { findUnique: vi.fn(async () => row), update: vi.fn() } };
    expect(await applySourceOp(prisma, { accountName: 'PepsiCo', url: 'https://news.example/n', op: 'ignore', actor: 'c', now: NOW })).toEqual({ ok: false, reason: 'needs_account' });
    expect(prisma.gapSignal.update).not.toHaveBeenCalled();
  });
});
