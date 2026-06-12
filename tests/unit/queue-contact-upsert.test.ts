import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  persona: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));
const upsertContactMock = vi.hoisted(() => vi.fn());
const searchContactByEmailMock = vi.hoisted(() => vi.fn());
const updateContactPropertiesMock = vi.hoisted(() => vi.fn());
const isConfiguredMock = vi.hoisted(() => vi.fn(() => true));
const flags = vi.hoisted(() => ({ HUBSPOT_SYNC_ENABLED: true }));

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/hubspot/contacts', () => ({
  upsertContact: upsertContactMock,
  searchContactByEmail: searchContactByEmailMock,
  updateContactProperties: updateContactPropertiesMock,
}));
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

/** An existing HubSpot contact with every clawd-sourced property curated. */
function curatedHubSpotContact(overrides: Record<string, string | boolean> = {}) {
  return {
    id: 'hs-existing-42',
    email: 'jane.doe@acme.com',
    firstname: 'Jane',
    lastname: 'Doe',
    company: 'Acme Corporation (curated)',
    jobtitle: 'Chief Operating Officer',
    phone: '',
    hs_lead_status: '',
    lifecyclestage: '',
    hs_email_optout: false,
    ...overrides,
  };
}

describe('upsertContactFromQueueItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flags.HUBSPOT_SYNC_ENABLED = true;
    isConfiguredMock.mockReturnValue(true);
    prismaMock.persona.findFirst.mockResolvedValue(null);
    prismaMock.persona.create.mockResolvedValue({ id: 7 });
    prismaMock.persona.update.mockResolvedValue({ id: 7 });
    searchContactByEmailMock.mockResolvedValue(null);
    upsertContactMock.mockResolvedValue('hs-501');
    updateContactPropertiesMock.mockResolvedValue(undefined);
  });

  it('creates a persona when none exists and persists the HubSpot id', async () => {
    const result = await upsertContactFromQueueItem(baseItem);

    expect(result).toEqual({ ok: true, personaCreated: true, personaOk: true, hubspotId: 'hs-501' });
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
    expect(searchContactByEmailMock).toHaveBeenCalledWith('jane.doe@acme.com');
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

    expect(result).toEqual({ ok: true, personaCreated: false, personaOk: true, hubspotId: 'hs-501' });
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

    expect(result).toEqual({ ok: true, personaCreated: true, personaOk: true, hubspotId: undefined });
    expect(searchContactByEmailMock).not.toHaveBeenCalled();
    expect(upsertContactMock).not.toHaveBeenCalled();
  });

  it('skips HubSpot when HubSpot is not configured', async () => {
    isConfiguredMock.mockReturnValue(false);

    const result = await upsertContactFromQueueItem(baseItem);

    expect(result).toEqual({ ok: true, personaCreated: true, personaOk: true, hubspotId: undefined });
    expect(upsertContactMock).not.toHaveBeenCalled();
  });

  it('returns persona success and never throws when HubSpot fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    upsertContactMock.mockRejectedValue(new Error('hubspot down'));

    const result = await upsertContactFromQueueItem(baseItem);

    expect(result).toEqual({ ok: true, personaCreated: true, personaOk: true, hubspotId: undefined });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('hubspot upsert failed'),
      expect.any(Error),
    );
    warn.mockRestore();
  });

  it('still attempts HubSpot when the persona write fails (Prisma error fail-soft)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    prismaMock.persona.findFirst.mockRejectedValue(new Error('db down'));

    const result = await upsertContactFromQueueItem(baseItem);

    expect(result).toEqual({ ok: true, personaCreated: false, personaOk: false, hubspotId: 'hs-501' });
    expect(upsertContactMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'jane.doe@acme.com', company: 'Acme' }),
    );
    // no persona row to backfill, so the id is not persisted locally
    expect(prismaMock.persona.update).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('persona upsert failed'),
      expect.any(Error),
    );
    warn.mockRestore();
  });

  it('no Account row -> persona skipped, HubSpot contact still created', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Persona.account_name is a required FK to Account.name; net-new
    // discovery facilities have no Account row, so the create fails.
    prismaMock.persona.create.mockRejectedValue(
      new Error('Foreign key constraint violated: `account_name`'),
    );

    const result = await upsertContactFromQueueItem({
      ...baseItem,
      accountName: 'Nestle Distribution Center (Truck Entrance)',
    });

    expect(result).toEqual({ ok: true, personaCreated: false, personaOk: false, hubspotId: 'hs-501' });
    expect(upsertContactMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'jane.doe@acme.com',
        company: 'Nestle Distribution Center (Truck Entrance)',
      }),
    );
    expect(prismaMock.persona.update).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[queue/contact-upsert]'),
      expect.any(Error),
    );
    warn.mockRestore();
  });

  it('returns ok: false only when both the persona write and HubSpot fail', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    prismaMock.persona.findFirst.mockRejectedValue(new Error('db down'));
    upsertContactMock.mockRejectedValue(new Error('hubspot down'));

    const result = await upsertContactFromQueueItem(baseItem);

    expect(result).toEqual({ ok: false, personaCreated: false, personaOk: false, hubspotId: undefined });
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('splits names like every other intake path: first token + last token', async () => {
    await upsertContactFromQueueItem({ ...baseItem, personaName: 'Jane van Doe' });

    expect(upsertContactMock).toHaveBeenCalledWith(
      expect.objectContaining({ firstname: 'Jane', lastname: 'Doe', company: 'Acme' }),
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

  it('still returns ok with the hubspotId when only the local backfill fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // persona create succeeds (id 7); the only persona.update call is the
    // hubspot_contact_id backfill, which rejects.
    prismaMock.persona.update.mockRejectedValue(new Error('db went away'));

    const result = await upsertContactFromQueueItem(baseItem);

    expect(result).toEqual({ ok: true, personaCreated: true, personaOk: true, hubspotId: 'hs-501' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('hubspot_contact_id backfill failed'),
      expect.any(Error),
    );
    warn.mockRestore();
  });

  it('flag off + persona failure -> counted in neither (personaOk false, no hubspotId)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    flags.HUBSPOT_SYNC_ENABLED = false;
    prismaMock.persona.findFirst.mockRejectedValue(new Error('db down'));

    const result = await upsertContactFromQueueItem(baseItem);

    expect(result).toEqual({ ok: false, personaCreated: false, personaOk: false, hubspotId: undefined });
    expect(searchContactByEmailMock).not.toHaveBeenCalled();
    expect(upsertContactMock).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('never overwrites curated properties on an existing HubSpot contact', async () => {
    searchContactByEmailMock.mockResolvedValue(curatedHubSpotContact());

    const result = await upsertContactFromQueueItem(baseItem);

    // every clawd-sourced property is already curated -> no API update at all
    expect(updateContactPropertiesMock).not.toHaveBeenCalled();
    expect(upsertContactMock).not.toHaveBeenCalled();
    expect(result.hubspotId).toBe('hs-existing-42');
    expect(result.ok).toBe(true);
  });

  it('fills only the empty properties on an existing HubSpot contact', async () => {
    searchContactByEmailMock.mockResolvedValue(
      curatedHubSpotContact({ lastname: '', jobtitle: '' }),
    );

    const result = await upsertContactFromQueueItem(baseItem);

    expect(updateContactPropertiesMock).toHaveBeenCalledTimes(1);
    expect(updateContactPropertiesMock).toHaveBeenCalledWith('hs-existing-42', {
      lastname: 'Doe',
      jobtitle: 'VP Operations',
    });
    // curated company/firstname were NOT in the patch, and no full upsert ran
    expect(upsertContactMock).not.toHaveBeenCalled();
    expect(result.hubspotId).toBe('hs-existing-42');
  });

  it('low confidence -> never creates a new HubSpot contact, persona still attempted', async () => {
    const result = await upsertContactFromQueueItem({ ...baseItem, contactConfidence: 'low' });

    expect(searchContactByEmailMock).toHaveBeenCalledWith('jane.doe@acme.com');
    expect(upsertContactMock).not.toHaveBeenCalled();
    expect(updateContactPropertiesMock).not.toHaveBeenCalled();
    expect(prismaMock.persona.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true, personaCreated: true, personaOk: true, hubspotId: undefined });
  });

  it('low confidence still fill-updates an existing HubSpot contact (the email evidently exists)', async () => {
    searchContactByEmailMock.mockResolvedValue(curatedHubSpotContact({ jobtitle: '' }));

    const result = await upsertContactFromQueueItem({ ...baseItem, contactConfidence: 'low' });

    expect(updateContactPropertiesMock).toHaveBeenCalledWith('hs-existing-42', {
      jobtitle: 'VP Operations',
    });
    expect(upsertContactMock).not.toHaveBeenCalled();
    expect(result.hubspotId).toBe('hs-existing-42');
  });

  it('blocked recipient domain -> neither persona nor HubSpot is written', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await upsertContactFromQueueItem({
      ...baseItem,
      toEmail: 'someone@freightroll.com',
    });

    expect(result).toEqual({ ok: false, personaCreated: false, personaOk: false });
    expect(prismaMock.persona.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.persona.create).not.toHaveBeenCalled();
    expect(searchContactByEmailMock).not.toHaveBeenCalled();
    expect(upsertContactMock).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('blocked recipient domain'));
    warn.mockRestore();
  });
});
