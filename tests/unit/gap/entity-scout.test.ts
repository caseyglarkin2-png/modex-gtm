/**
 * Release B1: SCOUT, the cheap first pass on a company GAP does not know. The
 * verdict is DERIVED from cited evidence, never taken from the model's opinion:
 * a shipper with cited network evidence is LIKELY ICP, a shipper without it is
 * MAYBE, a 3PL / carrier / broker / vendor is NOT ICP, a name that could be
 * several companies is AMBIGUOUS, and nothing usable is INSUFFICIENT. A claim
 * without a URL is never evidence.
 */
import { describe, expect, it } from 'vitest';
import { classifyByName, deriveVerdict, parseScout, scoutCompany } from '@/lib/gap/entity/scout';

describe('name rules (free, deterministic)', () => {
  it('flags carriers, brokers, 3PLs and vendors by name; says nothing about a plain name', () => {
    expect(classifyByName('Werner Enterprises Trucking').entityType).toBe('carrier');
    expect(classifyByName('Acme Freight Brokerage LLC').entityType).toBe('broker');
    expect(classifyByName('Summit Logistics Group').entityType).toBe('3pl');
    expect(classifyByName('Yardly Software Inc').entityType).toBe('vendor');
    expect(classifyByName('Harbor Foods Group').entityType).toBeNull();
    expect(classifyByName('Costa Farms').entityType).toBeNull();
  });

  it('a name rule alone never says LIKELY ICP', () => {
    expect(classifyByName('Harbor Foods Group').verdict).toBe('INSUFFICIENT');
    expect(classifyByName('Summit Logistics Group').verdict).toBe('NOT_ICP');
  });
});

describe('verdict is derived from cited evidence', () => {
  const net = [{ claim: 'Operates 12 distribution centers across the Southeast.', url: 'https://harborfoods.example/about' }];
  it('shipper + cited network evidence is LIKELY ICP; without it MAYBE', () => {
    expect(deriveVerdict({ entityType: 'shipper', network: net, freight: [], ambiguous: false })).toBe('LIKELY_ICP');
    expect(deriveVerdict({ entityType: 'shipper', network: [], freight: [], ambiguous: false })).toBe('MAYBE_ICP');
  });
  it('3PL, carrier, broker, vendor are NOT ICP; ambiguous identity wins; unknown type is INSUFFICIENT', () => {
    for (const t of ['3pl', 'carrier', 'broker', 'vendor'] as const) expect(deriveVerdict({ entityType: t, network: net, freight: [], ambiguous: false })).toBe('NOT_ICP');
    expect(deriveVerdict({ entityType: 'shipper', network: net, freight: [], ambiguous: true })).toBe('AMBIGUOUS');
    expect(deriveVerdict({ entityType: null, network: [], freight: [], ambiguous: false })).toBe('INSUFFICIENT');
  });
});

describe('parse: a claim without a URL is never evidence', () => {
  const text = '```json\n{"entityType":"shipper","domain":"harborfoods.com","ambiguous":false,"what":"Foodservice distributor","network":[{"claim":"Operates 12 distribution centers.","url":"https://harborfoods.example/about"},{"claim":"Has a big private fleet.","url":""}],"freight":[{"claim":"Runs a private fleet of 300 tractors.","url":"https://news.example/fleet"}],"unknowns":["Who owns the yards"]}\n```';
  it('drops uncited claims into unknowns and keeps cited ones', () => {
    const p = parseScout(text)!;
    expect(p.network).toEqual([{ claim: 'Operates 12 distribution centers.', url: 'https://harborfoods.example/about' }]);
    expect(p.freight).toHaveLength(1);
    expect(p.unknowns).toContain('Uncited claim (not evidence): Has a big private fleet.');
    expect(p.domain).toBe('harborfoods.com');
  });
  it('refuses a non-http URL (javascript:) as evidence', () => {
    const p = parseScout('{"entityType":"shipper","network":[{"claim":"x sites","url":"javascript:alert(1)"}],"freight":[],"unknowns":[]}')!;
    expect(p.network).toEqual([]);
  });
  it('garbage is null', () => {
    expect(parseScout('no json here')).toBeNull();
  });
});

describe('scoutCompany', () => {
  it('a name-rule NOT ICP never spends a web call', async () => {
    let calls = 0;
    const r = await scoutCompany('Summit Logistics Group', { ask: async () => { calls += 1; return ''; } });
    expect(calls).toBe(0);
    expect(r.verdict).toBe('NOT_ICP');
    expect(r.basis).toBe('name_rules');
  });
  it('runs the web pass and derives the verdict from its citations', async () => {
    const r = await scoutCompany('Harbor Foods Group', { ask: async () => '{"entityType":"shipper","domain":"harborfoods.com","ambiguous":false,"what":"Foodservice distributor","network":[{"claim":"Operates 12 distribution centers.","url":"https://harborfoods.example/about"}],"freight":[],"unknowns":[]}' });
    expect(r.verdict).toBe('LIKELY_ICP');
    expect(r.basis).toBe('web');
    expect(r.why).toMatch(/shipper with cited network evidence/);
  });
  it('no web search configured or a failed call is INSUFFICIENT, said plainly', async () => {
    const r = await scoutCompany('Harbor Foods Group', { ask: async () => { throw new Error('quota'); } });
    expect(r.verdict).toBe('INSUFFICIENT');
    expect(r.why).toMatch(/web pass failed/);
  });
});
