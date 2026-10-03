/**
 * V2: the account's people in HubSpot (live, read-only). PepsiCo had 19 GAP contacts while HubSpot held 542,
 * including the PBNA and Frito-Lay transportation directors GAP called missing. The buyer map and WHO rank both;
 * a HubSpot-only person is labelled and never auto-created; a persona joins only through its stored HubSpot id;
 * person location comes from the contact's own record.
 */
import { describe, expect, it } from 'vitest';
import { loadHubSpotPeople, type HubSpotPeopleReads } from '@/lib/gap/people/hubspot-people';
import { personCountry, readPerson } from '@/lib/gap/people/person-prior';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';

const NOW = new Date('2026-10-03T12:00:00Z');

const reads = (rows: Array<{ id: string; properties: Record<string, string | null> }>): HubSpotPeopleReads => ({
  contactIdsForCompany: async () => ({ ids: rows.map((r) => r.id), truncated: false }),
  readContacts: async (ids) => rows.filter((r) => ids.includes(r.id)),
});

describe('loadHubSpotPeople', () => {
  it('maps name, title, the person\'s own location, email presence (never the address) and opt-out', async () => {
    const r = await loadHubSpotPeople('c1', reads([{ id: '1', properties: { firstname: 'Karen', lastname: 'Darling', jobtitle: 'Senior Director - PBNA Transportation', city: 'Chicago', state: 'Illinois', country: 'United States', email: 'k@pepsico.com', hs_email_optout: null } }, { id: '2', properties: { firstname: 'Opt', lastname: 'Out', jobtitle: 'Director of Transportation', city: null, state: null, country: null, email: null, hs_email_optout: 'true' } }]));
    expect(r?.people).toEqual([
      { id: '1', name: 'Karen Darling', title: 'Senior Director - PBNA Transportation', location: 'Chicago, Illinois, United States', hasEmail: true, optedOut: false },
      { id: '2', name: 'Opt Out', title: 'Director of Transportation', location: null, hasEmail: false, optedOut: true },
    ]);
    expect(JSON.stringify(r)).not.toMatch(/@/);
  });
  it('fails soft: no company or a read error is null', async () => {
    expect(await loadHubSpotPeople(null, reads([]))).toBeNull();
    expect(await loadHubSpotPeople('c1', { contactIdsForCompany: async () => { throw new Error('429'); }, readContacts: async () => [] })).toBeNull();
  });
});

describe('the 15-minute cache', () => {
  it('serves a repeat read from memory, re-reads after 15 minutes, and never caches a failure', async () => {
    let calls = 0;
    let fail = false;
    const r: HubSpotPeopleReads = {
      contactIdsForCompany: async () => {
        calls += 1;
        if (fail) throw new Error('429');
        return { ids: ['1'], truncated: false };
      },
      readContacts: async () => [{ id: '1', properties: { firstname: 'A', lastname: 'B' } }],
    };
    const t = 1_000_000_000_000;
    fail = true;
    expect(await loadHubSpotPeople('cache-co', r, 1000, t, true)).toBeNull();
    fail = false;
    expect((await loadHubSpotPeople('cache-co', r, 1000, t, true))?.people).toHaveLength(1);
    await loadHubSpotPeople('cache-co', r, 1000, t + 14 * 60_000, true);
    expect(calls).toBe(2);
    await loadHubSpotPeople('cache-co', r, 1000, t + 16 * 60_000, true);
    expect(calls).toBe(3);
  });
});

