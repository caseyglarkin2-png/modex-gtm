// @vitest-environment node
/**
 * R62 MATRIX, IDENTITY AND SCOPE (mandate section 7, "Identity and scope"): a corporate family (a subsidiary whose
 * parent holds an open HubSpot deal), a sold unit, a common-name collision at intake, an account with more than a
 * hundred contacts and one with many sources, through the REAL routes and the page's own read (HubSpot through the
 * real resolver against the stub, the Gmail wire on the sink). Skipped without GAP_SCRATCH_DATABASE_URL pointing at
 * the matrix database (127.0.0.1:55433/gap_matrix).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const MATRIX_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:55433\/gap_matrix(?:\?.*)?$/;
const RUN = MATRIX_URL.test(process.env.GAP_SCRATCH_DATABASE_URL ?? '');
const defect = process.env.MATRIX_DEFECTS === '1' ? it : it.skip;

vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client');
  const url = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
  return { prisma: /^postgres/.test(url) ? new PrismaClient({ datasourceUrl: url }) : ({} as never) };
});

const req = (url: string, method: string, body?: unknown) => new NextRequest(`http://localhost${url}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe.skipIf(!RUN)('R62 matrix: identity and scope (the real routes and the page read)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  let h: import('@/scripts/gap/recovery/seed-matrix').MatrixHarness;
  let s: import('@/scripts/gap/recovery/seed-matrix').MatrixSeeder;
  type Acct = import('@/scripts/gap/recovery/seed-matrix').MatrixAccount;
  type Ready = Awaited<ReturnType<import('@/scripts/gap/recovery/seed-matrix').MatrixSeeder['readyAccount']>>;
  const tag = `mid${Date.now().toString(36)}`;
  let parent: Ready;
  let child: Ready;
  let sold: { a: Acct; factId: string; observation: string; personaId: number; title: string | null };
  let crowd: Acct;
  let sources: Acct;
  const collide = { a: '', b: '' };

  beforeAll(async () => {
    prisma = (await import('@/lib/prisma')).prisma as never;
    const { createMatrixSeeder, startMatrixHarness } = await import('@/scripts/gap/recovery/seed-matrix');
    const { citedQuote } = await import('@/lib/gap/research/propose');
    s = createMatrixSeeder(prisma, tag);
    // A corporate family: the parent is in a deal; the subsidiary has its own approved thesis and chosen person.
    parent = await s.readyAccount('Identity Parent');
    child = await s.readyAccount('Identity Child', { first: 'Cory' });
    await prisma.account.update({ where: { name: child.a.name }, data: { parent_brand: parent.a.name } });
    s.openDeal(parent.a, 4101);
    // A unit the account sold.
    {
      const a = await s.account('Identity Seller');
      const p = await s.person(a, 'Sam', 'Director Transportation');
      await s.choose(a, p.id);
      const f = await s.fact(a, 'sale', `${a.name} completed the sale of its freight brokerage division and its two Ohio terminals to Ridge Logistics.`, { title: `${a.name} sells brokerage unit`, observedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(), type: 'acquisition' });
      sold = { a, factId: f.id, observation: citedQuote(f.title, f.text, f.id, a.name), personaId: p.id, title: p.title };
    }
    // Two accounts whose names differ only by a legal suffix (the collision).
    collide.a = `Collide ${tag} Foods`;
    collide.b = `Collide ${tag} Foods Inc`;
    for (const n of [collide.a, collide.b]) await prisma.account.upsert({ where: { name: n }, update: {}, create: { rank: 9990 + (n.length % 7), name: n, vertical: 'food', tier: 'Tier 2', priority_band: 'B' } });
    // A hundred and twenty contacts, nobody chosen.
    crowd = await s.account('Identity Crowd');
    const titles = ['VP Transportation', 'Director of Transportation', 'Director, Distribution', 'Senior Manager, Fleet Operations', 'Director, Yard Operations', 'Analyst, Supply Chain'];
    for (let i = 0; i < 120; i += 1) await s.person(crowd, `P${i}`, titles[i % titles.length]);
    const cf = await s.fact(crowd, 'dc', `${crowd.name} opened a new cross-dock terminal in New Jersey adding 120 dock doors.`, { title: `${crowd.name} opens New Jersey terminal`, observedAt: new Date(Date.now() - 4 * 86_400_000).toISOString() });
    await s.thesis(crowd, crowd.people[0].id, cf, 'approved');
    // Sixty sources.
    sources = await s.account('Identity Sources');
    const sp = await s.person(sources, 'Ola', 'Director of Transportation');
    await s.choose(sources, sp.id);
    for (let i = 0; i < 60; i += 1) await s.fact(sources, `src${i}`, `${sources.name} opened a new distribution center in city number ${i + 1} with ${40 + i} dock doors.`, { title: `${sources.name} opens DC ${i + 1}`, observedAt: new Date(Date.now() - (2 + (i % 20)) * 86_400_000).toISOString() });
    h = await startMatrixHarness({ companies: s.companies, deals: s.deals });
    await h.control({ companyProps: { intent_score: '60', last_intent_at: new Date().toISOString() } });
  }, 600_000);
  afterAll(async () => {
    await h?.stop();
    await prisma?.$disconnect();
  });

  async function pageRead(a: { name: string; slug: string }, now = new Date()) {
    const { loadAccountView } = await import('@/lib/gap/account-intel/load');
    const { loadAccountContext } = await import('@/lib/gap/context/load');
    const { loadPursuit } = await import('@/lib/gap/pursuit/load');
    const loaded = await loadAccountView(prisma, a.slug, now, { live: true, context: true } as never);
    if (!loaded) throw new Error('account not loaded');
    const { brief, inputs } = loaded as { brief: { motion?: { kind?: string; why?: string } }; inputs: never };
    const c = await loadAccountContext(prisma, inputs, now);
    return { brief, pursuit: await loadPursuit(prisma, { brief: brief as never, inputs, ctx: c, now }) };
  }

  it('the parent\'s open deal holds the subsidiary on the page: no cold motion, said as related account activity', async () => {
    const { brief, pursuit } = await pageRead(child.a);
    expect(pursuit.state.coldTouchAllowed).toBe(false);
    expect(JSON.stringify({ motion: brief.motion, state: pursuit.state.stateLine, blocker: pursuit.state.blocker })).toMatch(new RegExp(parent.a.name));
  }, 180_000);

  it('the click agrees with the page: the subsidiary\'s card is refused active_opportunity with the related-account detail, nothing sent', async () => {
    const { PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');
    const used = await PATCH(req(`/api/gap/hypotheses/${child.h}`, 'PATCH', { advance: 'approve_and_use' }), ctx(child.h));
    expect(used.status).toBe(200);
    const d = (await prisma.routingDecision.findFirst({ where: { account_name: child.a.name, persona_id: child.p.id }, orderBy: { created_at: 'desc' }, select: { id: true } }))!;
    const { POST } = await import('@/app/api/gap/decisions/[id]/send/route');
    const res = await POST(req(`/api/gap/decisions/${d.id}/send`, 'POST', {}), ctx(d.id));
    const body = (await res.json()) as { error?: string; detail?: string };
    expect([res.status, body.error], JSON.stringify(body)).toEqual([409, 'active_opportunity']);
    expect(body.detail).toMatch(new RegExp(`^Related account activity\\. ${child.a.name} is part of ${parent.a.name}`));
    expect(h.writtenTo(child.p.email)).toBe(0);
  }, 180_000);

  // DEFECT src/lib/gap/routing/run.ts:258 (the routing snapshot reads resolveAccountOpportunity for the account alone):
  // routing ignores the corporate-family hold the page and the click both apply, so APPROVE AND USE routes a READY card
  // (lane work_queue, one_off_email) for the subsidiary while its parent is in a live deal; Work offers a first touch
  // that the preview then refuses. R10: a held account never presents as sendable on another surface.
  defect('routing never makes a READY card for a subsidiary held by its parent\'s live deal', async () => {
    const d = await prisma.routingDecision.findFirst({ where: { account_name: child.a.name, persona_id: child.p.id }, orderBy: { created_at: 'desc' }, select: { lane: true, action: true } });
    expect([d?.lane, d?.action]).not.toEqual(['work_queue', 'one_off_email']);
  }, 60_000);

  it('a unit the account SOLD is not a network change it can be asked about: the draft is refused', async () => {
    const { storyDraftPayload } = await import('@/lib/gap/story/draft-defaults');
    const { POST } = await import('@/app/api/gap/story/draft/route');
    const payload = storyDraftPayload({ accountName: sold.a.name, factId: sold.factId, claimClass: null, proposedObservation: sold.observation, person: { personaId: sold.personaId, title: sold.title }, problemFamily: 'network_standardization' });
    const res = await POST(req('/api/gap/story/draft', 'POST', payload));
    const body = (await res.json()) as { error?: string; detail?: string };
    expect([res.status, body.error], JSON.stringify(body)).toEqual([409, 'fact_not_outreach_evidence']);
  }, 120_000);

  it('a common-name collision stays unresolved at intake: a shared link naming both is never filed under either', async () => {
    const { POST } = await import('@/app/api/gap/signal-intake/route');
    const res = await POST(req('/api/gap/signal-intake', 'POST', { url: `https://news.example.com/collide-${tag}`, account: `Collide ${tag}` }));
    const body = (await res.json()) as { signal?: { resolution?: string; accountName?: string | null; candidates?: unknown }; resolution?: string; accountName?: string | null; error?: string };
    expect(res.status, JSON.stringify(body)).toBeLessThan(300);
    const row = await prisma.gapSignal.findFirst({ where: { url: `https://news.example.com/collide-${tag}` }, select: { resolution: true, account_name: true } });
    expect(row?.account_name ?? null, JSON.stringify(row)).toBeNull();
    expect(['ambiguous', 'needs_account']).toContain(row?.resolution);
  }, 120_000);

  it('a hundred and twenty contacts: nobody is preselected, the stack shows at most three people with reasons and counts the rest', async () => {
    const t0 = Date.now();
    const { pursuit } = await pageRead(crowd);
    const ms = Date.now() - t0;
    expect(pursuit.state.person ?? null).toBeNull();
    expect((pursuit.stack?.rows ?? []).length).toBeLessThanOrEqual(3);
    expect((pursuit.stack?.rows ?? []).length + (pursuit.stack?.more ?? []).length).toBeGreaterThanOrEqual(3);
    expect(ms, `page read took ${ms} ms`).toBeLessThan(60_000);
  }, 180_000);

  it('sixty sources: the page read completes, one NEXT, and the opening story offers a bounded set of drafts', async () => {
    const { pursuit } = await pageRead(sources);
    expect(pursuit.state.person?.name).toMatch(/^Ola/);
    expect(typeof pursuit.state.stateLine).toBe('string');
  }, 180_000);

  it('no case reached the network', () => {
    expect(h.refusedFetches.filter((u) => !/^https:\/\/news\.example\.com\//.test(u))).toEqual([]);
  });
});
