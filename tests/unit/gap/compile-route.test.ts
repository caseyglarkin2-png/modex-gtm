/**
 * POST /api/gap/compile (GAP Prospecting OS, Sprint 3, S3-T9; R3-3 rebuild).
 *
 * Prisma and fetch are injected; the compiler, the critic client and the
 * approval path are real. Pins the gate, auth, validation, the SERVER-SIDE
 * contract (evidence from the hypothesis's linked signals, stepCount and
 * claimsUsed from the version, prior bodies from the version's earlier steps
 * or the run's earlier items), the caller allowlist, the template path and
 * the status codes.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { wordCount } from '@/lib/gap/compiler/text';

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
  draftQueueItem: { findUnique: vi.fn(), findMany: vi.fn() },
  prospectingHypothesis: { findUnique: vi.fn() },
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

const STEP1_BODY = `Hi Kara,

The August postings named a second dock lead [[SRC:ev_1]]. Same site, same shift.

My guess is the second lead exists because the first one spends the shift on the radio.

Worth sending over the yard-network scorecard?

${SIGN}`;

const DAY = 24 * 60 * 60 * 1000;

const FILLER_WORDS = 'the lot and the dock disagree about where the trailer is on every wave'.split(' ');
/** Exactly `n` prose words, so a body can be padded to a known count. */
function fillerOf(n: number): string {
  return `${Array.from({ length: n }, (_, i) => FILLER_WORDS[i % FILLER_WORDS.length]).join(' ')}.`;
}

function signalRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ev_1',
    title: 'Ohio DC job postings, August',
    evidence_url: 'https://example.test/jobs',
    external_ok: true,
    observed_at: new Date(Date.now() - DAY),
    freshness_expires_at: new Date(Date.now() + 30 * DAY),
    source_type: 'public_primary',
    metadata: null,
    ...overrides,
  };
}

function hypothesisRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'hyp_1',
    status: 'approved',
    account_name: 'Acme Foods',
    observation: 'Ohio DC posted three gate-clerk roles in August.',
    problem_hypothesis: 'Clerks exist because the dock and the lot disagree.',
    problem_family: 'hidden_capacity',
    sequence_version_id: null,
    signals: [{ signal: signalRow() }],
    ...overrides,
  };
}

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
      templates: { subjectTemplate: 'Second dock lead', bodyTemplate: STEP1_BODY },
    },
    {
      index: 2,
      delay: { value: 3, unit: 'business_days' },
      purpose: 'impact',
      productProofAllowed: false,
      requiredEvidenceTypes: [],
      claimsUsed: [],
      templates: null,
    },
  ],
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
    contract: {},
    ...overrides,
  };
}

function prismaCalls(): number {
  return Object.values(fakePrisma).reduce(
    (n, delegate) => n + Object.values(delegate).reduce((m, fn) => m + (fn as ReturnType<typeof vi.fn>).mock.calls.length, 0),
    0,
  );
}

function createdRow(): Record<string, unknown> {
  const call = fakePrisma.gapCompile.create.mock.calls[0]?.[0] as { data: Record<string, unknown> } | undefined;
  if (!call) throw new Error('no GapCompile row was created');
  return call.data;
}

function snapshotOf(): Record<string, unknown> {
  return createdRow().inputs_snapshot as Record<string, unknown>;
}

