/**
 * GET / POST /api/gap/personas/[id]/suppression-review (WHO truth, 2026-10-05): the HTTP contract. Session only;
 * the actor is the session email; 404 unknown persona; 409 with the refusal on a refused clear; 200 on success.
 * Service behavior is tested in legacy-suppression-review.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { session, mocks } = vi.hoisted(() => ({
  session: { value: null as null | { user: { email: string } } },
  mocks: { loadSuppressionReview: vi.fn(), clearLegacyLocalFlag: vi.fn() },
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', () => ({ prisma: { tag: 'the-prisma' } }));
vi.mock('@/lib/gap/suppression/legacy-review', async (orig) => ({ ...(await orig<Record<string, unknown>>()), loadSuppressionReview: mocks.loadSuppressionReview, clearLegacyLocalFlag: mocks.clearLegacyLocalFlag }));

const { GET, POST, dynamic, maxDuration } = await import('@/app/api/gap/personas/[id]/suppression-review/route');

const req = (body?: unknown) => new NextRequest('https://x/api/gap/personas/13/suppression-review', { method: body === undefined ? 'GET' : 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const FLAGS = ['GAP_OS_ENABLED', 'GAP_HYPOTHESIS_ENABLED', 'GAP_ROUTING_ENABLED'];
const review = { personaId: 13, name: 'Isaac Scott', accountName: 'PepsiCo', email: 'isaac.scott@pepsico.com', class: 'LEGACY_CONFLICT', sources: [], whyBlocked: [], whatWouldClear: [], laterDeliveries: [], lastBounceAt: null, humanDecisions: [], clear: { allowed: true, touches: ['personas.do_not_contact', 'personas.email_status'], why: 'ok' }, readAt: '2026-10-05T18:00:00.000Z' };

beforeEach(() => {
  for (const f of FLAGS) process.env[f] = '1';
  session.value = { user: { email: 'casey@yardflow.ai' } };
  for (const m of Object.values(mocks)) m.mockReset();
});

describe('GET /api/gap/personas/[id]/suppression-review', () => {
  it('is dynamic with a 60 s budget (the contract and HubSpot are read live)', () => {
    expect(dynamic).toBe('force-dynamic');
    expect(maxDuration).toBe(60);
  });
  it('404 with the flag off; 401 without a session; 404 a non-numeric id or an unknown persona; 200 the review', async () => {
    process.env.GAP_ROUTING_ENABLED = 'false';
    expect((await GET(req(), ctx('13'))).status).toBe(404);
    process.env.GAP_ROUTING_ENABLED = '1';
    session.value = null;
    expect((await GET(req(), ctx('13'))).status).toBe(401);
    expect(mocks.loadSuppressionReview).not.toHaveBeenCalled();
    session.value = { user: { email: 'casey@yardflow.ai' } };
    expect((await GET(req(), ctx('abc'))).status).toBe(404);
    mocks.loadSuppressionReview.mockResolvedValueOnce(null);
    expect((await GET(req(), ctx('999'))).status).toBe(404);
    mocks.loadSuppressionReview.mockResolvedValueOnce(review);
    const res = await GET(req(), ctx('13'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(review);
    expect(mocks.loadSuppressionReview.mock.calls[1][0]).toEqual({ tag: 'the-prisma' });
    expect(mocks.loadSuppressionReview.mock.calls[1][1]).toBe(13);
    expect(mocks.clearLegacyLocalFlag).not.toHaveBeenCalled();
  });
});

describe('POST /api/gap/personas/[id]/suppression-review', () => {
  it('401 without a session; 400 a bad body; the session email is the actor and the body is handed through', async () => {
    session.value = null;
    expect((await POST(req({ confirmed: true, expectedEmail: 'isaac.scott@pepsico.com' }), ctx('13'))).status).toBe(401);
    session.value = { user: { email: 'casey@yardflow.ai' } };
    expect((await POST(req({}), ctx('13'))).status).toBe(400);
    expect((await POST(req({ confirmed: true }), ctx('13'))).status).toBe(400);
    expect((await POST(req({ confirmed: 'yes', expectedEmail: 'isaac.scott@pepsico.com' }), ctx('13'))).status).toBe(400);
    expect(mocks.clearLegacyLocalFlag).not.toHaveBeenCalled();
    mocks.clearLegacyLocalFlag.mockResolvedValueOnce({ ok: true, auditId: 'aud_1', before: { do_not_contact: true, email_status: 'bounced' }, after: { do_not_contact: false, email_status: 'unverified' }, review });
    const res = await POST(req({ confirmed: true, expectedEmail: 'Isaac.Scott@pepsico.com' }), ctx('13'));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, auditId: 'aud_1', after: { do_not_contact: false, email_status: 'unverified' } });
    expect(mocks.clearLegacyLocalFlag.mock.calls[0][0]).toEqual({ tag: 'the-prisma' });
    expect(mocks.clearLegacyLocalFlag.mock.calls[0][1]).toMatchObject({ personaId: 13, actor: 'casey@yardflow.ai', confirmed: true, expectedEmail: 'Isaac.Scott@pepsico.com' });
    expect(mocks.clearLegacyLocalFlag.mock.calls[0][1].now).toBeInstanceOf(Date);
  });
  it('a confirmed false body is handed through and comes back as the 409 not_confirmed refusal, never a silent 200', async () => {
    mocks.clearLegacyLocalFlag.mockResolvedValueOnce({ ok: false, reason: 'not_confirmed', detail: 'not confirmed', review });
    const res = await POST(req({ confirmed: false, expectedEmail: 'isaac.scott@pepsico.com' }), ctx('13'));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ ok: false, reason: 'not_confirmed' });
    expect(mocks.clearLegacyLocalFlag.mock.calls[0][1]).toMatchObject({ confirmed: false });
  });
  it('409 with the refusal (reason, detail, review) on hard_suppression, authority_unreadable, not_legacy_conflict, email_mismatch and row_changed; 404 persona_not_found', async () => {
    for (const reason of ['hard_suppression', 'authority_unreadable', 'not_legacy_conflict', 'email_mismatch', 'row_changed']) {
      mocks.clearLegacyLocalFlag.mockResolvedValueOnce({ ok: false, reason, detail: `why ${reason}`, review: { ...review, class: 'CONFIRMED_SUPPRESSION' } });
      const res = await POST(req({ confirmed: true, expectedEmail: 'isaac.scott@pepsico.com' }), ctx('13'));
      expect(res.status, reason).toBe(409);
      expect(await res.json(), reason).toMatchObject({ ok: false, reason, detail: `why ${reason}`, review: { class: 'CONFIRMED_SUPPRESSION' } });
    }
    mocks.clearLegacyLocalFlag.mockResolvedValueOnce({ ok: false, reason: 'persona_not_found', detail: 'no persona 999', review: null });
    expect((await POST(req({ confirmed: true, expectedEmail: 'x@y.com' }), ctx('999'))).status).toBe(404);
    expect((await POST(req({ confirmed: true, expectedEmail: 'x@y.com' }), ctx('nope'))).status).toBe(404);
  });
});
