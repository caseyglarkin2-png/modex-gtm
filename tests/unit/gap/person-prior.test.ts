/**
 * V2 PERSON PRIOR (Casey's seller learning, 2026-10-02): the US / North America leader who OPERATES transportation
 * and the physical freight network. Lanes and an ordered comparison, never a score. Title patterns come from Casey's
 * 78-contact HubSpot sample (role patterns only; no names).
 */
import { describe, expect, it } from 'vitest';
import { rankWho, readPerson, whoKey, type WhoCandidate } from '@/lib/gap/people/person-prior';

const lane = (t: string, entityType?: string) => readPerson(t, { entityType }).lane;

describe('lanes: operating ownership, not the bare word "transportation"', () => {
  it('primary operators', () => {
    for (const t of [
      'Director Global Transportation & Warehousing', 'NA Transportation Operations Director', 'Director, Transportation Operation Leader',
      'Senior Director- NA Transportation, Warehousing, Private Fleet', 'Director Global Transportation and Logistics', 'Transportation and Warehousing Director-Family Care',
      'Director of Global Transportation', 'Director Transportation & Distribution', 'Sr Director, Global Logistics and Transportation',
      'Director, Transportation Operations and Optimization', 'Director, Dedicated Transportation', 'Director, OTR Transportation', 'Director of Transportation',
      'Senior Director of Transportation', 'Corp. Director, Outbound Transportation', 'Senior Director (Sales Logistics, Transportation, Warehousing & I Trade)',
      'VP Logistics',
    ]) expect([t, lane(t)]).toEqual([t, 'PRIMARY_OPERATOR']);
  });
  it('procurement / commercial: buys, prices, funds or governs transportation', () => {
    for (const t of ['Director of Transportation Strategic Sourcing', 'Global Transportation Category Director', 'Director, Transportation & Trade Compliance', 'Finance Director, North America Transportation & Warehousing Forecast Operations', 'Director PS Transportation Sustainability at Procter & Gamble', 'Director Purchases Transportation and Warehousing', 'Global Transportation Cost Director', 'Senior Director of Transportation & Operations Purchasing'])
      expect([t, lane(t)]).toEqual([t, 'PROCUREMENT_COMMERCIAL']);
  });
  it('non-operating: a product market, business unit, R&D, sales or generic IT', () => {
    for (const t of ['Director Research & Development, Transportation & Electronics Business Group, 3M', 'EMEA Transportation Sales Director', 'Senior Director Regulatory & Quality (Transportation Markets)', 'Director EMEA, 3M Commercial Branding & Transportation Division', 'Global Director Transportation SBU', 'Director, R&D Category - Industrial & Transportation', 'IT Director, Identity and Access Management Operations Manager Europe'])
      expect([t, lane(t)]).toEqual([t, 'NON_OPERATING']);
  });
  it('transformation / technology partners', () => {
    for (const t of ['iTrade Digital Products and Transportation Services Software Engineering Director', 'Director of Distribution and Transportation Systems', 'IT Director, Transportation Europe Digital Product Area Leader', 'Director, Transportation Yard Modernization', 'Senior Manager, Automation Engineering'])
      expect([t, lane(t)]).toEqual([t, 'TRANSFORMATION_TECH']);
  });
  it('adjacent, facility and executive lanes', () => {
    expect(lane('VP Supply Chain Operations')).toBe('ADJACENT_OPERATOR');
    expect(lane('Director, Distribution Operations')).toBe('ADJACENT_OPERATOR');
    expect(lane('Operations Director & Plant Manager')).toBe('FACILITY_OPERATOR');
    expect(lane('Chief Supply Chain Officer')).toBe('EXECUTIVE_SPONSOR');
    expect(lane('Chief Financial Officer')).toBe('PROCUREMENT_COMMERCIAL');
    expect(lane('')).toBe('NEEDS_REVIEW');
  });
  it('golden-probe false positives (2026-10-02): a VP is not an executive; safety, store ops, the CEO office and a board seat are never the operating owner', () => {
    expect(lane('Vice President of Operations')).toBe('ADJACENT_OPERATOR');
    expect(readPerson('Vice President Supply Chain').seniority).toBe(4);
    expect(lane('Senior Vice President Chief Supply Chain Officer NA - Beverages')).toBe('EXECUTIVE_SPONSOR');
    expect(lane('Transportation Safety Manager')).toBe('SECURITY_RISK');
    expect(lane('Vice President of Store Operations')).toBe('NEEDS_REVIEW');
    expect(lane('Operations Manager, CEO Office')).toBe('NON_OPERATING');
    expect(lane('Board Director / Former EVP Supply Chain')).toBe('NON_OPERATING');
    expect(lane('VP of IT / CIO')).toBe('TRANSFORMATION_TECH');
    expect(lane('Corporate Supply Chain Planning Manager')).toBe('NEEDS_REVIEW');
  });
  it('at a carrier, 3PL or terminal the operator of the physical network is primary, whatever the shipper taxonomy says', () => {
    expect(lane('VP Terminal Operations', 'port_terminal')).toBe('PRIMARY_OPERATOR');
    expect(lane('VP Operations', 'carrier')).toBe('PRIMARY_OPERATOR');
    expect(lane('VP Operations', 'manufacturer')).toBe('ADJACENT_OPERATOR');
  });
});

