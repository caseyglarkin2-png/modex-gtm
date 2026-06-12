import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the HubSpot layer so importing actions.ts never touches the network
// (same module set discovery-actions.test.ts mocks).
vi.mock('@/lib/hubspot/client', () => ({
  isHubSpotConfigured: () => true,
  getPortalId: () => '999',
  withHubSpotRetry: (fn: () => Promise<unknown>) => fn(),
  getHubSpotClient: () => ({ crm: { companies: { basicApi: {} } } }),
}));
vi.mock('@/lib/hubspot/companies', () => ({
  searchCompanyByDomain: vi.fn(),
  searchCompanyByName: vi.fn(),
}));
vi.mock('@/lib/hubspot/properties', () => ({
  ensureYardflowIcpScoreProperty: vi.fn(),
}));

// vi.mock factories are hoisted; the shared spies must be hoisted with them.
const { authMock, findFirst, create, update, upsertContactFromQueueItem } = vi.hoisted(() => ({
  // Session: authenticated by default; individual tests override.
  authMock: vi.fn(async (): Promise<unknown> => ({ user: { email: 'casey@freightroll.com' } })),
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  upsertContactFromQueueItem: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ auth: () => authMock() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    discoveryContact: { findFirst, create, update },
    persona: { findMany: vi.fn(async () => []) },
  },
}));
vi.mock('@/lib/queue/contact-upsert', () => ({
  upsertContactFromQueueItem: (...args: unknown[]) => upsertContactFromQueueItem(...args),
}));

import { saveProspectContact } from '@/app/discovery/actions';

const BASE = {
  prospectName: 'Acme Logistics',
  name: 'Jane Doe',
  title: 'VP Operations',
  source: 'research' as const,
};

beforeEach(() => {
  authMock.mockReset().mockResolvedValue({ user: { email: 'casey@freightroll.com' } });
  findFirst.mockReset().mockResolvedValue(null);
  create.mockReset().mockImplementation(async ({ data }) => ({ id: 7, hubspot_id: data.hubspot_id ?? null }));
  update.mockReset().mockImplementation(async ({ where, data }) => ({ id: where.id, hubspot_id: data.hubspot_id ?? null }));
  upsertContactFromQueueItem.mockReset().mockResolvedValue({
    ok: true,
    personaCreated: true,
    personaOk: true,
    hubspotId: undefined,
  });
});

describe('saveProspectContact — auth and validation', () => {
  it('refuses unauthenticated callers without touching the database', async () => {
    authMock.mockResolvedValue(null);
    const res = await saveProspectContact({ ...BASE, email: 'jane@acme.com' });
    expect(res).toEqual({ ok: false, reason: 'unauthenticated' });
    expect(findFirst).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(upsertContactFromQueueItem).not.toHaveBeenCalled();
  });

  it('rejects missing prospect/name and bad sources as invalid', async () => {
    expect(await saveProspectContact({ ...BASE, prospectName: '  ' })).toEqual({ ok: false, reason: 'invalid' });
    expect(await saveProspectContact({ ...BASE, name: '' })).toEqual({ ok: false, reason: 'invalid' });
    expect(
      await saveProspectContact({ ...BASE, source: 'hubspot' as unknown as 'added' }),
    ).toEqual({ ok: false, reason: 'invalid' });
    expect(create).not.toHaveBeenCalled();
  });
});

