/**
 * CONTACT CURRENTNESS (owner resolution, 2026-10-05): WHO is right responsibility AND current employment. H-E-B
 * pattern: a HubSpot row modified after the person left (company H-E-B, title transportation & reverse logistics)
 * while their own profile and a directory place them at another distributor. Patterns, never people.
 */
import { describe, expect, it } from 'vitest';
import { apolloEvidence, crmEvidence, domainLabel, employmentBlocksOutreach, employmentRefusal, interactionEvidence, kindForUrl, readEmployment, sameEmployer, tierForUrl, type EmploymentEvidence } from '@/lib/gap/people/employment';

const NOW = new Date('2026-10-05T12:00:00Z');
const ACCOUNT = 'H-E-B';
const crm = () => crmEvidence({ company: 'Heb', title: 'transportation & reverse logistics', email: 'socha.dakota@heb.com', lastModifiedAt: '2026-08-18T17:45:54Z' });
const read = (evidence: EmploymentEvidence[], accountName = ACCOUNT) => readEmployment({ accountName, evidence, now: NOW });

describe('the CRM alone is unverified; its modified date and the email domain never prove anything', () => {
  it('a CRM row modified last month, with a company email, is CURRENT_UNVERIFIED', () => {
    const r = read(crm());
    expect(r.state).toBe('CURRENT_UNVERIFIED');
    expect(r.why).toMatch(/not proof/);
    expect(r.decidedBy.map((e) => e.kind)).toEqual(['crm']);
    expect(employmentBlocksOutreach(r.state)).toBe(false);
  });
  it('weak evidence never changes the answer, however recent', () => {
    const weak: EmploymentEvidence[] = [{ kind: 'crm_modified', tier: 'weak', company: ACCOUNT, title: null, at: '2026-10-04T00:00:00Z', source: 'HubSpot last modified' }, { kind: 'email_domain', tier: 'weak', company: ACCOUNT, title: null, at: null, source: 'heb.com' }];
    expect(read(weak).state).toBe('CURRENT_UNVERIFIED');
    expect(read([...weak, ...crm()]).state).toBe('CURRENT_UNVERIFIED');
  });
  it('"Heb" and "H-E-B" are the same company for the CRM read', () => {
    expect(read(crm()).decidedBy[0].company).toBe('Heb');
  });
});

describe('strong evidence elsewhere: LEFT_COMPANY_CONFIRMED, and it blocks outreach at this account', () => {
  const profile: EmploymentEvidence = { kind: 'profile', tier: 'strong', company: 'ADUSA Distribution', title: 'Director of Distribution Operations', at: '2026-09-20T00:00:00Z', source: 'LinkedIn profile', url: 'https://www.linkedin.com/in/example' };
  it('their own profile at another employer, newer than the CRM, is a confirmed departure with the new employer named', () => {
    const r = read([...crm(), profile]);
    expect(r.state).toBe('LEFT_COMPANY_CONFIRMED');
    expect(r.elsewhere).toMatchObject({ company: 'ADUSA Distribution', title: 'Director of Distribution Operations', source: 'LinkedIn profile' });
    expect(r.why).toMatch(/places them elsewhere/);
    expect(employmentBlocksOutreach(r.state)).toBe(true);
    expect(employmentRefusal(r.state)).toBe('persona_left_account');
  });
  it('a CRM row modified AFTER the profile date does not revive them (the modified date is weak)', () => {
    const r = read([...crmEvidence({ company: 'Heb', title: 'x', email: 'a@heb.com', lastModifiedAt: '2026-10-04T00:00:00Z' }), { ...profile, at: '2026-06-01T00:00:00Z' }]);
    expect(r.state).toBe('LEFT_COMPANY_CONFIRMED');
  });
  it('an older aggregator placing them here never overrides their newer profile elsewhere', () => {
    const r = read([...crm(), profile, { kind: 'aggregator', tier: 'supporting', company: ACCOUNT, title: 'Transportation FL: DCS', at: '2025-11-01T00:00:00Z', source: 'RocketReach' }]);
    expect(r.state).toBe('LEFT_COMPANY_CONFIRMED');
  });
  it('a departure is not do-not-contact: the read carries no suppression', () => {
    const r = read([...crm(), profile]);
    expect(JSON.stringify(r)).not.toMatch(/do_not_contact|unsubscribe|bounce/i);
  });
});

