import { describe, expect, it, vi } from 'vitest';
import { postReviewLog, DEFAULT_WAR_ROOM_URL } from '@/lib/gap/review-feed';
import { audit, recordHypothesisEvent } from '@/lib/gap/audit';

function okResponse(): Response {
  return { ok: true, status: 200 } as unknown as Response;
}

const ENTRY = {
  motion: 'gap' as const,
  action: 'hypothesis.approved',
  target: 'acme.com',
  title: 'Approved: Acme dwell hypothesis',
  intent: 'Operator veto surface',
};

describe('postReviewLog', () => {
  it('returns no_token and never calls fetch when MC_API_TOKEN is missing', async () => {
    const fetchImpl = vi.fn();
    const result = await postReviewLog(ENTRY, { fetchImpl, env: {} });
    expect(result).toEqual({ posted: false, reason: 'no_token' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('treats a blank token as missing', async () => {
    const fetchImpl = vi.fn();
    const result = await postReviewLog(ENTRY, { fetchImpl, env: { MC_API_TOKEN: '   ' } });
    expect(result).toEqual({ posted: false, reason: 'no_token' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('resolves http_<status> on a non-2xx response without throwing', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 500 }) as unknown as Response);
    const result = await postReviewLog(ENTRY, { fetchImpl, env: { MC_API_TOKEN: 'tok' } });
    expect(result).toEqual({ posted: false, reason: 'http_500' });
  });

  it('resolves network_error when fetch rejects', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNRESET');
    });
    const result = await postReviewLog(ENTRY, { fetchImpl, env: { MC_API_TOKEN: 'tok' } });
    expect(result).toEqual({ posted: false, reason: 'network_error' });
  });

  it('posts to <WAR_ROOM_URL>/api/review/log with the bearer header and a gap body', async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    const result = await postReviewLog(
      { ...ENTRY, criticVerdict: 'pass', criticScore: 91, url: 'https://x/y', rollbackRef: 'ref-1' },
      { fetchImpl, env: { MC_API_TOKEN: 'secret-token', WAR_ROOM_URL: 'https://war.example/' } },
    );
    expect(result).toEqual({ posted: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://war.example/api/review/log');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer secret-token');
    expect(headers['Content-Type']).toBe('application/json');
    expect(init.signal).toBeInstanceOf(AbortSignal);

    const body = JSON.parse(String(init.body));
    expect(body).toEqual({
      motion: 'gap',
      action: 'hypothesis.approved',
      target: 'acme.com',
      title: 'Approved: Acme dwell hypothesis',
      intent: 'Operator veto surface',
      criticVerdict: 'pass',
      criticScore: 91,
      url: 'https://x/y',
      rollbackRef: 'ref-1',
    });
  });

  it('falls back to the default war-room URL when WAR_ROOM_URL is unset', async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    await postReviewLog(ENTRY, { fetchImpl, env: { MC_API_TOKEN: 'tok' } });
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toBe(`${DEFAULT_WAR_ROOM_URL}/api/review/log`);
    expect(DEFAULT_WAR_ROOM_URL).toBe('https://yardflow-war-room.vercel.app');
  });

  it('reads env per call, not at module load', async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    const first = await postReviewLog(ENTRY, { fetchImpl, env: {} });
    expect(first).toEqual({ posted: false, reason: 'no_token' });
    expect(fetchImpl).not.toHaveBeenCalled();

    const second = await postReviewLog(ENTRY, {
      fetchImpl,
      env: { MC_API_TOKEN: 'later', WAR_ROOM_URL: 'https://second.example' },
    });
    expect(second).toEqual({ posted: true });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://second.example/api/review/log');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer later');
  });
});

describe('recordHypothesisEvent', () => {
  const input = {
    hypothesisId: 'hyp_1',
    fromStatus: 'submitted',
    toStatus: 'approved',
    action: 'approve',
    actor: 'casey',
    reason: 'looks right',
    payload: { note: 'x' },
  };

  it('writes through the transaction client when one is given', async () => {
    const tx = { hypothesisEvent: { create: vi.fn(async () => ({ id: 'evt_tx' })) } };
    const prisma = { hypothesisEvent: { create: vi.fn(async () => ({ id: 'evt_prisma' })) } };
    const id = await recordHypothesisEvent(prisma, tx, input);
    expect(id).toBe('evt_tx');
    expect(tx.hypothesisEvent.create).toHaveBeenCalledTimes(1);
    expect(prisma.hypothesisEvent.create).not.toHaveBeenCalled();
    expect(tx.hypothesisEvent.create).toHaveBeenCalledWith({
      data: {
        hypothesis_id: 'hyp_1',
        from_status: 'submitted',
        to_status: 'approved',
        action: 'approve',
        actor: 'casey',
        reason: 'looks right',
        payload: { note: 'x' },
      },
      select: { id: true },
    });
  });

  it('falls back to the prisma client when tx is null and nulls optional fields', async () => {
    const prisma = { hypothesisEvent: { create: vi.fn(async () => ({ id: 'evt_prisma' })) } };
    const id = await recordHypothesisEvent(prisma, null, {
      hypothesisId: 'hyp_2',
      fromStatus: null,
      toStatus: 'submitted',
      action: 'submit',
      actor: 'system',
    });
    expect(id).toBe('evt_prisma');
    expect(prisma.hypothesisEvent.create).toHaveBeenCalledWith({
      data: {
        hypothesis_id: 'hyp_2',
        from_status: null,
        to_status: 'submitted',
        action: 'submit',
        actor: 'system',
        reason: null,
        payload: null,
      },
      select: { id: true },
    });
  });
});

