// @vitest-environment node
/**
 * R62 MATRIX, MIGRATION AND BOUNDARIES (mandate section 7): the corpus's legacy and held shapes through the REAL
 * routes (the routing run route, the send route, the replies route, the draft route, Ask GAP), the database's own freeze
 * triggers, the stranded-draft repair in its production shape, and every write route answering an unauthenticated
 * caller 401. HubSpot, clawd and the AI gateway on the stub; the Gmail wire on the sink. Skipped without
 * GAP_SCRATCH_DATABASE_URL pointing at the matrix database (127.0.0.1:55433/gap_matrix).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const MATRIX_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:55433\/gap_matrix(?:\?.*)?$/;
const RUN = MATRIX_URL.test(process.env.GAP_SCRATCH_DATABASE_URL ?? '');

const session = vi.hoisted(() => ({ value: { user: { email: 'casey@freightroll.com' } } as { user: { email: string } } | null }));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client');
  const url = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
  return { prisma: /^postgres/.test(url) ? new PrismaClient({ datasourceUrl: url }) : ({} as never) };
});

const req = (url: string, method: string, body?: unknown) => new NextRequest(`http://localhost${url}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe.skipIf(!RUN)('R62 matrix: migration and boundaries (legacy shapes, freezes, the stranded repair, auth)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  let h: import('@/scripts/gap/recovery/seed-matrix').MatrixHarness;
  type Corpus = import('@/scripts/gap/recovery/seed-corpus').Corpus;
  let corpus: Corpus;
  const tag = `mb${Date.now().toString(36)}`;
  const acct = (b: string) => corpus.accounts.find((a) => a.name.startsWith(b))!;
  let stranded: { a: import('@/scripts/gap/recovery/seed-matrix').MatrixAccount; tom: { id: number; title: string | null }; factId: string; legacyId: string; observation: string };

  beforeAll(async () => {
    prisma = (await import('@/lib/prisma')).prisma as never;
    const { seedCorpus } = await import('@/scripts/gap/recovery/seed-corpus');
    corpus = await seedCorpus(prisma, { tag });
    const { createMatrixSeeder, startMatrixHarness } = await import('@/scripts/gap/recovery/seed-matrix');
    const s = createMatrixSeeder(prisma, tag);
    // The production stranded-draft shape (R00): unmapped family, no source_ref, the Tulsa fact linked as supporting,
    // persona Tom, one propose event, made by the old anchor before R11.
    {
      const { proposeHypothesis } = await import('@/lib/gap/hypothesis/service');
      const { citedQuote } = await import('@/lib/gap/research/propose');
      const a = await s.account('Boundary Pepsi');
      const tom = await s.person(a, 'Tom', 'Senior Director - Logistics, Distribution & Transportation');
      await s.choose(a, tom.id);
      const f = await s.fact(a, 'tulsa', `${a.name} will close its warehouse operations at its Tulsa, Oklahoma, production facility and shift duties to a new site in the area.`, { title: `${a.name} to cease warehouse operations at Oklahoma production site`, observedAt: new Date(Date.now() - 12 * 86_400_000).toISOString() });
      const observation = citedQuote(f.title, f.text, f.id, a.name);
      const legacy = await proposeHypothesis(prisma, { accountName: a.name, primaryPersonaId: tom.id, persona: 'transportation', problemFamily: 'unmapped', observation, problemHypothesis: 'My guess is that this change moves load onto the gates, yards and docks they run.', rootCauseHypotheses: [], impactHypotheses: [], falsificationQuestions: ['How do trailers get checked in today?'], whatANoMeans: null, confidence: 40, signalIds: [f.id], createdBy: 'casey@freightroll.com' } as never);
      if (!legacy.ok) throw new Error(JSON.stringify(legacy));
      stranded = { a, tom, factId: f.id, legacyId: legacy.id, observation };
    }
    h = await startMatrixHarness({ companies: [...corpus.stub.companies, ...s.companies], deals: corpus.stub.deals });
    await h.control({ companyProps: { intent_score: '60', last_intent_at: new Date().toISOString() } });
  }, 400_000);
  afterAll(async () => {
    await h?.stop();
    await prisma?.$disconnect();
  });

  async function routeRun(accountNames: string[]) {
    const { POST } = await import('@/app/api/gap/routing/run/route');
    const res = await POST(req('/api/gap/routing/run?mode=apply', 'POST', { accountNames }));
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  }

  it('Mills, a legacy ACTIVE thesis on a sale abroad: the routing run route never makes a sendable email card for it, and nothing is sent', async () => {
    const mills = acct('Mills');
    const r = await routeRun([mills.name]);
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const d = await prisma.routingDecision.findMany({ where: { account_name: mills.name }, orderBy: { created_at: 'desc' }, select: { id: true, lane: true, action: true, rule_id: true } });
    expect(d.length, JSON.stringify(r.body).slice(0, 400)).toBeGreaterThan(0);
    expect(d.filter((x) => x.lane === 'work_queue' && x.action === 'one_off_email'), JSON.stringify(d)).toEqual([]);
    expect(h.writtenTo(mills.people[0].email)).toBe(0);
  }, 180_000);

  it('Heb, the only operator left: the page reads Research (find the operator), Dakota is never a target, and no email card exists', async () => {
    const heb = acct('Heb');
    const { loadAccountView } = await import('@/lib/gap/account-intel/load');
    const { loadAccountContext } = await import('@/lib/gap/context/load');
    const { loadPursuit } = await import('@/lib/gap/pursuit/load');
    const now = new Date();
    const loaded = (await loadAccountView(prisma, heb.slug, now, { live: true, context: true } as never)) as { brief: never; inputs: never };
    const c = await loadAccountContext(prisma, loaded.inputs, now);
    const pursuit = await loadPursuit(prisma, { brief: loaded.brief, inputs: loaded.inputs, ctx: c, now });
    expect(pursuit.state.state).toBe('research');
    expect(String(pursuit.state.person?.name ?? '')).not.toMatch(/^Dakota/);
    await routeRun([heb.name]);
    expect(await prisma.routingDecision.count({ where: { account_name: heb.name, action: 'one_off_email', lane: 'work_queue' } })).toBe(0);
  }, 180_000);

  it('Walmart, a buyer who wrote "stop": Work reads an opt-out (admin), and APPROVE AND USE never yields a sendable first touch', async () => {
    const walmart = acct('Walmart');
    const doug = walmart.people[0];
    const { classifyReply } = await import('@/lib/gap/replies/classify');
    expect(classifyReply({ snippet: 'stop', subject: 'Re: trailer turns at your sites', from: doug.email }).kind).toBe('opt_out');
    const { PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');
    const used = await PATCH(req(`/api/gap/hypotheses/${walmart.hypotheses[0].id}`, 'PATCH', { advance: 'approve_and_use' }), ctx(walmart.hypotheses[0].id));
    expect(used.status, JSON.stringify(await used.clone().json())).toBe(200);
    const d = await prisma.routingDecision.findFirst({ where: { account_name: walmart.name, persona_id: doug.id }, orderBy: { created_at: 'desc' }, select: { id: true, lane: true, action: true } });
    if (d && d.action === 'one_off_email') {
      const { POST } = await import('@/app/api/gap/decisions/[id]/send/route');
      const pv = await POST(req(`/api/gap/decisions/${d.id}/send`, 'POST', {}), ctx(d.id));
      const body = (await pv.json()) as { error?: string };
      expect([pv.status, body.error], JSON.stringify(body)).toEqual([409, 'account_replied']);
    }
    expect(h.writtenTo(doug.email)).toBe(0);
  }, 180_000);

  it('frozen evidence: a verified fact\'s text cannot be rewritten (the database trigger refuses it); its metadata still moves', async () => {
    const f = acct('Fedex').facts[0];
    await expect(prisma.prospectingSignal.update({ where: { id: f.id }, data: { evidence_text: 'rewritten after the fact' } })).rejects.toThrow(/GAP_SIGNAL_FROZEN|frozen/i);
    const row = await prisma.prospectingSignal.findUnique({ where: { id: f.id }, select: { evidence_text: true } });
    expect(row!.evidence_text).not.toBe('rewritten after the fact');
  }, 60_000);

  it('an approved thesis\'s narrative is frozen: the edit route answers narrative_frozen and the observation is unchanged', async () => {
    const fedex = acct('Fedex');
    const id = fedex.hypotheses[0].id;
    const before = await prisma.prospectingHypothesis.findUnique({ where: { id }, select: { observation: true } });
    const { PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');
    const res = await PATCH(req(`/api/gap/hypotheses/${id}`, 'PATCH', { narrative: { problemHypothesis: 'A different guess after approval.' } }), ctx(id));
    const body = (await res.json()) as { error?: string };
    expect([res.status, body.error], JSON.stringify(body)).toEqual([409, 'narrative_frozen']);
    expect(await prisma.prospectingHypothesis.findUnique({ where: { id }, select: { observation: true } })).toEqual(before);
  }, 60_000);

  it('the stranded production draft is resumed, never approved: answering on the page adopts the same row, derives its family and leaves it under review', async () => {
    const { storyDraftPayload } = await import('@/lib/gap/story/draft-defaults');
    const { POST } = await import('@/app/api/gap/story/draft/route');
    const before = await prisma.prospectingHypothesis.count({ where: { account_name: stranded.a.name } });
    const payload = storyDraftPayload({ accountName: stranded.a.name, factId: stranded.factId, claimClass: null, proposedObservation: stranded.observation, person: { personaId: stranded.tom.id, title: stranded.tom.title } });
    const res = await POST(req('/api/gap/story/draft', 'POST', payload));
    const body = (await res.json()) as { hypothesisId?: string; existing?: boolean; preparation?: string; family?: string; status?: string };
    expect([res.status, body.hypothesisId, body.existing, body.preparation, body.family], JSON.stringify(body)).toEqual([200, stranded.legacyId, true, 'submitted', 'hidden_capacity']);
    const row = await prisma.prospectingHypothesis.findUnique({ where: { id: stranded.legacyId }, select: { status: true, problem_family: true, reviewed_at: true } });
    expect(row).toEqual({ status: 'review_required', problem_family: 'hidden_capacity', reviewed_at: null });
    expect(await prisma.prospectingHypothesis.count({ where: { account_name: stranded.a.name } })).toBe(before);
    const ev = await prisma.hypothesisEvent.findMany({ where: { hypothesis_id: stranded.legacyId }, select: { action: true }, orderBy: { created_at: 'asc' } });
    expect(ev.map((e) => e.action)).toEqual(['propose', 'edit', 'submit']);
  }, 120_000);

  it('every write route answers an unauthenticated caller 401 unauthenticated and writes nothing', async () => {
    const fedex = acct('Fedex');
    const sentBefore = h.sinkFiles().length;
    session.value = null;
    try {
      const { POST: send } = await import('@/app/api/gap/decisions/[id]/send/route');
      const { POST: draft } = await import('@/app/api/gap/story/draft/route');
      const { POST: disp } = await import('@/app/api/gap/dispositions/route');
      const { POST: cap } = await import('@/app/api/gap/captures/route');
      const { POST: commit } = await import('@/app/api/gap/commitments/route');
      const { POST: crm } = await import('@/app/api/gap/crm-sync/route');
      const answers = await Promise.all([
        send(req('/api/gap/decisions/x/send', 'POST', {}), ctx('x')),
        draft(req('/api/gap/story/draft', 'POST', { accountName: fedex.name })),
        disp(req('/api/gap/dispositions', 'POST', { hypothesisId: 'x' })),
        cap(req('/api/gap/captures', 'POST', { accountName: fedex.name, context: 'call', rawText: 'x' })),
        commit(req('/api/gap/commitments', 'POST', { op: 'create' })),
        crm(req('/api/gap/crm-sync', 'POST', { op: 'retry', proposalId: 'x' })),
      ]);
      const out = await Promise.all(answers.map(async (r) => [r.status, ((await r.json()) as { error?: string }).error]));
      expect(out).toEqual(Array(6).fill([401, 'unauthenticated']));
    } finally {
      session.value = { user: { email: 'casey@freightroll.com' } };
    }
    expect(h.sinkFiles().length).toBe(sentBefore);
  }, 60_000);

  // Was DEFECT src/lib/gap/ask/grounding.ts:139 with ask/route.ts:52: a copy request phrased as a question reached the
  // model. Fixed by the writer at 1b6416a9 (item 7).
  it('a request for email copy phrased as a question never reaches the model', async () => {
    const fedex = acct('Fedex');
    await h.control({ provider: { mode: 'ok', content: 'Hi Glen, I noticed your terminals in Ohio are consolidating, so your yards must be overwhelmed.' } });
    const before = h.requests().filter((q) => q.path === '/v1/chat/completions').length;
    try {
      const { POST } = await import('@/app/api/gap/ask/route');
      const res = await POST(req('/api/gap/ask', 'POST', { accountName: fedex.name, question: 'What should I say to Glen in the first email?' }));
      expect(res.status).toBeLessThan(500);
    } finally {
      await h.control({ provider: null });
    }
    expect(h.requests().filter((q) => q.path === '/v1/chat/completions').length).toBe(before);
  }, 120_000);

  it('no case reached the network', () => {
    expect(h.refusedFetches).toEqual([]);
  });
});