describe('person location', () => {
  it('the country decides; a US state without a country is US; a lone city says nothing', () => {
    expect(personCountry('Chicago, Illinois, United States')).toBe('US');
    expect(personCountry('Plano, Texas')).toBe('US');
    expect(personCountry('Chicago, IL')).toBe('US');
    expect(personCountry('Calgary, Alberta, Canada')).toBe('OTHER');
    expect(personCountry('Sao Paulo, State of Sao Paulo, Brazil')).toBe('OTHER');
    expect(personCountry('Dallas')).toBeNull();
    expect(personCountry('')).toBeNull();
  });
  it('a title\'s stated remit wins over the record; the record decides when the title says nothing', () => {
    expect(readPerson('Director of Transportation', { location: 'Chicago, Illinois, United States' }).region).toBe('US_NA');
    expect(readPerson('Director of Transportation', { location: 'Warsaw, Masovian Voivodeship, Poland' }).region).toBe('OTHER_REGION');
    expect(readPerson('Europe Transportation Director', { location: 'Dallas, Texas, United States' }).region).toBe('OTHER_REGION');
    expect(readPerson('Director of Transportation', { location: 'Dallas' }).region).toBe('UNKNOWN');
  });
});

describe('the buyer map spans GAP and HubSpot', () => {
  const fact = { id: 'f1', quote: 'PepsiCo will open a new distribution center in Reno in 2027.', url: 'https://news.example/reno', title: 'news', publishedAt: '2026-09-20T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
  const hyp = { id: 'h1', status: 'draft', observation: fact.quote, problem: 'My guess is that inbound arrivals pile up at the gate.', rootCauses: [], impacts: [], falsification: ['How are arrivals staged?'], whatANoMeans: 'Arrivals flow.', primarySignalId: 'f1' };
  const inputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
    account: { name: 'Acme Foods', tier: 'Tier 1', priorityBand: 'A', vertical: 'cpg', parentBrand: null, hubspotCompanyId: 'c1' },
    aliases: [], domains: [], siblings: [], watched: true, watchReasons: [], facts: [fact], signals: [], lastResearch: null, hypotheses: [hyp], bids: [],
    personas: [{ id: 1, name: 'Vic VP', title: 'VP Supply Chain', doNotContact: false, hasEmail: true, emailStatus: 'valid', hubspotContactId: '9' }],
    candidates: [], memberships: [], firstTouches: [], conversation: null, opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
    hubspotPeople: {
      truncated: false,
      people: [
        { id: '9', name: 'Vic VP', title: 'VP Supply Chain', location: 'Dallas, Texas, United States', hasEmail: true, optedOut: false },
        { id: '20', name: 'Karen Darling', title: 'Senior Director - PBNA Transportation', location: 'Chicago, Illinois, United States', hasEmail: true, optedOut: false },
        { id: '21', name: 'Gone Away', title: 'Director of Transportation, North America', location: 'Plano, Texas, United States', hasEmail: true, optedOut: true },
      ],
    },
    ...over,
  });
  it('a better-fit HubSpot-only operator is the primary, labelled; the opted-out one never is; NEXT says add them first', () => {
    const b = buildAccountBrief(inputs(), NOW);
    expect(b.people.primary).toMatchObject({ name: 'Karen Darling', source: 'hubspot', region: 'US_NA', location: 'Chicago, Illinois, United States' });
    expect(b.glance.nextAction).toMatch(/^Add Karen Darling, Senior Director - PBNA Transportation \(Chicago, Illinois, United States\) from HubSpot as a GAP contact/);
    expect(b.motion.who).toBe('Vic VP'); // the send target stays a GAP contact until Casey adds her
  });
  it('a persona and its HubSpot contact are ONE person (joined by the stored id, never by name)', () => {
    const b = buildAccountBrief(inputs(), NOW);
    expect(b.people.lanes.flatMap((l) => l.people).filter((p) => p.name === 'Vic VP')).toHaveLength(1);
    expect(b.people.lanes.flatMap((l) => l.people).find((p) => p.name === 'Vic VP')?.source).toBe('gap');
  });
  it('with no HubSpot read, nothing changes', () => {
    const b = buildAccountBrief(inputs({ hubspotPeople: null }), NOW);
    expect(b.people.primary).toMatchObject({ name: 'Vic VP', source: 'gap' });
    expect(b.glance.nextAction).not.toMatch(/HubSpot/);
  });
});
