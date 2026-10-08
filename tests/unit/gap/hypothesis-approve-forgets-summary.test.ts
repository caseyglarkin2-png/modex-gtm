/**
 * X12 demo finding (GAP OS sales execution engine, 2026-10-08): "Approve and use this story" left the account's remembered
 * Work summary in place, so Work and the morning briefing kept offering the pre-approval move ("Put the story in use",
 * no pack) until someone opened the account page. The approve route must forget the remembered summary after a
 * transition that succeeded (advance, activate, reject), the way the outcome, send and answer routes do, so the next
 * Work read and the next briefing rebuild the card from the live state. Pinned: forgotten on a successful advance and
 * on a successful action; never on a refusal; the account name is the hypothesis's own; the forget comes after routing.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const h = vi.hoisted(() => ({
  auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })),
  advance: vi.fn(),
  transition: vi.fn(),
  forget: vi.fn<(prisma: unknown, account: string) => Promise<void>>(async () => undefined),
  routeAfterUse: vi.fn(async () => ({ ok: true, runId: 'r', people: [], counts: {}, failures: [] })),
  findUnique: vi.fn(async () => ({ status: 'approved', account_name: 'Fedex Scratch Co r63', primary_persona_id: 3, primary_persona: { name: 'Glen Scratch' } })),
}));

vi.mock('@/lib/auth', () => ({ auth: h.auth }));
vi.mock('@/lib/prisma', () => ({ prisma: { __tag: 'fake', prospectingHypothesis: { findUnique: h.findUnique } } }));
vi.mock('@/lib/gap/hypothesis/thesis-groups', () => ({ advanceHypothesis: h.advance }));
vi.mock('@/lib/gap/hypothesis/service', () => ({ proposeHypothesis: vi.fn(), transitionHypothesis: h.transition, updateDraftNarrative: vi.fn(), listHypotheses: vi.fn(), getHypothesis: vi.fn() }));
vi.mock('@/lib/gap/routing/interactive', () => ({ routeAfterUse: h.routeAfterUse }));
vi.mock('@/lib/gap/pursuit/summary', () => ({ forgetPursuitSummary: h.forget }));

const { PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');
const patch = (body: unknown) => PATCH(new NextRequest('http://localhost/api/gap/hypotheses/hyp-1', { method: 'PATCH', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }), { params: Promise.resolve({ id: 'hyp-1' }) });

describe('approving a story forgets the remembered Work summary', () => {
  beforeEach(() => {
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_HYPOTHESIS_ENABLED = 'true';
    h.advance.mockReset();
    h.transition.mockReset();
    h.forget.mockClear();
  });

  it('approve_and_use that succeeds forgets the account summary (after the routing that puts the story in use)', async () => {
    h.advance.mockResolvedValue({ ok: true, from: 'approved', to: 'active', hypothesisId: 'hyp-1', detail: 'now in use' });
    const res = await patch({ advance: 'approve_and_use' });
    expect(res.status).toBe(200);
    expect(h.forget).toHaveBeenCalledTimes(1);
    expect(h.forget.mock.calls[0][1]).toBe('Fedex Scratch Co r63');
    expect(h.routeAfterUse.mock.invocationCallOrder[0]).toBeLessThan(h.forget.mock.invocationCallOrder[0]);
  });

  it('a refused advance forgets nothing', async () => {
    h.advance.mockResolvedValue({ ok: false, reason: 'stale_status', from: 'rejected' });
    const res = await patch({ advance: 'approve' });
    expect(res.status).toBe(409);
    expect(h.forget).not.toHaveBeenCalled();
  });

  it('an action that succeeds (activate, reject) forgets the account summary; a refused one does not', async () => {
    h.transition.mockResolvedValue({ ok: true, from: 'approved', to: 'active', effects: [] });
    expect((await patch({ action: 'activate' })).status).toBe(200);
    expect(h.forget).toHaveBeenCalledTimes(1);
    expect(h.forget.mock.calls[0][1]).toBe('Fedex Scratch Co r63');
    h.transition.mockResolvedValue({ ok: false, reason: 'invalid_transition' });
    expect((await patch({ action: 'reject_review', reason: 'no' })).status).toBe(409);
    expect(h.forget).toHaveBeenCalledTimes(1);
  });
});
