/** Review SF3: the human Apollo action names the signed-in session as its actor, and with no session it runs nothing. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => vi.fn());
const enrich = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('@/lib/enrichment/apollo-enrichment', () => ({ enrichPersonaFromHubSpotContact: enrich }));
vi.mock('@/lib/hubspot/contacts', () => ({ getContactById: vi.fn().mockResolvedValue({ id: 'hs-1', email: 'd@acme.com' }), hsSearchContacts: vi.fn(), listRecentContacts: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { systemConfig: { findUnique: vi.fn().mockResolvedValue(null) } } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
import { enrichHubSpotContactsBulk } from '@/app/contacts/actions';

describe('enrichHubSpotContactsBulk actor', () => {
  beforeEach(() => { authMock.mockReset(); enrich.mockReset(); });
  it('no session: nothing is enriched', async () => {
    authMock.mockResolvedValue(null);
    const r = await enrichHubSpotContactsBulk(['hs-1']);
    expect(enrich).not.toHaveBeenCalled();
    expect(r.errors).toBe(1);
  });
  it('the actor is the session, and an already-enriched person is counted, not re-spent', async () => {
    authMock.mockResolvedValue({ user: { email: 'casey@freightroll.com' } });
    enrich.mockResolvedValue({ status: 'already_enriched', personaId: 5, at: null });
    const r = await enrichHubSpotContactsBulk(['hs-1']);
    expect(enrich.mock.calls[0][1]).toEqual({ kind: 'human', actor: 'casey@freightroll.com (contacts: enrich selected)' });
    expect(r).toMatchObject({ alreadyEnriched: 1, errors: 0 });
  });
});
