/**
 * GAP Signal Intelligence A: signal intake. A signal is captured before we
 * know whose it is; it is never a fact; Casey's note is context, not evidence;
 * an ambiguous signal never silently attaches to an account; capture writes
 * ONE GapSignal row and nothing else (no PounceTrigger, no ProspectingSignal,
 * no HubSpot, no Slack).
 */
import { describe, expect, it, vi } from 'vitest';
import { captureSignal, classifySignal, makeFetchHtml, normalizeSignalUrl, resolvesToPrivate, parseSignalMeta, resolveSignalAccount, signalStatus, sourceClassOf } from '@/lib/gap/signals/intake';

const NOW = new Date('2026-09-28T15:00:00.000Z');

function fakeDb(opts: { accounts?: Array<{ name: string; parent_brand?: string | null }>; aliases?: Array<{ alias: string; normalized_alias: string; account_name: string }>; links?: Array<{ canonical_company_id: string; account_name: string }> } = {}) {
  const rows: Array<Record<string, unknown>> = [];
  const accounts = (opts.accounts ?? [{ name: 'PepsiCo' }, { name: 'Frito-Lay' }, { name: 'General Mills' }, { name: 'Target' }]).map((a) => ({ parent_brand: null, ...a }));
  const lower = (s: string) => s.toLowerCase();
  const prisma = {
    gapSignal: {
      findUnique: vi.fn(async ({ where }: { where: { url_hash: string } }) => rows.find((r) => r.url_hash === where.url_hash) ?? null),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `sig-${rows.length + 1}`, ...data };
        rows.push(row);
        return { id: row.id };
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const r = rows.find((x) => x.id === where.id)!;
        Object.assign(r, data);
        return r;
      }),
    },
    account: {
      findMany: vi.fn(async ({ where }: { where?: { name?: { equals?: string; contains?: string } } } = {}) => {
        if (where?.name?.equals !== undefined) return accounts.filter((a) => lower(a.name) === lower(where.name!.equals!));
        if (where?.name?.contains !== undefined) return accounts.filter((a) => lower(a.name).includes(lower(where.name!.contains!)));
        return accounts;
      }),
    },
    gapAccountAlias: { findMany: vi.fn(async ({ where }: { where?: { normalized_alias?: string } } = {}) => (opts.aliases ?? []).filter((a) => !where?.normalized_alias || a.normalized_alias === where.normalized_alias)) },
    canonicalAccountLink: { findMany: vi.fn(async ({ where }: { where: { canonical_company_id: { in: string[] } } }) => (opts.links ?? []).filter((l) => where.canonical_company_id.in.includes(l.canonical_company_id))) },
    pounceTrigger: { create: vi.fn() },
    prospectingSignal: { create: vi.fn(), upsert: vi.fn() },
  };
  return { prisma, rows };
}

describe('URL identity', () => {
  it('strips tracking params, fragments, www and trailing slashes; keeps meaningful query params', () => {
    expect(normalizeSignalUrl('https://www.Reuters.com/business/pepsico-gatik/?utm_source=x&utm_medium=y#top')).toBe('https://reuters.com/business/pepsico-gatik');
    expect(normalizeSignalUrl('http://example.com/story?id=42&fbclid=abc')).toBe('https://example.com/story?id=42');
  });

  it('refuses non-web and network-private URLs (never fetched server-side)', () => {
    for (const u of ['ftp://x.com/a', 'javascript:alert(1)', 'http://localhost/a', 'http://10.0.0.5/a', 'http://192.168.1.1/x', 'http://[::1]/', 'not a url']) expect(normalizeSignalUrl(u)).toBeNull();
  });

  it('classifies the source by host', () => {
    expect(sourceClassOf('sec.gov')).toBe('sec_filing');
    expect(sourceClassOf('prnewswire.com')).toBe('press_release');
    expect(sourceClassOf('linkedin.com')).toBe('social');
    expect(sourceClassOf('boards.greenhouse.io')).toBe('job_posting');
    expect(sourceClassOf('sam.gov')).toBe('procurement');
    expect(sourceClassOf('supplychaindive.com')).toBe('news');
  });

  it('reads title and publication date from page metadata', () => {
    const m = parseSignalMeta('<html><head><meta property="og:title" content="PepsiCo expands Gatik autonomous freight &amp; more"><meta property="article:published_time" content="2026-09-20T10:00:00Z"><meta property="og:site_name" content="Supply Chain Dive"></head></html>');
    expect(m).toEqual({ title: 'PepsiCo expands Gatik autonomous freight & more', publishedAt: new Date('2026-09-20T10:00:00Z'), siteName: 'Supply Chain Dive' });
  });
});

