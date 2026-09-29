/**
 * The canonical AccountIntelligenceBrief (2026-09-29): a PURE projection over
 * the stores GAP already has, every statement under the truth contract, no
 * score, and honest about what it does not know.
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { isValidStatement } from '@/lib/gap/account-intel/truth';

const NOW = new Date('2026-09-29T12:00:00Z');
const site = (id: string, over: Record<string, unknown> = {}) => ({
  id, name: `Site ${id}`, type: 'Distribution center', archetype: '#3', archetypeName: 'Dense DC', confidence: 'high',
  yardMetrics: { dockDoorCount: 60, trailersVisible: 80, trailerParkingCapacity: 120, truckGateCount: 2, buildingCount: 1, siteAreaAcres: 40, railServed: false },
  classification: { dropYard: true, guardShack: true, truckGate: true, preGateStaging: true, fastLaneOpportunity: true, dockDoors: 'large', dropArea: 'large' },
  verification: { verdict: 'confirmed', operator: 'self', tenancy: 'owned', citations: [{ tier: 1, url: 'https://acme.example/dc', date: '2026-05-01', type: 'company', claim: 'Acme DC' }], imageryDate: '2026-04-01', checkedDivestiture: true, rationale: 'x', verifiedBy: 'agent', verifiedAt: '2026-06-01' },
  ...over,
});

const base = (over: Partial<AccountInputs> = {}): AccountInputs => ({
  account: { name: 'Acme Foods', tier: 'Tier 1', priorityBand: 'A', vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
  aliases: ['Acme'],
  domains: ['acmefoods.com'],
  siblings: [],
  watched: true,
  watchReasons: ['Tier 1'],
  facts: [{ id: 'f1', quote: 'Acme Foods will open a new automated distribution center in Reno in 2027.', url: 'https://news.example/reno', title: 'Acme newsroom', publishedAt: '2026-09-10T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event', currentness: null }],
  signals: [],
  lastResearch: { at: '2026-09-20T00:00:00Z', outcome: 'evidence_found' },
  hypotheses: [{ id: 'h1', status: 'draft', observation: 'Acme Foods will open a new automated distribution center in Reno in 2027.', problem: 'My guess is that inbound arrivals at the new DC pile up at the gate.', rootCauses: ['Arrivals are not sequenced'], impacts: ['Detention'], falsification: ['How are inbound trailers staged at the new DC?', 'Every arrival is appointment-scheduled.'], whatANoMeans: 'Arrivals already flow without waiting.', primarySignalId: 'f1' }],
  bids: [],
  personas: [{ id: 1, name: 'Angi Acosta', title: 'VP Distribution', doNotContact: false, hasEmail: true, emailStatus: 'valid' }],
  candidates: [],
  memberships: [],
  firstTouches: [],
  conversation: null,
  opportunity: { status: 'CLEAR', detail: '', deals: [] },
  pack: {
    builtAt: '2026-06-01T00:00:00Z',
    account: { archetype: 'cpg', siteCount: 4, networkCount: 38, networkCountSource: 'FY25 10-K Item 2', networkCountAsOf: '2026-02-01', coverageNote: { auditedCount: 4, estimatedFootprint: 38, legacyYmsFacilityCount: null } },
    network: { totals: { dockDoors: 200, trailerCapacity: 400, gates: 8, railServed: 1, acres: 150 }, sites: [site('01-a'), site('02-b'), site('03-c', { verification: { ...site('x').verification, operator: '3PL', tenancy: 'leased' } }), site('04-d', { verification: { ...site('x').verification, verdict: 'rejected' } })] },
  } as never,
  microsite: { network: { facilityCount: '40+ plants and DCs', facilityTypes: ['Plants', 'DCs'], geographicSpread: 'National', dailyTrailerMoves: '1,500-2,000' }, freight: { primaryModes: ['Truckload', 'Intermodal'], avgLoadsPerDay: '900' }, sections: [{ body: 'Acme uses Blue Yonder WMS.' }] } as never,
  facilityFact: null,
  roi: { hardSavingsAnnual: 2_100_000, totalValueAnnual: 5_400_000, facilities: 38, calculatorVersion: 'v3', assumptions: ['Facility mix from the demo pack audit'] },
  ...over,
});

describe('every statement honors the truth contract', () => {
  it('no statement in any section fails its class requirements', () => {
    const b = buildAccountBrief(base(), NOW);
    for (const s of Object.values(b.sections)) for (const st of s.statements) expect(isValidStatement(st), `${s.key}: ${st.text}`).toBe(true);
    for (const s of Object.values(b.sections)) expect(s.refused, s.key).toEqual([]); // nothing the builder wrote is silently dropped
  });
});

describe('footprint: ownership is never inflated', () => {
  it('3PL-operated sites are not counted as owned; rejected sites are excluded and said so', () => {
    const f = buildAccountBrief(base(), NOW).sections.footprint;
    const text = f.statements.map((s) => s.text).join('\n');
    expect(text).toMatch(/2 self-operated, 1 3PL-operated \(not counted as owned\)/);
    expect(text).toMatch(/1 rejected by verification \(excluded\)/);
    expect(f.statements.find((s) => /38 facilities/.test(s.text))?.truth).toBe('VERIFIED_PUBLIC');
  });
  it('hand-authored microsite copy is INFERENCE, never current truth', () => {
    const f = buildAccountBrief(base(), NOW).sections.footprint;
    const m = f.statements.find((s) => /40\+ plants and DCs/.test(s.text));
    expect(m?.truth).toBe('INFERENCE');
    expect(m?.text).toMatch(/hand-authored, undated/);
  });
});

describe('volume: modeled ranges, never fake precision', () => {
  it('daily trailer moves are a range from audited dock doors, with inputs, formula and assumptions', () => {
    const v = buildAccountBrief(base(), NOW).sections.volume.statements.find((s) => s.truth === 'MODELED_ESTIMATE');
    expect(v?.model).toMatchObject({ inputs: { auditedDockDoors: 180, auditedSites: 3 }, unit: 'trailer moves/day across audited sites' });
    expect(v!.model!.range[0]).toBeLessThan(v!.model!.range[1]);
  });
});

describe('buyer truth outranks public inference', () => {
  it('a confirmed BID about the stack is BUYER_CONFIRMED and listed first in technology', () => {
    const b = buildAccountBrief(base({ bids: [{ id: 'b1', type: 'current_state', summary: 'We use PINC at all 12 plants.', quote: 'We use PINC at all 12 plants.', who: 'VP Distribution', at: '2026-09-25T00:00:00Z', hypothesisId: 'h1' }] }), NOW);
    const t = b.sections.technology.statements;
    expect(t[0]).toMatchObject({ truth: 'BUYER_CONFIRMED' });
    expect(t[0].text).toMatch(/PINC/);
    expect(t.find((s) => /Blue Yonder/.test(s.text))?.truth).toBe('INFERENCE');
  });
  it('a buyer objection keeps the contradiction visible and stops the story', () => {
    const b = buildAccountBrief(base({ bids: [{ id: 'b2', type: 'objection', summary: 'Our gates are not a problem.', quote: 'Our gates are not a problem.', who: 'VP Distribution', at: '2026-09-25T00:00:00Z', hypothesisId: 'h1' }] }), NOW);
    expect(b.hypotheses[0].truth).toBe('CONTRADICTED');
    expect(b.glance.nextAction).toMatch(/^Stop the current story/);
  });
});

describe('honest answers are first-class', () => {
  it('no hypothesis: "No strong hypothesis yet"', () => {
    expect(buildAccountBrief(base({ hypotheses: [] }), NOW).glance.topHypothesis).toBe('No strong hypothesis yet.');
  });
  it('no live verified fact: do not contact yet, research first', () => {
    const b = buildAccountBrief(base({ facts: [], hypotheses: [] }), NOW);
    expect(b.glance.nextAction).toMatch(/^Do not contact yet/);
  });
  it('an open deal: no cold prospecting, work the deal', () => {
    const b = buildAccountBrief(base({ opportunity: { status: 'ACTIVE', detail: '1 open deal', deals: [{ name: 'Acme pilot', stage: 'discovery' }] } }), NOW);
    expect(b.glance.nextAction).toMatch(/^Work the deal/);
    expect(b.thesis.whyNotPursue.join(' ')).toMatch(/open deal/);
  });
  it('every contactable person marked do not contact: do not contact', () => {
    const b = buildAccountBrief(base({ personas: [{ id: 1, name: 'A', title: 'VP', doNotContact: true, hasEmail: true, emailStatus: 'valid' }] }), NOW);
    expect(b.glance.nextAction).toMatch(/^Do not contact yet/);
  });
});

describe('discovery: 3 to 7 questions from the real unknowns', () => {
  it('asks to verify the problem first, then the unknown stack and process; never a generic dump', () => {
    const q = buildAccountBrief(base(), NOW).discovery;
    expect(q.length).toBeGreaterThanOrEqual(3);
    expect(q.length).toBeLessThanOrEqual(7);
    expect(q[0]).toMatchObject({ type: 'VERIFY_PROBLEM', question: 'How are inbound trailers staged at the new DC?' });
    expect(q.map((x) => x.type)).toContain('CURRENT_PROCESS');
  });
  it('a question already answered by the buyer is not asked again', () => {
    const q = buildAccountBrief(base({ bids: [{ id: 'b3', type: 'impact', summary: 'We pay $40k a month in detention.', quote: 'x', who: 'VP', at: '2026-09-25T00:00:00Z', hypothesisId: 'h1' }] }), NOW).discovery;
    expect(q.map((x) => x.type)).not.toContain('IMPACT');
  });
});

describe('site wedge: only audited, self-operated sites, never fictional conditions', () => {
  it('names candidate sites from confirmed self-operated audits; the 3PL and rejected sites are never candidates', () => {
    const w = buildAccountBrief(base(), NOW).wedge;
    expect(w.candidates.map((c) => c.siteId).sort()).toEqual(['01-a', '02-b']);
    expect(w.candidates[0].mustVerify.join(' ')).toMatch(/current yard process/);
    expect(w.archetype).toMatch(/Dense DC/);
  });
  it('no audit data: the wedge is UNKNOWN, not invented', () => {
    const w = buildAccountBrief(base({ pack: null }), NOW).wedge;
    expect(w.candidates).toEqual([]);
    expect(w.archetype).toBeNull();
    expect(w.note).toMatch(/No audited site data/);
  });
});

describe('the thesis is inference, never approved', () => {
  it('is labelled for review and says what would make it wrong and why not to pursue', () => {
    const t = buildAccountBrief(base(), NOW).thesis;
    expect(t.status).toBe('INFERENCE, for your review (never approved by GAP)');
    expect(t.wrongIf).toBe('Arrivals already flow without waiting.');
    const bare = buildAccountBrief(base({ facts: [] }), NOW).thesis;
    expect(bare.whyNotPursue.join(' ')).toMatch(/No live verified fact/);
    // the draft's observation is no longer live: it cannot lead
    expect(bare.whatMayBeBroken).toMatch(/^Unknown: No strong hypothesis yet \(1 ungrounded draft/);
  });
});

describe('sections carry status, never a score', () => {
  it('technology with only an inference is MODELED; commercial with a clear deal read is KNOWN', () => {
    const b = buildAccountBrief(base(), NOW);
    expect(b.sections.technology.status).toBe('MODELED');
    expect(b.sections.commercial.status === 'KNOWN' || b.sections.commercial.status === 'PARTIAL').toBe(true);
    expect(JSON.stringify(b)).not.toMatch(/"score"/);
  });
});

describe('real-data fixes (PepsiCo / General Mills / Kroger dogfood)', () => {
  it('the best fact and why-now follow seller relevance: a network redesign beats a newer foreign divestiture', () => {
    const facts = [
      { id: 'div', quote: 'During the quarter we entered into a definitive agreement to sell our business in Brazil.', url: 'https://sec.example/q', title: '10-Q', publishedAt: '2026-09-23T00:00:00Z', expiresAt: '2027-01-21T00:00:00Z', continuity: 'event' as const, currentness: null },
      { id: 'net', quote: 'Acme Foods will redesign the plant and warehouse network behind its three largest brands.', url: 'https://news.example/net', title: 'news', publishedAt: '2026-07-02T00:00:00Z', expiresAt: '2026-10-30T00:00:00Z', continuity: 'event' as const, currentness: null },
    ];
    const b = buildAccountBrief(base({ facts }), NOW);
    expect(b.glance.bestFact).toMatch(/redesign the plant and warehouse network/);
    expect(b.glance.whyNow).toMatch(/redesign/);
  });

  it('a hypothesis not grounded in a live verified fact never leads: "No strong hypothesis yet" and the drafts are counted', () => {
    const h = { ...base().hypotheses[0], id: 'kw', observation: 'PEP 10-Q mentions: capital expenditure', problem: 'My guess is that physical handoffs constrain production capacity, and the signals above are where that pressure shows first.', primarySignalId: 'kw-signal' };
    const b = buildAccountBrief(base({ hypotheses: [h] }), NOW);
    expect(b.glance.topHypothesis).toBe('No strong hypothesis yet (1 ungrounded draft exists: its observation is not a live verified fact).');
    expect(b.hypotheses[0].grounded).toBe(false);
  });

  it('a vendor is labelled with what it does (autonomous freight is not a yard system)', () => {
    const facts = [{ id: 'g', quote: 'Gatik moves freight for Acme Foods across 250 stores.', url: 'https://news.example/g', title: 'news', publishedAt: '2026-08-25T00:00:00Z', expiresAt: '2026-12-23T00:00:00Z', continuity: 'ongoing_state' as const, currentness: null }];
    const t = buildAccountBrief(base({ facts }), NOW).sections.technology.statements.find((s) => /Gatik/.test(s.text));
    expect(t?.text).toMatch(/^Gatik \(autonomous freight; PUBLIC MENTION, 2026-08-25\)/);
  });

  it('an open deal: "Work the deal" with the next learning as its own question', () => {
    const b = buildAccountBrief(base({ opportunity: { status: 'ACTIVE', detail: '', deals: [{ name: 'Acme pilot', stage: 'discovery' }] } }), NOW);
    expect(b.glance.nextAction).toBe('Work the deal (In Deals), never cold. Next learning: the question below.');
  });
});

describe('review fixes (Release A reviewer)', () => {
  const h1 = (over: Record<string, unknown> = {}) => ({ ...base().hypotheses[0], ...over });
  const bidOf = (over: Record<string, unknown>) => ({ id: 'b1', type: 'business_problem', summary: 'Trucks wait two hours at the gate.', quote: 'Trucks wait two hours at the gate.', who: 'ops@acme.example', at: '2026-09-20T00:00:00Z', hypothesisId: 'h1', ...over });

  it('a BID confirms or contradicts only ITS hypothesis, never every hypothesis on the account', () => {
    const other = h1({ id: 'h2', primarySignalId: null, problem: 'My guess is that detention is high.' });
    const b = buildAccountBrief(base({ hypotheses: [h1(), other], bids: [bidOf({ type: 'objection', hypothesisId: 'h2' })] }), NOW);
    expect(b.hypotheses.find((h) => h.id === 'h1')?.truth).toBe('INFERENCE');
    expect(b.hypotheses.find((h) => h.id === 'h2')?.truth).toBe('CONTRADICTED');
    const c = buildAccountBrief(base({ hypotheses: [h1(), other], bids: [bidOf({ hypothesisId: 'h1' })] }), NOW);
    expect(c.hypotheses.find((h) => h.id === 'h2')?.truth).toBe('INFERENCE');
    expect(c.hypotheses.find((h) => h.id === 'h1')?.truth).toBe('BUYER_CONFIRMED');
  });

  it('a draft Casey withdrew is not a buyer rejection and never leads', () => {
    const b = buildAccountBrief(base({ hypotheses: [h1({ status: 'rejected' })] }), NOW);
    expect(b.hypotheses).toEqual([]);
    expect(b.glance.nextAction).not.toMatch(/Stop the current story/);
  });

  it('a site without verification is not self-operated; unknown operators are counted, not dropped', () => {
    const p = base().pack!;
    const sites = [site('01-a'), site('02-b', { verification: undefined }), site('03-c', { verification: { ...site('x').verification, operator: 'unknown' } })];
    const f = buildAccountBrief(base({ pack: { ...p, network: { ...p.network, sites } } as never }), NOW).sections.footprint;
    expect(f.statements.map((s) => s.text).join('\n')).toMatch(/3 sites audited: 1 self-operated, 0 3PL-operated \(not counted as owned\), 1 operator unknown, 1 not yet verified; 0 rejected/);
  });

  it('uncited audit data is INFERENCE, not Verified (rail, yard features, trailers)', () => {
    const p = base().pack!;
    const probable = (id: string) => site(id, { verification: { ...site('x').verification, verdict: 'probable', citations: [] } });
    const b = buildAccountBrief(base({ pack: { ...p, network: { ...p.network, sites: [probable('01-a'), probable('02-b')] } } as never }), NOW);
    expect(b.sections.freight.statements.find((s) => /rail-served/.test(s.text))?.truth).toBe('INFERENCE');
    expect(b.sections.yard.statements.find((s) => /drop yard/.test(s.text))?.truth).toBe('INFERENCE');
    expect(b.sections.volume.statements.find((s) => /trailers visible/.test(s.text))?.truth).toBe('INFERENCE');
  });

  it('a place name is not a vendor, and "pilot plant" is not a pilot', () => {
    const fact = (quote: string) => ({ ...base().facts[0], id: quote.slice(0, 8), quote });
    const b = buildAccountBrief(base({ facts: [fact('Acme Foods opened a distribution center in Aurora, Illinois and a pilot plant in Manhattan, Kansas.'), fact('Acme Foods uses Oracle for planning.')] }), NOW);
    const text = b.sections.technology.statements.map((s) => s.text).join('\n');
    expect(text).not.toMatch(/^Aurora|^Manhattan/m);
    expect(text).toMatch(/^Oracle \(ERP \/ supply chain software; PUBLIC MENTION/m);
    expect(b.glance.currentTech).toMatch(/^Public mention only: Oracle/);
  });

  it('the glance commercial state is the deal truth, never a BID or a touch', () => {
    const b = buildAccountBrief(base({ opportunity: { status: 'UNKNOWN', detail: 'timeout', deals: [] }, bids: [bidOf({ type: 'objection', hypothesisId: 'hx' })] }), NOW);
    expect(b.glance.commercialState).toMatch(/^HubSpot deal state could not be read/);
  });

  it('a refused statement is said, not silently dropped (a point-estimate ROI)', () => {
    const b = buildAccountBrief(base({ roi: { hardSavingsAnnual: 1_000_000, totalValueAnnual: 1_000_000, facilities: 3, calculatorVersion: null, assumptions: ['x'] } }), NOW);
    expect(b.sections.economics.refused[0]).toMatch(/^modeled_point_estimate: /);
  });
});
