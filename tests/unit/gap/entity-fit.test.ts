/**
 * Release J: ENTITY TYPE != YARDFLOW FIT. What a company IS (shipper, retailer, 3PL, carrier, port, broker,
 * vendor...) is descriptive; whether it could BUY YardFlow is decided by cited operating evidence: plants,
 * DCs, terminals, yards, trailer pools, gates, fleets. A 3PL running DCs is a direct buyer; a pure broker is
 * not; a software vendor is a partner at most. Name rules only settle the genuinely obvious.
 */
import { describe, expect, it } from 'vitest';
import { deriveFit, operatingClaims, fitFromName } from '@/lib/gap/entity/fit';

const c = (claim: string) => ({ claim, url: 'https://example.com/x' });

describe('operating evidence', () => {
  it('counts cited claims that the company RUNS freight operations, not marketing', () => {
    expect(operatingClaims([c('Operates 120 distribution centers across North America.'), c('Runs a private fleet of 900 tractors.'), c('Named a top workplace in 2025.')])).toHaveLength(2);
    expect(operatingClaims([c('Operates marine terminals in Jacksonville and San Juan with container yards.')])).toHaveLength(1);
  });
  it('a mention is not an operation (review J P1)', () => {
    for (const x of ['Access to 40,000 trucks through our carrier network.', 'Serves customers at 500 facilities.', 'Closed two plants in Ohio.', 'Manufactures plastic containers.', 'Ships to 40 ports worldwide.']) expect(operatingClaims([c(x)]), x).toHaveLength(0);
  });
});

describe('deriveFit: fit comes from operations, not from the label', () => {
  it('a 3PL, carrier or terminal operator WITH corroborated operations is a direct buyer; one claim is potential', () => {
    for (const t of ['3pl', 'carrier', 'port_terminal'] as const) {
      expect(deriveFit({ entityType: t, operating: 2, ambiguous: false, what: null }).fit).toBe('DIRECT_BUYER');
      expect(deriveFit({ entityType: t, operating: 1, ambiguous: false, what: null }).fit).toBe('POTENTIAL_DIRECT_BUYER');
    }
  });
  it('the same types WITHOUT cited operations are UNKNOWN (needs an operating-network check), never rejected', () => {
    const r = deriveFit({ entityType: '3pl', operating: 0, ambiguous: false, what: null });
    expect(r.fit).toBe('UNKNOWN');
    expect(r.why).toMatch(/operating-network check/);
  });
  it('a shipper, retailer, distributor or manufacturer: direct with operations, potential without', () => {
    for (const t of ['shipper', 'retailer', 'distributor', 'manufacturer'] as const) {
      expect(deriveFit({ entityType: t, operating: 1, ambiguous: false, what: null }).fit).toBe('DIRECT_BUYER');
      expect(deriveFit({ entityType: t, operating: 0, ambiguous: false, what: null }).fit).toBe('POTENTIAL_DIRECT_BUYER');
    }
  });
  it('a pure broker is not a fit; an asset-based broker with cited operations is a potential buyer', () => {
    expect(deriveFit({ entityType: 'broker', operating: 0, ambiguous: false, what: null }).fit).toBe('NOT_FIT');
    expect(deriveFit({ entityType: 'broker', operating: 1, ambiguous: false, what: null }).fit).toBe('UNKNOWN');
    expect(deriveFit({ entityType: 'broker', operating: 2, ambiguous: false, what: null }).fit).toBe('POTENTIAL_DIRECT_BUYER');
  });
  it('a vendor is never a direct buyer: a partner when it serves logistics, else not a fit', () => {
    expect(deriveFit({ entityType: 'vendor', operating: 3, ambiguous: false, what: 'Transportation management software for shippers.' }).fit).toBe('PARTNER');
    expect(deriveFit({ entityType: 'vendor', operating: 0, ambiguous: false, what: 'Dental practice management software.' }).fit).toBe('NOT_FIT');
  });
  it('an identity that could be several companies, or an unknown type, is UNKNOWN', () => {
    expect(deriveFit({ entityType: 'shipper', operating: 3, ambiguous: true, what: null }).fit).toBe('UNKNOWN');
    expect(deriveFit({ entityType: null, operating: 0, ambiguous: false, what: null }).fit).toBe('UNKNOWN');
  });
});

describe('name rules settle only the genuinely obvious', () => {
  it('a logistics, transportation, distribution-services, carrier or broker NAME never decides fit', () => {
    for (const n of ['ABC Logistics', 'ABC Transportation', 'ABC Distribution Services', 'Forward Air', 'Summit Freight Lines', 'Acme Brokerage', 'Gnosis Freight']) {
      const r = fitFromName(n);
      expect(r.final, n).toBe(false);
      expect(r.fit, n).toBe('UNKNOWN');
    }
    expect(fitFromName('ABC Logistics').entityType).toBe('3pl');
  });
  it('healthcare, education and public bodies are guesses (they can run DCs and ports), never settled by name', () => {
    for (const n of ['Cardinal Health', 'Academy Sports', 'School Specialty', 'Broward County Port Everglades', 'Pacific Dental Services']) expect(fitFromName(n).final, n).toBe(false);
  });
  it('our own company, finance, law enforcement, media and software firms are settled by name', () => {
    for (const n of ['FreightRoll', 'Blackstone', 'Suffolk County Sheriffs Office', 'Transport Topics', 'Acme Software']) {
      const r = fitFromName(n);
      expect(r.final, n).toBe(true);
      expect(r.fit, n).toBe('NOT_FIT');
    }
  });
  it('a plain company name says nothing: UNKNOWN, not final', () => {
    expect(fitFromName('Harbor Foods Group')).toMatchObject({ entityType: null, fit: 'UNKNOWN', final: false });
  });
});
