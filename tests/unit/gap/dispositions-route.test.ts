/**
 * POST /api/gap/dispositions (GAP Prospecting OS, Sprint 4, S4-T3).
 *
 * The service is a module mock so this file pins only what the route owns:
 * the gate (404 skip payload), auth (session = human, HEADER token = agent,
 * never `?secret=`), the zod shape of the Sprint 4 contract, and the
 * 201 / 400 / 409 bodies.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockedAuth, mockedService } = vi.hoisted(() => ({
  mockedAuth: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedService: vi.fn<(...args: any[]) => Promise<any>>(),
}));

vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: { __tag: 'fake-prisma' } }));
vi.mock('@/lib/gap/disposition/service', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/gap/disposition/service')>();
  return { ...original, recordDisposition: mockedService };
});

const { POST } = await import('@/app/api/gap/dispositions/route');

const BASE = 'http://localhost/api/gap/dispositions';
const SESSION = { user: { email: 'casey@freightroll.com' } };
const ENV_KEYS = ['GAP_OS_ENABLED', 'CRON_SECRET', 'QUEUE_AGENT_SECRET'] as const;

const VALID_BODY = {
  hypothesisId: 'H1',
  personaId: 7,
  contactEmail: 'jordan@acme.example',
  channel: 'call',
  responseClass: 'problem_confirmed',
  buyerLanguage: 'we lose trailers every week',
  source: { kind: 'call', id: 'call:7:1' },
  bids: [{ type: 'business_problem', rawBuyerLanguage: 'we lose trailers every week' }],
};

const OK = {
  ok: true,
  dispositionId: 'D1',
  bidIds: ['B1'],
  humanConfirmed: true,
  effects: { stopped: ['E1'], unsubscribed: false, resolution: { outcome: 'confirmed', confidence: 85 }, mirrored: false },
  refusals: [{ step: 'mirror', reason: 'skipped:gap_mirror_disabled' }],
};

function post(body: unknown, opts: { url?: string; headers?: Record<string, string> } = {}) {
  return new NextRequest(opts.url ?? BASE, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(opts.headers ?? {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.GAP_OS_ENABLED = 'true';
  process.env.CRON_SECRET = 'cron-secret-value';
  delete process.env.QUEUE_AGENT_SECRET;
  mockedAuth.mockReset();
  mockedAuth.mockResolvedValue(SESSION);
  mockedService.mockReset();
  mockedService.mockResolvedValue(OK);
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe('POST /api/gap/dispositions', () => {
  it('404 with the typed skip payload when GAP_OS_ENABLED is off, before auth', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    const res = await POST(post(VALID_BODY));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    expect(mockedAuth).not.toHaveBeenCalled();
    expect(mockedService).not.toHaveBeenCalled();
  });

  it('401 for no session, and `?secret=` in the query is never accepted', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await POST(post(VALID_BODY, { url: `${BASE}?secret=cron-secret-value` }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthenticated' });
    expect(mockedService).not.toHaveBeenCalled();
  });

  it('201 with the contract body for a session: actor = the email, actorKind human, the body mapped field for field', async () => {
    const res = await POST(post(VALID_BODY));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ dispositionId: 'D1', bidIds: ['B1'], effects: OK.effects, refusals: OK.refusals });
    expect(mockedService).toHaveBeenCalledTimes(1);
    const [prismaArg, input] = mockedService.mock.calls[0];
    expect(prismaArg).toEqual({ __tag: 'fake-prisma' });
    expect(input).toMatchObject({
      hypothesisId: 'H1',
      personaId: 7,
      contactEmail: 'jordan@acme.example',
      channel: 'call',
      responseClass: 'problem_confirmed',
      buyerLanguage: 'we lose trailers every week',
      source: { kind: 'call', id: 'call:7:1' },
      bids: [{ type: 'business_problem', rawBuyerLanguage: 'we lose trailers every week' }],
      aiSuggestionId: null,
      resumeAt: null,
      referral: null,
      actor: 'casey@freightroll.com',
      actorKind: 'human',
    });
    expect(input.now).toBeInstanceOf(Date);
  });

  it('a header token authenticates an agent: actor cron, actorKind agent (the service writes an unconfirmed row)', async () => {
    mockedAuth.mockResolvedValue(null);
    mockedService.mockResolvedValue({ ok: true, dispositionId: 'D1', bidIds: [], humanConfirmed: false, effects: 'none', refusals: [] });
    const res = await POST(post(VALID_BODY, { headers: { 'x-gap-token': 'cron-secret-value' } }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ dispositionId: 'D1', bidIds: [], effects: 'none', refusals: [] });
    expect(mockedService.mock.calls[0][1]).toMatchObject({ actor: 'cron', actorKind: 'agent' });
  });

  it('400 invalid_body naming the field for a shape miss, an unknown class, a bad source kind, an unknown key, and unparsable JSON', async () => {
    let res = await POST(post({ ...VALID_BODY, responseClass: 'positive_interest' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'responseClass' });

    res = await POST(post({ ...VALID_BODY, source: { kind: 'fax', id: '1' } }));
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'source.kind' });

    res = await POST(post({ ...VALID_BODY, bids: [{ type: 'feeling', rawBuyerLanguage: 'x' }] }));
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'bids.0.type' });

    res = await POST(post({ ...VALID_BODY, readback: {} }));
    expect(res.status).toBe(400);

    res = await POST(post('{not json'));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'body' });
    expect(mockedService).not.toHaveBeenCalled();
  });

  it('400 invalid_body with the reason when the service refuses the shape (a taxonomy rule zod cannot see)', async () => {
    mockedService.mockResolvedValue({ ok: false, kind: 'invalid_body', field: 'buyerLanguage', reason: 'quote_required' });
    const res = await POST(post({ ...VALID_BODY, buyerLanguage: undefined }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'buyerLanguage', reason: 'quote_required' });
  });

  it('409 with the reason for a service refusal; duplicate_source carries the existing id', async () => {
    mockedService.mockResolvedValue({ ok: false, kind: 'refused', reason: 'hypothesis_not_active' });
    let res = await POST(post(VALID_BODY));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'hypothesis_not_active' });

    mockedService.mockResolvedValue({ ok: false, kind: 'refused', reason: 'duplicate_source', existingId: 'D_old' });
    res = await POST(post(VALID_BODY));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'duplicate_source', existingId: 'D_old' });

    mockedService.mockResolvedValue({ ok: false, kind: 'refused', reason: 'suppressed_target_mismatch' });
    res = await POST(post(VALID_BODY));
    expect(await res.json()).toEqual({ error: 'suppressed_target_mismatch' });
  });

  it('passes aiSuggestionId, resumeAt and referral through when given', async () => {
    const res = await POST(post({ ...VALID_BODY, responseClass: 'timing', buyerLanguage: undefined, bids: undefined, aiSuggestionId: 'D_ai', resumeAt: '2027-01-04T00:00:00.000Z' }));
    expect(res.status).toBe(201);
    expect(mockedService.mock.calls[0][1]).toMatchObject({ aiSuggestionId: 'D_ai', resumeAt: '2027-01-04T00:00:00.000Z', bids: undefined });
    const bad = await POST(post({ ...VALID_BODY, resumeAt: 'next quarter' }));
    expect(await bad.json()).toEqual({ error: 'invalid_body', field: 'resumeAt' });
  });
});
