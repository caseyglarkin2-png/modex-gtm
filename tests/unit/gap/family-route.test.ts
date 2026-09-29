/** POST /api/gap/accounts/separate-motion: audited, reasoned, scoped to the real family; never a blanket bypass. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { session, fam } = vi.hoisted(() => ({ session: { value: null as null | { user: { email: string } } }, fam: { loadCorporateFamily: vi.fn(), recordSeparateMotion: vi.fn(), hubspotFamily: vi.fn(), loadRelatedActivity: vi.fn() } }));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/gap/flags', () => ({ assertGapEnabled: () => null }));
vi.mock('@/lib/gap/family/family', () => fam);
import { POST } from '@/app/api/gap/accounts/separate-motion/route';

const req = (body: unknown) => new NextRequest('https://x/api/gap/accounts/separate-motion', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
beforeEach(() => {
  for (const f of Object.values(fam)) f.mockReset();
  session.value = { user: { email: 'casey@freightroll.com' } };
  fam.loadCorporateFamily.mockResolvedValue({ accountName: 'Frito-Lay', parentName: 'PepsiCo', members: [{ accountName: 'PepsiCo', relation: 'parent', source: 'parent_brand' }] });
  fam.loadRelatedActivity.mockResolvedValue([{ accountName: 'PepsiCo', relation: 'parent', activity: ['a first touch in motion (x)'], unknown: false }]);
});

describe('separate buying motion route', () => {
  it('records with the session as the actor', async () => {
    fam.recordSeparateMotion.mockResolvedValue({ ok: true, expiresAt: '2026-12-28T00:00:00.000Z' });
    const r = await POST(req({ accountName: 'Frito-Lay', relatedAccounts: ['PepsiCo'], reason: 'Frito-Lay DC operations buy separately.', days: 90 }));
    expect(r.status).toBe(200);
    expect(fam.recordSeparateMotion.mock.calls[0][1]).toMatchObject({ actor: 'casey@freightroll.com', relatedAccounts: ['PepsiCo'], snapshot: { PepsiCo: ['a first touch in motion (x)'] } });
  });
  it('refuses a duplicate record of the same company, and an unreadable related account (nothing recorded)', async () => {
    fam.loadCorporateFamily.mockResolvedValueOnce({ accountName: 'Kenco Logistics Services', parentName: null, members: [{ accountName: 'Kenco', relation: 'same_company', source: 'parent_brand' }] });
    expect((await POST(req({ accountName: 'Kenco Logistics Services', relatedAccounts: ['Kenco'], reason: 'They buy separately, trust me.' }))).status).toBe(409);
    fam.loadRelatedActivity.mockResolvedValueOnce([{ accountName: 'PepsiCo', relation: 'parent', activity: [], unknown: true }]);
    expect((await POST(req({ accountName: 'Frito-Lay', relatedAccounts: ['PepsiCo'], reason: 'Frito-Lay DC operations buy separately.' }))).status).toBe(503);
    expect(fam.recordSeparateMotion).not.toHaveBeenCalled();
  });
  it('refuses an account outside the family, and a reason too short to mean anything', async () => {
    expect((await POST(req({ accountName: 'Frito-Lay', relatedAccounts: ['Kroger'], reason: 'Frito-Lay DC operations buy separately.' }))).status).toBe(409);
    expect((await POST(req({ accountName: 'Frito-Lay', relatedAccounts: ['PepsiCo'], reason: 'ok' }))).status).toBe(400);
    expect(fam.recordSeparateMotion).not.toHaveBeenCalled();
  });
  it('401 without a session', async () => {
    session.value = null;
    expect((await POST(req({ accountName: 'Frito-Lay', relatedAccounts: ['PepsiCo'], reason: 'Frito-Lay DC operations buy separately.' }))).status).toBe(401);
  });
});