describe('strong evidence here: CURRENT_CONFIRMED when recent, CURRENT_LIKELY when old', () => {
  it('a buyer interaction from this account within 180 days confirms them', () => {
    const r = read([...crm(), ...interactionEvidence({ at: '2026-09-01T00:00:00Z', what: 'Reply from this account', accountName: ACCOUNT })]);
    expect(r.state).toBe('CURRENT_CONFIRMED');
    expect(r.decidedBy[0].kind).toBe('buyer_interaction');
  });
  it('the employer page from a year ago is likely, not confirmed', () => {
    const r = read([...crm(), { kind: 'employer_page', tier: 'strong', company: 'H-E-B', title: 'Director of Transportation', at: '2025-09-01T00:00:00Z', source: 'heb.com leadership page' }]);
    expect(r.state).toBe('CURRENT_LIKELY');
    expect(r.why).toMatch(/older than 180 days/);
  });
  it('their profile here, NEWER than an announcement elsewhere, keeps them current (they came back or the other source is stale)', () => {
    const r = read([{ kind: 'profile', tier: 'strong', company: ACCOUNT, title: 'Director of Transportation', at: '2026-09-25T00:00:00Z', source: 'LinkedIn profile' }, { kind: 'employer_page', tier: 'strong', company: 'Other Co', title: null, at: '2026-03-01T00:00:00Z', source: 'otherco.com' }]);
    expect(r.state).toBe('CURRENT_CONFIRMED');
  });
});

describe('conflicts trigger VERIFY CURRENT ROLE, never a tie-break', () => {
  it('two strong sources within a month that disagree are a conflict', () => {
    const r = read([{ kind: 'profile', tier: 'strong', company: ACCOUNT, title: null, at: '2026-09-20T00:00:00Z', source: 'LinkedIn profile' }, { kind: 'employer_page', tier: 'strong', company: 'Other Co', title: null, at: '2026-09-28T00:00:00Z', source: 'otherco.com' }]);
    expect(r.state).toBe('EMPLOYMENT_CONFLICT');
    expect(r.verifyNeeded).toBe(true);
    expect(employmentRefusal(r.state)).toBe('persona_employment_conflict');
  });
  it('an undated strong source against a dated one is a conflict, not a departure', () => {
    const r = read([{ kind: 'profile', tier: 'strong', company: ACCOUNT, title: null, at: null, source: 'LinkedIn profile' }, { kind: 'employer_page', tier: 'strong', company: 'Other Co', title: null, at: '2026-09-28T00:00:00Z', source: 'otherco.com' }]);
    expect(r.state).toBe('EMPLOYMENT_CONFLICT');
  });
  it("Apollo saying moved out, against the CRM, is a conflict to verify (a provider alone never confirms a departure)", () => {
    const r = read([...crm(), ...apolloEvidence({ status: 'moved_out', verifiedAt: '2026-09-11T00:00:00Z', accountName: ACCOUNT })]);
    expect(r.state).toBe('EMPLOYMENT_CONFLICT');
    expect(r.why).toMatch(/Apollo employment check.*no longer at H-E-B/);
    expect(employmentBlocksOutreach(r.state)).toBe(true);
  });
});

describe('supporting evidence here corroborates: CURRENT_LIKELY', () => {
  it('Apollo current plus the CRM is likely; Apollo unverified adds nothing', () => {
    expect(read([...crm(), ...apolloEvidence({ status: 'current', verifiedAt: '2026-09-11T00:00:00Z', accountName: ACCOUNT, title: 'Director of Transportation' })]).state).toBe('CURRENT_LIKELY');
    expect(read([...crm(), ...apolloEvidence({ status: 'unverified', verifiedAt: null, accountName: ACCOUNT })]).state).toBe('CURRENT_UNVERIFIED');
  });
});

describe('a human correction outranks everything and is never overwritten by automation', () => {
  it('Casey marked them as left: LEFT_COMPANY_CONFIRMED, even against a newer profile here', () => {
    const r = read([...crm(), { kind: 'human', tier: 'strong', company: 'ADUSA Distribution', title: 'Director', at: '2026-10-05T00:00:00Z', source: 'Casey', left: true }, { kind: 'profile', tier: 'strong', company: ACCOUNT, title: null, at: '2026-10-05T06:00:00Z', source: 'LinkedIn profile' }]);
    expect(r.state).toBe('LEFT_COMPANY_CONFIRMED');
    expect(r.why).toMatch(/^Casey marked them as no longer at H-E-B \(now ADUSA Distribution, Director\)/);
  });
  it('Casey confirmed them current: CURRENT_CONFIRMED even against an aggregator elsewhere', () => {
    const r = read([{ kind: 'human', tier: 'strong', company: ACCOUNT, title: 'Director of Transportation', at: '2026-10-05T00:00:00Z', source: 'Casey' }, { kind: 'aggregator', tier: 'supporting', company: 'Other Co', title: null, at: '2026-10-01T00:00:00Z', source: 'ZoomInfo' }]);
    expect(r.state).toBe('CURRENT_CONFIRMED');
  });
  it('the newest human word decides when there are two', () => {
    const r = read([{ kind: 'human', tier: 'strong', company: 'Other', title: null, at: '2026-09-01T00:00:00Z', source: 'Casey', left: true }, { kind: 'human', tier: 'strong', company: ACCOUNT, title: null, at: '2026-10-01T00:00:00Z', source: 'Casey' }]);
    expect(r.state).toBe('CURRENT_CONFIRMED');
  });
});

