import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

process.env.QUEUE_AGENT_SECRET = 'test-secret';

const mockedAddOne = vi.fn(async () => ({ ok: true as const, id: 1 }));
const mockedUpsertContact = vi.fn(async () => ({ ok: true, personaCreated: true }));

vi.mock('@/app/discovery/queue-actions', () => ({ addOne: mockedAddOne }));
vi.mock('@/lib/queue/contact-upsert', () => ({
  upsertContactFromQueueItem: mockedUpsertContact,
}));

const { POST } = await import('@/app/api/cron/queue/route');

const validBody = {
  items: [
    {
      toEmail: 'ops@example.com',
      accountName: 'Acme',
      subject: 'Hello',
      body: 'Body copy',
    },
    {
      toEmail: 'lead@example.com',
      accountName: 'Beta Co',
      subject: 'Hi there',
      body: 'More body copy',
    },
  ],
};

function makeReq(opts: { headers?: Record<string, string>; body?: unknown; url?: string } = {}) {
  return new NextRequest(opts.url ?? 'http://localhost/api/cron/queue', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(opts.headers ?? {}) },
    body: opts.body === undefined ? JSON.stringify(validBody) : JSON.stringify(opts.body),
  });
}

describe('POST /api/cron/queue (Clawd bulk-add)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAddOne.mockResolvedValue({ ok: true as const, id: 1 });
    mockedUpsertContact.mockResolvedValue({ ok: true, personaCreated: true });
  });

  it('rejects with 401 when no Authorization header is present', async () => {
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
    expect(mockedAddOne).not.toHaveBeenCalled();
  });

  it('rejects with 401 when the bearer secret is wrong', async () => {
    const res = await POST(makeReq({ headers: { authorization: 'Bearer wrong' } }));
    expect(res.status).toBe(401);
    expect(mockedAddOne).not.toHaveBeenCalled();
  });

  it('rejects the ?secret= query form with 401 (never accepted)', async () => {
    const res = await POST(makeReq({ url: 'http://localhost/api/cron/queue?secret=test-secret' }));
    expect(res.status).toBe(401);
    expect(mockedAddOne).not.toHaveBeenCalled();
  });

  it('accepts a valid bearer call and adds each item', async () => {
    const res = await POST(makeReq({ headers: { authorization: 'Bearer test-secret' } }));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(mockedAddOne).toHaveBeenCalledTimes(2);
    expect(payload).toEqual({ added: 2, skipped: [], contactsUpserted: 2 });
    // forces source: 'clawd' and applies the default owner
    expect(mockedAddOne).toHaveBeenCalledWith(
      expect.objectContaining({ toEmail: 'ops@example.com', source: 'clawd' }),
      'casey@freightroll.com',
    );
    // each added item gets a contact upsert
    expect(mockedUpsertContact).toHaveBeenCalledTimes(2);
    expect(mockedUpsertContact).toHaveBeenCalledWith({
      toEmail: 'ops@example.com',
      personaName: null,
      personaTitle: null,
      accountName: 'Acme',
    });
  });

  it('passes personaName and personaTitle through to the contact upsert', async () => {
    const res = await POST(
      makeReq({
        headers: { authorization: 'Bearer test-secret' },
        body: {
          items: [
            {
              toEmail: 'ops@example.com',
              accountName: 'Acme',
              personaName: 'Jane Doe',
              personaTitle: 'VP Operations',
              contactSource: 'clawd-enrichment',
              contactConfidence: 'high',
              subject: 'Hello',
              body: 'Body copy',
            },
          ],
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(mockedUpsertContact).toHaveBeenCalledWith({
      toEmail: 'ops@example.com',
      personaName: 'Jane Doe',
      personaTitle: 'VP Operations',
      accountName: 'Acme',
    });
  });

  it('collects skipped items with their reasons and skips their contact upserts', async () => {
    mockedAddOne
      .mockResolvedValueOnce({ ok: true as const, id: 1 })
      .mockResolvedValueOnce({ ok: false as const, reason: 'already_queued' } as never);

    const res = await POST(makeReq({ headers: { authorization: 'Bearer test-secret' } }));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.added).toBe(1);
    expect(payload.skipped).toEqual([{ toEmail: 'lead@example.com', reason: 'already_queued' }]);
    // dedup-skipped items were handled when first queued; no upsert
    expect(mockedUpsertContact).toHaveBeenCalledTimes(1);
    expect(mockedUpsertContact).toHaveBeenCalledWith(
      expect.objectContaining({ toEmail: 'ops@example.com' }),
    );
  });

  it('does not count failed contact upserts in contactsUpserted', async () => {
    mockedUpsertContact
      .mockResolvedValueOnce({ ok: true, personaCreated: true })
      .mockResolvedValueOnce({ ok: false, personaCreated: false });

    const res = await POST(makeReq({ headers: { authorization: 'Bearer test-secret' } }));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.added).toBe(2);
    expect(payload.contactsUpserted).toBe(1);
  });

  it('returns 400 on invalid JSON', async () => {
    const req = new NextRequest('http://localhost/api/cron/queue', {
      method: 'POST',
      headers: { authorization: 'Bearer test-secret', 'content-type': 'application/json' },
      body: '{ not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockedAddOne).not.toHaveBeenCalled();
  });

  it('returns 400 on a payload that fails schema validation', async () => {
    const res = await POST(
      makeReq({ headers: { authorization: 'Bearer test-secret' }, body: { items: [] } }),
    );
    const payload = await res.json();
    expect(res.status).toBe(400);
    expect(payload.error).toBe('Invalid payload');
    expect(payload.details).toBeTruthy();
    expect(mockedAddOne).not.toHaveBeenCalled();
  });
});