describe('conservative account resolution', () => {
  it('Casey\'s explicit account wins when it names exactly one account', async () => {
    const { prisma } = fakeDb();
    expect(await resolveSignalAccount(prisma, { accountHint: 'pepsico', title: 'Frito-Lay opens a plant' })).toMatchObject({ resolution: 'resolved', accountName: 'PepsiCo', basis: 'explicit_account' });
  });

  it('exactly one account named in the title resolves; two (parent and subsidiary) are AMBIGUOUS, never collapsed', async () => {
    const { prisma } = fakeDb();
    expect(await resolveSignalAccount(prisma, { title: 'General Mills to consolidate two distribution centers' })).toMatchObject({ resolution: 'resolved', accountName: 'General Mills', basis: 'named_in_source' });
    const amb = await resolveSignalAccount(prisma, { title: 'PepsiCo and Frito-Lay expand Texas network' });
    expect(amb.resolution).toBe('ambiguous');
    expect(amb.accountName).toBeNull();
    expect(amb.candidates.map((c) => c.name).sort()).toEqual(['Frito-Lay', 'PepsiCo']);
  });

  it('a generic-word account name never matches free text; nothing named is NEEDS ACCOUNT', async () => {
    const { prisma } = fakeDb();
    expect(await resolveSignalAccount(prisma, { title: 'Retailers target faster dock turns this peak' })).toMatchObject({ resolution: 'needs_account', accountName: null });
  });

  it('the source on the company\'s own domain resolves', async () => {
    const { prisma } = fakeDb({ links: [{ canonical_company_id: 'domain:pepsico.com', account_name: 'PepsiCo' }] });
    expect(await resolveSignalAccount(prisma, { title: 'Our network update', url: 'https://www.pepsico.com/news/story' })).toMatchObject({ resolution: 'resolved', accountName: 'PepsiCo', basis: 'domain' });
  });
});

