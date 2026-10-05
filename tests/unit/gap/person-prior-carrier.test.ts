/**
 * CARRIER / PARCEL / 3PL NETWORK DOCTRINE (owner resolution, 2026-10-05). At a carrier transportation IS the company:
 * the equivalent of a shipper's transportation owner runs the physical network (network, hub, terminal, linehaul,
 * sortation, operations planning and engineering). A bare "operations" title at a company with thousands of local
 * operating leaders is not promoted on seniority: its scope is what the title says. The air side is not the ground
 * network. Patterns, never people.
 */
import { describe, expect, it } from 'vitest';
import { isColdWho, rankWho, readPerson, type WhoCandidate } from '@/lib/gap/people/person-prior';
import { entityBoundaryFor } from '@/lib/gap/people/entity-boundary';

const read = (t: string, entityType = 'carrier', location?: string) => readPerson(t, { entityType, location });
const lane = (t: string, entityType = 'carrier') => read(t, entityType).lane;
const p = (key: string, title: string, over: Partial<WhoCandidate> = {}): WhoCandidate => ({ key, name: key, title, reachable: true, ...over });

describe('the carrier network owner is a direct operator', () => {
  it('network, hub, terminal, linehaul, sortation and operations planning / engineering titles run the physical network', () => {
    for (const t of [
      'Vice President - Operations Planning and Engineering - North America',
      'Vice President Network Operations',
      'Managing Director - Linehaul / Transportation',
      'Senior Manager - Linehaul Operations',
      'Director, Terminal Operations',
      'Director Hub Operations',
      'VP Surface Operations',
      'Director of Sortation Operations',
      'Senior Manager Operations HUBS & Networks BeLux',
      'Vice President Road Network - Northern Europe',
    ])
      expect([t, lane(t)]).toEqual([t, 'PRIMARY_OPERATOR']);
  });
  it('a ground network title owns the network by name (ownership 2) and is cold WHO; the NA remit reads as North America', () => {
    const r = read('Vice President - Operations Planning and Engineering - North America', 'carrier', 'Plano, Texas, United States');
    expect(r).toMatchObject({ lane: 'PRIMARY_OPERATOR', ownership: 2, geo: 'NA_REMIT', scope: 'NETWORK', market: 'US' });
    expect(isColdWho(r)).toBe(true);
    expect(r.laneWhy).toMatch(/runs the carrier's physical network/);
  });
  it('the same titles at a shipper keep the shipper reading (planning and engineering is not the freight owner there)', () => {
    expect(lane('Vice President - Operations Planning and Engineering - North America', 'manufacturer')).not.toBe('PRIMARY_OPERATOR');
    expect(lane('Vice President Operations', 'manufacturer')).toBe('ADJACENT_OPERATOR');
  });
});

describe('operations technology at a carrier is the freight-scoped technology owner, never the cold default', () => {
  it('ops technology, operations technology product management and assets / infrastructure / ops technology', () => {
    for (const t of ['Senior Vice President - Global Assets, Infrastructure and Ops Technology', 'Vice President Operations Technology Product Management', 'Managing Director Ops Technology', 'Managing Director Operations Technology']) {
      const r = read(t);
      expect([t, r.lane, r.ownership]).toEqual([t, 'TRANSFORMATION_TECH', 2]);
      expect(isColdWho(r)).toBe(false);
      expect(isColdWho(r, { initiative: 'Network 2.0 technology' })).toBe(true);
    }
  });
  it('tax operations and generic airline technology are not operations technology', () => {
    expect(lane('Director, Tax Operations & Technology')).toBe('PROCUREMENT_COMMERCIAL');
    expect(lane('Vice President, Airline Technology')).toBe('NON_OPERATING');
  });
});

describe('the air side is not the ground network', () => {
  it('flight operations, aircraft and airline titles are adjacent (the air side), not the hubs and yards', () => {
    for (const t of ['Vice President Flight Ops, Training and GOCC, FAA 119 Director of Ops', 'Senior Vice President, Flight Operations & Network Planning', 'Managing Director Flight Technical Operations']) {
      const r = read(t);
      expect([t, r.lane]).toEqual([t, 'ADJACENT_OPERATOR']);
      expect(isColdWho(r)).toBe(false);
    }
  });
  it('air network operations runs the air hubs: a direct operator with less named ownership than a ground title', () => {
    const r = read('President Air Network Operations');
    expect(r).toMatchObject({ lane: 'PRIMARY_OPERATOR', ownership: 1 });
    expect(r.laneWhy).toMatch(/air network/);
    const ground = read('Vice President Network Operations');
    expect(rankWho([p('air', 'President Air Network Operations'), p('ground', 'Vice President Network Operations')], { entityType: 'carrier' })[0].candidate.key).toBe('ground');
  });
});

describe('a bare "operations" title at a carrier is not promoted on seniority', () => {
  it('its scope is what the title says: district / station is one site; enterprise / regional / network is the network; nothing stated is unknown', () => {
    expect(read('District Managing Director- Operations').scope).toBe('SITE');
    expect(read('Station Manager').scope).toBe('SITE');
    expect(read('Vice President, Gulf Regional Operations').scope).toBe('NETWORK');
    const bare = read('Managing Director of Operations');
    expect(bare.lane).toBe('PRIMARY_OPERATOR');
    expect(bare.scope).toBe('UNKNOWN');
    expect(bare.laneWhy).toMatch(/scope not stated: may be one station or district/);
    // A shipper's director of transportation still infers network scope from seniority (unchanged).
    expect(readPerson('Director of Transportation').scope).toBe('NETWORK');
  });
  it('a North America network planner outranks a bare operations VP, who outranks a district managing director', () => {
    const ranked = rankWho(
      [p('district', 'District Managing Director- Operations', { location: 'Champaign, Illinois, United States' }), p('vp', 'Vice President of Operations', { location: 'Miami, Florida, United States' }), p('na', 'Vice President - Operations Planning and Engineering - North America', { location: 'Plano, Texas, United States' })],
      { entityType: 'carrier' },
    );
    expect(ranked.map((r) => r.candidate.key)).toEqual(['na', 'vp', 'district']);
  });
  it('an analyst or coordinator of network operations is a support role, not the operator', () => {
    expect(lane('Network Operations Analyst')).toBe('NEEDS_REVIEW');
    expect(lane('Custom Trade Coordinator')).toBe('NEEDS_REVIEW');
  });
  it('people, revenue, HR and customer operations at a carrier are never the network (unchanged)', () => {
    for (const t of ['VP People Operations', 'Director Revenue Operations', 'Vice President, Global Sales Operations', 'Managing Director Customer Experience Pickup Coordination Transportation'])
      expect([t, lane(t)]).not.toEqual([t, 'PRIMARY_OPERATOR']);
  });
});

describe('entity boundary: a known corporate transaction outranks stale CRM data', () => {
  it('FedEx Supply Chain was sold to CMA CGM on 2026-10-01: divested, with the date', () => {
    expect(entityBoundaryFor('FedEx', { title: 'President, FedEx Supply Chain' })).toMatchObject({ unit: 'FedEx Supply Chain', status: 'divested', since: '2026-10-01' });
    expect(entityBoundaryFor('FedEx Corporation', { title: 'Vice President', company: 'GENCO, A FedEx Company' })?.status).toBe('divested');
  });
  it('FedEx Logistics and FedEx Freight are separate operating companies: flagged, not divested', () => {
    expect(entityBoundaryFor('FedEx', { title: 'Director, Worldwide Sales-FedEx Logistics' })).toMatchObject({ unit: 'FedEx Logistics', status: 'separate' });
    expect(entityBoundaryFor('FedEx', { title: 'VP Operations', company: 'FedEx Freight' })).toMatchObject({ unit: 'FedEx Freight', status: 'separate' });
  });
  it('FedEx Ground is FedEx; another account has no FedEx boundaries; an email domain never decides', () => {
    expect(entityBoundaryFor('FedEx', { title: 'District Managing Director- Operations', company: 'FedEx Ground' })).toBeNull();
    expect(entityBoundaryFor('PepsiCo', { title: 'President, FedEx Supply Chain' })).toBeNull();
    expect(entityBoundaryFor('FedEx', { title: 'Vice President Network Operations', company: null })).toBeNull();
  });
});
