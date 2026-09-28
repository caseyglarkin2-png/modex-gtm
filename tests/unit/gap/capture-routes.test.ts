import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { session, store } = vi.hoisted(() => ({
  session: { value: null as null | { user: { email: string } } },
  store: { createCapture: vi.fn(), decideCandidate: vi.fn(), linkCapture: vi.fn(), recordMeetingOutcome: vi.fn(), loadCapture: vi.fn(), listRecentCaptures: vi.fn() },
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/gap/flags', () => ({ assertGapEnabled: () => null }));
vi.mock('@/lib/gap/capture/store', async (orig) => ({ ...(await orig<typeof import('@/lib/gap/capture/store')>()), ...store }));

import { POST as createPOST } from '@/app/api/gap/captures/route';
import { POST as notePOST } from '@/app/api/gap/captures/[id]/route';

const req = (body: unknown) => new NextRequest('https://x/api/gap/captures', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
const ctx = { params: Promise.resolve({ id: 'cap1' }) };

beforeEach(() => {
  for (const f of Object.values(store)) f.mockReset();
  session.value = { user: { email: 'casey@freightroll.com' } };
});

describe('POST /api/gap/captures', () => {
  it('401 without a session; 201 with the capture; the session is the actor', async () => {
    session.value = null;
    expect((await createPOST(req({ context: 'meeting', rawText: 'x' }))).status).toBe(401);
    session.value = { user: { email: 'casey@freightroll.com' } };
    store.createCapture.mockResolvedValue({ ok: true, capture: { id: 'cap1' } });
    const r = await createPOST(req({ accountName: 'PepsiCo', context: 'conference', rawText: 'We lose trailers every day.' }));
    expect(r.status).toBe(201);
    expect(store.createCapture.mock.calls[0][1]).toMatchObject({ accountName: 'PepsiCo', context: 'conference', actor: 'casey@freightroll.com' });
  });

  it('an unknown context is 400 before anything is stored', async () => {
    expect((await createPOST(req({ context: 'tiktok', rawText: 'x' }))).status).toBe(400);
    expect(store.createCapture).not.toHaveBeenCalled();
  });
});

describe('POST /api/gap/captures/[id]', () => {
  it('decide passes the human decision through; a refusal (quote not in the note) is 409 with the reason', async () => {
    store.decideCandidate.mockResolvedValue({ ok: false, reason: 'quote_not_in_source' });
    const r = await notePOST(req({ op: 'decide', candidateId: 'c1', decision: 'confirm', hypothesisId: 'h1' }), ctx);
    expect(r.status).toBe(409);
    expect(await r.json()).toMatchObject({ error: 'quote_not_in_source' });
    expect(store.decideCandidate.mock.calls[0][1]).toMatchObject({ captureId: 'cap1', candidateId: 'c1', decision: 'confirm', actor: 'casey@freightroll.com' });
  });

  it('a meeting outcome outside the five is 400', async () => {
    expect((await notePOST(req({ op: 'meeting', outcome: 'great_vibes', hypothesisId: 'h1' }), ctx)).status).toBe(400);
  });
});
