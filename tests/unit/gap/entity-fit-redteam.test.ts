/** Final red team (ICP lens): the exact strings that broke type != fit. */
import { describe, expect, it } from 'vitest';
import { deriveFit, fitFromName, operatingClaims } from '@/lib/gap/entity/fit';
import { typeFromVertical } from '@/lib/gap/account-intel/build';

const ops = (...claims: string[]) => operatingClaims(claims.map((claim) => ({ claim }))).map((c) => c.claim);

describe('a name alone never rejects a freight operator', () => {
  it.each(['Capital Logistics', 'Capital City Trucking', 'Capital Transportation', 'Insurance Auto Auctions'])('%s is checked, not rejected', (n) => {
    expect(fitFromName(n)).toMatchObject({ final: false, fit: 'UNKNOWN' });
  });
  it('a finance firm is still settled by name', () => {
    expect(fitFromName('Balyasny Asset Management')).toMatchObject({ final: true, fit: 'NOT_FIT' });
    expect(fitFromName('Summit Capital Partners')).toMatchObject({ final: true, fit: 'NOT_FIT' });
  });
});

describe('operating claims', () => {
  it('counts of its own facilities and fleets are operations', () => {
    expect(ops('Old Dominion has 261 service centers', 'J.B. Hunt fleet of 20,000 tractors', 'XPO: 290 terminals across North America', 'Operates 30 cross-docks close to major ports', 'GXO operates 970 warehouses and closed 3')).toHaveLength(5);
  });
  it("a broker's carrier network and a vendor's software footprint are not", () => {
    expect(ops('TQL network of 90,000 trucks', 'Our carrier network includes 1 million trucks', 'Its yard management software runs in 500 facilities', 'Its WMS manages 1,200 warehouses for customers', 'Acme closed two plants')).toEqual([]);
  });
  it('a broker Scout-typed as a 3PL with only its carrier network stays short of a direct buyer', () => {
    const n = ops('TQL network of 90,000 trucks', 'Our carrier network includes 1 million trucks').length;
    expect(deriveFit({ entityType: '3pl', operating: n, ambiguous: false, what: 'Freight brokerage' }).fit).toBe('UNKNOWN');
  });
  it('"other" with nothing cited is unknown, not a negative verdict', () => {
    expect(deriveFit({ entityType: 'other', operating: 0, ambiguous: false, what: 'A company' }).fit).toBe('UNKNOWN');
  });
});

describe('vertical to type', () => {
  it.each([['Logistics Technology', 'vendor'], ['Supply Chain Software', 'vendor'], ['Transportation Technology', 'vendor'], ['Marine', null], ['Marine Terminal', 'port_terminal'], ['3PL / Logistics', '3pl'], ['Food & Beverage', 'manufacturer']])('%s -> %s', (v, t) => {
    expect(typeFromVertical(v)).toBe(t);
  });
});
