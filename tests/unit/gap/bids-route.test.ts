/**
 * POST /api/gap/bids (GAP Prospecting OS, Sprint 4, S4-T3). The service is
 * a module mock; this pins the gate, auth, the zod shape and the
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
vi.mock('@/lib/gap/bid/service', () => ({ recordBid: mockedService }));

const { POST } = await import('@/app/api/gap/bids/route');

const BASE = 'http://localhost/api/gap/bids';
const SESSION = { user: { email: 'casey@freightroll.com' } };
const ENV_KEYS = ['GAP_OS_ENABLED', 'CRON_SECRET', 'QUEUE_AGENT_SECRET'] as const;

const VALID_BODY = {
  hypothesisId: 'H1',
  contactEmail: 'jordan@acme.example',
  dispositionId: 'D1',
  type: 'metric',
  rawBuyerLanguage: '40 minutes a truck',
  numericValue: 40,
  unit: 'minutes',
  source: 'call',
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
  mockedService.mockResolvedValue({ ok: true, bidId: 'B1', humanConfirmed: true, supersedesId: null });
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe('POST /api/gap/bids', () => {
  it('404 skip payload when the flag is off, before auth', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    const res = await POST(post(VALID_BODY));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    expect(mockedAuth).not.toHaveBeenCalled();
  });

  it('401 without a session or header token; `?secret=` never counts', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await POST(post(VALID_BODY, { url: `${BASE}?secret=cron-secret-value` }));
    expect(res.status).toBe(401);
    expect(mockedService).not.toHaveBeenCalled();
  });

  it('201 with { bidId, humanConfirmed, supersedesId } for a session, the body mapped through', async () => {
    const res = await POST(post(VALID_BODY));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ bidId: 'B1', humanConfirmed: true, supersedesId: null });
    expect(mockedService.mock.calls[0][1]).toMatchObject({
      hypothesisId: 'H1',
      contactEmail: 'jordan@acme.example',
      dispositionId: 'D1',
      type: 'metric',
      rawBuyerLanguage: '40 minutes a truck',
      numericValue: 40,
      unit: 'minutes',
      source: 'call',
      supersedesId: null,
      actor: 'casey@freightroll.com',
      actorKind: 'human',
    });
  });

  it('a header token is an agent actor; a correction passes supersedesId through', async () => {
    mockedAuth.mockResolvedValue(null);
    mockedService.mockResolvedValue({ ok: true, bidId: 'B2', humanConfirmed: false, supersedesId: 'B1' });
    const res = await POST(post({ ...VALID_BODY, supersedesId: 'B1' }, { headers: { authorization: 'Bearer cron-secret-value' } }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ bidId: 'B2', humanConfirmed: false, supersedesId: 'B1' });
    expect(mockedService.mock.calls[0][1]).toMatchObject({ actor: 'cron', actorKind: 'agent', supersedesId: 'B1' });
  });

  it('400 invalid_body naming the field: unknown type, unknown source, missing language, unknown key, bad JSON', async () => {
    expect(await (await POST(post({ ...VALID_BODY, type: 'feeling' }))).json()).toEqual({ error: 'invalid_body', field: 'type' });
    expect(await (await POST(post({ ...VALID_BODY, source: 'pigeon' }))).json()).toEqual({ error: 'invalid_body', field: 'source' });
    expect(await (await POST(post({ ...VALID_BODY, rawBuyerLanguage: '' }))).json()).toEqual({ error: 'invalid_body', field: 'rawBuyerLanguage' });
    expect((await POST(post({ ...VALID_BODY, extra: 1 }))).status).toBe(400);
    const res = await POST(post('{'));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'body' });
    expect(mockedService).not.toHaveBeenCalled();
  });

  it('400 with the service field and reason, 409 with the service refusal', async () => {
    mockedService.mockResolvedValue({ ok: false, kind: 'invalid_body', field: 'unit', reason: 'unit_required' });
    let res = await POST(post({ ...VALID_BODY, unit: undefined }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'unit', reason: 'unit_required' });

    mockedService.mockResolvedValue({ ok: false, kind: 'refused', reason: 'already_superseded' });
    res = await POST(post({ ...VALID_BODY, supersedesId: 'B0' }));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'already_superseded' });
  });
});
