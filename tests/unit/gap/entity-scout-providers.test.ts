/**
 * Release L: Gemini is not a single point of failure. One grounded Scout contract, several providers; a quota
 * is infrastructure state (try the next provider, then a retryable failure), never company evidence. A claim the
 * search did not cite is dropped. One Scout per company at a time; every pass (ok or failed) is audited with the
 * provider chain, and a failed pass is never stored as a verdict.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { _resetCooldowns, askGrounded, classifyProviderError, groundedOnly, urlsIn, withModelFallback, type ProviderAnswer, type ScoutProvider } from '@/lib/gap/entity/providers';
import { scoutCompany } from '@/lib/gap/entity/scout';
import { scoutCandidate } from '@/lib/gap/entity/candidates';

const quota = Object.assign(new Error('[429 Too Many Requests] You exceeded your current quota. Quota: GenerateRequestsPerDayPerProjectPerModel-FreeTier'), { status: 429 });
const prov = (name: ScoutProvider['name'], ask: (q: string) => Promise<ProviderAnswer>, available = true): ScoutProvider & { calls: number } => {
  const p = { name, available: () => available, calls: 0, ask: async (q: string) => (p.calls++, ask(q)) };
  return p;
};
const SCOUT_JSON = JSON.stringify({
  entityType: '3pl',
  domain: 'kenco.example',
  what: 'Contract logistics company that runs warehouses and distribution centers.',
  network: [
    { claim: 'Operates 100 distribution centers across North America', url: 'https://kenco.example/locations' },
    { claim: 'Runs a yard and trailer pool at its Chattanooga campus', url: 'https://made-up.example/yard' },
  ],
  freight: [{ claim: 'Operates a dedicated fleet of trucks and hostlers at its DCs', url: 'https://kenco.example/fleet/' }],
  unknowns: [],
});
const noSleep = async () => {};
beforeEach(() => _resetCooldowns());

describe('the provider chain', () => {
  it('(sanity) the fixture is grounded on the pages it cites', () => {
    expect(groundedOnly(JSON.parse(SCOUT_JSON).network, ['https://kenco.example/locations']).kept).toHaveLength(1);
  });

  it('a Gemini quota error is not evidence: it cools Gemini down and the next grounded provider answers', async () => {
    const gemini = prov('gemini', async () => { throw quota; });
    const openai = prov('openai_web', async () => ({ text: SCOUT_JSON, citations: ['https://kenco.example/locations', 'https://www.kenco.example/fleet'] }));
    const r = await scoutCompany('Kenco Logistics', { providers: [gemini, openai] });
    expect(r.failed).toBeUndefined();
    expect(r.provider).toBe('openai_web');
    expect(r.attempts?.map((a) => [a.provider, a.outcome])).toEqual([['gemini', 'quota'], ['openai_web', 'ok']]);
    // the uncited yard claim is dropped, and said
    expect(r.network.map((c) => c.url)).toEqual(['https://kenco.example/locations']);
    expect(r.unknowns).toContain('Not cited by the search (dropped): Runs a yard and trailer pool at its Chattanooga campus');
    expect(r.verdict).toBe('DIRECT_BUYER');
    // Gemini is cooling: the next pass does not even call it
    await scoutCompany('Kenco Logistics', { providers: [gemini, openai] });
    expect(gemini.calls).toBe(1);
  });

  it('every provider failing is a retryable failure that names each attempt, not INSUFFICIENT evidence', async () => {
    const r = await scoutCompany('Crowley Maritime', { providers: [prov('gemini', async () => { throw quota; }), prov('openai_web', async () => ({ text: SCOUT_JSON, citations: [] })), prov('gateway_web', async () => ({ text: '' }) as never, false)] });
    expect(r.failed).toBe(true);
    expect(r.why).toBe('The web pass failed (gemini quota; openai_web no citations; gateway_web unavailable); nothing is known yet. Retry later.');
    expect(r.attempts?.map((a) => a.outcome)).toEqual(['quota', 'no_citations', 'unavailable']);
  });

  it('an answer without citations is model memory, never used', async () => {
    const r = await askGrounded('q', (a) => a.text, [prov('openai_web', async () => ({ text: 'x', citations: [] }))]);
    expect(r).toMatchObject({ ok: false, attempts: [{ provider: 'openai_web', outcome: 'no_citations' }] });
  });

  it('a transient error retries once (bounded), then moves on', async () => {
    let n = 0;
    const flaky = prov('gemini', async () => { n++; throw new Error('503 Service Unavailable'); });
    const r = await askGrounded('q', (a) => a.text, [flaky], { sleep: noSleep });
    expect(n).toBe(2);
    expect(r).toMatchObject({ ok: false, attempts: [{ provider: 'gemini', outcome: 'error' }] });
  });

  it('classifies quota vs transient vs other, with a cooldown from the provider hint', () => {
    expect(classifyProviderError(quota)).toMatchObject({ kind: 'quota', coolMs: 3_600_000 });
    expect(classifyProviderError(new Error('429 rate limit. Please retry in 12.5s'))).toMatchObject({ kind: 'quota', coolMs: 13_500 });
    expect(classifyProviderError(Object.assign(new Error('429 You have no credits remaining. Add credits to continue'), { status: 429 }))).toMatchObject({ kind: 'quota', coolMs: 3_600_000 });
    expect(classifyProviderError(new Error('fetch failed'))).toMatchObject({ kind: 'transient' });
    expect(classifyProviderError(new Error('invalid model'))).toMatchObject({ kind: 'error' });
  });

  it('every claim failing the citation check is not grounded: no fit is read from it, the next provider answers', async () => {
    const miss = prov('openai_web', async () => ({ text: SCOUT_JSON, citations: ['https://other.example/page'] }));
    const gw = prov('gateway_web', async () => ({ text: SCOUT_JSON, citations: ['https://kenco.example/locations'] }));
    const r = await scoutCompany('Kenco Logistics', { providers: [miss, gw] });
    expect(r.attempts?.map((a) => [a.provider, a.outcome])).toEqual([['openai_web', 'unparsable'], ['gateway_web', 'ok']]);
    const none = await scoutCompany('Kenco Logistics', { providers: [prov('openai_web', async () => ({ text: SCOUT_JSON, citations: ['https://other.example/page'] }))] });
    expect(none.failed).toBe(true);
  });

  it('Gemini: an answer with no grounding (no sites read) is model memory; with sites read, a claim must be on one', async () => {
    const memory = await askGrounded('q', (a) => a.text, [prov('gemini', async () => ({ text: SCOUT_JSON, citations: [], citedHosts: [] }))]);
    expect(memory).toMatchObject({ ok: false, attempts: [{ provider: 'gemini', outcome: 'no_citations' }] });
    const r = await scoutCompany('Kenco Logistics', { providers: [prov('gemini', async () => ({ text: SCOUT_JSON, citations: [], citedHosts: ['kenco.example'] }))] });
    expect(r.provider).toBe('gemini');
    expect(r.network.map((c) => c.url)).toEqual(['https://kenco.example/locations']);
    expect(r.freight).toHaveLength(1);
    // a claim citing one of the grounding chunk links (a Google redirect to the page read) is cited
    const redirect = 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQ1';
    const viaChunk = await scoutCompany('Kenco Logistics', { providers: [prov('gemini', async () => ({ text: SCOUT_JSON.replace('https://made-up.example/yard', redirect), citations: [redirect], citedHosts: [] }))] });
    expect(viaChunk.network.map((c) => c.url)).toEqual([redirect]);
  });

  it('a hung provider is aborted at its bound, not retried, and the chain moves on inside one deadline', async () => {
    let aborted = false;
    let hungCalls = 0;
    const hung = prov('gemini', () => new Promise<ProviderAnswer>(() => {}));
    hung.ask = (q: string, signal: AbortSignal) => (signal.addEventListener('abort', () => (aborted = true)), new Promise<ProviderAnswer>(() => { hungCalls++; }));
    const ok = prov('openai_web', async () => ({ text: 'x', citations: ['https://a.example/'] }));
    const r = await askGrounded('q', (a) => a.text, [hung, ok], { timeoutMs: 20, sleep: noSleep });
    expect(aborted).toBe(true);
    expect(hungCalls).toBe(1);
    expect(r).toMatchObject({ ok: true, provider: 'openai_web', attempts: [{ provider: 'gemini', outcome: 'error' }, { provider: 'openai_web', outcome: 'ok' }] });
    const late = await askGrounded('q', (a) => a.text, [ok], { budgetMs: 1_000 });
    expect(late).toMatchObject({ ok: false, attempts: [{ provider: 'openai_web', outcome: 'error', detail: 'no time left in this pass' }] });
  });

  it('the gateway search sources in provider_metadata are citations; its routing block is not', () => {
    expect(urlsIn({ perplexity: { citations: ['https://kenco.example/locations'], search_results: [{ url: 'https://kenco.example/fleet', title: 't' }] } })).toEqual(['https://kenco.example/locations', 'https://kenco.example/fleet']);
    expect(urlsIn('not a url')).toEqual([]);
  });

  it('the paid "new user" Gemini key: a model-gone 404 moves to the -latest alias; a quota error does not', async () => {
    const tried: string[] = [];
    const gone = new Error('[404 Not Found] This model models/gemini-2.5-flash is no longer available to new users.');
    expect(await withModelFallback(['gemini-2.5-flash', 'gemini-flash-latest'], async (m) => { tried.push(m); if (m === 'gemini-2.5-flash') throw gone; return m; })).toBe('gemini-flash-latest');
    expect(tried).toEqual(['gemini-2.5-flash', 'gemini-flash-latest']);
    const calls: string[] = [];
    await expect(withModelFallback(['gemini-2.5-flash', 'gemini-flash-latest'], async (m) => { calls.push(m); throw quota; })).rejects.toBe(quota);
    expect(calls).toEqual(['gemini-2.5-flash']);
  });

  it('groundedOnly matches host and path, ignoring www, query, fragment and a trailing slash', () => {
    const { kept, dropped } = groundedOnly([{ claim: 'a', url: 'https://www.x.com/a/?utm=1#f' }, { claim: 'b', url: 'https://x.com/b' }], ['https://x.com/a']);
    expect(kept.map((c) => c.claim)).toEqual(['a']);
    expect(dropped.map((c) => c.claim)).toEqual(['b']);
  });
});

type Rec = Record<string, unknown>;
function fakePrisma() {
  const candidates: Rec[] = [];
  const audits: Rec[] = [];
  let clock = 0;
  const inWhere = (a: Rec, where: Rec) => {
    if (where.subject_id && a.subject_id !== where.subject_id) return false;
    const k = where.kind as string | { in: string[] } | undefined;
    if (typeof k === 'string' && a.kind !== k) return false;
    if (k && typeof k === 'object' && !k.in.includes(String(a.kind))) return false;
    const gte = (where.created_at as { gte?: Date } | undefined)?.gte;
    if (gte && (a.created_at as Date) < gte) return false;
    return true;
  };
  return {
    candidates,
    audits,
    gapAccountCandidate: {
      findUnique: async ({ where }: { where: Rec }) => candidates.find((c) => c.company_key === where.company_key) ?? null,
      upsert: async ({ where, create, update }: { where: Rec; create: Rec; update: Rec }) => {
        const cur = candidates.find((c) => c.company_key === where.company_key);
        if (cur) return Object.assign(cur, update);
        const row = { ...create };
        candidates.push(row);
        return row;
      },
    },
    gapAuditEvent: {
      create: async ({ data }: { data: Rec }) => {
        const row = { id: `a${audits.length}`, created_at: new Date(NOW.getTime() + clock++), ...data };
        audits.push(row);
        return row;
      },
      findMany: async ({ where }: { where: Rec }) => audits.filter((a) => inWhere(a, where)),
      count: async ({ where }: { where: Rec }) => audits.filter((a) => inWhere(a, where) && (!('payload' in where) || (a.payload as Rec)?.ok === true)).length,
    },
  };
}
const NOW = new Date('2026-09-29T15:00:00.000Z');
const okScout = async (company: string) => ({ company, verdict: 'DIRECT_BUYER' as const, entityType: '3pl' as const, domain: null, what: null, why: 'x', network: [], freight: [], unknowns: [], basis: 'web' as const, provider: 'openai_web' as const, attempts: [{ provider: 'gemini' as const, outcome: 'quota' as const }, { provider: 'openai_web' as const, outcome: 'ok' as const }] });

describe('scoutCandidate: one Scout at a time, every pass audited', () => {
  it('records the provider chain on a successful pass', async () => {
    const p = fakePrisma();
    await scoutCandidate(p as never, { company: 'Kenco Logistics', actor: 'casey@freightroll.com', now: NOW }, { scout: okScout });
    const done = p.audits.find((a) => a.kind === 'entity.scouted');
    expect(done?.payload).toMatchObject({ ok: true, provider: 'openai_web', attempts: [{ provider: 'gemini', outcome: 'quota' }, { provider: 'openai_web', outcome: 'ok' }] });
  });

  it('a failed pass is audited as infrastructure state (not a verdict) and stores no candidate row', async () => {
    const p = fakePrisma();
    const scout = async () => ({ company: 'AkzoNobel', verdict: 'UNKNOWN' as const, entityType: null, domain: null, what: null, why: 'The web pass failed (gemini quota).', network: [], freight: [], unknowns: [], basis: 'web' as const, failed: true, attempts: [{ provider: 'gemini' as const, outcome: 'quota' as const }] });
    expect(await scoutCandidate(p as never, { company: 'AkzoNobel', actor: 'x', now: NOW }, { scout })).toMatchObject({ refused: 'web_failed', retryable: true });
    expect(p.candidates).toHaveLength(0);
    expect(p.audits.map((a) => a.kind)).toEqual(['entity.scout_started', 'entity.scout_failed']);
    expect(p.audits[1].payload).toMatchObject({ ok: false, attempts: [{ provider: 'gemini', outcome: 'quota' }] });
    // and it does not block an immediate retry
    expect(await scoutCandidate(p as never, { company: 'AkzoNobel', actor: 'x', now: NOW }, { scout: okScout })).toMatchObject({ verdict: 'DIRECT_BUYER' });
  });

  it('a second Scout of the same company while one is running is refused, and runs no provider', async () => {
    const p = fakePrisma();
    let release!: () => void;
    let calls = 0;
    const slow = async (company: string) => (calls++, await new Promise<void>((r) => (release = r)), okScout(company));
    const first = scoutCandidate(p as never, { company: 'Crowley', actor: 'x', now: NOW }, { scout: slow });
    await new Promise((r) => setTimeout(r, 0));
    expect(await scoutCandidate(p as never, { company: 'Crowley', actor: 'x', now: NOW, force: true }, { scout: slow })).toMatchObject({ refused: 'in_flight' });
    release();
    await first;
    expect(calls).toBe(1);
  });

  it('bounds the attempts a day, failed passes included (cost)', async () => {
    const p = fakePrisma();
    // passes the platform killed mid-run never recorded an end: their claims still count
    for (let i = 0; i < 150; i++) p.audits.push({ id: `f${i}`, kind: 'entity.scout_started', subject_id: `c${i}`, created_at: NOW, payload: {} });
    expect(await scoutCandidate(p as never, { company: 'Kenco', actor: 'x', now: NOW }, { scout: okScout })).toMatchObject({ refused: 'attempt_cap' });
  });
});
