import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  persona: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));
const upsertContactMock = vi.hoisted(() => vi.fn());
const isConfiguredMock = vi.hoisted(() => vi.fn(() => true));
const flags = vi.hoisted(() => ({ HUBSPOT_SYNC_ENABLED: true }));

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/hubspot/contacts', () => ({ upsertContact: upsertContactMock }));
vi.mock('@/lib/hubspot/client', () => ({ isHubSpotConfigured: isConfiguredMock }));
vi.mock('@/lib/feature-flags', () => ({
  get HUBSPOT_SYNC_ENABLED() {
    return flags.HUBSPOT_SYNC_ENABLED;
  },
}));

const { upsertContactFromQueueItem } = await import('@/lib/queue/contact-upsert');

const baseItem = {
  toEmail: 'Jane.Doe@Acme.com',
  personaName: 'Jane Doe',
  personaTitle: 'VP Operations',
  accountName: 'Acme',
};

describe('upsertContactFromQueueItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flags.HUBSPOT_SYNC_ENABLED = true;
    isConfiguredMock.mockReturnValue(true);
    prismaMock.persona.findFirst.mockResolvedValue(null);
    prismaMock.persona.create.mockResolvedValue({ id: 7 });
    prismaMock.persona.update.mockResolvedValue({ id: 7 });
    upsertContactMock.mockResolvedValue('hs-501');
  });

  it('creates a persona when none exists and persists the HubSpot id', async () => {
    const result = await upsertContactFromQueueItem(baseItem);

    expect(result).toEqual({ ok: true, personaCreated: true, hubspotId: 'hs-501' });
    expect(prismaMock.persona.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'jane.doe@acme.com' } }),
    );
    expect(prismaMock.persona.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          account_name: 'Acme',
          name: 'Jane Doe',
          title: 'VP Operations',
          email: 'jane.doe@acme.com',
          source_type: 'clawd',
        }),
      }),
    );
    expect(prismaMock.persona.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { hubspot_contact_id: 'hs-501' },
    });
  });

  it('only backfills a missing title on an existing persona', async () => {
    prismaMock.persona.findFirst.mockResolvedValue({
      id: 3,
      title: null,
      hubspot_contact_id: 'hs-existing',
    });

    const result = await upsertContactFromQueueItem(baseItem);

    expect(result).toEqual({ ok: true, personaCreated: false, hubspotId: 'hs-501' });
    expect(prismaMock.persona.create).not.toHaveBeenCalled();
    expect(prismaMock.persona.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.persona.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { title: 'VP Operations' },
    });
  });

  it('leaves an existing persona with a title untouched', async () => {
    prismaMock.persona.findFirst.mockResolvedValue({
      id: 3,
      title: 'COO',
      hubspot_contact_id: 'hs-existing',
    });

    const result = await upsertContactFromQueueItem(baseItem);

    expect(result.ok).toBe(true);
    expect(result.personaCreated).toBe(false);
    expect(prismaMock.persona.create).not.toHaveBeenCalled();
    expect(prismaMock.persona.update).not.toHaveBeenCalled();
  });

  it('skips HubSpot when the sync flag is off', async () => {
    flags.HUBSPOT_SYNC_ENABLED = false;

    const result = await upsertContactFromQueueItem(baseItem);

    expect(result).toEqual({ ok: true, personaCreated: true, hubspotId: undefined });
    expect(upsertContactMock).not.toHaveBeenCalled();
  });

  it('skips HubSpot when HubSpot is not configured', async () => {
    isConfiguredMock.mockReturnValue(false);

    const result = await upsertContactFromQueueItem(baseItem);

    expect(result).toEqual({ ok: true, personaCreated: true, hubspotId: undefined });
    expect(upsertContactMock).not.toHaveBeenCalled();
  });

  it('returns persona success and never throws when HubSpot fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    upsertContactMock.mockRejectedValue(new Error('hubspot down'));

    const result = await upsertContactFromQueueItem(baseItem);

    expect(result).toEqual({ ok: true, personaCreated: true, hubspotId: undefined });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[queue/contact-upsert]'),
      expect.any(Error),
    );
    warn.mockRestore();
  });

  it('fails soft and never throws when the persona write fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    prismaMock.persona.findFirst.mockRejectedValue(new Error('db down'));

    const result = await upsertContactFromQueueItem(baseItem);

    expect(result).toEqual({ ok: false, personaCreated: false });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[queue/contact-upsert]'),
      expect.any(Error),
    );
    warn.mockRestore();
  });

  it('splits a two-token name into firstname and lastname', async () => {
    await upsertContactFromQueueItem({ ...baseItem, personaName: 'Jane van Doe' });

    expect(upsertContactMock).toHaveBeenCalledWith(
      expect.objectContaining({ firstname: 'Jane van', lastname: 'Doe', company: 'Acme' }),
    );
  });

  it('treats a single-token name as firstname only', async () => {
    await upsertContactFromQueueItem({ ...baseItem, personaName: 'Cher' });

    const call = upsertContactMock.mock.calls[0][0];
    expect(call.firstname).toBe('Cher');
    expect(call).not.toHaveProperty('lastname');
  });

  it('sends no name fields when personaName is empty', async () => {
    await upsertContactFromQueueItem({ ...baseItem, personaName: null });

    const call = upsertContactMock.mock.calls[0][0];
    expect(call).not.toHaveProperty('firstname');
    expect(call).not.toHaveProperty('lastname');
    expect(call.email).toBe('jane.doe@acme.com');
  });
});
