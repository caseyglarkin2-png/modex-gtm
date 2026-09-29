/**
 * /api/gap/candidates: every write is Casey's click (a session), an ADD refused
 * by the creation check is a 409 with the matches and re-plans nothing, and an
 * unknown op is a 400 before anything runs.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { session, svc } = vi.hoisted(() => ({
  session: { value: null as null | { user: { email: string } } },
  svc: { accountCreationCheck: vi.fn(), createGapAccount: vi.fn(), decideCandidate: vi.fn(), loadCandidateQueue: vi.fn(), mapCandidateToAccount: vi.fn(), replanSourcesFor: vi.fn(), scoutCandidate: vi.fn() },
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/gap/flags', () => ({ assertGapEnabled: () => null }));
vi.mock('@/lib/gap/entity/candidates', () => svc);

import { GET, POST } from '@/app/api/gap/candidates/route';

const req = (body: unknown) => new NextRequest('https://x/api/gap/candidates', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });

beforeEach(() => {
  for (const f of Object.values(svc)) f.mockReset();
  session.value = { user: { email: 'casey@freightroll.com' } };
});

describe('/api/gap/candidates', () => {
  it('401 without a session, for reads and writes', async () => {
    session.value = null;
    expect((await GET(new NextRequest('https://x/api/gap/candidates'))).status).toBe(401);
    expect((await POST(req({ op: 'ignore', company: 'Acme' }))).status).toBe(401);
    expect(svc.decideCandidate).not.toHaveBeenCalled();
  });

  it('an add refused as a possible duplicate is 409 with the matches, and nothing is re-planned', async () => {
    svc.createGapAccount.mockResolvedValue({ ok: false, reason: 'possible_duplicate', matches: ['Costa Farms, LLC'] });
    const r = await POST(req({ op: 'add', company: 'Costa Farms', name: 'Costa Farms', vertical: 'agriculture', reason: 'Inland26' }));
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({ error: 'possible_duplicate', matches: ['Costa Farms, LLC'] });
    expect(svc.replanSourcesFor).not.toHaveBeenCalled();
    expect(svc.createGapAccount.mock.calls[0][1]).toMatchObject({ actor: 'casey@freightroll.com' });
  });

  it('an add without a reason never reaches the contract', async () => {
    expect((await POST(req({ op: 'add', company: 'X', name: 'X', vertical: 'cpg', reason: '' }))).status).toBe(400);
    expect(svc.createGapAccount).not.toHaveBeenCalled();
  });

  it('a successful map re-plans the sources that met the company', async () => {
    svc.mapCandidateToAccount.mockResolvedValue({ ok: true, alias: 'CREATED' });
    svc.replanSourcesFor.mockResolvedValue({ sources: 1, reresolved: 2 });
    const r = await POST(req({ op: 'map', company: 'Harbor Foods Group', accountName: 'Harbor Foods' }));
    expect(await r.json()).toMatchObject({ ok: true, replan: { sources: 1, reresolved: 2 } });
  });

  it('an unknown op is 400', async () => {
    expect((await POST(req({ op: 'create_everything' }))).status).toBe(400);
  });
});
