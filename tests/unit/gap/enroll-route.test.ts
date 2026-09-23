/**
 * POST /api/gap/enroll (GAP Prospecting OS, Sprint 3, S3-T12).
 *
 * The service is a module mock so this file pins only what the route owns:
 * the gate, auth (session or HEADER token, never `?secret=`), the zod shape,
 * the shadow default, the `confirm: true` requirement for live, and the
 * status codes.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockedAuth, mockedService, mockedAddOne } = vi.hoisted(() => ({
  mockedAuth: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedService: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedAddOne: vi.fn<(...args: any[]) => Promise<any>>(),
}));

vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: { __tag: 'fake-prisma' } }));
vi.mock('@/lib/gap/enroll/service', () => ({ enrollFromDecision: mockedService }));
vi.mock('@/app/discovery/queue-actions', () => ({ addOne: mockedAddOne }));

const { POST } = await import('@/app/api/gap/enroll/route');

const BASE = 'http://localhost/api/gap/enroll';
const SESSION = { user: { email: 'casey@freightroll.com' } };
const ENV_KEYS = ['GAP_OS_ENABLED', 'CRON_SECRET', 'QUEUE_AGENT_SECRET'] as const;

const VALID_BODY = {
  hypothesisId: 'H1',
  personaId: 7,
  sequenceVersionId: 'v1',
  compileIds: ['c0', 'c1'],
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
  mockedService.mockResolvedValue({ ok: true, kind: 'modex_shadow', target: 'modex_queue', mode: 'shadow', wouldBe: { toEmail: 'x@y.z' } });
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe('POST /api/gap/enroll', () => {
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

  it('a header token authenticates an agent: actor cron, actorKind agent', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await POST(post(VALID_BODY, { headers: { 'x-gap-token': 'cron-secret-value' } }));
    expect(res.status).toBe(200);
    expect(mockedService).toHaveBeenCalledTimes(1);
    expect(mockedService.mock.calls[0][1]).toMatchObject({ actor: 'cron', actorKind: 'agent', mode: 'shadow' });
  });

  it('422 confirm_required for mode live without confirm: true', async () => {
    const res = await POST(post({ ...VALID_BODY, mode: 'live' }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'confirm_required', field: 'confirm' });
    expect(mockedService).not.toHaveBeenCalled();

    const falsy = await POST(post({ ...VALID_BODY, mode: 'live', confirm: false }));
    expect(falsy.status).toBe(422);
  });

  it('mode live with confirm: true reaches the service as live from the human actor', async () => {
    mockedService.mockResolvedValue({ ok: true, kind: 'modex_enrolled', target: 'modex_queue', mode: 'live', draftItemId: 1, enrollment: { id: 'e', frozen: true, isTest: false } });
    const res = await POST(post({ ...VALID_BODY, mode: 'live', confirm: true }));
    expect(res.status).toBe(200);
    expect(mockedService.mock.calls[0][1]).toMatchObject({ mode: 'live', actor: 'casey@freightroll.com', actorKind: 'human' });
  });

  it('200 shadow by default: the service result is the body and mode defaults to shadow', async () => {
    const res = await POST(post(VALID_BODY));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, kind: 'modex_shadow', mode: 'shadow' });
    const [prismaArg, inputArg, depsArg] = mockedService.mock.calls[0];
    expect(prismaArg).toEqual({ __tag: 'fake-prisma' });
    expect(inputArg).toMatchObject({
      decisionId: null,
      hypothesisId: 'H1',
      personaId: 7,
      sequenceVersionId: 'v1',
      compileIds: ['c0', 'c1'],
      mode: 'shadow',
      actor: 'casey@freightroll.com',
      actorKind: 'human',
      readback: null,
    });
    expect(inputArg.now).toBeInstanceOf(Date);
    expect(depsArg.addOne).toBe(mockedAddOne);
  });

  it('409 with the reason (and detail when given) on a service refusal', async () => {
    mockedService.mockResolvedValue({ ok: false, reason: 'compile_not_passed:1' });
    const res = await POST(post(VALID_BODY));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'compile_not_passed:1' });

    mockedService.mockResolvedValue({ ok: false, reason: 'autonomy_halted', detail: 'outreach motion halted' });
    const halted = await POST(post({ ...VALID_BODY, mode: 'live', confirm: true }));
    expect(halted.status).toBe(409);
    expect(await halted.json()).toEqual({ error: 'autonomy_halted', detail: 'outreach motion halted' });
  });

  it('422 invalid_body naming the field; 400 for unparsable JSON', async () => {
    const missing = await POST(post({ ...VALID_BODY, compileIds: [] }));
    expect(missing.status).toBe(422);
    expect(await missing.json()).toEqual({ error: 'invalid_body', field: 'compileIds' });

    const badMode = await POST(post({ ...VALID_BODY, mode: 'yolo' }));
    expect(badMode.status).toBe(422);
    expect(await badMode.json()).toEqual({ error: 'invalid_body', field: 'mode' });

    const junk = await POST(post('{not json'));
    expect(junk.status).toBe(400);
    expect(await junk.json()).toEqual({ error: 'invalid_body', field: 'body' });
    expect(mockedService).not.toHaveBeenCalled();
  });

  it('passes decisionId, readback, owner and sender through when given', async () => {
    const readback = { activelyEnrolledCount: 1, latestSequenceId: '333', latestEnrolledAt: null };
    await POST(post({ ...VALID_BODY, decisionId: 'dec_1', readback, owner: 'jake@freightroll.com', sender: 'casey@yardflow.ai' }));
    expect(mockedService.mock.calls[0][1]).toMatchObject({
      decisionId: 'dec_1',
      readback,
      owner: 'jake@freightroll.com',
      sender: 'casey@yardflow.ai',
    });
  });
});