describe('captureSignal', () => {
  const meta = async () => '<meta property="og:title" content="PepsiCo expands autonomous freight program with Gatik"><meta property="article:published_time" content="2026-09-20">';

  it('a URL alone is enough: it is captured, resolved from the page title and classified; nothing else is written', async () => {
    const { prisma, rows } = fakeDb();
    const r = await captureSignal(prisma, { url: 'https://supplychaindive.com/news/pepsico-gatik/?utm_source=li', origin: 'casey_share', actor: 'casey@freightroll.com', now: NOW }, { fetchHtml: meta });
    expect(r).toEqual({ ok: true, signal: { id: 'sig-1', created: true } });
    expect(rows[0]).toMatchObject({ account_name: 'PepsiCo', resolution: 'resolved', resolution_basis: 'named_in_source', relevance: 'outreach_evidence_candidate', source_class: 'news', title: 'PepsiCo expands autonomous freight program with Gatik', event_id: 'sig-1' });
    expect(rows[0].categories).toContain('autonomy');
    expect(prisma.pounceTrigger.create).not.toHaveBeenCalled();
    expect(prisma.prospectingSignal.create).not.toHaveBeenCalled();
    expect(prisma.prospectingSignal.upsert).not.toHaveBeenCalled();
  });

  it('Casey\'s note is stored verbatim as context and never becomes the title or evidence text', async () => {
    const { prisma, rows } = fakeDb();
    await captureSignal(prisma, { url: 'https://supplychaindive.com/news/pepsico-gatik', note: 'Gatik angle feels more useful than the capex filing.', accountHint: 'PepsiCo', origin: 'casey_share', actor: 'casey', now: NOW }, { fetchHtml: meta });
    expect(rows[0].note).toBe('Gatik angle feels more useful than the capex filing.');
    expect(rows[0].title).toBe('PepsiCo expands autonomous freight program with Gatik');
    expect(JSON.stringify(rows[0])).not.toMatch(/evidence_text/);
  });

  it('the same story with different tracking params is ONE source; a second share is remembered on it', async () => {
    const { prisma, rows } = fakeDb();
    await captureSignal(prisma, { url: 'https://supplychaindive.com/news/pepsico-gatik?utm_source=a', origin: 'discovery', actor: 'gap', now: NOW }, { fetchHtml: meta });
    const again = await captureSignal(prisma, { url: 'https://www.supplychaindive.com/news/pepsico-gatik/?utm_campaign=b', note: 'worth a look', origin: 'casey_share', actor: 'casey', now: NOW }, { fetchHtml: meta });
    expect(again).toEqual({ ok: true, signal: { id: 'sig-1', created: false } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ origin: 'casey_share', note: 'worth a look' });
  });

  it('an ambiguous signal is kept with its candidates and no account', async () => {
    const { prisma, rows } = fakeDb();
    await captureSignal(prisma, { url: 'https://example.com/a', origin: 'casey_share', actor: 'casey', now: NOW }, { fetchHtml: async () => '<title>PepsiCo and Frito-Lay expand Texas network</title>' });
    expect(rows[0]).toMatchObject({ resolution: 'ambiguous', account_name: null });
    expect((rows[0].candidates as Array<{ name: string }>).length).toBe(2);
  });

  it('an unreadable page still keeps the signal (NEEDS ACCOUNT), recording why', async () => {
    const { prisma, rows } = fakeDb();
    const r = await captureSignal(prisma, { url: 'https://paywalled.example.com/story', origin: 'casey_share', actor: 'casey', now: NOW }, { fetchHtml: async () => { throw new Error('fetch 403'); } });
    expect(r.ok).toBe(true);
    expect(rows[0]).toMatchObject({ resolution: 'needs_account', title: null });
    expect((rows[0].metadata as { metaError?: string }).metaError).toBe('fetch 403');
  });

  it('a conference note with no link is operator context: resolved by Casey\'s account, never researched as public evidence', async () => {
    const { prisma, rows } = fakeDb();
    await captureSignal(prisma, { note: 'VP Ops said their trailer visibility is still site-by-site.', accountHint: 'PepsiCo', origin: 'conference_note', actor: 'casey', now: NOW }, { fetchHtml: null });
    expect(rows[0]).toMatchObject({ url: null, url_hash: null, account_name: 'PepsiCo', relevance: 'account_context', source_name: 'conference' });
  });

  it('refuses an empty submission and a non-web URL', async () => {
    const { prisma } = fakeDb();
    expect(await captureSignal(prisma, { origin: 'casey_share', actor: 'c', now: NOW })).toEqual({ ok: false, reason: 'url_or_note_required' });
    expect(await captureSignal(prisma, { url: 'http://127.0.0.1/admin', origin: 'casey_share', actor: 'c', now: NOW })).toEqual({ ok: false, reason: 'bad_url' });
  });
});

describe('relevance is a label, and status tells Casey what GAP did', () => {
  it('classifies deterministically', () => {
    expect(classifySignal('PepsiCo opens new distribution center in Texas', 'PepsiCo').relevance).toBe('outreach_evidence_candidate');
    expect(classifySignal('PepsiCo appoints new chief supply chain officer', 'PepsiCo').relevance).toBe('leadership');
    expect(classifySignal('Cargo theft ring targets PepsiCo trailers', 'PepsiCo').relevance).toBe('risk');
    expect(classifySignal('PepsiCo stock price target raised by analyst', 'PepsiCo').relevance).toBe('research_lead');
  });

  it('status words', () => {
    const s = (o: Partial<Parameters<typeof signalStatus>[0]>) => signalStatus({ url: 'https://x.com/a', resolution: 'resolved', research_status: 'none', feedback: null, ...o }).status;
    expect(s({ resolution: 'needs_account' })).toBe('Needs you');
    expect(s({ resolution: 'ambiguous' })).toBe('Needs you');
    expect(s({})).toBe('Captured');
    expect(s({ research_status: 'queued' })).toBe('Researching');
    expect(s({ research_status: 'fact_found' })).toBe('Fact ready');
    expect(s({ research_status: 'contradiction' })).toBe('Needs you');
    expect(s({ research_status: 'no_usable_fact' })).toBe('Nothing usable');
    expect(s({ url: null })).toBe('Context kept');
    expect(s({ feedback: 'irrelevant' })).toBe('Ignored');
  });
});