function contractOf(): Record<string, unknown> {
  return snapshotOf().contract as Record<string, unknown>;
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
  fakePrisma.draftQueueItem.findMany.mockResolvedValue([]);
  fakePrisma.prospectingHypothesis.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) =>
    where.id === 'hyp_1' ? hypothesisRow() : null,
  );
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
    expect(createdRow().created_by).toBe('cron');
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
    const res = await POST(jsonRequest({ hypothesisId: 'hyp_1', stepIndex: 0 }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'subject' });
  });

  it('priorBodies is not caller-authored any more -> 422 body_key_not_allowed:priorBodies', async () => {
    const res = await POST(jsonRequest(validBody({ priorBodies: ['earlier copy'] })));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'body_key_not_allowed:priorBodies', field: 'priorBodies' });
    expect(prismaCalls()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// R3-3: the contract is built server-side; the caller gets an allowlist
// ---------------------------------------------------------------------------

describe('R3-3: server-side contract', () => {
  it('evidence comes from the hypothesis\'s linked signals and the hypothesis text is lifted from the row', async () => {
    const res = await POST(jsonRequest(validBody()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.verdict).toBe('pass');
    expect(json.evidenceIdsUsed).toEqual(['ev_1']);
    expect(fakePrisma.prospectingHypothesis.findUnique).toHaveBeenCalledTimes(1);
    const contract = contractOf();
    expect(contract.evidence).toEqual([
      {
        id: 'ev_1',
        title: 'Ohio DC job postings, August',
        url: 'https://example.test/jobs',
        externalOk: true,
        fresh: true,
        superseded: false,
        firstParty: false,
      },
    ]);
    expect(contract.hypothesis).toEqual({
      observation: 'Ohio DC posted three gate-clerk roles in August.',
      problemHypothesis: 'Clerks exist because the dock and the lot disagree.',
      problemFamily: 'hidden_capacity',
    });
    expect(contract).not.toHaveProperty('wordRange');
    expect(contract).not.toHaveProperty('journeyStage');
    expect(contract).not.toHaveProperty('top100Compile');
    expect(snapshotOf().priorBodies).toEqual([]);
  });

  it('a stale linked signal is stale in the contract: C01 rejects with the stale reason (freshness is not the caller\'s to assert)', async () => {
    fakePrisma.prospectingHypothesis.findUnique.mockResolvedValue(
      hypothesisRow({ signals: [{ signal: signalRow({ freshness_expires_at: new Date(Date.now() - DAY) }) }] }),
    );
    const res = await POST(jsonRequest(validBody()));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.checks.find((c: { code: string }) => c.code === 'C01')).toMatchObject({
      passed: false,
      detail: 'marker [[SRC:ev_1]] cites stale evidence ev_1',
    });
  });

  it('the allowlisted keys pass through: proofRefs, namedPipeline, unnamedOnlyClaimIds', async () => {
    const res = await POST(
      jsonRequest(validBody({ contract: { proofRefs: ['ev_9'], namedPipeline: ['Example Motors'], unnamedOnlyClaimIds: ['CR-050'] } })),
    );
    expect(res.status).toBe(200);
    expect(contractOf()).toMatchObject({ proofRefs: ['ev_9'], namedPipeline: ['Example Motors'], unnamedOnlyClaimIds: ['CR-050'] });
  });

  const FORBIDDEN_KEYS: Array<[string, unknown]> = [
    ['evidence', [{ id: 'fake_1', title: 'Fabricated', externalOk: true, fresh: true, superseded: false, firstParty: false }]],
    ['hypothesis', { observation: 'x', problemHypothesis: 'y', problemFamily: 'hidden_capacity' }],
    ['wordRange', { min: 1, max: 5000 }],
    ['journeyStage', 'meeting_prep'],
    ['stepCount', 1],
    ['isLastStep', true],
    ['claimsUsed', ['CR-001']],
    ['validateClaims', 'fn'],
    ['evidenceIds', ['fake_1']],
    ['priorEvidenceIds', [['fake_1']]],
    ['top100Compile', { laneKey: 'acme', hubspotContactId: '1' }],
  ];
  for (const [key, value] of FORBIDDEN_KEYS) {
    it(`contract.${key} is not the caller's to set -> 422 contract_key_not_allowed:${key}`, async () => {
      const res = await POST(jsonRequest(validBody({ contract: { [key]: value } })));
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual({ error: `contract_key_not_allowed:${key}`, field: `contract.${key}` });
      expect(prismaCalls()).toBe(0);
    });
  }

  it('names the first disallowed key when several are sent', async () => {
    const res = await POST(jsonRequest(validBody({ contract: { proofRefs: [], wordRange: { min: 1, max: 5 }, evidence: [] } })));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'contract_key_not_allowed:wordRange', field: 'contract.wordRange' });
  });

  it('a null contract is an empty allowlist', async () => {
    const res = await POST(jsonRequest(validBody({ contract: null })));
    expect(res.status).toBe(200);
  });

  describe("the reviewer's probe: 127 words, a fabricated citation, a meeting ask", () => {
    const PROBE_BASE = `Hi Kara,

Your Ohio DC posted three gate-clerk roles in August [[SRC:fake_1]]. Two of them are night shift.

My guess is the clerks exist to keep inbound trailers moving when the dock and the lot disagree.

Open to a quick call on it?

${SIGN}`;
    const PROBE_BODY = PROBE_BASE.replace('the lot disagree.', `the lot disagree. ${fillerOf(127 - wordCount(PROBE_BASE))}`);

    it('with the forged contract -> 422 on the first disallowed key, nothing compiled', async () => {
      const res = await POST(
        jsonRequest(
          validBody({
            body: PROBE_BODY,
            contract: {
              evidence: [{ id: 'fake_1', title: 'Fabricated posting', externalOk: true, fresh: true, superseded: false, firstParty: false }],
              wordRange: { min: 1, max: 5000 },
              journeyStage: 'meeting_prep',
            },
          }),
        ),
      );
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual({ error: 'contract_key_not_allowed:evidence', field: 'contract.evidence' });
      expect(fakePrisma.gapCompile.create).not.toHaveBeenCalled();
    });

    it('with an honest contract -> 409: C01 cannot resolve the forged marker, C07 counts 127 words, C09 refuses the meeting ask', async () => {
      const res = await POST(jsonRequest(validBody({ body: PROBE_BODY })));
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.verdict).toBe('reject');
      const failed = Object.fromEntries(
        json.checks.filter((c: { passed: boolean }) => !c.passed).map((c: { code: string; detail: string }) => [c.code, c.detail]),
      );
      expect(failed.C01).toBe('marker [[SRC:fake_1]] resolves to no evidence ref (id fake_1)');
      expect(failed.C07).toBe('127 words, outside 45..80 for step 0');
      expect(failed.C09).toContain('CTA family meeting_request is disallowed before a meeting (step 0, sequence_step_1)');
      expect(json.allowedCtaFamily).toBe('scorecard_reply');
      expect(criticCalls).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// R3-3: a hypothesis is required unless the compile is template-level
// ---------------------------------------------------------------------------

describe('R3-3: hypothesis resolution', () => {
  it('copy with no hypothesisId and no source that resolves one -> 422 hypothesis_required', async () => {
    const res = await POST(jsonRequest({ stepIndex: 0, subject: 'Ohio gate roles', body: PASSING_BODY }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'hypothesis_required' });
    expect(fakePrisma.gapCompile.create).not.toHaveBeenCalled();
  });

  it('a sequenceVersionId alone resolves no hypothesis (many hypotheses share a version) -> 422 hypothesis_required', async () => {
    fakePrisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'ver_1', steps: STEPS });
    const res = await POST(jsonRequest({ sequenceVersionId: 'ver_1', stepIndex: 0 }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'hypothesis_required' });
  });

  it('an unknown hypothesisId -> 422 hypothesis_not_found', async () => {
    const res = await POST(jsonRequest(validBody({ hypothesisId: 'hyp_missing' })));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'hypothesis_not_found', hypothesisId: 'hyp_missing' });
  });

  it('a hypothesis with no linked signals compiles with an empty evidence list (every marker then fails C01)', async () => {
    fakePrisma.prospectingHypothesis.findUnique.mockResolvedValue(hypothesisRow({ signals: [] }));
    const res = await POST(jsonRequest(validBody()));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.checks.find((c: { code: string }) => c.code === 'C01')?.detail).toBe(
      'marker [[SRC:ev_1]] resolves to no evidence ref (id ev_1)',
    );
    expect(contractOf().evidence).toEqual([]);
  });
});

