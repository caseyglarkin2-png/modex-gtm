/**
 * ACCOUNT KIND REVIEW (enterprise graph, 2026-10-05). NFI Industries, J.B. Hunt, UPS, PepsiCo, Tyson Foods and
 * Kroger carry vertical "Unknown", so the product reads them under shipper rules. The classifier proposes a vertical
 * ONLY from the live vocabulary and ONLY on strong evidence: a Scout web read of carrier / 3PL, or a majority of
 * carrier-network titles among at least five. A set vertical never flips. Thin evidence leaves Unknown alone.
 */
import { describe, expect, it } from 'vitest';
import { CARRIER_VERTICAL, VERTICAL_VOCABULARY, carrierNetworkTitleShare, proposeAccountKind, type AccountKindEvidence } from '@/lib/gap/people/account-kind-review';
import { typeFromVertical } from '@/lib/gap/account-intel/build';

const base = (over: Partial<AccountKindEvidence> = {}): AccountKindEvidence => ({ accountName: 'NFI Industries', vertical: 'Unknown', scout: null, sites: null, titles: [], ...over });
const scout = (entityType: string, basis: 'web' | 'name_rules' = 'web', ambiguous = false): AccountKindEvidence['scout'] => ({ entityType, basis, ambiguous, what: 'a third-party logistics provider', at: '2026-09-30T00:00:00Z' });

describe('the vocabulary', () => {
  it('is the live set of Account.vertical values, and the carrier value is "3PL / Logistics" because there is no separate carrier value', () => {
    expect([...VERTICAL_VOCABULARY]).toEqual(['Unknown', 'Food & Beverage', 'Industrial', 'Retail', 'Manufacturing', 'Packaging', 'Logistics', 'Automotive', '3PL / Logistics', 'Beverage', 'food_bev', 'Healthcare']);
    expect(CARRIER_VERTICAL).toBe('3PL / Logistics');
    expect(typeFromVertical(CARRIER_VERTICAL)).toBe('3pl');
  });
});

describe('carrierNetworkTitleShare', () => {
  it('counts linehaul, hub, terminal, sortation, dedicated fleet, network operations, drivers, intermodal, brokerage and pickup and delivery; never a bare logistics or DC title', () => {
    // Review S8: a shipper's private fleet also has fleet, driver, dedicated-fleet and intermodal titles, so they
    // never count; only titles the physical network as a product has do.
    const r = carrierNetworkTitleShare(['Director of Linehaul Operations', 'Hub Manager', 'Terminal Manager', 'VP Sortation', 'Dedicated Fleet Manager', 'Director Network Operations', 'Driver Manager', 'VP Intermodal', 'Brokerage Operations Lead', 'Pickup and Delivery Supervisor', 'Logistics Manager', 'Director DC Operations', 'VP Finance', '', '  ']);
    expect(r).toEqual({ total: 13, carrier: 7, matched: ['Director of Linehaul Operations', 'Hub Manager', 'Terminal Manager', 'VP Sortation', 'Director Network Operations', 'Brokerage Operations Lead', 'Pickup and Delivery Supervisor'] });
  });
});

