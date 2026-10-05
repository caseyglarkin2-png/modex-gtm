/**
 * SELLER DOGFOOD CORRECTION (Casey, 2026-10-04): OPERATOR-FIRST COLD WHO. Functional ownership beats generic
 * supply-chain seniority. The cold first touch goes to the person who runs physical freight execution across the
 * network (Mark Marshall, Transportation Operations Manager, Sub-Zero; Jarrod Black, Director, Logistics, World
 * Market). These are persona SEEDS: the pattern is tested, never the people.
 *
 *   buyer map (worth showing)   every operating, sponsor, tech and site lane, unchanged
 *   cold WHO (first touch)      a direct freight operator; a transportation tech / transformation owner only with
 *                               a named initiative; a site operator only for a site-scoped motion
 */
import { describe, expect, it } from 'vitest';
import { isColdWho, rankWho, readPerson, type WhoCandidate } from '@/lib/gap/people/person-prior';

const lane = (t: string, entityType?: string) => readPerson(t, { entityType }).lane;
const p = (key: string, title: string, over: Partial<WhoCandidate> = {}): WhoCandidate => ({ key, name: key, title, reachable: true, ...over });
const cold = <C extends WhoCandidate>(cs: C[], entityType?: string) => rankWho(cs, { entityType }).filter((r) => isColdWho(r.read, r.candidate));
const coldFirst = (cs: WhoCandidate[], entityType?: string) => cold(cs, entityType)[0]?.candidate.key ?? null;

describe('direct freight operators: the lookalike seeds', () => {
  it('Transportation Operations Manager, Director Logistics, Director of Transportation are direct operators', () => {
    for (const t of ['Transportation Operations Manager', 'Director, Logistics', 'Director of Transportation', 'Logistics Operations Manager', 'Network Logistics Manager', 'LD&T Director - PBNA Sector Transport', 'Middle Mile Transportation Manager', 'Physical Distribution Manager'])
      expect([t, lane(t)]).toEqual([t, 'PRIMARY_OPERATOR']);
  });
  it('a manager can be a direct operator: seniority does not define the lane', () => {
    const r = readPerson('Transportation Operations Manager');
    expect(r.lane).toBe('PRIMARY_OPERATOR');
    expect(isColdWho(r)).toBe(true);
  });
});

describe('mixed titles: compliance or safety beside a transportation function does not demote it', () => {
  it('a substantive transportation / logistics function with compliance is a direct operator', () => {
    for (const t of ['VP Global Transportation and Compliance', 'Director Transportation Operations & Compliance', 'VP Logistics and Transportation Compliance', 'Director, Transportation & Trade Compliance', 'VP Transportation & Safety'])
      expect([t, lane(t)]).toEqual([t, 'PRIMARY_OPERATOR']);
  });
  it('the reason says why it is not procurement', () => {
    expect(readPerson('VP Global Transportation and Compliance').laneWhy).toMatch(/compliance is a second remit beside the operating function/);
  });
  it('sourcing, procurement, category, finance and compliance-only titles are never the operator', () => {
    for (const t of ['Director Transportation Strategic Sourcing', 'VP Transportation Procurement', 'Director Trade Compliance', 'Transportation Category Manager', 'Transportation Finance Director', 'Transportation Compliance Manager', 'Director, Transportation Sustainability'])
      expect([t, lane(t)]).toEqual([t, 'PROCUREMENT_COMMERCIAL']);
    expect(lane('Transportation Safety Manager')).toBe('SECURITY_RISK');
    expect(lane('Director, Fleet Safety')).toBe('SECURITY_RISK');
  });
});

describe('transportation technology / transformation needs explicit freight scope', () => {
  it('generic innovation or technology is not transportation tech', () => {
    expect(lane('Director of Innovation')).toBe('NON_OPERATING');
    expect(lane('VP Digital Transformation')).toBe('NON_OPERATING');
    expect(readPerson('Director, Supply Chain Transformation').ownership).toBe(0);
  });
  it('transformation with transportation / fleet scope is transportation tech, owning freight scope', () => {
    const r = readPerson('VP Strategy & Transformation, Global Transportation & Fleet');
    expect(r.lane).toBe('TRANSFORMATION_TECH');
    expect(r.ownership).toBe(2);
    expect(readPerson('Director, Transportation Systems (TMS)').ownership).toBe(2);
  });
  it('PepsiCo dogfood 2026-10-04: "S&T" (strategy and transformation) deployment of transportation is transformation, not the operator', () => {
    const r = readPerson('Sr Director, S&T North America Deployment - Transportation, Safety & Equipment Service');
    expect(r.lane).toBe('TRANSFORMATION_TECH');
    expect(r.ownership).toBe(2);
    expect(r.laneWhy).toMatch(/\(safety is a second remit beside the function\)$/);
    expect(lane('Sr. Director, Strategy and Transformation for PepsiCo Global Transportation')).toBe('TRANSFORMATION_TECH');
  });
  it('transportation tech is cold WHO only with a named initiative', () => {
    const r = readPerson('VP Strategy & Transformation, Global Transportation & Fleet');
    expect(isColdWho(r)).toBe(false);
    expect(isColdWho(r, { initiative: 'yard modernization program lead (press release)' })).toBe(true);
    expect(isColdWho(readPerson('Director of Innovation'), { initiative: 'x' })).toBe(false);
  });
});