describe('URL tiers: a profile or the employer page is strong; an aggregator or anything else is supporting; not a URL is weak', () => {
  it('reads the host and path', () => {
    expect(tierForUrl('https://www.linkedin.com/in/someone/')).toBe('strong');
    expect(tierForUrl('https://www.linkedin.com/company/adusa')).toBe('supporting');
    expect(tierForUrl('https://www.heb.com/leadership', ['heb.com'])).toBe('strong');
    expect(tierForUrl('https://www.zoominfo.com/pic/x')).toBe('supporting');
    expect(tierForUrl('https://news.example/story')).toBe('supporting');
    expect(tierForUrl('not a url')).toBe('weak');
    expect(tierForUrl(null)).toBe('weak');
    expect(kindForUrl('https://www.linkedin.com/in/someone/')).toBe('profile');
    expect(kindForUrl('https://careers.heb.com/x', ['heb.com'])).toBe('employer_page');
    expect(kindForUrl('https://rocketreach.co/x')).toBe('aggregator');
    expect(kindForUrl('https://news.example/story')).toBe('web');
  });
});

describe('employer spellings: a provider or CRM variant of the same employer is HERE, never elsewhere (dogfood 2026-10-05)', () => {
  // Every GAP contact at NFI Industries and J.B. Hunt was set aside because Apollo wrote "NFI" and
  // "J.B. Hunt Transport Services, Inc."; PepsiCo's sponsor because HubSpot wrote "Pepsi". Patterns, never people.
  it.each([
    ['NFI', 'NFI Industries'],
    ['J.B. Hunt Transport Services, Inc.', 'J.B. Hunt'],
    ['Pepsi', 'PepsiCo'],
    ['Tyson', 'Tyson Foods'],
    ['Fed Ex Freight', 'FedEx'],
    ['The Kroger Co.', 'Kroger'],
    ['Heb', 'H-E-B'],
    ['UPS Supply Chain Solutions', 'UPS'],
  ])('"%s" is the same employer as %s', (company, account) => {
    expect(sameEmployer(company, account)).toBe(true);
  });
  it.each([
    ['ADUSA Distribution', 'H-E-B'],
    ['General Electric', 'General Mills'],
    ['American Axle', 'American Airlines'],
    ['Upstream Logistics', 'UPS'],
    ['Estes Forwarding Worldwide', 'Estes Express Lines'],
  ])('"%s" is NOT the same employer as %s', (company, account) => {
    expect(sameEmployer(company, account)).toBe(false);
  });
  it('a spelling that only the account domain explains ("Genmills") matches through the domain label', () => {
    expect(domainLabel('genmills.com')).toBe('genmills');
    expect(domainLabel('www.jbhunt.co.uk')).toBe('jbhunt');
    expect(sameEmployer('Genmills', 'General Mills')).toBe(false);
    expect(sameEmployer('Genmills', 'General Mills', [], ['genmills.com'])).toBe(true);
  });
  it('Apollo "NFI" beside the GAP record at NFI Industries is consistent support: CURRENT_LIKELY, not a conflict', () => {
    const evidence: EmploymentEvidence[] = [
      ...crmEvidence({ company: 'NFI Industries', title: 'Director of Transportation Operations', email: 'x@nfiindustries.com', lastModifiedAt: null, source: 'GAP record' }),
      { kind: 'apollo', tier: 'supporting', company: 'NFI', title: 'Director of Transportation Operations', at: '2026-05-04T00:00:00Z', source: 'Apollo intake' },
    ];
    const r = read(evidence, 'NFI Industries');
    expect(r.state).toBe('CURRENT_LIKELY');
    expect(employmentBlocksOutreach(r.state)).toBe(false);
  });
  it('a genuinely different employer in the same shape is still a conflict (ADUSA beside the H-E-B record)', () => {
    const evidence: EmploymentEvidence[] = [...crm(), { kind: 'apollo', tier: 'supporting', company: 'ADUSA Distribution', title: 'Director of Distribution Operations', at: '2026-09-20T00:00:00Z', source: 'Apollo intake' }];
    const r = read(evidence);
    expect(r.state).toBe('EMPLOYMENT_CONFLICT');
    expect(employmentBlocksOutreach(r.state)).toBe(true);
  });
});
