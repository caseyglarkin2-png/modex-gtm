/**
 * GEOGRAPHY (Casey amendment, 2026-10-03): Canada is part of North America. A person's LOCATION (where their record
 * says they sit) and their OPERATING REMIT (the region their title says they run) are two facts, never one field:
 *   NA_REMIT          a North America remit in the title, wherever they sit (Toronto-based VP, North America Transportation)
 *   US_CONFIRMED      located in the US, remit not stated
 *   CANADA_CONFIRMED  located in Canada, remit not stated
 *   OTHER_REGION      another region's remit (a Chicago-based Director, European Logistics), or located outside North America
 *   UNKNOWN           neither on record (a company's headquarters never fills it)
 * The three North America states rank as one tier: geography never outranks operating ownership.
 */
import { describe, expect, it } from 'vitest';
import { GEO_LABEL, personLocation, rankWho, readPerson } from '@/lib/gap/people/person-prior';

describe('person location', () => {
  it('US, Canada, elsewhere, or nothing usable', () => {
    expect(personLocation('Chicago, Illinois, United States')).toBe('US');
    expect(personLocation('Plano, Texas')).toBe('US');
    expect(personLocation('Toronto, Ontario, Canada')).toBe('CANADA');
    expect(personLocation('Calgary, Alberta')).toBe('CANADA');
    expect(personLocation('Montreal, QC')).toBe('CANADA');
    expect(personLocation('Warsaw, Masovian Voivodeship, Poland')).toBe('OTHER');
    expect(personLocation('Dallas')).toBeNull();
    expect(personLocation(null)).toBeNull();
  });
});

describe('location and remit are separate facts', () => {
  it('a Toronto-based VP, North America Transportation is NORTH AMERICA REMIT CONFIRMED', () => {
    const r = readPerson('VP, North America Transportation', { location: 'Toronto, Ontario, Canada' });
    expect(r).toMatchObject({ location: 'CANADA', remit: 'NORTH_AMERICA', geo: 'NA_REMIT', region: 'US_NA' });
    expect(r.regionWhy).toBe('North America remit in the title (based in Toronto, Ontario, Canada)');
  });
  it('a Toronto-based Director of Transportation with no remit stated is CANADA CONFIRMED, North America tier', () => {
    const r = readPerson('Director of Transportation', { location: 'Toronto, Ontario, Canada' });
    expect(r).toMatchObject({ location: 'CANADA', remit: null, geo: 'CANADA_CONFIRMED', region: 'US_NA' });
    expect(r.regionWhy).toBe('Canada-based (Toronto, Ontario, Canada); remit not stated');
  });
  it('a Chicago-based Director, European Logistics runs Europe, not North America', () => {
    const r = readPerson('Director, European Logistics', { location: 'Chicago, Illinois, United States' });
    expect(r).toMatchObject({ location: 'US', remit: 'OTHER_REGION', geo: 'OTHER_REGION', region: 'OTHER_REGION' });
    expect(r.regionWhy).toBe('another region\'s remit in the title (based in Chicago, Illinois, United States; the remit decides, not the desk)');
  });
  it('a Canada remit in the title is North America', () => {
    expect(readPerson('Director of Transportation, Canada').geo).toBe('NA_REMIT');
  });
  it('US located, no remit: US CONFIRMED; nothing on record: UNKNOWN, never filled from the company', () => {
    expect(readPerson('Director of Transportation', { location: 'Chicago, IL' }).geo).toBe('US_CONFIRMED');
    const u = readPerson('Director of Transportation');
    expect(u).toMatchObject({ geo: 'UNKNOWN', region: 'UNKNOWN', location: null, remit: null });
    expect(u.regionWhy).toBe('location and remit not on record');
  });
  it('each state has a plain label', () => {
    expect(GEO_LABEL).toEqual({ NA_REMIT: 'North America remit confirmed', US_CONFIRMED: 'US confirmed', CANADA_CONFIRMED: 'Canada confirmed', MEXICO_CONFIRMED: 'Mexico confirmed', OTHER_REGION: 'Other region', UNKNOWN: 'Location / remit unknown' });
  });
});