describe('cold WHO eligibility is narrower than the buyer map', () => {
  it('a VP Supply Chain is a buyer-map sponsor, never the default cold first touch', () => {
    const r = readPerson('Vice President Supply Chain', { location: 'Overland Park, Kansas, United States' });
    expect(r.lane).toBe('ADJACENT_OPERATOR');
    expect(isColdWho(r)).toBe(false);
  });
  it('"operations" alone is not cold WHO at a shipper', () => {
    expect(isColdWho(readPerson('Director of Operations'))).toBe(false);
    expect(isColdWho(readPerson('VP Supply Chain Operations'))).toBe(false);
  });
  it('a site operator is cold WHO only for a site-scoped motion', () => {
    const r = readPerson('Plant Manager');
    expect(r.lane).toBe('FACILITY_OPERATOR');
    expect(isColdWho(r)).toBe(false);
    expect(isColdWho(r, { siteScoped: true })).toBe(true);
  });
  it('a direct operator running another region is not cold WHO', () => {
    expect(isColdWho(readPerson('Europe Transportation Director'))).toBe(false);
    expect(isColdWho(readPerson('Director of Transportation', { location: 'São Paulo, Brazil' }))).toBe(false);
  });
  it('unknown geography is not foreign', () => {
    expect(isColdWho(readPerson('Director of Transportation'))).toBe(true);
  });
});

describe('regressions from real accounts (patterns, not people)', () => {
  it('PepsiCo: Director of Transportation leads; VP Supply Chain stays in the buyer map', () => {
    const michelle = p('michelle', 'Vice President Supply Chain', { location: 'Overland Park, Kansas, United States' });
    const himanshu = p('himanshu', 'Director of Transportation', { reachable: false });
    expect(coldFirst([michelle, himanshu])).toBe('himanshu');
    expect(rankWho([michelle, himanshu])[1].candidate.key).toBe('michelle');
    expect(coldFirst([michelle])).toBeNull();
  });
  it('World Market: Director, Logistics leads VP Global Supply Chain; VP Global Transportation and Compliance is an operator', () => {
    expect(coldFirst([p('mitch', 'VP Global Supply Chain'), p('jarrod', 'Director, Logistics', { location: 'Stockton, California, United States' })])).toBe('jarrod');
    expect(coldFirst([p('mitch', 'VP Global Supply Chain'), p('derek', 'VP Global Transportation and Compliance')])).toBe('derek');
  });
  it('Sub-Zero: Transportation Operations Manager leads VP Supply Chain', () => {
    expect(coldFirst([p('vp', 'VP Supply Chain', { location: 'Madison, Wisconsin, United States' }), p('mark', 'Transportation Operations Manager', { location: 'Madison, Wisconsin, United States' })])).toBe('mark');
  });
  it('a generic VP Supply Chain alone leaves cold WHO unresolved (research required)', () => {
    expect(coldFirst([p('vp', 'VP Supply Chain'), p('csco', 'Chief Supply Chain Officer')])).toBeNull();
  });
});

describe('US-first among comparable operators; function always first', () => {
  const us = { location: 'Plano, Texas, United States' };
  const ca = { location: 'Toronto, Ontario, Canada' };
  it('US direct operator beats an equally qualified Canada direct operator', () => {
    expect(coldFirst([p('a-canada', 'Director of Transportation', ca), p('z-us', 'Director of Transportation', us)])).toBe('z-us');
  });
  it('a title remit of Mexico or Canada only is not the US market', () => {
    expect(coldFirst([p('a-mx', 'Mexico Transportation Director'), p('z-us', 'US Transportation Director')])).toBe('z-us');
  });
  it('a Canada direct operator beats a US generic VP Supply Chain', () => {
    expect(rankWho([p('vp', 'VP Supply Chain', us), p('ca', 'Director of Transportation', ca)])[0].candidate.key).toBe('ca');
  });
  it('named transportation ownership beats US preference', () => {
    expect(rankWho([p('us-log', 'Director, Logistics', us), p('ca-tr', 'Director of Transportation', ca)])[0].candidate.key).toBe('ca-tr');
  });
  it('a US manager beats a director based outside North America in the same lane', () => {
    expect(rankWho([p('br', 'Director of Transportation', { location: 'São Paulo, Brazil' }), p('us', 'Transportation Operations Manager', us)])[0].candidate.key).toBe('us');
  });
  it('US-confirmed beats unknown among equals; unknown is not foreign', () => {
    expect(coldFirst([p('a-unk', 'Director of Transportation'), p('z-us', 'Director of Transportation', us)])).toBe('z-us');
    expect(rankWho([p('a-br', 'Director of Transportation', { location: 'São Paulo, Brazil' }), p('z-unk', 'Director of Transportation')])[0].candidate.key).toBe('z-unk');
  });
});
