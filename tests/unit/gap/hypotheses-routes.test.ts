/**
 * Hypothesis API routes (GAP Prospecting OS, Sprint 1, S1-T9).
 *
 * The service is mocked: these tests pin the HTTP contract (gate, auth,
 * validation, status codes) and that the handlers hand the service exactly
 * what the spec says. Service behavior is covered in hypothesis-service.test.ts.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedAuth = vi.fn();
const mockedPropose = vi.fn();
const mockedTransition = vi.fn();
const mockedUpdateNarrative = vi.fn();
const mockedList = vi.fn();
const mockedGet = vi.fn();
const fakePrisma = { __tag: 'fake-prisma' };

vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: fakePrisma }));
vi.mock('@/lib/gap/hypothesis/service', () => ({
  proposeHypothesis: mockedPropose,
  transitionHypothesis: mockedTransition,
  updateDraftNarrative: mockedUpdateNarrative,
  listHypotheses: mockedList,
  getHypothesis: mockedGet,
}));

const { GET: listGET, POST } = await import('@/app/api/gap/hypotheses/route');
const { GET: oneGET, PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');

const BASE = 'http://localhost/api/gap/hypotheses';
const SESSION = { user: { email: 'casey@freightroll.com' } };
const ENV_KEYS = ['GAP_OS_ENABLED', 'GAP_HYPOTHESIS_ENABLED', 'CRON_SECRET', 'QUEUE_AGENT_SECRET'] as const;

let savedEnv: Record<string, string | undefined>;

function serviceCalls(): number {
  return (
    mockedPropose.mock.calls.length +
    mockedTransition.mock.calls.length +
    mockedUpdateNarrative.mock.calls.length +
    mockedList.mock.calls.length +
    mockedGet.mock.calls.length
  );
}

function jsonRequest(url: string, method: string, body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(url, {
    method,
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function idParams(id = 'hyp_1') {
  return { params: Promise.resolve({ id }) };
}

function validProposeBody() {
  return {
    accountName: 'Boston Beer Company',
    persona: 'site_ops',
    problemFamily: 'hidden_capacity',
    observation: 'Observed two new DC openings in the 10-K filing.',
    problemHypothesis: 'Physical handoffs may be capping capacity.',
    rootCauseHypotheses: ['Gate waiting'],
    impactHypotheses: ['Fewer turns'],
    falsificationQuestions: ['Do drivers wait at the gate?'],
    confidence: 60,
    signalIds: ['sig_1', 'sig_2'],
    primarySignalId: 'sig_1',
    sourceRef: 'pounce:trigger:123',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  savedEnv = {};
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  process.env.GAP_OS_ENABLED = '1';
  process.env.GAP_HYPOTHESIS_ENABLED = '1';
  delete process.env.CRON_SECRET;
  delete process.env.QUEUE_AGENT_SECRET;
  mockedAuth.mockResolvedValue(SESSION);
  mockedList.mockResolvedValue({ items: [], nextCursor: null });
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

// ---------------------------------------------------------------------------
// Flag gate
// ---------------------------------------------------------------------------

describe('flag gate', () => {
  it('GET list: GAP_OS_ENABLED off -> 404 skip payload, service never called', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    const res = await listGET(new NextRequest(BASE));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    expect(serviceCalls()).toBe(0);
  });

  it('GET list: OS on but GAP_HYPOTHESIS_ENABLED off -> 404 naming the hypothesis flag', async () => {
    delete process.env.GAP_HYPOTHESIS_ENABLED;
    const res = await listGET(new NextRequest(BASE));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_HYPOTHESIS_ENABLED=false' });
    expect(serviceCalls()).toBe(0);
  });

  it('POST: flags off -> 404 skip payload even for a cron caller', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    process.env.CRON_SECRET = 'cron-secret';
    mockedAuth.mockResolvedValue(null);
    const res = await POST(jsonRequest(BASE, 'POST', validProposeBody(), { 'x-gap-token': 'cron-secret' }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    expect(serviceCalls()).toBe(0);
  });

  it('GET one: flags off -> 404 skip payload', async () => {
    process.env.GAP_OS_ENABLED = '0';
    const res = await oneGET(new NextRequest(`${BASE}/hyp_1`), idParams());
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    expect(serviceCalls()).toBe(0);
  });

  it('PATCH: flags off -> 404 skip payload, transition never attempted', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    const res = await PATCH(jsonRequest(`${BASE}/hyp_1`, 'PATCH', { action: 'submit' }), idParams());
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    expect(serviceCalls()).toBe(0);
  });

  it('PATCH: hypothesis flag off -> 404 naming GAP_HYPOTHESIS_ENABLED', async () => {
    process.env.GAP_HYPOTHESIS_ENABLED = 'no';
    const res = await PATCH(jsonRequest(`${BASE}/hyp_1`, 'PATCH', { action: 'submit' }), idParams());
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_HYPOTHESIS_ENABLED=false' });
    expect(serviceCalls()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// GET /api/gap/hypotheses
// ---------------------------------------------------------------------------

describe('GET /api/gap/hypotheses', () => {
  it('401 without a session', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await listGET(new NextRequest(BASE));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthenticated' });
    expect(mockedList).not.toHaveBeenCalled();
  });

  it('401 for a cron token alone: GET is session-only', async () => {
    mockedAuth.mockResolvedValue(null);
    process.env.CRON_SECRET = 'cron-secret';
    const res = await listGET(new NextRequest(BASE, { headers: { 'x-gap-token': 'cron-secret' } }));
    expect(res.status).toBe(401);
    expect(mockedList).not.toHaveBeenCalled();
  });

  it('200 with parsed filters handed to the service', async () => {
    mockedList.mockResolvedValue({ items: [{ id: 'hyp_1' }], nextCursor: 'hyp_1' });
    const res = await listGET(
      new NextRequest(`${BASE}?status=draft,approved&account=Acme&family=hidden_capacity&limit=10&cursor=hyp_0`),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [{ id: 'hyp_1' }], nextCursor: 'hyp_1' });
    expect(mockedList).toHaveBeenCalledWith(fakePrisma, {
      status: ['draft', 'approved'],
      accountName: 'Acme',
      problemFamily: 'hidden_capacity',
      limit: 10,
      cursor: 'hyp_0',
    });
  });

  it('defaults limit to 25 and omits absent filters', async () => {
    await listGET(new NextRequest(BASE));
    expect(mockedList).toHaveBeenCalledWith(fakePrisma, { limit: 25 });
  });

  it('limit=500 -> 400 invalid_query field limit', async () => {
    const res = await listGET(new NextRequest(`${BASE}?limit=500`));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_query', field: 'limit' });
    expect(mockedList).not.toHaveBeenCalled();
  });

  it('unknown status -> 400 invalid_query field status', async () => {
    const res = await listGET(new NextRequest(`${BASE}?status=bogus`));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_query', field: 'status' });
  });

  it('unknown family -> 400 invalid_query field family; unmapped is accepted', async () => {
    const bad = await listGET(new NextRequest(`${BASE}?family=nope`));
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ error: 'invalid_query', field: 'family' });

    const ok = await listGET(new NextRequest(`${BASE}?family=unmapped`));
    expect(ok.status).toBe(200);
    expect(mockedList).toHaveBeenLastCalledWith(fakePrisma, { problemFamily: 'unmapped', limit: 25 });
  });
});

// ---------------------------------------------------------------------------
// POST /api/gap/hypotheses
// ---------------------------------------------------------------------------

describe('POST /api/gap/hypotheses', () => {
  it('401 with neither session nor agent token', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await POST(jsonRequest(BASE, 'POST', validProposeBody()));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthenticated' });
    expect(mockedPropose).not.toHaveBeenCalled();
  });

  it('401 when x-gap-token does not match CRON_SECRET', async () => {
    mockedAuth.mockResolvedValue(null);
    process.env.CRON_SECRET = 'cron-secret';
    const res = await POST(jsonRequest(BASE, 'POST', validProposeBody(), { 'x-gap-token': 'wrong' }));
    expect(res.status).toBe(401);
    expect(mockedPropose).not.toHaveBeenCalled();
  });

  it('401 when CRON_SECRET is unset even if a token is sent', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await POST(jsonRequest(BASE, 'POST', validProposeBody(), { 'x-gap-token': '' }));
    expect(res.status).toBe(401);
  });

  it('201 with createdBy = session email', async () => {
    mockedPropose.mockResolvedValue({ ok: true, id: 'hyp_new', status: 'draft' });
    const res = await POST(jsonRequest(BASE, 'POST', validProposeBody()));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 'hyp_new', status: 'draft' });
    expect(mockedPropose).toHaveBeenCalledTimes(1);
    const [prismaArg, input] = mockedPropose.mock.calls[0];
    expect(prismaArg).toBe(fakePrisma);
    expect(input).toMatchObject({ ...validProposeBody(), createdBy: 'casey@freightroll.com' });
  });

  it('201 with createdBy = cron for an x-gap-token caller', async () => {
    mockedAuth.mockResolvedValue(null);
    process.env.CRON_SECRET = 'cron-secret';
    mockedPropose.mockResolvedValue({ ok: true, id: 'hyp_new', status: 'draft' });
    const res = await POST(jsonRequest(BASE, 'POST', validProposeBody(), { 'x-gap-token': 'cron-secret' }));
    expect(res.status).toBe(201);
    expect(mockedPropose.mock.calls[0][1].createdBy).toBe('cron');
  });

  it('201 for a Bearer QUEUE_AGENT_SECRET caller', async () => {
    mockedAuth.mockResolvedValue(null);
    process.env.QUEUE_AGENT_SECRET = 'queue-secret';
    mockedPropose.mockResolvedValue({ ok: true, id: 'hyp_new', status: 'draft' });
    const res = await POST(jsonRequest(BASE, 'POST', validProposeBody(), { authorization: 'Bearer queue-secret' }));
    expect(res.status).toBe(201);
    expect(mockedPropose.mock.calls[0][1].createdBy).toBe('cron');
  });

  it('400 invalid_body naming the first failing field (signalIds empty)', async () => {
    const res = await POST(jsonRequest(BASE, 'POST', { ...validProposeBody(), signalIds: [] }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'signalIds' });
    expect(mockedPropose).not.toHaveBeenCalled();
  });

  it('400 invalid_body for a persona outside PERSONAS', async () => {
    const res = await POST(jsonRequest(BASE, 'POST', { ...validProposeBody(), persona: 'ceo' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'persona' });
  });

  it('400 invalid_body for confidence above 100 and for a problemFamily outside the catalog', async () => {
    const conf = await POST(jsonRequest(BASE, 'POST', { ...validProposeBody(), confidence: 101 }));
    expect(await conf.json()).toEqual({ error: 'invalid_body', field: 'confidence' });

    const fam = await POST(jsonRequest(BASE, 'POST', { ...validProposeBody(), problemFamily: 'nope' }));
    expect(await fam.json()).toEqual({ error: 'invalid_body', field: 'problemFamily' });

    mockedPropose.mockResolvedValue({ ok: true, id: 'x', status: 'draft' });
    const unmapped = await POST(jsonRequest(BASE, 'POST', { ...validProposeBody(), problemFamily: 'unmapped' }));
    expect(unmapped.status).toBe(201);
    expect(mockedPropose.mock.calls[0][1].problemFamily).toBe('unmapped');
  });

  it('400 invalid_body field body when the JSON does not parse', async () => {
    const res = await POST(jsonRequest(BASE, 'POST', '{not json'));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'body' });
  });

  it('409 duplicate_source_ref carries existingId', async () => {
    mockedPropose.mockResolvedValue({ ok: false, reason: 'duplicate_source_ref', existingId: 'hyp_old' });
    const res = await POST(jsonRequest(BASE, 'POST', validProposeBody()));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'duplicate_source_ref', existingId: 'hyp_old' });
  });

  it('422 with the exact reason for any other refusal', async () => {
    mockedPropose.mockResolvedValue({ ok: false, reason: 'unknown_signal:sig_9' });
    const res = await POST(jsonRequest(BASE, 'POST', validProposeBody()));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'unknown_signal:sig_9' });
  });
});

// ---------------------------------------------------------------------------
// GET /api/gap/hypotheses/[id]
// ---------------------------------------------------------------------------

describe('GET /api/gap/hypotheses/[id]', () => {
  it('401 without a session', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await oneGET(new NextRequest(`${BASE}/hyp_1`), idParams());
    expect(res.status).toBe(401);
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('404 not_found when the row is missing', async () => {
    mockedGet.mockResolvedValue(null);
    const res = await oneGET(new NextRequest(`${BASE}/hyp_missing`), idParams('hyp_missing'));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
    expect(mockedGet).toHaveBeenCalledWith(fakePrisma, 'hyp_missing');
  });

  it('200 with the row', async () => {
    mockedGet.mockResolvedValue({ id: 'hyp_1', status: 'draft', signals: [], events: [] });
    const res = await oneGET(new NextRequest(`${BASE}/hyp_1`), idParams());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 'hyp_1', status: 'draft', signals: [], events: [] });
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/gap/hypotheses/[id]
// ---------------------------------------------------------------------------

describe('PATCH /api/gap/hypotheses/[id]', () => {
  it('401 without a session, even with a cron token', async () => {
    mockedAuth.mockResolvedValue(null);
    process.env.CRON_SECRET = 'cron-secret';
    const res = await PATCH(
      jsonRequest(`${BASE}/hyp_1`, 'PATCH', { action: 'submit' }, { 'x-gap-token': 'cron-secret' }),
      idParams(),
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthenticated' });
    expect(mockedTransition).not.toHaveBeenCalled();
  });

  it('400 invalid_body field action when neither action nor narrative is present', async () => {
    const res = await PATCH(jsonRequest(`${BASE}/hyp_1`, 'PATCH', { reason: 'why' }), idParams());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'action' });
    expect(serviceCalls()).toBe(0);
  });

  it('400 invalid_body field action for an unknown action', async () => {
    const res = await PATCH(jsonRequest(`${BASE}/hyp_1`, 'PATCH', { action: 'launch' }), idParams());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'action' });
  });

  it('400 invalid_body field outcome for an unknown outcome', async () => {
    const res = await PATCH(
      jsonRequest(`${BASE}/hyp_1`, 'PATCH', { action: 'resolve', outcome: 'maybe' }),
      idParams(),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'outcome' });
  });

  it('200 with from/to/effects; actor is the session email and reason/outcome pass through', async () => {
    mockedTransition.mockResolvedValue({ ok: true, from: 'active', to: 'confirmed', effects: ['set_resolved'] });
    const res = await PATCH(
      jsonRequest(`${BASE}/hyp_1`, 'PATCH', { action: 'resolve', outcome: 'confirmed', reason: 'buyer confirmed' }),
      idParams(),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ from: 'active', to: 'confirmed', effects: ['set_resolved'] });
    expect(mockedTransition).toHaveBeenCalledTimes(1);
    const [prismaArg, id, action, ctx] = mockedTransition.mock.calls[0];
    expect(prismaArg).toBe(fakePrisma);
    expect(id).toBe('hyp_1');
    expect(action).toBe('resolve');
    expect(ctx.actor).toBe('casey@freightroll.com');
    expect(ctx.reason).toBe('buyer confirmed');
    expect(ctx.outcome).toBe('confirmed');
    expect(ctx.now).toBeInstanceOf(Date);
  });

  it('409 with the exact machine reason on an illegal transition', async () => {
    mockedTransition.mockResolvedValue({ ok: false, reason: 'ILLEGAL_TRANSITION:draft->approve' });
    const res = await PATCH(jsonRequest(`${BASE}/hyp_1`, 'PATCH', { action: 'approve' }), idParams());
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'ILLEGAL_TRANSITION:draft->approve' });
  });

  it('409 for guard refusals and stale_status', async () => {
    mockedTransition.mockResolvedValueOnce({ ok: false, reason: 'no_evidence' });
    const guard = await PATCH(jsonRequest(`${BASE}/hyp_1`, 'PATCH', { action: 'submit' }), idParams());
    expect(guard.status).toBe(409);
    expect(await guard.json()).toEqual({ error: 'no_evidence' });

    mockedTransition.mockResolvedValueOnce({ ok: false, reason: 'stale_status' });
    const stale = await PATCH(jsonRequest(`${BASE}/hyp_1`, 'PATCH', { action: 'submit' }), idParams());
    expect(stale.status).toBe(409);
    expect(await stale.json()).toEqual({ error: 'stale_status' });
  });

  it('404 not_found from the transition', async () => {
    mockedTransition.mockResolvedValue({ ok: false, reason: 'not_found' });
    const res = await PATCH(jsonRequest(`${BASE}/hyp_x`, 'PATCH', { action: 'submit' }), idParams('hyp_x'));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
  });

  it('narrative patch -> 200 with id/status; actor is the session email', async () => {
    mockedUpdateNarrative.mockResolvedValue({ ok: true, id: 'hyp_1', status: 'draft' });
    const res = await PATCH(
      jsonRequest(`${BASE}/hyp_1`, 'PATCH', { narrative: { confidence: 70, whyNow: null } }),
      idParams(),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 'hyp_1', status: 'draft' });
    expect(mockedUpdateNarrative).toHaveBeenCalledWith(
      fakePrisma,
      'hyp_1',
      { confidence: 70, whyNow: null },
      'casey@freightroll.com',
    );
    expect(mockedTransition).not.toHaveBeenCalled();
  });

  it('narrative_frozen -> 409', async () => {
    mockedUpdateNarrative.mockResolvedValue({ ok: false, reason: 'narrative_frozen' });
    const res = await PATCH(
      jsonRequest(`${BASE}/hyp_1`, 'PATCH', { narrative: { observation: 'new text' } }),
      idParams(),
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'narrative_frozen' });
  });

  it('narrative validator reasons -> 422; not_found -> 404', async () => {
    mockedUpdateNarrative.mockResolvedValueOnce({ ok: false, reason: 'observation_hedged' });
    const invalid = await PATCH(
      jsonRequest(`${BASE}/hyp_1`, 'PATCH', { narrative: { observation: 'might be' } }),
      idParams(),
    );
    expect(invalid.status).toBe(422);
    expect(await invalid.json()).toEqual({ error: 'observation_hedged' });

    mockedUpdateNarrative.mockResolvedValueOnce({ ok: false, reason: 'not_found' });
    const missing = await PATCH(
      jsonRequest(`${BASE}/hyp_x`, 'PATCH', { narrative: { observation: 'x' } }),
      idParams('hyp_x'),
    );
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: 'not_found' });
  });

  it('400 invalid_body naming the narrative field that fails validation', async () => {
    const res = await PATCH(
      jsonRequest(`${BASE}/hyp_1`, 'PATCH', { narrative: { persona: 'ceo' } }),
      idParams(),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'narrative.persona' });
    expect(mockedUpdateNarrative).not.toHaveBeenCalled();
  });
});