describe('ranking: North America is one tier, and never outranks ownership', () => {
  const c = (key: string, title: string, location: string | null) => ({ key, name: key, title, reachable: true, location });
  it('a Canada-based transportation owner ties a US-based one on geography and beats an unknown one', () => {
    const r = rankWho([c('unknown', 'Director of Transportation', null), c('toronto', 'Director of Transportation', 'Toronto, Ontario, Canada')]);
    expect(r[0].candidate.key).toBe('toronto');
    const tie = rankWho([c('b-us', 'Director of Transportation', 'Chicago, IL'), c('a-ca', 'Director of Transportation', 'Toronto, ON')]);
    expect(tie.map((x) => x.candidate.key)).toEqual(['a-ca', 'b-us']);
  });
  it('a located-in-NA adjacent operator never beats a transportation owner whose location is unknown', () => {
    const r = rankWho([c('adj', 'VP Supply Chain', 'Toronto, Ontario, Canada'), c('owner', 'Director of Transportation', null)]);
    expect(r[0].candidate.key).toBe('owner');
  });
  it('WHY says which geography fact decided', () => {
    const [top] = rankWho([c('t', 'Director of Transportation', 'Toronto, Ontario, Canada')]);
    expect(top.why).toBe('Primary operator: title says they run transportation, freight or fleet; Canada-based; network scope.');
  });
});