describe('R3-3: template-level compiles', () => {
  it('template: true with a version compiles the template copy into a row with hypothesis_id null', async () => {
    fakePrisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'ver_1', steps: STEPS });
    const res = await POST(jsonRequest({ template: true, sequenceVersionId: 'ver_1', stepIndex: 0 }));
    // The template body cites [[SRC:ev_1]] and a template has no evidence: C01 rejects. That is the point.
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.hypothesisId).toBeNull();
    const row = createdRow();
    expect(row.hypothesis_id).toBeNull();
    expect(row.sequence_version_id).toBe('ver_1');
    expect(snapshotOf().template).toBe(true);
    expect(contractOf()).toMatchObject({ evidence: [], stepCount: 3, claimsUsed: [] });
    expect(fakePrisma.prospectingHypothesis.findUnique).not.toHaveBeenCalled();
  });

  it('template: true with a hypothesisId -> 422 template_excludes_hypothesis', async () => {
    const res = await POST(jsonRequest(validBody({ template: true })));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'template_excludes_hypothesis' });
  });

  it('template: true with a draftQueueItemId -> 422 template_excludes_hypothesis', async () => {
    const res = await POST(jsonRequest({ template: true, draftQueueItemId: 42, stepIndex: 0 }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'template_excludes_hypothesis' });
  });

  it('template: true without a version -> 422 template_requires_version', async () => {
    const res = await POST(jsonRequest({ template: true, stepIndex: 0, subject: 'Ohio gate roles', body: PASSING_BODY }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'template_requires_version' });
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
    expect(createdRow().hypothesis_id).toBe('hyp_1');
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
  it('version_not_found -> 422', async () => {
    const res = await POST(jsonRequest({ hypothesisId: 'hyp_1', sequenceVersionId: 'ver_missing', stepIndex: 0 }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'version_not_found', sequenceVersionId: 'ver_missing' });
    expect(fakePrisma.sequenceVersion.findUnique).toHaveBeenCalledWith({
      where: { id: 'ver_missing' },
      select: { id: true, steps: true },
    });
  });

  it('step_out_of_range -> 422', async () => {
    fakePrisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'ver_1', steps: STEPS });
    const res = await POST(jsonRequest({ hypothesisId: 'hyp_1', sequenceVersionId: 'ver_1', stepIndex: 7 }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'step_out_of_range', sequenceVersionId: 'ver_1', stepIndex: 7, stepCount: 3 });
  });

  it('a step with no templates -> 422 step_has_no_copy', async () => {
    fakePrisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'ver_1', steps: STEPS });
    const res = await POST(jsonRequest({ hypothesisId: 'hyp_1', sequenceVersionId: 'ver_1', stepIndex: 2 }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'step_has_no_copy', sequenceVersionId: 'ver_1', stepIndex: 2 });
  });

  it('loads the step copy, stamps the version id and fills stepCount and claimsUsed from the version', async () => {
    fakePrisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'ver_1', steps: STEPS });
    const res = await POST(jsonRequest({ sequenceVersionId: 'ver_1', stepIndex: 0, hypothesisId: 'hyp_1' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.verdict).toBe('pass');
    expect(createdRow().sequence_version_id).toBe('ver_1');
    const snapshot = snapshotOf();
    expect(snapshot.subject).toBe('Ohio gate roles');
    expect(snapshot.body).toBe(PASSING_BODY);
    expect(contractOf().stepCount).toBe(3);
    expect(contractOf().claimsUsed).toEqual([]);
  });

  it('prior bodies are the version\'s earlier steps, never the caller\'s', async () => {
    fakePrisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'ver_1', steps: STEPS });
    const res = await POST(jsonRequest({ sequenceVersionId: 'ver_1', stepIndex: 1, hypothesisId: 'hyp_1' }));
    expect([200, 409]).toContain(res.status);
    const snapshot = snapshotOf();
    expect(snapshot.priorBodies).toEqual([PASSING_BODY]);
    expect(contractOf().claimsUsed).toEqual(['CR-001']);
  });

  it('explicit subject and body win over the version step; the version still supplies stepCount', async () => {
    fakePrisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'ver_1', steps: STEPS });
    const res = await POST(jsonRequest(validBody({ sequenceVersionId: 'ver_1', subject: 'Re: Ohio gate roles' })));
    const json = await res.json();
    expect(json.verdict).toBe('review_required');
    expect(snapshotOf().subject).toBe('Re: Ohio gate roles');
    expect(contractOf().stepCount).toBe(3);
  });

  it('the hypothesis\'s own version supplies stepCount and prior bodies when the caller names none, without stamping the row', async () => {
    fakePrisma.prospectingHypothesis.findUnique.mockResolvedValue(hypothesisRow({ sequence_version_id: 'ver_h' }));
    fakePrisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'ver_h', steps: STEPS });
    const res = await POST(jsonRequest(validBody({ stepIndex: 1, body: STEP1_BODY, subject: 'Second dock lead' })));
    expect([200, 409]).toContain(res.status);
    expect(fakePrisma.sequenceVersion.findUnique).toHaveBeenCalledWith({ where: { id: 'ver_h' }, select: { id: true, steps: true } });
    expect(createdRow().sequence_version_id).toBeNull();
    expect(contractOf().stepCount).toBe(3);
    expect(snapshotOf().priorBodies).toEqual([PASSING_BODY]);
  });
});

