// @vitest-environment node
/**
 * GUI-03 (the Gmail action UI audit, 2026-10-10): the contact packet. Pinned: the stored row's address with its
 * status, the phone with its kind and source and update date, LinkedIn only above the confidence floor and only a
 * profile URL, the HubSpot record links in the /record/0-1, 0-2, 0-3 forms, the deals; a live HubSpot contact read
 * only through the injected reader (absent in tests), its mobile labelled mobile and its phone direct, cached;
 * nothing guessed: no number from a pattern, no identity from a namesake at another account, no main line from an
 * email domain; an unknown value is null (the renderer says unavailable).
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { LINKEDIN_CONFIDENCE_FLOOR, contactLiveCacheKey, contactPacketFor, findPersonaContact, hubspotRecordUrl, projectContactPacket, readHubSpotContactLive, type PersonaContactRow } from '@/lib/gap/people/contact-packet';

const NOW = new Date('2026-10-10T13:00:00Z');
const PHIL: PersonaContactRow = { id: 980, name: 'Savastano, Philip', title: 'Director of Supply Chain', email: 'Phil.Savastano@bostonbeer.com', email_status: 'verified', phone: '+1 617 555 0100', phone_status: 'verified', linkedin_url: 'https://www.linkedin.com/in/phil-savastano/', linkedin_confidence: 80, hubspot_contact_id: '980', account_name: 'The Boston Beer Company', updated_at: new Date('2026-10-01T12:00:00Z'), do_not_contact: false };

describe('GUI-03: projectContactPacket (pure)', () => {
  it('the stored row: address with status, the direct phone with its source and update date, LinkedIn, the HubSpot record links, the deals', () => {
    const p = projectContactPacket({ accountName: 'The Boston Beer Company', persona: PHIL, hubspotCompanyId: '55', deals: [{ id: '1001', name: 'Boston Beer pilot' }, { id: null, name: 'unlinked' }], live: null, liveRead: false });
    expect(p).toMatchObject({ name: 'Savastano, Philip', title: 'Director of Supply Chain', company: 'The Boston Beer Company', email: 'phil.savastano@bostonbeer.com', emailStatus: 'verified', timezone: null, linkedin: 'https://www.linkedin.com/in/phil-savastano/' });
    expect(p?.phones).toEqual([{ kind: 'direct', value: '+1 617 555 0100', source: 'GAP contact record (status verified)', updatedAt: '2026-10-01T12:00:00.000Z' }]);
    expect(p?.hubspotContactUrl).toBe('https://app.hubspot.com/contacts/3819073/record/0-1/980');
    expect(p?.hubspotCompanyUrl).toBe('https://app.hubspot.com/contacts/3819073/record/0-2/55');
    expect(p?.dealUrls, 'a deal with no id has no link').toEqual([{ name: 'Boston Beer pilot', url: 'https://app.hubspot.com/contacts/3819073/record/0-3/1001' }]);
    expect(p?.source).toBe('GAP contact record 980 and the HubSpot contact (not read this time)');
    expect(p?.updatedAt).toBe('2026-10-01T12:00:00.000Z');
    expect(hubspotRecordUrl('deal', '7')).toBe('https://app.hubspot.com/contacts/3819073/record/0-3/7');
  });

  it('never a guess: LinkedIn below the floor or not a profile URL is null; a dead phone is left out; a person-level number is never a main line; no number from the email domain', () => {
    const low = projectContactPacket({ accountName: 'A', persona: { ...PHIL, linkedin_confidence: LINKEDIN_CONFIDENCE_FLOOR - 1, phone_status: 'invalid' }, hubspotCompanyId: null, deals: [], live: null, liveRead: false });
    expect(low?.linkedin).toBeNull();
    expect(low?.phones).toEqual([]);
    expect(low?.hubspotCompanyUrl).toBeNull();
    const company = projectContactPacket({ accountName: 'A', persona: { ...PHIL, linkedin_url: 'https://www.linkedin.com/company/boston-beer/' }, hubspotCompanyId: null, deals: [], live: null, liveRead: false });
    expect(company?.linkedin, 'a company page is not the person').toBeNull();
    const withLive = projectContactPacket({ accountName: 'A', persona: PHIL, hubspotCompanyId: null, deals: [], live: { phone: '617-555-0100', mobilephone: '+1 617 555 0199', jobtitle: 'VP Supply Chain', linkedin: null, timezone: 'America/New_York', updatedAt: '2026-10-09T12:00:00.000Z' }, liveRead: true });
    expect(withLive?.phones).toEqual([
      { kind: 'mobile', value: '+1 617 555 0199', source: 'HubSpot contact (mobile phone field), read live', updatedAt: '2026-10-09T12:00:00.000Z' },
      { kind: 'direct', value: '617-555-0100', source: 'HubSpot contact (phone field), read live', updatedAt: '2026-10-09T12:00:00.000Z' },
    ]);
    expect(withLive?.phones.every((x) => x.kind !== 'main'), 'a contact record never yields a main line').toBe(true);
    expect(withLive?.title, 'the live title wins over the stored one').toBe('VP Supply Chain');
    expect(withLive?.timezone).toBe('America/New_York');
    expect(withLive?.source).toBe('GAP contact record 980 and the HubSpot contact, read live');
    expect(withLive?.updatedAt).toBe('2026-10-09T12:00:00.000Z');
  });

  it('no row: the fallback names the person and everything else is null; no name at all is no packet', () => {
    const p = projectContactPacket({ accountName: 'PepsiCo', persona: null, fallback: { name: 'Karen Ortiz', title: 'Director, Transportation', email: 'karen@pepsico.com' }, hubspotCompanyId: null, deals: [], live: null, liveRead: false });
    expect(p).toMatchObject({ name: 'Karen Ortiz', title: 'Director, Transportation', email: 'karen@pepsico.com', emailStatus: 'not on the GAP record', phones: [], timezone: null, linkedin: null, hubspotContactUrl: null, hubspotCompanyUrl: null, dealUrls: [], source: 'no GAP contact record and no HubSpot contact link', updatedAt: null });
    expect(projectContactPacket({ accountName: 'PepsiCo', persona: null, fallback: { name: null, title: null, email: null }, hubspotCompanyId: null, deals: [], live: null, liveRead: false })).toBeNull();
  });
});

describe('GUI-03: contactPacketFor over the ledger', () => {
  const db = () => ledgerDb({
    accounts: [{ name: 'The Boston Beer Company', hubspot_company_id: '55' }, { name: 'Other Co' }],
    personas: [
      { ...PHIL, updated_at: new Date('2026-10-01T12:00:00Z') },
      { id: 981, name: 'Philip Savastano', title: 'Namesake', email: 'p@other.com', email_status: 'unverified', phone: null, phone_status: 'unknown', linkedin_url: null, linkedin_confidence: 0, hubspot_contact_id: null, account_name: 'Other Co', updated_at: new Date('2026-09-01T12:00:00Z'), do_not_contact: false },
    ],
  }, NOW);

  it('finds the row by id, by address (any case), or by name AT the account ("Philip Savastano" is "Savastano, Philip"); a namesake at another account never answers', async () => {
    const c = db().client();
    expect((await findPersonaContact(c, { personaId: 980, accountName: 'The Boston Beer Company', now: NOW }))?.id).toBe(980);
    expect((await findPersonaContact(c, { email: 'PHIL.SAVASTANO@BOSTONBEER.COM', accountName: 'The Boston Beer Company', now: NOW }))?.id).toBe(980);
    expect((await findPersonaContact(c, { name: 'Philip Savastano', accountName: 'The Boston Beer Company', now: NOW }))?.id).toBe(980);
    expect(await findPersonaContact(c, { name: 'Philip Savastano', accountName: 'Kenco', now: NOW })).toBeNull();
  });

  it('the live reader is called once with the stored HubSpot contact id and its fields land; a null reader means not read; the deals come from the injected read', async () => {
    const hubspotContact = vi.fn(async () => ({ phone: null, mobilephone: '+1 617 555 0199', jobtitle: null, linkedin: null, timezone: 'America/New_York', updatedAt: null }));
    const deals = vi.fn(async () => [{ id: '1001', name: 'Boston Beer pilot' }]);
    const p = await contactPacketFor(db().client(), { personaId: 980, accountName: 'The Boston Beer Company', now: NOW }, { hubspotContact, deals });
    expect(hubspotContact).toHaveBeenCalledWith('980');
    expect(p?.phones.map((x) => x.kind)).toEqual(['mobile', 'direct']);
    expect(p?.timezone).toBe('America/New_York');
    expect(p?.hubspotCompanyUrl).toBe('https://app.hubspot.com/contacts/3819073/record/0-2/55');
    expect(p?.dealUrls).toEqual([{ name: 'Boston Beer pilot', url: 'https://app.hubspot.com/contacts/3819073/record/0-3/1001' }]);
    const q = await contactPacketFor(db().client(), { personaId: 980, accountName: 'The Boston Beer Company', now: NOW }, { hubspotContact: null });
    expect(q?.source).toBe('GAP contact record 980 and the HubSpot contact (not read this time)');
    expect(q?.dealUrls).toEqual([]);
  });

  it('readHubSpotContactLive: not configured reads nothing; configured reads once and answers from the SystemConfig cache after; a non-profile LinkedIn is dropped', async () => {
    const c = db().client();
    const fetchContact = vi.fn(async () => ({ phone: '617-555-0100', mobilephone: null, jobtitle: 'VP', hs_linkedin_url: 'https://www.linkedin.com/company/boston-beer/', hs_timezone: 'America/New_York', lastmodifieddate: '2026-10-09T12:00:00.000Z' }));
    expect(await readHubSpotContactLive(c, '980', NOW, { fetchContact, configured: false })).toBeNull();
    expect(fetchContact).not.toHaveBeenCalled();
    const first = await readHubSpotContactLive(c, '980', NOW, { fetchContact, configured: true });
    expect(first).toEqual({ phone: '617-555-0100', mobilephone: null, jobtitle: 'VP', linkedin: null, timezone: 'America/New_York', updatedAt: '2026-10-09T12:00:00.000Z' });
    const second = await readHubSpotContactLive(c, '980', new Date(NOW.getTime() + 60_000), { fetchContact, configured: true });
    expect(second).toEqual(first);
    expect(fetchContact, 'the cache answers the second read').toHaveBeenCalledTimes(1);
    expect(await c.systemConfig.findUnique({ where: { key: contactLiveCacheKey('980') } })).toBeTruthy();
    expect(await readHubSpotContactLive(c, 'not-an-id', NOW, { fetchContact, configured: true }), 'an id that is not HubSpot\'s is never sent').toBeNull();
  });
});