describe('review A hardening', () => {
  it('the metadata fetch never follows a redirect into a private host', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data/' } }));
    await expect(makeFetchHtml({ lookup: async () => ['93.184.216.34'] })('https://public.example.com/story')).rejects.toThrow('private host');
    expect(f).toHaveBeenCalledTimes(1);
    f.mockRestore();
  });

  it('two captures of the same link at once: the unique key lets one win and the other returns it', async () => {
    const { prisma } = fakeDb();
    prisma.gapSignal.findUnique = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'winner' });
    prisma.gapSignal.create = vi.fn(async () => {
      throw Object.assign(new Error('unique'), { code: 'P2002' });
    });
    expect(await captureSignal(prisma, { url: 'https://example.com/story', origin: 'discovery', actor: 'gap', now: NOW, title: 'x' }, { fetchHtml: null })).toEqual({ ok: true, signal: { id: 'winner', created: false } });
  });
});

describe('review A P1s', () => {
  it('a public name that resolves to a private address is never fetched (DNS rebinding); a lookup failure fails closed', async () => {
    expect(await resolvesToPrivate('x.127.0.0.1.nip.io', async () => ['127.0.0.1'])).toBe(true);
    expect(await resolvesToPrivate('cgnat.example', async () => ['100.64.1.2'])).toBe(true);
    expect(await resolvesToPrivate('nx.example', async () => { throw new Error('ENOTFOUND'); })).toBe(true);
    expect(await resolvesToPrivate('news.example', async () => ['93.184.216.34'])).toBe(false);
    const f = vi.spyOn(globalThis, 'fetch');
    await expect(makeFetchHtml({ lookup: async () => ['10.0.0.7'] })('https://rebind.example.com/a')).rejects.toThrow('private host');
    expect(f).not.toHaveBeenCalled();
    f.mockRestore();
  });

  it('a partial hint resolves only as a 5+ letter prefix of one name; "Dana" is shown to Casey, never attached', async () => {
    const { prisma } = fakeDb({ accounts: [{ name: 'Danaher' }, { name: 'PepsiCo' }] });
    expect(await resolveSignalAccount(prisma, { accountHint: 'Pepsi' })).toMatchObject({ resolution: 'resolved', accountName: 'PepsiCo', basis: 'hint_prefix' });
    expect(await resolveSignalAccount(prisma, { accountHint: 'Dana' })).toMatchObject({ resolution: 'ambiguous', accountName: null, candidates: [{ name: 'Danaher' }] });
    expect(await resolveSignalAccount(prisma, { accountHint: 'aher' })).toMatchObject({ resolution: 'ambiguous', accountName: null });
  });

  it('short or everyday account names never match a headline', async () => {
    const { prisma } = fakeDb({ accounts: [{ name: 'Ford' }, { name: 'Mars' }, { name: 'Dover' }, { name: 'Hormel Foods' }] });
    expect((await resolveSignalAccount(prisma, { title: 'Harrison Ford visits a Mars mission warehouse in Dover' })).resolution).toBe('needs_account');
    expect(await resolveSignalAccount(prisma, { title: 'Hormel Foods consolidates two plants' })).toMatchObject({ resolution: 'resolved', accountName: 'Hormel Foods' });
  });

  it('a re-share that names the account resolves a row that still needed one, and follows it up', async () => {
    const { prisma, rows } = fakeDb();
    await captureSignal(prisma, { url: 'https://example.com/story-x', origin: 'discovery', actor: 'gap', now: NOW }, { fetchHtml: async () => '<title>Quiet news day</title>' });
    expect(rows[0].resolution).toBe('needs_account');
    await captureSignal(prisma, { url: 'https://example.com/story-x', accountHint: 'PepsiCo', origin: 'casey_share', actor: 'casey', now: NOW }, { fetchHtml: null });
    expect(rows[0]).toMatchObject({ account_name: 'PepsiCo', resolution: 'resolved', research_status: 'queued', origin: 'casey_share' });
  });
});