describe('proposeAccountKind', () => {
  it('a Scout web read of 3PL or carrier proposes "3PL / Logistics" with the doctrine change and the vocabulary note', () => {
    const p = proposeAccountKind(base({ scout: scout('3pl') }));
    expect(p).toMatchObject({ accountName: 'NFI Industries', current: 'Unknown', proposed: '3PL / Logistics', strength: 'strong' });
    expect(p.evidence).toEqual(['Scout (web, 2026-09-30): 3pl, "a third-party logistics provider"', 'GAP persona titles: none on record']);
    expect(p.doctrine).toMatch(/^shipper rules -> carrier doctrine/);
    expect(p.doctrine).toMatch(/no separate carrier value/);
    expect(proposeAccountKind(base({ accountName: 'J.B. Hunt', scout: scout('carrier') })).proposed).toBe('3PL / Logistics');
  });
  it('a Scout read from name rules, or an ambiguous one, is not evidence: Unknown stays Unknown', () => {
    expect(proposeAccountKind(base({ scout: scout('carrier', 'name_rules') }))).toMatchObject({ proposed: null, strength: 'thin' });
    expect(proposeAccountKind(base({ scout: scout('carrier', 'web', true) }))).toMatchObject({ proposed: null, strength: 'thin' });
  });
  it('a majority of carrier-network titles among at least five proposes the carrier value; a minority, or fewer than five, leaves Unknown', () => {
    const majority = proposeAccountKind(base({ accountName: 'J.B. Hunt', titles: ['VP Truckload Operations', 'Director Linehaul', 'Brokerage Operations Manager', 'Terminal Manager', 'VP Finance', 'HR Director'] }));
    expect(majority).toMatchObject({ proposed: '3PL / Logistics', strength: 'strong' });
    expect(majority.evidence).toContain('GAP persona titles: 4 of 6 are carrier-network roles (VP Truckload Operations, Director Linehaul, Brokerage Operations Manager, Terminal Manager)');
    expect(proposeAccountKind(base({ titles: ['VP Intermodal Operations', 'Director Linehaul', 'VP Finance', 'HR Director', 'Controller', 'CFO'] }))).toMatchObject({ proposed: null, strength: 'thin' });
    expect(proposeAccountKind(base({ titles: ['VP Intermodal Operations', 'Director Linehaul', 'Driver Manager', 'Terminal Manager'] }))).toMatchObject({ proposed: null, strength: 'thin' });
  });
  it('a set vertical never flips: a food company with carrier-looking titles and even a Scout 3PL read stays as it is (shipper stays shipper)', () => {
    const p = proposeAccountKind(base({ accountName: 'Tyson Foods', vertical: 'Food & Beverage', scout: scout('3pl'), titles: ['Logistics Manager', 'Director Linehaul', 'Hub Manager', 'Terminal Manager', 'Driver Manager', 'VP Intermodal'] }));
    expect(p).toMatchObject({ current: 'Food & Beverage', proposed: null, strength: 'unchanged' });
    expect(p.doctrine).toMatch(/^unchanged: "Food & Beverage" reads as manufacturer today/);
    expect(p.doctrine).toMatch(/never flips a set vertical/);
  });
  it('a Scout web read of a retailer or a manufacturer proposes Retail or Manufacturing; a kind with no vocabulary value says so and stays Unknown', () => {
    expect(proposeAccountKind(base({ accountName: 'Kroger', scout: scout('retailer') }))).toMatchObject({ proposed: 'Retail', strength: 'strong' });
    expect(proposeAccountKind(base({ accountName: 'Tyson Foods', scout: scout('manufacturer') }))).toMatchObject({ proposed: 'Manufacturing', strength: 'strong' });
    const port = proposeAccountKind(base({ accountName: 'Ports America', scout: scout('port_terminal') }));
    expect(port).toMatchObject({ proposed: null, strength: 'thin' });
    expect(port.evidence.join(' ')).toMatch(/no vocabulary value for port_terminal/);
    expect(proposeAccountKind(base({ accountName: 'Kroger', scout: scout('retailer') })).doctrine).toMatch(/^shipper rules unchanged/);
  });
  it('no evidence at all: Unknown stays Unknown, and the site mix is reported as evidence only, never a reason', () => {
    const p = proposeAccountKind(base({ sites: { audited: 12, self: 3, threePl: 9, jv: 0 } }));
    expect(p).toMatchObject({ proposed: null, strength: 'thin' });
    expect(p.evidence).toContain('audited sites: 12 (self-operated 3, 3PL-operated 9, JV 0): who runs the sites says nothing about what the company is');
  });
  it('every proposal value is in the vocabulary', () => {
    for (const s of ['3pl', 'carrier', 'retailer', 'manufacturer', 'distributor', 'shipper', 'vendor', 'other']) {
      const p = proposeAccountKind(base({ scout: scout(s) }));
      if (p.proposed) expect(VERTICAL_VOCABULARY).toContain(p.proposed);
    }
  });
});