describe('copy from a draft queue item', () => {
  function item(overrides: Record<string, unknown> = {}) {
    return {
      id: 42,
      subject: 'Re: Ohio gate roles',
      body: PASSING_BODY,
      account_name: 'Boston Beer Company',
      step_index: 0,
      sequence_run_id: 'run_1',
      sequence_version_id: null,
      campaign_tag: 'gap:hyp_1',
      ...overrides,
    };
  }

  it('draft_queue_item_not_found -> 422', async () => {
    const res = await POST(jsonRequest({ draftQueueItemId: 42, stepIndex: 0 }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'draft_queue_item_not_found', draftQueueItemId: 42 });
  });

  it('loads subject, body and account name from the item and resolves the hypothesis from its gap campaign tag', async () => {
    fakePrisma.draftQueueItem.findUnique.mockResolvedValue(item());
    const res = await POST(jsonRequest({ draftQueueItemId: 42, stepIndex: 0 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.verdict).toBe('review_required');
    expect(json.hypothesisId).toBe('hyp_1');
    const row = createdRow();
    expect(row.draft_queue_item_id).toBe(42);
    expect(row.hypothesis_id).toBe('hyp_1');
    const approval = fakePrisma.sendApprovalRequest.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(approval.data.account_name).toBe('Boston Beer Company');
    expect(approval.data.risk_reasons).toEqual(['gap_compile:cmp_1', 'C15', 'hypothesis:hyp_1', 'draft_queue_item:42']);
  });

  it('an item without a gap tag and no hypothesisId -> 422 hypothesis_required', async () => {
    fakePrisma.draftQueueItem.findUnique.mockResolvedValue(item({ campaign_tag: 'allentown-tour' }));
    const res = await POST(jsonRequest({ draftQueueItemId: 42, stepIndex: 0 }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'hypothesis_required' });
  });

  it('a stepIndex that disagrees with the item -> 422 step_index_mismatch', async () => {
    fakePrisma.draftQueueItem.findUnique.mockResolvedValue(item({ step_index: 1 }));
    const res = await POST(jsonRequest({ draftQueueItemId: 42, stepIndex: 0 }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'step_index_mismatch', draftQueueItemId: 42, stepIndex: 0, itemStepIndex: 1 });
  });

  it('prior bodies are the run\'s earlier items in step order', async () => {
    fakePrisma.draftQueueItem.findUnique.mockResolvedValue(item({ step_index: 2, body: STEP1_BODY, subject: 'Second dock lead' }));
    fakePrisma.draftQueueItem.findMany.mockResolvedValue([
      { step_index: 0, body: 'step zero body' },
      { step_index: 1, body: 'step one body' },
    ]);
    const res = await POST(jsonRequest({ draftQueueItemId: 42, stepIndex: 2 }));
    expect([200, 409]).toContain(res.status);
    expect(fakePrisma.draftQueueItem.findMany).toHaveBeenCalledWith({
      where: { sequence_run_id: 'run_1', step_index: { lt: 2 } },
      orderBy: { step_index: 'asc' },
      select: { step_index: true, body: true },
    });
    expect(snapshotOf().priorBodies).toEqual(['step zero body', 'step one body']);
  });
});
