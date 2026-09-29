/**
 * SCOUT (Releases B1 and J). ENTITY TYPE is descriptive; the stored verdict is the YARDFLOW FIT, derived from
 * cited operating evidence (entity/fit.ts), never from the label: a 3PL, carrier or terminal that runs
 * facilities is a direct buyer. Name rules settle only the genuinely obvious. A claim without a URL is never
 * evidence; a failed web pass stores nothing.
 */
import { describe, expect, it } from 'vitest';
import { classifyByName, deriveVerdict, parseScout, scoutCompany } from '@/lib/gap/entity/scout';

describe('name rules (free, deterministic)', () => {
  it('guess the type of a carrier, broker, 3PL or terminal, and leave the fit open', () => {
    expect(classifyByName('Werner Enterprises Trucking')).toMatchObject({ entityType: 'carrier', verdict: 'UNKNOWN', final: false });
    expect(classifyByName('Acme Freight Brokerage LLC')).toMatchObject({ entityType: 'broker', verdict: 'UNKNOWN', final: false });
    expect(classifyByName('Summit Logistics Group')).toMatchObject({ entityType: '3pl', verdict: 'UNKNOWN', final: false });
    expect(classifyByName('Harbor Foods Group')).toMatchObject({ entityType: null, verdict: 'UNKNOWN', final: false });
  });
  it('settle only the genuinely obvious (software, media, finance, law enforcement, us)', () => {
    for (const n of ['FreightRoll', 'Transport Topics', 'Blackstone', 'Balyasny Asset Mangement', 'Motorcycle Section Suffolk County Sheriffs Office', 'Yardly Software Inc']) {
      expect(classifyByName(n), n).toMatchObject({ verdict: 'NOT_FIT', final: true });
    }
    expect(classifyByName('FreightRoll').why).toMatch(/our own company/);
  });
  it('REGRESSION: a logistics, transportation, distribution-services, carrier or broker name is never rejected by name', () => {
    for (const n of ['Forward Air', 'Gnosis Freight', 'Escutia express', 'Logistic Group of America', 'ABC Transportation', 'ABC Distribution Services', 'Freight Buyers Club', 'Nike SA E2E Supply Chain Optimization Expert', 'AkzoNobel', 'Costa Farms']) {
      expect(classifyByName(n).final, n).toBe(false);
    }
  });
});

describe('the fit comes from cited operations, not the label', () => {
  const net = [{ claim: 'Operates 12 distribution centers across the Southeast.', url: 'https://harborfoods.example/about' }, { claim: 'Runs a private fleet of 300 tractors.', url: 'https://harborfoods.example/fleet' }];
  it('a shipper with operations is a direct buyer; without them a potential one', () => {
    expect(deriveVerdict({ entityType: 'shipper', network: net, freight: [], ambiguous: false })).toBe('DIRECT_BUYER');
    expect(deriveVerdict({ entityType: 'shipper', network: [], freight: [], ambiguous: false })).toBe('POTENTIAL_DIRECT_BUYER');
  });
  it('a 3PL, carrier or terminal operator with operations is a direct buyer; a pure broker is not; a vendor never is', () => {
    for (const t of ['3pl', 'carrier', 'port_terminal'] as const) expect(deriveVerdict({ entityType: t, network: net, freight: [], ambiguous: false })).toBe('DIRECT_BUYER');
    expect(deriveVerdict({ entityType: 'broker', network: [], freight: [], ambiguous: false })).toBe('NOT_FIT');
    expect(deriveVerdict({ entityType: 'vendor', network: net, freight: [], ambiguous: false, what: 'Yard management software.' })).toBe('PARTNER');
    expect(deriveVerdict({ entityType: 'shipper', network: net, freight: [], ambiguous: true })).toBe('UNKNOWN');
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
    expect(parseScout('{"entityType":"shipper","domain":"https://www.akzonobel.com/en","network":[],"freight":[],"unknowns":[]}')!.domain).toBe('akzonobel.com');
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
  it('a genuinely obvious name never spends a web call', async () => {
    let calls = 0;
    const r = await scoutCompany('Acme Staffing', { ask: async () => { calls += 1; return ''; } });
    expect(calls).toBe(0);
    expect(r).toMatchObject({ verdict: 'NOT_FIT', basis: 'name_rules' });
  });
  it('a logistics name IS checked, and a 3PL running DCs comes back a direct buyer', async () => {
    let calls = 0;
    const r = await scoutCompany('Summit Logistics Group', { ask: async () => { calls += 1; return '{"entityType":"3pl","domain":"summitlog.example","ambiguous":false,"what":"Contract logistics provider","network":[{"claim":"Operates 40 distribution centers for retail and CPG customers.","url":"https://summitlog.example/network"}],"freight":[{"claim":"Runs a dedicated fleet of 800 tractors and 3,000 trailers.","url":"https://summitlog.example/fleet"}],"unknowns":[]}'; } });
    expect(calls).toBe(1);
    expect(r).toMatchObject({ verdict: 'DIRECT_BUYER', entityType: '3pl', basis: 'web' });
    expect(r.why).toMatch(/owns yard problems even without owning the freight/);
  });
  it('a failed call is a failure (never a verdict), said plainly', async () => {
    const r = await scoutCompany('Harbor Foods Group', { ask: async () => { throw new Error('quota'); } });
    expect(r.failed).toBe(true);
    expect(r.why).toMatch(/web pass failed/);
  });
});
