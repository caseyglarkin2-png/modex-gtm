/**
 * POST /api/gap/compile (GAP Prospecting OS, Sprint 3, S3-T9).
 *
 * Prisma and fetch are injected; the compiler, the critic client and the
 * approval path are real. Pins the gate, auth, validation, the copy-loading
 * paths (sequence version step, draft queue item) and the status codes.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedAuth = vi.fn();

const fakePrisma = {
  gapCompile: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  gapAuditEvent: { create: vi.fn() },
  sendApprovalRequest: { findFirst: vi.fn(), create: vi.fn() },
  sequenceVersion: { findUnique: vi.fn() },
  draftQueueItem: { findUnique: vi.fn() },
};

vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: fakePrisma }));

const { POST } = await import('@/app/api/gap/compile/route');

const BASE = 'http://localhost/api/gap/compile';
const SESSION = { user: { email: 'casey@freightroll.com' } };
const ENV_KEYS = [
  'GAP_OS_ENABLED',
  'GAP_MESSAGE_COMPILER_ENABLED',
  'CRON_SECRET',
  'QUEUE_AGENT_SECRET',
  'CLAWD_BASE_URL',
  'CLAWD_URL',
  'MC_API_TOKEN',
  'WAR_ROOM_URL',
] as const;

const SIGN = 'Casey Larkin, YardFlow by FreightRoll';
const PASSING_BODY = `Hi Kara,

Your Ohio DC posted three gate-clerk roles in August [[SRC:ev_1]]. Two of them are night shift.

My guess is the clerks exist to keep inbound trailers moving when the dock and the lot disagree about what is where.

How many trailers sit past their appointment on a normal Tuesday?

${SIGN}`;

const CONTRACT = {
  hypothesis: {
    observation: 'Ohio DC posted three gate-clerk roles in August.',
    problemHypothesis: 'Clerks exist because the dock and the lot disagree.',
    problemFamily: 'hidden_capacity',
  },
  evidence: [
    { id: 'ev_1', title: 'Ohio DC job postings, August', url: null, externalOk: true, fresh: true, superseded: false, firstParty: false },
  ],
  stepCount: 4,
};

let savedEnv: Record<string, string | undefined>;
let criticMode: 'pass' | 'warn' | 'block' | 'down' | 'http500';
let criticCalls: number;
let compileCounter: number;

function clawdPayload(verdict: 'pass' | 'warn' | 'block') {
  return {
    verdict,
    hard_block: verdict === 'block',
    score: verdict === 'pass' ? 100 : verdict === 'warn' ? 94 : 75,
    counts: { block: verdict === 'block' ? 1 : 0, warn: verdict === 'warn' ? 1 : 0 },
    violations: verdict === 'pass' ? [] : [{ rule: 'r1', severity: verdict === 'warn' ? 'warn' : 'block', message: 'm' }],
    artifact_type: 'email',
    used_llm: true,
  };
}

const fetchMock = vi.fn(async (url: string | URL | Request) => {
  const href = String(url);
  if (href.includes('/api/critic/score')) {
    criticCalls += 1;
    if (criticMode === 'down') throw new TypeError('fetch failed');
    if (criticMode === 'http500') return new Response('{"error":"critic failed"}', { status: 500 });
    return new Response(JSON.stringify(clawdPayload(criticMode)), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  // The review feed fan-out; never the real war room.
  return new Response('{"ok":true}', { status: 200 });
});

function jsonRequest(body: unknown, headers: Record<string, string> = {}, url = BASE) {
  return new NextRequest(url, {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    hypothesisId: 'hyp_1',
    stepIndex: 0,
    subject: 'Ohio gate roles',
    body: PASSING_BODY,
    priorBodies: [],
    contract: CONTRACT,
    ...overrides,
  };
}

function prismaCalls(): number {
  return Object.values(fakePrisma).reduce(
    (n, delegate) => n + Object.values(delegate).reduce((m, fn) => m + (fn as ReturnType<typeof vi.fn>).mock.calls.length, 0),
    0,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  savedEnv = {};
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  process.env.GAP_OS_ENABLED = '1';
  process.env.GAP_MESSAGE_COMPILER_ENABLED = '1';
  process.env.CLAWD_BASE_URL = 'https://clawd.example.test';
  process.env.MC_API_TOKEN = 'test-token';
  process.env.WAR_ROOM_URL = 'https://war-room.example.test';
  delete process.env.CLAWD_URL;
  delete process.env.CRON_SECRET;
  delete process.env.QUEUE_AGENT_SECRET;
  criticMode = 'pass';
  criticCalls = 0;
  compileCounter = 0;
  mockedAuth.mockResolvedValue(SESSION);
  fakePrisma.gapCompile.create.mockImplementation(async () => {
    compileCounter += 1;
    return { id: `cmp_${compileCounter}` };
  });
  fakePrisma.gapCompile.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
    id: where.id,
    result: { verdict: 'review_required' },
  }));
  fakePrisma.gapCompile.update.mockResolvedValue({ id: 'cmp_1' });
  fakePrisma.gapAuditEvent.create.mockResolvedValue({ id: 'aud_1' });
  fakePrisma.sendApprovalRequest.findFirst.mockResolvedValue(null);
  fakePrisma.sendApprovalRequest.create.mockResolvedValue({ id: 'apr_1', status: 'pending' });
  fakePrisma.sequenceVersion.findUnique.mockResolvedValue(null);
  fakePrisma.draftQueueItem.findUnique.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

// ---------------------------------------------------------------------------
// Flag gate
// ---------------------------------------------------------------------------

describe('flag gate', () => {
  it('GAP_OS_ENABLED off -> 404 skip payload, nothing touched', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    const res = await POST(jsonRequest(validBody()));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    expect(prismaCalls()).toBe(0);
    expect(criticCalls).toBe(0);
  });

  it('OS on but GAP_MESSAGE_COMPILER_ENABLED off -> 404 naming the compiler flag, even for a cron caller', async () => {
    delete process.env.GAP_MESSAGE_COMPILER_ENABLED;
    process.env.CRON_SECRET = 'cron-secret';
    mockedAuth.mockResolvedValue(null);
    const res = await POST(jsonRequest(validBody(), { Authorization: 'Bearer cron-secret' }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_MESSAGE_COMPILER_ENABLED=false' });
    expect(prismaCalls()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

describe('auth', () => {
  it('no session and no token -> 401', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await POST(jsonRequest(validBody()));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthenticated' });
    expect(prismaCalls()).toBe(0);
  });

  it('?secret= is never accepted', async () => {
    mockedAuth.mockResolvedValue(null);
    process.env.CRON_SECRET = 'cron-secret';
    const res = await POST(jsonRequest(validBody(), {}, `${BASE}?secret=cron-secret`));
    expect(res.status).toBe(401);
  });

  it('a wrong Bearer -> 401', async () => {
    mockedAuth.mockResolvedValue(null);
    process.env.CRON_SECRET = 'cron-secret';
    const res = await POST(jsonRequest(validBody(), { Authorization: 'Bearer nope' }));
    expect(res.status).toBe(401);
  });

  it('Bearer CRON_SECRET is accepted and the row is created by cron', async () => {
    mockedAuth.mockResolvedValue(null);
    process.env.CRON_SECRET = 'cron-secret';
    const res = await POST(jsonRequest(validBody(), { Authorization: 'Bearer cron-secret' }));
    expect(res.status).toBe(200);
    const { data } = fakePrisma.gapCompile.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(data.created_by).toBe('cron');
  });

  it('x-gap-token equal to CRON_SECRET is accepted', async () => {
    mockedAuth.mockResolvedValue(null);
    process.env.CRON_SECRET = 'cron-secret';
    const res = await POST(jsonRequest(validBody(), { 'x-gap-token': 'cron-secret' }));
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('validation', () => {
  it('invalid JSON -> 400', async () => {
    const res = await POST(jsonRequest('{not json'));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'body' });
  });

  it('missing stepIndex -> 422 naming the field', async () => {
    const body = validBody();
    delete (body as Record<string, unknown>).stepIndex;
    const res = await POST(jsonRequest(body));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'stepIndex' });
    expect(prismaCalls()).toBe(0);
  });

  it('subject without body and no source id -> 422 naming body', async () => {
    const body = validBody();
    delete (body as Record<string, unknown>).body;
    const res = await POST(jsonRequest(body));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'body' });
  });

  it('neither copy nor a source id -> 422 naming subject', async () => {
    const res = await POST(jsonRequest({ stepIndex: 0, contract: CONTRACT }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'subject' });
  });

  it('a non-array priorBodies -> 422 naming priorBodies', async () => {
    const res = await POST(jsonRequest(validBody({ priorBodies: 'no' })));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'priorBodies' });
  });
});

// ---------------------------------------------------------------------------
// Verdicts
// ---------------------------------------------------------------------------

describe('verdicts', () => {
  it('pass -> 200 with the compile result, a GapCompile row, no approval request', async () => {
    const res = await POST(jsonRequest(validBody()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.checks.filter((c: { passed: boolean }) => !c.passed)).toEqual([]);
    expect(json).toMatchObject({
      id: 'cmp_1',
      verdict: 'pass',
      hypothesisId: 'hyp_1',
      stepIndex: 0,
      ctaFamily: 'scorecard_reply',
      evidenceIdsUsed: ['ev_1'],
      critic: { ok: true, verdict: 'pass', score: 100 },
    });
    expect(json.approvalRequestId).toBeUndefined();
    expect(criticCalls).toBe(1);
    expect(fakePrisma.gapCompile.create).toHaveBeenCalledTimes(1);
    expect(fakePrisma.sendApprovalRequest.create).not.toHaveBeenCalled();
    const criticCall = fetchMock.mock.calls.find((c) => String(c[0]).includes('/api/critic/score'));
    expect(String(criticCall?.[0])).toBe('https://clawd.example.test/api/critic/score');
  });

  it('review_required (C15 subject form) -> 200, one approval request; the second call returns the same id', async () => {
    const body = validBody({ subject: 'Re: Ohio gate roles' });
    const first = await POST(jsonRequest(body));
    expect(first.status).toBe(200);
    const json1 = await first.json();
    expect(json1.verdict).toBe('review_required');
    expect(json1.checks.find((c: { code: string }) => c.code === 'C15')).toMatchObject({ passed: false, severity: 'review' });
    expect(json1.approvalRequestId).toBe('apr_1');
    expect(json1.approvalExisting).toBe(false);
    expect(fakePrisma.sendApprovalRequest.create).toHaveBeenCalledTimes(1);
    const { data } = fakePrisma.sendApprovalRequest.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(data).toMatchObject({
      channel: 'gap_compile',
      status: 'pending',
      risk_score: 40,
      risk_reasons: ['gap_compile:cmp_1', 'C15', 'hypothesis:hyp_1'],
      requested_by: 'casey@freightroll.com',
    });

    // Second call for the same compile id: the open request is returned, not duplicated.
    fakePrisma.sendApprovalRequest.findFirst.mockResolvedValue({ id: 'apr_1', status: 'pending' });
    fakePrisma.gapCompile.create.mockResolvedValueOnce({ id: 'cmp_1' });
    const second = await POST(jsonRequest(body));
    const json2 = await second.json();
    expect(json2.approvalRequestId).toBe('apr_1');
    expect(json2.approvalExisting).toBe(true);
    expect(fakePrisma.sendApprovalRequest.create).toHaveBeenCalledTimes(1);
  });

  it('reject (C11 banned word) -> 409 with verdict reject and the checks; critic never called', async () => {
    const body = validBody({ body: PASSING_BODY.replace('inbound trailers moving', 'inbound throughput moving') });
    const res = await POST(jsonRequest(body));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.verdict).toBe('reject');
    expect(json.checks.find((c: { code: string }) => c.code === 'C11')).toMatchObject({ passed: false, severity: 'reject' });
    expect(json.id).toBe('cmp_1');
    expect(criticCalls).toBe(0);
    expect(fakePrisma.sendApprovalRequest.create).not.toHaveBeenCalled();
  });

  it('critic unreachable -> 200 review_required with the reason, approval requested', async () => {
    criticMode = 'down';
    const res = await POST(jsonRequest(validBody()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.verdict).toBe('review_required');
    expect(json.critic).toEqual({ ok: false, reason: 'critic_unreachable' });
    expect(json.approvalRequestId).toBe('apr_1');
  });

  it('critic 500 -> review_required; critic block -> 409 reject', async () => {
    criticMode = 'http500';
    const res = await POST(jsonRequest(validBody()));
    expect((await res.json()).verdict).toBe('review_required');

    criticMode = 'block';
    const blocked = await POST(jsonRequest(validBody()));
    expect(blocked.status).toBe(409);
    expect((await blocked.json()).verdict).toBe('reject');
  });

  it('critic unconfigured (no CLAWD_BASE_URL) -> review_required without a network call', async () => {
    delete process.env.CLAWD_BASE_URL;
    const res = await POST(jsonRequest(validBody()));
    const json = await res.json();
    expect(json.verdict).toBe('review_required');
    expect(json.critic).toEqual({ ok: false, reason: 'critic_unconfigured' });
    expect(criticCalls).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Copy sources
// ---------------------------------------------------------------------------

describe('copy from a sequence version step', () => {
  const STEPS = {
    schema: 'steps.v2',
    steps: [
      {
        index: 0,
        delay: { value: 0, unit: 'business_days' },
        purpose: 'intrigue',
        productProofAllowed: false,
        requiredEvidenceTypes: [],
        claimsUsed: [],
        templates: { subjectTemplate: 'Ohio gate roles', bodyTemplate: PASSING_BODY },
      },
      {
        index: 1,
        delay: { value: 3, unit: 'business_days' },
        purpose: 'root_cause',
        productProofAllowed: false,
        requiredEvidenceTypes: [],
        claimsUsed: ['CR-001'],
        templates: null,
      },
    ],
  };

  it('version_not_found -> 422', async () => {
    const res = await POST(jsonRequest({ sequenceVersionId: 'ver_missing', stepIndex: 0, contract: CONTRACT }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'version_not_found', sequenceVersionId: 'ver_missing' });
    expect(fakePrisma.sequenceVersion.findUnique).toHaveBeenCalledWith({
      where: { id: 'ver_missing' },
      select: { id: true, steps: true },
    });
  });

  it('step_out_of_range -> 422', async () => {
    fakePrisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'ver_1', steps: STEPS });
    const res = await POST(jsonRequest({ sequenceVersionId: 'ver_1', stepIndex: 7, contract: CONTRACT }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'step_out_of_range', sequenceVersionId: 'ver_1', stepIndex: 7, stepCount: 2 });
  });

  it('a step with no templates -> 422 step_has_no_copy', async () => {
    fakePrisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'ver_1', steps: STEPS });
    const res = await POST(jsonRequest({ sequenceVersionId: 'ver_1', stepIndex: 1, contract: CONTRACT }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'step_has_no_copy', sequenceVersionId: 'ver_1', stepIndex: 1 });
  });

  it('loads the step copy, stamps the version id and fills stepCount and claimsUsed from the version', async () => {
    fakePrisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'ver_1', steps: STEPS });
    const contract = { ...CONTRACT };
    delete (contract as Record<string, unknown>).stepCount;
    const res = await POST(jsonRequest({ sequenceVersionId: 'ver_1', stepIndex: 0, hypothesisId: 'hyp_1', contract }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.verdict).toBe('pass');
    const { data } = fakePrisma.gapCompile.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(data.sequence_version_id).toBe('ver_1');
    const snapshot = data.inputs_snapshot as Record<string, unknown>;
    expect(snapshot.subject).toBe('Ohio gate roles');
    expect(snapshot.body).toBe(PASSING_BODY);
    expect((snapshot.contract as Record<string, unknown>).stepCount).toBe(2);
    expect((snapshot.contract as Record<string, unknown>).claimsUsed).toEqual([]);
  });

  it('explicit subject and body win over the version step', async () => {
    fakePrisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'ver_1', steps: STEPS });
    const res = await POST(jsonRequest(validBody({ sequenceVersionId: 'ver_1', subject: 'Re: Ohio gate roles' })));
    const json = await res.json();
    expect(json.verdict).toBe('review_required');
    expect(fakePrisma.sequenceVersion.findUnique).not.toHaveBeenCalled();
  });
});

describe('copy from a draft queue item', () => {
  it('draft_queue_item_not_found -> 422', async () => {
    const res = await POST(jsonRequest({ draftQueueItemId: 42, stepIndex: 0, contract: CONTRACT }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'draft_queue_item_not_found', draftQueueItemId: 42 });
  });

  it('loads subject, body and account name from the item', async () => {
    fakePrisma.draftQueueItem.findUnique.mockResolvedValue({
      id: 42,
      subject: 'Re: Ohio gate roles',
      body: PASSING_BODY,
      account_name: 'Boston Beer Company',
      step_index: 0,
    });
    const res = await POST(jsonRequest({ draftQueueItemId: 42, stepIndex: 0, hypothesisId: 'hyp_1', contract: CONTRACT }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.verdict).toBe('review_required');
    const { data } = fakePrisma.gapCompile.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(data.draft_queue_item_id).toBe(42);
    const approval = fakePrisma.sendApprovalRequest.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(approval.data.account_name).toBe('Boston Beer Company');
    expect(approval.data.risk_reasons).toEqual(['gap_compile:cmp_1', 'C15', 'hypothesis:hyp_1', 'draft_queue_item:42']);
  });
});