describe('audit', () => {
  const base = {
    kind: 'hypothesis.approved' as const,
    actor: 'casey',
    subjectType: 'hypothesis',
    subjectId: 'hyp_1',
    payload: { from: 'submitted', to: 'approved' },
  };

  it('skips the write when the client has no gapAuditEvent delegate', async () => {
    const prisma = {};
    await expect(audit(prisma, base)).resolves.toEqual({ stored: false, reviewQueued: false });
  });

  it('writes the exact row when the delegate exists', async () => {
    const prisma = { gapAuditEvent: { create: vi.fn(async () => ({ id: 'a1' })) } };
    const result = await audit(prisma, base);
    expect(result).toEqual({ stored: true, reviewQueued: false });
    expect(prisma.gapAuditEvent.create).toHaveBeenCalledTimes(1);
    expect(prisma.gapAuditEvent.create).toHaveBeenCalledWith({
      data: {
        kind: 'hypothesis.approved',
        actor: 'casey',
        subject_type: 'hypothesis',
        subject_id: 'hyp_1',
        payload: { from: 'submitted', to: 'approved' },
      },
      select: { id: true },
    });
  });

  it('defaults payload to an empty object when omitted', async () => {
    const prisma = { gapAuditEvent: { create: vi.fn(async () => ({ id: 'a1' })) } };
    const { payload: _omit, ...noPayload } = base;
    await audit(prisma, noPayload);
    expect(prisma.gapAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ payload: {} }) }),
    );
  });

  it('queues a gap review entry whose action is the audit kind', async () => {
    const prisma = { gapAuditEvent: { create: vi.fn(async () => ({ id: 'a1' })) } };
    const postReview = vi.fn<typeof postReviewLog>(async () => ({ posted: true }));
    const result = await audit(
      prisma,
      {
        ...base,
        review: {
          target: 'acme.com',
          title: 'Approved',
          intent: 'veto',
          url: 'https://x/y',
          rollbackRef: 'ref',
        },
      },
      { postReview },
    );
    expect(result).toEqual({ stored: true, reviewQueued: true });
    await Promise.resolve();
    expect(postReview).toHaveBeenCalledTimes(1);
    expect(postReview).toHaveBeenCalledWith({
      motion: 'gap',
      action: 'hypothesis.approved',
      target: 'acme.com',
      title: 'Approved',
      intent: 'veto',
      url: 'https://x/y',
      rollbackRef: 'ref',
    });
  });

  it('does not reject when the review post rejects', async () => {
    const prisma = { gapAuditEvent: { create: vi.fn(async () => ({ id: 'a1' })) } };
    const postReview = vi.fn<typeof postReviewLog>(async () => {
      throw new Error('boom');
    });
    const result = await audit(
      prisma,
      { ...base, review: { target: 't', title: 'x', intent: 'y' } },
      { postReview },
    );
    expect(result).toEqual({ stored: true, reviewQueued: true });
    await new Promise((r) => setTimeout(r, 0));
    expect(postReview).toHaveBeenCalledTimes(1);
  });

  it('does not reject when the review post throws synchronously', async () => {
    const prisma = {};
    const postReview = vi.fn(() => {
      throw new Error('sync boom');
    }) as unknown as typeof postReviewLog;
    const result = await audit(
      prisma,
      { ...base, review: { target: 't', title: 'x', intent: 'y' } },
      { postReview },
    );
    expect(result).toEqual({ stored: false, reviewQueued: true });
  });

  it('resolves stored:false when the create itself throws', async () => {
    const prisma = {
      gapAuditEvent: {
        create: vi.fn(async () => {
          throw new Error('db down');
        }),
      },
    };
    await expect(audit(prisma, base)).resolves.toEqual({ stored: false, reviewQueued: false });
  });
});