describe('saveProspectContact — dedup and upsert', () => {
  it('creates a new row with the email lowercased, and runs the guarded contact upsert', async () => {
    const res = await saveProspectContact({ ...BASE, email: 'Jane.Doe@Acme.com', confidence: 'high' });
    expect(res.ok).toBe(true);

    // Dedup lookup is by (prospect, lowercased email).
    expect(findFirst.mock.calls[0][0].where).toEqual({
      prospect_name: 'Acme Logistics',
      email: 'jane.doe@acme.com',
    });
    expect(create).toHaveBeenCalledTimes(1);
    const data = create.mock.calls[0][0].data;
    expect(data.email).toBe('jane.doe@acme.com');
    expect(data.source).toBe('research');
    expect(data.confidence).toBe('high');

    expect(upsertContactFromQueueItem).toHaveBeenCalledWith({
      toEmail: 'jane.doe@acme.com',
      personaName: 'Jane Doe',
      personaTitle: 'VP Operations',
      accountName: 'Acme Logistics',
      contactConfidence: 'high',
    });
  });

  it('updates the existing row when (prospect, email) already exists (dedup-by-email)', async () => {
    findFirst.mockResolvedValueOnce({ id: 5 });
    const res = await saveProspectContact({ ...BASE, email: 'jane@acme.com' });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.id).toBe(5);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0].where).toEqual({ id: 5 });
    expect(create).not.toHaveBeenCalled();
  });

  it('dedups by (prospect, name) when no email is present and skips the CRM upsert', async () => {
    findFirst.mockResolvedValueOnce({ id: 5 });
    const res = await saveProspectContact({ ...BASE, source: 'added' });
    expect(res.ok).toBe(true);
    expect(findFirst.mock.calls[0][0].where).toEqual({
      prospect_name: 'Acme Logistics',
      name: 'Jane Doe',
    });
    expect(update).toHaveBeenCalledTimes(1);
    expect(upsertContactFromQueueItem).not.toHaveBeenCalled();
    // A sparse re-save never nulls out a stored email.
    expect(update.mock.calls[0][0].data).not.toHaveProperty('email');
  });

  it('stores the hubspotId returned by the contact upsert and returns the portal URL', async () => {
    upsertContactFromQueueItem.mockResolvedValue({
      ok: true,
      personaCreated: false,
      personaOk: true,
      hubspotId: 'hs-42',
    });
    const res = await saveProspectContact({ ...BASE, email: 'jane@acme.com' });
    expect(res.ok).toBe(true);
    expect(create.mock.calls[0][0].data.hubspot_id).toBe('hs-42');
    if (res.ok) {
      expect(res.hubspotId).toBe('hs-42');
      expect(res.hubspotUrl).toBe('https://app.hubspot.com/contacts/999/contact/hs-42');
    }
  });

  it('still saves the local row when the contact upsert is blocked (ok: false, no hubspotId)', async () => {
    upsertContactFromQueueItem.mockResolvedValue({
      ok: false,
      personaCreated: false,
      personaOk: false,
      hubspotId: undefined,
    });
    const res = await saveProspectContact({ ...BASE, email: 'jane@blocked.com' });
    expect(res.ok).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data).not.toHaveProperty('hubspot_id');
    if (res.ok) expect(res.hubspotId).toBeUndefined();
  });

  it('still saves the local row when the contact upsert throws', async () => {
    upsertContactFromQueueItem.mockRejectedValue(new Error('hubspot down'));
    const res = await saveProspectContact({ ...BASE, email: 'jane@acme.com' });
    expect(res.ok).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('upgrades an earlier email-less row when a save with an email matches by name', async () => {
    // Email lookup misses, name fallback hits the email-less row.
    findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 9 });
    const res = await saveProspectContact({ ...BASE, email: 'Jane@Acme.com' });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.id).toBe(9);
    expect(findFirst).toHaveBeenCalledTimes(2);
    expect(findFirst.mock.calls[1][0].where).toEqual({
      prospect_name: 'Acme Logistics',
      name: 'Jane Doe',
    });
    expect(create).not.toHaveBeenCalled();
    expect(update.mock.calls[0][0].where).toEqual({ id: 9 });
    expect(update.mock.calls[0][0].data.email).toBe('jane@acme.com');
  });

  it('treats a P2002 race on create as success by adopting the concurrent winner row', async () => {
    create.mockRejectedValue(Object.assign(new Error('unique constraint'), { code: 'P2002' }));
    // Lookups: email miss, name miss, then the post-conflict re-read finds the winner.
    findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 11, hubspot_id: 'hs-7' });
    const res = await saveProspectContact({ ...BASE, email: 'jane@acme.com' });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.id).toBe(11);
      expect(res.hubspotId).toBe('hs-7');
    }
    expect(update).not.toHaveBeenCalled();
  });

  it('returns a tagged failure instead of throwing when the database write fails', async () => {
    create.mockRejectedValue(new Error('db down'));
    const res = await saveProspectContact({ ...BASE, email: 'jane@acme.com' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain('db down');
  });
});
