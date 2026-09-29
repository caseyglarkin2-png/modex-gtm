/** "Reviewed, keep it": one audit row on an approved or active thesis; a draft is refused; the thesis is never touched. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { session, db } = vi.hoisted(() => ({
  session: { value: null as null | { user: { email: string } } },
  db: { findUnique: vi.fn(), audit: vi.fn(), update: vi.fn() },
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/gap/flags', () => ({ assertGapEnabled: () => null }));
vi.mock('@/lib/prisma', () => ({ prisma: { prospectingHypothesis: { findUnique: db.findUnique, update: db.update }, gapAuditEvent: { create: db.audit } } }));

import { POST } from '@/app/api/gap/accounts/thesis-reviewed/route';

const req = (body: unknown) => new NextRequest('https://x/api/gap/accounts/thesis-reviewed', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });

beforeEach(() => {
  for (const f of Object.values(db)) f.mockReset();
  session.value = { user: { email: 'casey@freightroll.com' } };
});

describe('POST /api/gap/accounts/thesis-reviewed', () => {
  it('records one audit row for an approved thesis and never updates the thesis', async () => {
    db.findUnique.mockResolvedValue({ id: 'h1', status: 'approved', account_name: 'Acme Foods' });
    expect((await POST(req({ hypothesisId: 'h1' }))).status).toBe(200);
    expect(db.audit.mock.calls[0][0].data).toMatchObject({ kind: 'thesis.review_ack', actor: 'casey@freightroll.com', subject_type: 'hypothesis', subject_id: 'h1' });
    expect(db.update).not.toHaveBeenCalled();
  });
  it('refuses a draft (only what Casey approved can be marked reviewed)', async () => {
    db.findUnique.mockResolvedValue({ id: 'h1', status: 'draft', account_name: 'Acme Foods' });
    expect((await POST(req({ hypothesisId: 'h1' }))).status).toBe(409);
    expect(db.audit).not.toHaveBeenCalled();
  });
  it('401 without a session', async () => {
    session.value = null;
    expect((await POST(req({ hypothesisId: 'h1' }))).status).toBe(401);
  });
});