describe('the buyer map says which geography fact holds', () => {
  it('a Canada-based owner is tagged [Canada]; a NA remit [North America remit]; unknown carries no tag', async () => {
    const { buildAccountBrief } = await import('@/lib/gap/account-intel/build');
    const { projectBrief } = await import('@/lib/gap/context/brief');
    const { projectEngagement, projectRelationship } = await import('@/lib/gap/context/context');
    const NOW = new Date('2026-10-03T12:00:00Z');
    const p = (id: number, name: string, title: string, location: string | null) => ({ id, name, title, doNotContact: false, hasEmail: true, emailStatus: 'valid', location });
    const i = {
      account: { name: 'Acme Foods', tier: null, priorityBand: null, vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
      aliases: [], domains: ['acmefoods.com'], siblings: [], watched: true, watchReasons: [], facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [],
      personas: [p(1, 'Tara North', 'Director of Transportation', 'Toronto, Ontario, Canada'), p(2, 'Nia Remit', 'VP, North America Logistics', null), p(3, 'Uma Known', 'Transportation Manager', null)],
      candidates: [], memberships: [], firstTouches: [], conversation: null, opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
    } as never;
    const brief = buildAccountBrief(i, NOW);
    expect(brief.people.lanes.flatMap((l) => l.people).find((x) => x.name === 'Tara North')).toMatchObject({ geo: 'CANADA_CONFIRMED', region: 'US_NA' });
    const ctx = { relationship: projectRelationship({ restriction: null, account: null, personas: [], memberships: [], meetings: [], emails: [], now: NOW }), engagement: projectEngagement([], NOW), history: [], assets: [], legacyNote: null };
    const text = JSON.stringify(projectBrief(brief, ctx, i, NOW));
    expect(text).toMatch(/Tara North \(Director of Transportation\) · Toronto, Ontario, Canada \[Canada\]/);
    expect(text).toMatch(/Nia Remit \(VP, North America Logistics\) \[North America remit\]/);
    expect(text).toMatch(/Uma Known \(Transportation Manager\)(?! \[)/);
    expect(text).not.toMatch(/US \/ NA/);
  });
});

describe('another region\'s remit never becomes the North America owner (review B1)', () => {
  const NOW = new Date('2026-10-03T12:00:00Z');
  const p = (id: number, name: string, title: string, location: string | null) => ({ id, name, title, doNotContact: false, hasEmail: true, emailStatus: 'valid', location });
  const brief = async (personas: unknown[]) => {
    const { buildAccountBrief } = await import('@/lib/gap/account-intel/build');
    const i = {
      account: { name: 'Acme Foods', tier: null, priorityBand: null, vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
      aliases: [], domains: ['acmefoods.com'], siblings: [], watched: true, watchReasons: [], facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [],
      personas, candidates: [], memberships: [], firstTouches: [], conversation: null, opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
      hubspotPeople: { truncated: false, people: [] },
    } as never;
    return { b: buildAccountBrief(i, NOW), i };
  };
  it('a Chicago-based Director, European Logistics is not WHO; a Toronto VP Supply Chain is; Apollo proposes finding the NA owner', async () => {
    const { b, i } = await brief([p(1, 'Eve Euro', 'Director, European Logistics', 'Chicago, Illinois, United States'), p(2, 'Tom Toronto', 'VP Supply Chain', 'Toronto, Ontario, Canada')]);
    expect(b.people.primary?.name).toBe('Tom Toronto');
    expect(b.people.lanes.flatMap((l) => l.people).find((x) => x.name === 'Eve Euro')).toMatchObject({ geo: 'OTHER_REGION' });
    const { apolloCandidates } = await import('@/lib/gap/people/apollo-candidates');
    expect(apolloCandidates(b, i).candidates.map((c) => c.kind)).toEqual(['FIND_OWNER']);
  });
  it('when the European director is the only operator on record, WHO is unknown and Apollo proposes the NA owner', async () => {
    const { b, i } = await brief([p(1, 'Eve Euro', 'Director, European Logistics', 'Chicago, Illinois, United States')]);
    expect(b.people.primary).toBeNull();
    const { apolloCandidates } = await import('@/lib/gap/people/apollo-candidates');
    expect(apolloCandidates(b, i).candidates.map((c) => c.kind)).toEqual(['FIND_OWNER']);
  });
  it('an operator located outside North America (no remit stated) can be WHO, but Apollo still proposes the NA owner', async () => {
    const { b, i } = await brief([p(1, 'Wiktor Warsaw', 'Director of Transportation', 'Warsaw, Masovian Voivodeship, Poland')]);
    expect(b.people.primary).toMatchObject({ name: 'Wiktor Warsaw', geo: 'OTHER_REGION' });
    const { apolloCandidates } = await import('@/lib/gap/people/apollo-candidates');
    const c = apolloCandidates(b, i).candidates;
    expect(c.map((x) => x.kind)).toEqual(['FIND_OWNER']);
    expect(c[0].possibleMatch).toBe('Wiktor Warsaw, Director of Transportation (primary operator, on record)');
  });
  it('rankWho puts a stated other-region remit after every North America or unstated person in the default lanes', () => {
    const r = rankWho([{ key: 'eu', name: 'eu', title: 'Director of Transportation, Europe', reachable: true, location: 'Chicago, IL' }, { key: 'adj', name: 'adj', title: 'Supply Chain Manager', reachable: true, location: null }]);
    expect(r.map((x) => x.candidate.key)).toEqual(['adj', 'eu']);
  });
});

describe('Canada in the research ranking and the edge cases (review SF1, nice-to-haves)', () => {
  it('a Canadian site is a North America network change, not activity abroad', async () => {
    const { sellerRelevance } = await import('@/lib/gap/research/continuity');
    expect(sellerRelevance('Acme Foods opens a new distribution center in Mississauga, Ontario, Canada.').rank).toBe(2);
    expect(sellerRelevance('Acme Foods opens a beverage plant in Kazakhstan.')).toMatchObject({ rank: 8, reason: 'activity outside the North America network' });
  });
  it('"Toronto, ON, CA" is Canada (CA is the country code there, not California)', () => {
    expect(personLocation('Toronto, ON, CA')).toBe('CANADA');
    expect(personLocation('San Jose, CA')).toBe('US');
  });
  it('"Americas" alone does not claim a North America remit (it includes Latin America)', () => {
    expect(readPerson('VP Logistics, Americas', { location: 'Sao Paulo, State of Sao Paulo, Brazil' }).geo).toBe('OTHER_REGION');
    expect(readPerson('VP Logistics, Americas').geo).toBe('UNKNOWN');
  });
});

describe('Mexico is North America (Casey, 2026-10-03); generic Latin America is not', () => {
  it('location: Mexico, never New Mexico', () => {
    expect(personLocation('Monterrey, Nuevo Leon, Mexico')).toBe('MEXICO');
    expect(personLocation('Mexico City, CDMX')).toBe('MEXICO');
    expect(personLocation('Guadalajara, Jalisco, México')).toBe('MEXICO');
    expect(personLocation('Santa Fe, New Mexico')).toBe('US');
    expect(personLocation('Albuquerque, NM')).toBe('US');
  });
  it('VP, Mexico Transportation is a North America remit', () => {
    expect(readPerson('VP, Mexico Transportation')).toMatchObject({ remit: 'NORTH_AMERICA', geo: 'NA_REMIT', region: 'US_NA' });
  });
  it('a Monterrey-based Director of Transportation is MEXICO CONFIRMED, North America tier', () => {
    const r = readPerson('Director of Transportation', { location: 'Monterrey, Nuevo Leon, Mexico' });
    expect(r).toMatchObject({ location: 'MEXICO', remit: null, geo: 'MEXICO_CONFIRMED', region: 'US_NA' });
    expect(r.regionWhy).toBe('Mexico-based (Monterrey, Nuevo Leon, Mexico); remit not stated');
  });
  it('a Mexico City-based Director, European Logistics is another region: the stated remit wins', () => {
    expect(readPerson('Director, European Logistics', { location: 'Mexico City, CDMX, Mexico' })).toMatchObject({ location: 'MEXICO', remit: 'OTHER_REGION', geo: 'OTHER_REGION' });
  });
  it('VP, Latin America Transportation is NOT North America (LATAM is broader than Mexico)', () => {
    expect(readPerson('VP, Latin America Transportation')).toMatchObject({ remit: 'OTHER_REGION', geo: 'OTHER_REGION' });
    expect(readPerson('Director of Logistics LATAM', { location: 'Mexico City, CDMX, Mexico' })).toMatchObject({ geo: 'OTHER_REGION' });
  });
  it('WHO: a Mexico-based owner ties a US-based one on geography; ownership still outranks geography', () => {
    const c = (key: string, title: string, location: string | null) => ({ key, name: key, title, reachable: true, location });
    expect(rankWho([c('b-us', 'Director of Transportation', 'Chicago, IL'), c('a-mx', 'Director of Transportation', 'Monterrey, Nuevo Leon, Mexico')]).map((x) => x.candidate.key)).toEqual(['a-mx', 'b-us']);
    expect(rankWho([c('adj', 'VP Supply Chain', 'Monterrey, Nuevo Leon, Mexico'), c('owner', 'Director of Transportation', null)])[0].candidate.key).toBe('owner');
    const [top] = rankWho([c('m', 'Director of Transportation', 'Monterrey, Nuevo Leon, Mexico')]);
    expect(top.why).toBe('Primary operator: title says they run transportation, freight or fleet; Mexico-based; network scope.');
  });
  it('a Mexican plant is a North America network change in WHY NOW', async () => {
    const { sellerRelevance } = await import('@/lib/gap/research/continuity');
    expect(sellerRelevance('Acme Foods opens a new distribution center in Monterrey, Mexico.').rank).toBe(2);
    expect(sellerRelevance('Acme Foods opens a new plant in Sao Paulo, Brazil.').rank).toBe(8);
  });
});
