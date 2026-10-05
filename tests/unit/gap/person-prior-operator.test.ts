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
import { isColdWho, isSponsor, rankWho, readPerson, type WhoCandidate } from '@/lib/gap/people/person-prior';

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

describe('review B1 (2026-10-04): a governance remit with a trailing department is not an operator', () => {
  it('compliance, safety or sustainability with the function only as a suffix stays governance', () => {
    for (const [t, want] of [
      ['Safety Manager - Fleet', 'SECURITY_RISK'], ['VP Safety, Transportation', 'SECURITY_RISK'], ['Safety Director, Private Fleet', 'SECURITY_RISK'],
      ['Director Environmental Health and Safety Transportation', 'SECURITY_RISK'], ['Compliance Manager, Transportation', 'PROCUREMENT_COMMERCIAL'],
      ['Director Safety and Compliance - Transportation', 'PROCUREMENT_COMMERCIAL'], ['Hazmat Compliance Manager - Transportation', 'PROCUREMENT_COMMERCIAL'],
      ['Director Sustainability - Transportation', 'PROCUREMENT_COMMERCIAL'], ['Director, Trade Compliance - Transportation', 'PROCUREMENT_COMMERCIAL'],
      ['Compliance Director, Logistics', 'PROCUREMENT_COMMERCIAL'],
    ] as const) expect([t, lane(t)]).toEqual([t, want]);
  });
  it('a governance remit joined to operations by a conjunction keeps the operator', () => {
    for (const t of ['Senior Director, Transportation Compliance & Operations', 'VP Fleet Safety & Operations', 'VP Fleet Operations & Safety', 'VP Safety and Transportation'])
      expect([t, lane(t)]).toEqual([t, 'PRIMARY_OPERATOR']);
  });
});

describe('re-review C1 (2026-10-05): two governance remits are governance, even with a function word on the second', () => {
  it('safety plus fleet / transportation compliance is not an operator', () => {
    for (const t of ['Safety & Fleet Compliance Manager', 'Director, Safety and Transportation Compliance', 'Director Compliance and Fleet Safety', 'Compliance & Fleet Safety Manager', 'Director, Fleet Safety and Operations Compliance'])
      expect([t, lane(t)]).not.toEqual([t, 'PRIMARY_OPERATOR']);
  });
  it('a governance remit joined to a bare function stays the operator', () => {
    for (const t of ['Safety & Transportation Manager', 'Director of Transportation & Safety', 'VP Global Transportation and Compliance', 'VP Fleet Safety & Operations'])
      expect([t, lane(t)]).toEqual([t, 'PRIMARY_OPERATOR']);
  });
});

describe('re-review (d) (2026-10-05): a second hat never demotes a real operator; a trailing department never rescues another function', () => {
  it('logistics joined to customer / commercial operations, budget or spend beside operations, and dedicated contracts are operators', () => {
    for (const t of ['Director, Logistics & Customer Operations', 'Director Customer Operations & Logistics', 'VP Commercial Operations & Logistics', 'Director Transportation Budget & Operations', 'Director Transportation Operations (Budget Owner)', 'Director, Transportation Operations and Spend', 'Director of Operations, Dedicated Contracts'])
      expect([t, lane(t)]).toEqual([t, 'PRIMARY_OPERATOR']);
    expect(lane('VP Dedicated Contracts', 'carrier')).toBe('PRIMARY_OPERATOR');
  });
  it('spend, budget and contracts alone stay commercial', () => {
    for (const t of ['Director of Transportation Spend', 'Director Transportation Budget', 'Director Transportation Contracts'])
      expect([t, lane(t)]).toEqual([t, 'PROCUREMENT_COMMERCIAL']);
  });
  it('people / customer / business operations with a trailing freight department are not operators', () => {
    expect(lane('Director People Operations, Fleet')).toBe('NON_OPERATING');
    expect(lane('Director Customer Operations - Transportation')).not.toBe('PRIMARY_OPERATOR');
    expect(lane('Director Business Operations, Transportation')).not.toBe('PRIMARY_OPERATOR');
  });
  it('rail and intermodal operations are freight', () => {
    expect(lane('Director, Rail & Intermodal Operations')).toBe('PRIMARY_OPERATOR');
    expect(lane('Director, Intermodal')).toBe('PRIMARY_OPERATOR');
  });
});

describe('review S5 (2026-10-04): freight finance, contracts, HR and legal are never the operator', () => {
  it('audit, payment, contracts, rates, spend and budget are commercial', () => {
    for (const t of ['Director, Freight Audit', 'Freight Payment Manager', 'Director Transportation Contracts', 'Director, Freight Contracting', 'Director Transportation Rate Management', 'Director of Transportation Spend', 'Director Transportation Budget', 'Director Indirect Spend - Logistics', 'Director, Freight Audit & Payment'])
      expect([t, lane(t)]).toEqual([t, 'PROCUREMENT_COMMERCIAL']);
  });
  it('HR, recruiting and legal are not operating roles', () => {
    for (const t of ['Director Transportation HR', 'Transportation Recruiter', 'Driver Recruiting Manager - Fleet', 'Transportation Attorney'])
      expect([t, lane(t)]).toEqual([t, 'NON_OPERATING']);
  });
  it('contract logistics at a 3PL is still the operation', () => {
    expect(lane('Director, Contract Logistics', '3pl')).toBe('PRIMARY_OPERATOR');
  });
});

describe('review S6 (2026-10-04): a non-freight "operations" is never the operator or the sponsor', () => {
  it('at a carrier or 3PL, people / revenue / commercial / HR / customer operations are not the network', () => {
    for (const t of ['VP People Operations', 'Director Revenue Operations', 'VP Commercial Operations', 'Director HR Operations', 'Director Customer Operations'])
      expect([t, lane(t, '3pl')]).not.toEqual([t, 'PRIMARY_OPERATOR']);
    expect(lane('VP Operations', 'carrier')).toBe('PRIMARY_OPERATOR');
    expect(lane('Director, Terminal Operations', 'carrier')).toBe('PRIMARY_OPERATOR');
  });
  it('at a shipper, a VP Commercial Operations is not the sponsor', () => {
    expect(isSponsor(readPerson('VP Commercial Operations'), 'VP Commercial Operations')).toBe(false);
    expect(isSponsor(readPerson('Vice President Supply Chain'), 'Vice President Supply Chain')).toBe(true);
    expect(isSponsor(readPerson('Director of Warehouse Operations'), 'Director of Warehouse Operations')).toBe(false);
    expect(isSponsor(readPerson('Chief Supply Chain Officer'), 'Chief Supply Chain Officer')).toBe(true);
  });
});

describe('review N4 (2026-10-04): tech scope words are freight words, not generic ones', () => {
  it('"S&T" is transformation only beside a deployment / program / strategy word; elsewhere it is supply and transportation', () => {
    expect(lane('Director, S&T Marine Transportation')).toBe('PRIMARY_OPERATOR');
    expect(lane('Sr Director, S&T North America Deployment - Transportation, Safety & Equipment Service')).toBe('TRANSFORMATION_TECH');
  });
  it('order orchestration or customer visibility is not transportation tech', () => {
    expect(readPerson('Director, Order Orchestration').ownership).toBe(0);
    expect(readPerson('Director Customer Visibility').ownership).toBe(0);
    expect(readPerson('Director, Transportation Visibility').ownership).toBe(2);
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