describe('region: the person\'s own remit, never the company\'s country', () => {
  it('US / North America only when the title or person record says so', () => {
    expect(readPerson('NA Transportation Operations Director').region).toBe('US_NA');
    expect(readPerson('Director, Domestic Transportation').region).toBe('US_NA');
    expect(readPerson('Europe Transportation Director').region).toBe('OTHER_REGION');
    expect(readPerson('Delivery and Transportation Director Latam').region).toBe('OTHER_REGION');
    expect(readPerson('Director of Transportation', { location: 'Chicago, IL' }).region).toBe('US_NA');
  });
  it('no remit stated is "location unknown", not foreign', () => {
    const r = readPerson('Director of Global Transportation');
    expect(r.region).toBe('UNKNOWN');
    expect(r.regionWhy).toBe('location unknown (global remit; North America responsibility not stated)');
    expect(readPerson('Sr. Director, International Transportation').region).toBe('UNKNOWN');
  });
});

describe('WHO order: buyer truth > relationship > initiative > lane > region > scope > seniority', () => {
  const p = (key: string, title: string, over: Partial<WhoCandidate> = {}): WhoCandidate => ({ key, name: key, title, reachable: true, ...over });
  const first = (cs: WhoCandidate[], entityType?: string) => rankWho(cs, { entityType })[0].candidate.key;
  it('functional ownership beats seniority', () => {
    expect(first([p('svp', 'SVP Strategy'), p('vpp', 'VP Procurement'), p('cfo', 'Chief Financial Officer'), p('cto', 'Chief Transformation Officer'), p('dir', 'Director, Transportation Operations')])).toBe('dir');
    expect(first([p('vpsc', 'VP Supply Chain Operations'), p('dir', 'Director of Transportation')])).toBe('dir');
  });
  it('a confirmed US / NA remit wins between comparable people; unknown beats another region', () => {
    expect(first([p('glob', 'Director of Global Transportation'), p('na', 'NA Transportation Operations Director')])).toBe('na');
    expect(first([p('eu', 'Europe Transportation Director'), p('glob', 'Director of Global Transportation')])).toBe('glob');
  });
  it('network scope beats one site at the same lane', () => {
    expect(first([p('site', 'Plant Transportation Manager'), p('net', 'Transportation Manager, North America')])).toBe('net');
  });
  it('initiative ownership, then relationship, then buyer truth override the prior', () => {
    const op = p('op', 'NA Transportation Operations Director');
    const yard = p('yard', 'Senior Manager, Automation Engineering', { initiative: 'Walmart Careers: yard modernization initiatives' });
    expect(first([op, yard])).toBe('yard');
    const known = p('known', 'VP Supply Chain', { relationship: 'Introduced by Mark Shaughnessy' });
    expect(first([op, yard, known])).toBe('known');
    expect(first([op, yard, known, p('buyer', 'Logistics Analyst', { buyerTruth: 'replied 2026-09-30' })])).toBe('buyer');
  });
  it('production finding (PepsiCo, 2026-10-03): named transportation ownership beats generic logistics, and a senior director beats a director', () => {
    const us = { location: 'Dallas, Texas, United States' };
    expect(first([p('log', 'Director I Pepsi Logistics Co, Inc.', us), p('pbna', 'Senior Director - PBNA Transportation', { location: 'Chicago, Illinois, United States' })])).toBe('pbna');
    expect(first([p('dir', 'Director of Transportation', us), p('sr', 'Sr Director of Transportation - Frito-Lay', us)])).toBe('sr');
    expect(readPerson('Senior Director of Transportation').seniority).toBeGreaterThan(readPerson('Director of Transportation').seniority);
  });
  it('a do-not-contact person is never first', () => {
    expect(first([p('dnc', 'NA Transportation Operations Director', { doNotContact: true }), p('ok', 'Director, Supply Chain Manager')])).toBe('ok');
  });
  it('why is a sentence, never a number', () => {
    const [top] = rankWho([p('na', 'NA Transportation Operations Director')]);
    expect(top.why).toBe('Primary operator: title says they run transportation, freight or fleet; North America remit stated; network scope.');
    expect(top.why).not.toMatch(/\d/);
    expect(whoKey(top.candidate, top.read).length).toBe(11);
  });
});
