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
  it('counts cited claims about physical freight operations, not marketing', () => {
    expect(operatingClaims([c('Operates 120 distribution centers across North America.'), c('Runs a private fleet of 900 tractors.'), c('Named a top workplace in 2025.')])).toHaveLength(2);
    expect(operatingClaims([c('Operates marine terminals in Jacksonville and San Juan with container yards.')])).toHaveLength(1);
  });
});

describe('deriveFit: fit comes from operations, not from the label', () => {
  it('a 3PL, carrier or terminal operator WITH cited operations is a direct buyer', () => {
    for (const t of ['3pl', 'carrier', 'port_terminal'] as const) expect(deriveFit({ entityType: t, operating: 2, ambiguous: false, what: null }).fit).toBe('DIRECT_BUYER');
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
    expect(deriveFit({ entityType: 'broker', operating: 1, ambiguous: false, what: null }).fit).toBe('POTENTIAL_DIRECT_BUYER');
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
  it('our own company, finance, healthcare, education, public sector, media and software firms are settled by name', () => {
    for (const n of ['FreightRoll', 'Blackstone', 'Pacific Dental Services', 'Bates College', 'Suffolk County Sheriffs Office', 'Transport Topics', 'Acme Software']) {
      const r = fitFromName(n);
      expect(r.final, n).toBe(true);
      expect(r.fit, n).toBe('NOT_FIT');
    }
  });
  it('a plain company name says nothing: UNKNOWN, not final', () => {
    expect(fitFromName('Harbor Foods Group')).toMatchObject({ entityType: null, fit: 'UNKNOWN', final: false });
  });
});
