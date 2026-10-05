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
    // V2 operator review: a 3PL-run yard is a shared decision through the 3PL contract, never "not theirs".
    expect(text).toMatch(/2 self-operated, 1 run by a 3PL \(a shared decision through the 3PL contract\)/);
    expect(text).toMatch(/1 rejected by verification \(excluded\)/);
    // a named filing without a link is a lead, said so (red team: never VERIFIED without the source)
    expect(f.statements.find((s) => /38 facilities/.test(s.text))).toMatchObject({ truth: 'INFERENCE', text: 'About 38 facilities (per FY25 10-K Item 2, not linked)' });
  });
  it('hand-authored microsite copy is INFERENCE, never current truth', () => {
    const f = buildAccountBrief(base(), NOW).sections.footprint;
    const m = f.statements.find((s) => /40\+ plants and DCs/.test(s.text));
    expect(m?.truth).toBe('INFERENCE');
    expect(m?.text).toMatch(/hand-authored, undated/);
  });
});

describe('volume: modeled ranges, never fake precision', () => {
  it('door turns are ONE unit, theoretical capacity, with the live-vs-drop assumption stated (V2 operator review)', () => {
    const b = buildAccountBrief(base(), NOW);
    const v = b.sections.volume.statements.find((s) => s.truth === 'MODELED_ESTIMATE');
    expect(v?.model).toMatchObject({ inputs: { auditedDockDoors: 120, auditedSites: 2 }, unit: 'door turns/day (theoretical capacity) across self-operated audited sites', range: [120, 720] });
    expect(v!.text).toMatch(/^Theoretical door capacity: roughly 120-720 door turns a day if every door .* is active \(not measured\)$/);
    expect(v!.model!.assumptions.join(' ')).toMatch(/drop vs live loading \(unknown\)/);
    expect(v!.model!.assumptions.join(' ')).not.toMatch(/at least two yard moves/);
    // The wedge never calls the same arithmetic "trailer moves".
    expect(JSON.stringify(b.wedge)).not.toMatch(/trailer moves a day/);
  });
  it('a trailer count over sites names its imagery dates (a range when they differ) and flags imagery over two years old', async () => {
    const { imagerySpan } = await import('@/lib/gap/account-intel/build');
    expect(imagerySpan(['2026-05-01', '2026-05-01'], NOW)).toBe('on imagery dated 2026-05-01');
    expect(imagerySpan(['2026-05-01', '2025-09-12'], NOW)).toBe('on imagery dated 2025-09-12 to 2026-05-01 (different dates: a sum, not one snapshot)');
    expect(imagerySpan(['2023-04-01'], NOW)).toMatch(/imagery over two years old/);
    expect(imagerySpan([null], NOW)).toBe('imagery date not recorded');
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
    expect(b.glance.nextAction).toMatch(/^Do not contact yet: the buyer contradicted the current story/);
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
  it('GAP order (red team): current state first, then verify the problem, root cause, impact; never a generic dump', () => {
    const q = buildAccountBrief(base(), NOW).discovery;
    expect(q.length).toBeGreaterThanOrEqual(3);
    expect(q.length).toBeLessThanOrEqual(7);
    expect(q.slice(0, 4).map((x) => x.type)).toEqual(['CURRENT_PROCESS', 'VERIFY_PROBLEM', 'ROOT_CAUSE', 'IMPACT']);
    expect(q[1].question).toBe('How are inbound trailers staged at the new DC?');
    // never a satellite-found site name put to the buyer, and the impact question presumes nothing
    expect(q[0].question).toBe('How do trailers get checked in and found at your plants and DCs today?');
    expect(q[3].question).toMatch(/^Is yard time something you measure today\?/);
  });

  it('with no grounded thesis, the problem question is open: the buyer names the problem', () => {
    const q = buildAccountBrief(base({ hypotheses: [] }), NOW).discovery;
    expect(q[1]).toMatchObject({ type: 'VERIFY_PROBLEM', question: 'What slows trucks and trailers down at your plants and DCs, if anything?' });
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
    expect(b.glance.nextAction).toBe('Work the deal from In Deals (Acme pilot, discovery), never cold. Its deal brief sets what to learn next.');
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
    expect(f.statements.map((s) => s.text).join('\n')).toMatch(/3 sites audited: 1 self-operated, 0 run by a 3PL \(a shared decision through the 3PL contract\), 1 operator unknown, 1 not yet verified; 0 rejected/);
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

describe('a network count that is our own estimate is never VERIFIED (PepsiCo dogfood)', () => {
  it('an estimate or extrapolation source is INFERENCE; a named filing with a URL is VERIFIED and linked', () => {
    const p = base().pack!;
    const est = buildAccountBrief(base({ pack: { ...p, account: { ...p.account, networkCount: 105, networkCountSource: "YardFlow estimate of Acme's footprint, extrapolated from the 30 sites we satellite-mapped" } } as never }), NOW);
    expect(est.sections.footprint.statements.find((s) => /105 facilities/.test(s.text))?.truth).toBe('INFERENCE');
    const filed = buildAccountBrief(base({ pack: { ...p, account: { ...p.account, networkCount: 28, networkCountSource: 'FY2025 Form 10-K, Item 2 Properties. https://sec.example/10k' } } as never }), NOW);
    const s = filed.sections.footprint.statements.find((x) => /28 facilities/.test(x.text));
    expect(s?.truth).toBe('VERIFIED_PUBLIC');
    expect(s?.sources[0].url).toBe('https://sec.example/10k');
  });
});

describe('Scout leads carry into the brief as INFERENCE, never verified (B + A: one intelligence)', () => {
  it('an added account keeps what Scout found, labelled a lead with its link', () => {
    const b = buildAccountBrief(base({ scout: { domain: 'harborfoods.com', what: 'Foodservice distributor', entityType: 'shipper', network: [{ claim: 'Operates 12 distribution centers.', url: 'https://harborfoods.example/about' }], freight: [{ claim: 'Runs a private fleet.', url: 'https://news.example/fleet' }], at: '2026-09-29T00:00:00Z' } }), NOW);
    const net = b.sections.footprint.statements.find((s) => /12 distribution centers/.test(s.text));
    expect(net).toMatchObject({ truth: 'INFERENCE', text: 'Operates 12 distribution centers. (Scout lead, not yet verified at source)' });
    expect(net?.sources[0].url).toBe('https://harborfoods.example/about');
    expect(b.sections.freight.statements.find((s) => /private fleet/.test(s.text))?.truth).toBe('INFERENCE');
    expect(b.sections.identity.statements.find((s) => /^Scout:/.test(s.text))?.text).toBe('Scout: a shipper; Foodservice distributor (harborfoods.com)');
  });
});

describe('dogfood fixes (Release H)', () => {
  it('a sensitive best fact is flagged in why now and in why not pursue (Tyson: a plant closure, jobs lost)', () => {
    const quote = 'Acme Foods announced the closure of its plant in Joslin, throwing more than 2,500 workers out of work.';
    const b = buildAccountBrief(base({ facts: [{ ...base().facts[0], quote }] }), NOW);
    expect(b.thesis.whyNow).toMatch(/SENSITIVE \(people lost their jobs\): never the hook/);
    expect(b.thesis.whyNotPursue.join(' ')).toMatch(/The best fact is sensitive/);
  });
  it('REGRESSION (Release J): a 3PL that runs audited sites is a DIRECT BUYER, never a "partner" by label', () => {
    const b = buildAccountBrief(base({ account: { ...base().account, vertical: '3PL / Logistics' } }), NOW);
    expect(b.fit).toMatchObject({ entityType: '3pl', fit: 'DIRECT_BUYER' });
    expect(b.glance.fit).toBe('3PL / contract logistics · Direct buyer');
    expect(b.motion.type).toBe('FACT_LED');
    expect(b.thesis.whyNotPursue.join(' ')).not.toMatch(/partner|shipper prospect/i);
  });
  it('with no live fact, "research first" points at catalysts on the account page', () => {
    expect(buildAccountBrief(base({ facts: [] }), NOW).glance.nextAction).toBe('Do not contact yet: no verified fact and no relationship to open with. Research first (Deepen catalysts on this page).');
  });
});

describe('red team fixes (Release I)', () => {
  it('a buyer-rejected thesis shows as contradicted (never vanishes); a withdrawn draft stays hidden', () => {
    const h = { ...base().hypotheses[0], status: 'rejected', buyerRejected: true };
    const b = buildAccountBrief(base({ hypotheses: [h] }), NOW);
    expect(b.hypotheses[0].truth).toBe('CONTRADICTED');
    expect(b.motion.type).toBe('NO_GOOD_MOTION');
    expect(buildAccountBrief(base({ hypotheses: [{ ...h, buyerRejected: false }] }), NOW).hypotheses).toEqual([]);
  });
  it('a status of confirmed without a live BID is not buyer truth', () => {
    const b = buildAccountBrief(base({ hypotheses: [{ ...base().hypotheses[0], status: 'confirmed' }] }), NOW);
    expect(b.hypotheses[0].truth).toBe('INFERENCE');
  });
  it('an inference keeps its label in the glance and the thesis', () => {
    const b = buildAccountBrief(base(), NOW);
    expect(b.glance.topHypothesis).toMatch(/^Inference: /);
    expect(b.thesis.whatMayBeBroken).toMatch(/^Inference: /);
  });
  it('a vendor marketing fact never leads when an account fact exists', () => {
    const vendor = { ...base().facts[0], id: 'v1', quote: 'Gatik moves freight for Acme Foods across 250 stores and a new distribution center network.', publishedAt: '2026-09-20T00:00:00Z' };
    expect(buildAccountBrief(base({ facts: [vendor, base().facts[0]] }), NOW).glance.bestFact).toMatch(/^Acme Foods will open/);
  });
  it('sourcing, procurement and planning titles are never "who probably owns it"; the most senior operations title is', () => {
    const personas = [
      { id: 1, name: 'Sam Sourcing', title: 'Enterprise Sourcing Category Manager - Ground Transportation', doNotContact: false, hasEmail: true, emailStatus: 'valid' },
      { id: 2, name: 'Mia Manager', title: 'Distribution Manager', doNotContact: false, hasEmail: true, emailStatus: 'valid' },
      { id: 3, name: 'Val VP', title: 'VP Supply Chain Operations', doNotContact: false, hasEmail: true, emailStatus: 'valid' },
    ];
    // Operator-first (2026-10-04): a VP Supply Chain Operations is the sponsor, never the likely owner.
    expect(buildAccountBrief(base({ personas }), NOW).glance.likelyOwner).toBe('Unknown: transportation owner not yet identified: research required. Sponsor on record: Val VP, VP Supply Chain Operations (adjacent operator).');
  });
  it('a software vendor record is never a direct buyer: a partner when it serves logistics, else not a fit', () => {
    const vendor = base({ account: { ...base().account, vertical: 'Software' }, pack: null, facts: [], scout: { domain: null, what: 'Yard management software', entityType: 'vendor', network: [], freight: [], at: null } });
    const b = buildAccountBrief(vendor, NOW);
    expect(b.fit.fit).toBe('PARTNER');
    expect(b.motion).toMatchObject({ type: 'NO_GOOD_MOTION', why: expect.stringMatching(/^Not a direct buyer/) });
  });
  it('a carrier record with no operating evidence is UNKNOWN (check its network), never rejected', () => {
    const b = buildAccountBrief(base({ account: { ...base().account, vertical: 'Trucking' }, pack: null, facts: [], microsite: null }), NOW);
    expect(b.fit).toMatchObject({ entityType: 'carrier', fit: 'UNKNOWN' });
    expect(b.thesis.whyNotPursue.join(' ')).toMatch(/Fit unknown: A carrier; fit depends on whether it runs facilities/);
  });
  it('no wedge expansion inside a deal; NETWORK only on a cited count', () => {
    expect(buildAccountBrief(base({ opportunity: { status: 'ACTIVE', detail: '', deals: [{ name: 'x', stage: 'y' }] } }), NOW).wedge.expansion).toEqual([]);
    expect(buildAccountBrief(base(), NOW).wedge.expansion.join(' ')).not.toMatch(/NETWORK/);
  });
});


describe('dogfood: a quoted vendor statement is still vendor marketing', () => {
  it('a fact that opens with a quotation mark and a vendor name never leads', () => {
    const vendor = { ...base().facts[0], id: 'v2', quote: '“Gatik is already operating inside our networks and brings the scale we need,” said Acme Foods.', publishedAt: '2026-09-25T00:00:00Z' };
    expect(buildAccountBrief(base({ facts: [vendor, base().facts[0]] }), NOW).glance.bestFact).toMatch(/^Acme Foods will open/);
  });
});

describe('review J: vertical words and ambiguous Scouts', () => {
  it('real vertical words map to a type (stems match their endings; distribution before food)', async () => {
    const { typeFromVertical } = await import('@/lib/gap/account-intel/build');
    expect(typeFromVertical('Manufacturing')).toBe('manufacturer');
    expect(typeFromVertical('Automotive')).toBe('manufacturer');
    expect(typeFromVertical('Food Distribution')).toBe('distributor');
    expect(typeFromVertical('Warehousing')).toBe('3pl');
    expect(typeFromVertical('Transportation')).toBe('carrier');
    expect(typeFromVertical('Consulting')).toBe('vendor');
    expect(typeFromVertical('Unknown')).toBeNull();
  });
  it('an ambiguous Scout (a name shared by several companies) never counts as the account evidence or type', () => {
    const b = buildAccountBrief(base({ account: { ...base().account, vertical: 'Unknown' }, pack: null, facts: [], scout: { domain: null, what: 'A different company', entityType: 'carrier', network: [{ claim: 'Operates 30 terminals.', url: 'https://x.example' }], freight: [{ claim: 'Runs a fleet of 2,000 tractors.', url: 'https://x.example/f' }], at: '2026-09-29T00:00:00Z', basis: 'web', ambiguous: true } }), NOW);
    expect(b.fit).toMatchObject({ entityType: null, fit: 'UNKNOWN' });
  });
});

describe('first-party freshness (Release M): real record dates, or undated, never invented', () => {
  it('carries the CRM contact, relationship, staged candidate, alias and record timestamps', () => {
    const b = buildAccountBrief(base({
      account: { ...base().account, recordUpdatedAt: '2026-08-01T00:00:00.000Z' },
      aliasesAddedAt: '2026-07-15T00:00:00.000Z',
      personas: [{ id: 1, name: 'Angi Acosta', title: 'VP Distribution', doNotContact: false, hasEmail: true, emailStatus: 'valid', updatedAt: '2026-09-01T00:00:00.000Z' }],
      candidates: [{ id: 7, name: 'Lee Park', title: 'DC Manager', state: 'staged', seenAt: '2026-09-20T00:00:00.000Z' }],
      memberships: [{ sourceName: 'MMYQB subscribers', sourceType: 'list', relationshipContext: 'Met at MODEX', personName: 'Angi Acosta', addedAt: '2026-09-15T00:00:00.000Z' }],
    }), NOW);
    const at = (sec: keyof typeof b.sections, text: RegExp) => b.sections[sec].statements.find((s) => text.test(s.text))?.sources[0].at;
    expect(at('org', /^Angi Acosta, VP Distribution/)).toBe('2026-09-01T00:00:00.000Z');
    expect(at('org', /^Lee Park/)).toBe('2026-09-20T00:00:00.000Z');
    expect(at('relationships', /Met at MODEX/)).toBe('2026-09-15T00:00:00.000Z');
    expect(at('identity', /^Also known as/)).toBe('2026-07-15T00:00:00.000Z');
    expect(at('identity', /^Acme Foods, cpg/)).toBe('2026-08-01T00:00:00.000Z');
  });
  it('no timestamp stays null (the view says undated); nothing defaults to now', () => {
    const b = buildAccountBrief(base(), NOW);
    expect(b.sections.org.statements.find((s) => /^Angi Acosta, VP/.test(s.text))?.sources[0].at).toBeNull();
    expect(b.sections.identity.statements.find((s) => /^Acme Foods, cpg/.test(s.text))?.sources[0].at).toBeNull();
  });
});

describe('fit comes from operations, not the label (final dogfood: Crowley, PepsiCo, Kroger showed "Fit unknown")', () => {
  it('type unknown + verified self-operated sites is a direct buyer; the type stays unknown', () => {
    const b = buildAccountBrief(base({ account: { ...base().account, vertical: 'Unknown' }, facts: [] }), NOW);
    expect(b.fit).toMatchObject({ entityType: null, fit: 'DIRECT_BUYER' });
    expect(b.fit.why).toMatch(/what kind of company it is is not established yet/);
  });
  it('type unknown + a sourced count of many facilities (a 10-K) is a direct buyer', () => {
    const b = buildAccountBrief(base({ account: { ...base().account, vertical: 'Unknown' }, facts: [], pack: { ...(base().pack as object), network: { totals: {}, sites: [] } } as never }), NOW);
    expect(b.fit.fit).toBe('DIRECT_BUYER');
    expect(b.fit.evidence[0]).toMatch(/network count \(FY25 10-K Item 2\): 38/);
  });
  it('type unknown and nothing it operates stays unknown', () => {
    const b = buildAccountBrief(base({ account: { ...base().account, vertical: 'Unknown' }, facts: [], pack: null }), NOW);
    expect(b.fit).toMatchObject({ entityType: null, fit: 'UNKNOWN' });
  });
});

describe('scale dogfood reasoning fixes', () => {
  const brazil = { id: 'fb', quote: 'We entered into a definitive agreement to sell our business in Brazil, including its two distribution centers.', url: 'https://sec.example/q', title: '10-Q', publishedAt: '2026-09-23T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
  it('a draft Casey built on a fact he chose stays grounded (the brief never overrides his choice; review P1-B)', () => {
    const h = { ...base().hypotheses[0], id: 'hb', status: 'draft', observation: brazil.quote, primarySignalId: 'fb' };
    expect(buildAccountBrief(base({ facts: [brazil], hypotheses: [h] }), NOW).hypotheses[0].grounded).toBe(true);
  });
  it('a 3PL\'s "3PL-operated" audited sites are its own: no "decision sits with the 3PL", and they count as operations', () => {
    const pack = base().pack as { network: { sites: unknown[] } };
    const threePl = (id: string) => ({ ...(pack.network.sites[0] as object), id, verification: { ...(pack.network.sites[0] as { verification: object }).verification, operator: '3PL' } });
    const b = buildAccountBrief(base({ account: { ...base().account, vertical: '3PL / Logistics' }, facts: [], pack: { ...(base().pack as object), network: { totals: {}, sites: [threePl('a'), threePl('b'), threePl('c')] } } as never }), NOW);
    expect(b.thesis.whyNotPursue.join(' ')).not.toMatch(/decision may sit with the 3PL/);
    expect(b.fit).toMatchObject({ entityType: '3pl', fit: 'DIRECT_BUYER' });
  });
});

describe('scale dogfood: operators are asked about the sites they run', () => {
  // A marine operator moves containers and chassis as well as trailers (click test: "trailers" to Crowley read as uninformed).
  it.each([['3PL / Logistics', 'the warehouses and customer sites you run', 'trailers'], ['Trucking', 'your terminals and yards', 'trailers'], ['Marine Terminal', 'your terminals', 'containers, chassis and trailers'], ['Grocery Retail', 'your DCs', 'trailers'], ['Food & Beverage', 'your plants and DCs', 'trailers'], ['Unknown', 'your sites', 'trailers']])('%s -> "%s"', (vertical, words, assets) => {
    const b = buildAccountBrief(base({ account: { ...base().account, vertical }, bids: [] }), NOW);
    expect(b.discovery.find((q) => q.type === 'CURRENT_PROCESS')?.question).toBe(`How do ${assets} get checked in and found at ${words} today?`);
  });
});

describe('scale dogfood: an unknown type is never assumed', () => {
  it('3PL-marked sites on an account of unknown type: settle identity, never "the decision sits with the 3PL"', () => {
    const pack = base().pack as { network: { sites: unknown[] } };
    const threePl = (id: string) => ({ ...(pack.network.sites[0] as object), id, verification: { ...(pack.network.sites[0] as { verification: object }).verification, operator: '3PL' } });
    const b = buildAccountBrief(base({ account: { ...base().account, vertical: 'Unknown' }, facts: [], pack: { ...(base().pack as object), network: { totals: {}, sites: [threePl('a'), threePl('b')] } } as never }), NOW);
    expect(b.thesis.whyNotPursue.join(' ')).toMatch(/it may BE the 3PL/);
    expect(b.thesis.whyNotPursue.join(' ')).not.toMatch(/decision may sit with the 3PL/);
  });
});

describe('closeout: General Mills and RXO', () => {
  it('General Mills: a lead thesis opening on a foreign divestiture routes Casey to review it on the better fact', () => {
    const brazil = { id: 'fb', quote: 'During the fourth quarter of fiscal 2026, we entered into a definitive agreement to sell our business in Brazil to a local buyer.', url: 'https://sec.example/q', title: '10-Q', publishedAt: '2026-09-23T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
    const redesign = { id: 'fr', quote: 'General Mills will redesign the plant and warehouse network behind Cheerios, Blue Buffalo and Pillsbury, as part of a plan to cut $3 billion in costs.', url: 'https://news.example/gm', title: 'news', publishedAt: '2026-07-02T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
    const h = { ...base().hypotheses[0], id: 'hb', status: 'draft', observation: brazil.quote, primarySignalId: 'fb' };
    const b = buildAccountBrief(base({ facts: [brazil, redesign], hypotheses: [h] }), NOW);
    expect(b.motion.type).toBe('FACT_LED');
    expect(b.glance.nextAction).toMatch(/^Review the thesis before any first touch: it opens on activity outside the North America network/);
    expect(b.glance.nextAction).toMatch(/the best current fact is "General Mills will redesign the plant and warehouse network/);
    // a thesis on the best fact keeps the ordinary next action
    const good = buildAccountBrief(base({ personas: [{ ...base().personas[0], title: 'VP Transportation' }], facts: [brazil, redesign], hypotheses: [{ ...h, observation: redesign.quote, primarySignalId: 'fr' }] }), NOW);
    expect(good.glance.nextAction).toMatch(/^Review the thesis, then use the verified fact/);
  });
  it('RXO: no HubSpot company link is said as the blocker, not a failed deal read', () => {
    const b = buildAccountBrief(base({ opportunity: { status: 'UNKNOWN', detail: 'identity_unresolved', deals: [], unlinked: true } }), NOW);
    expect(b.motion.type).toBe('NO_GOOD_MOTION');
    expect(b.motion.why).toBe('Do not contact yet: this GAP account is not linked to a HubSpot company, so the opportunity state cannot be verified (link it in HubSpot, or confirm there is none).');
    expect(b.sections.commercial.statements[0].text).toMatch(/^Cannot verify opportunity state because this GAP account is not linked to a HubSpot company/);
    // the glance and the next action say the same blocker (no "not read", no "research first")
    const bare = buildAccountBrief(base({ facts: [], opportunity: { status: 'UNKNOWN', detail: 'identity_unresolved', deals: [], unlinked: true } }), NOW);
    expect(bare.glance.commercialState).toMatch(/^Cannot verify opportunity state because this GAP account is not linked/);
    expect(bare.glance.nextAction).not.toMatch(/Research first/);
    expect(bare.glance.nextAction).toMatch(/not linked to a HubSpot company/);
    const other = buildAccountBrief(base({ opportunity: { status: 'UNKNOWN', detail: 'timeout', deals: [] } }), NOW);
    expect(other.motion.why).toBe('Do not contact yet: the HubSpot deal state could not be read.');
  });
});

describe('final review (2026-09-30): the headline lines say what is known', () => {
  const tyson = { id: 'lay', quote: 'Acme Foods has announced the sudden closure of its beef plant in Joslin, Illinois, throwing more than 2,500 union workers out of work.', url: 'https://news.example/j', title: 'n', publishedAt: '2026-09-15T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
  const air = { id: 'air', quote: 'With Tricolor, we are redesigning our international air network by deploying our aircraft and linehaul flights strategically to grow in the premium global freight market.', url: 'https://sec.example/a', title: '10-K', publishedAt: '2026-09-15T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
  const gatik = { id: 'gat', quote: 'Gatik moves freight for Acme Foods across roughly 250 retail locations in Texas.', url: 'https://gatik.ai/n', title: 'n', publishedAt: '2026-09-15T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
  const fleet = { id: 'flt', quote: 'Acme Foods will add 200 tractors to its private fleet serving its distribution centers in 2027.', url: 'https://news.example/f', title: 'n', publishedAt: '2026-09-15T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };

  it('NETWORK is a count, never a news quote; a sensitive or vendor fact is not a footprint statement', () => {
    const b = buildAccountBrief(base({ facts: [tyson, gatik] }), NOW);
    expect(b.glance.network).not.toMatch(/Joslin|Gatik/);
    expect(b.glance.network).toMatch(/38 facilities/);
    expect(b.sections.footprint.statements.map((s) => s.text).join('\n')).not.toMatch(/union workers|Gatik/);
  });
  it('FREIGHT is a freight model: air network and vendor marketing are not it; a private fleet is', () => {
    const b = buildAccountBrief(base({ facts: [air, gatik, fleet], microsite: null }), NOW);
    const text = b.sections.freight.statements.map((s) => s.text).join('\n');
    expect(text).not.toMatch(/air network|Gatik/);
    expect(b.glance.freight).toMatch(/private fleet/);
    const bare = buildAccountBrief(base({ facts: [air], microsite: null }), NOW);
    expect(bare.glance.freight).toMatch(/^Not established from public data \(rail: 0 of 3 audited sites rail-served\)/);
  });
  it('an audit that recorded no yard features says unknown, never zero', () => {
    const blank = (id: string) => site(id, { yardMetrics: { dockDoorCount: null, trailersVisible: null, trailerParkingCapacity: null, truckGateCount: null, buildingCount: null, siteAreaAcres: null, railServed: null }, classification: { dropYard: false, guardShack: false, truckGate: false, preGateStaging: false, fastLaneOpportunity: false, dockDoors: 'unknown', dropArea: 'unknown' } });
    const pack = { ...(base().pack as object), network: { totals: { dockDoors: 0, trailerCapacity: 0, gates: 0, railServed: 0, acres: 0 }, sites: [blank('t1'), blank('t2')] } } as never;
    const b = buildAccountBrief(base({ pack }), NOW);
    expect(b.sections.yard.statements.map((s) => s.text).join('\n')).not.toMatch(/0 with a drop yard/);
    expect(b.sections.yard.unknowns.join('\n')).toMatch(/Yard features: the audit recorded none for these 2 sites \(unknown, not zero\)/);
    expect(b.sections.freight.statements.map((s) => s.text).join('\n')).not.toMatch(/rail-served/);
    expect(b.sections.freight.unknowns.join('\n')).toMatch(/Rail service \(not recorded by the audit\)/);
  });
  it('the audited-sites line is VERIFIED only when every counted site is cited (one cited site is not enough)', () => {
    const uncited = site('u1', { verification: { ...site('x').verification, citations: [] } });
    const pack = { ...(base().pack as object), network: { totals: { dockDoors: 0, trailerCapacity: 0, gates: 0, railServed: 0, acres: 0 }, sites: [site('c1'), uncited] } } as never;
    const f = buildAccountBrief(base({ pack }), NOW).sections.footprint.statements.find((s) => /sites audited/.test(s.text));
    expect(f?.truth).toBe('INFERENCE');
  });
  it('WHY NOW never calls a fact past the catalyst window "Recent"', () => {
    const old = { ...fleet, publishedAt: '2026-06-01T00:00:00Z' };
    const b = buildAccountBrief(base({ facts: [old] }), NOW);
    expect(b.thesis.whyNow).toMatch(/^Older \(2026-06-01, past the 45-day catalyst window\):/);
    expect(buildAccountBrief(base(), NOW).thesis.whyNow).toMatch(/^Recent:/);
  });
  it('a modeled range too wide to act on is said as such', () => {
    const b = buildAccountBrief(base({ roi: { hardSavingsAnnual: 67_900_000, totalValueAnnual: 2_565_600_000, facilities: 500, calculatorVersion: 'v3', assumptions: [] } }), NOW);
    expect(b.sections.economics.statements[0].text).toMatch(/^Too uncertain to use: the model spans \$67\.9M to \$2565\.6M a year \(38x\) across 500 facilities/);
    expect(b.sections.economics.statements[0].text).toMatch(/the footprint counts 38/);
  });
  it('in a deal, the next action names the deal, not a placeholder', () => {
    const b = buildAccountBrief(base({ opportunity: { status: 'ACTIVE', detail: '', deals: [{ id: 'd1', name: 'Acme pilot', stage: 'Discovery' }] as never } }), NOW);
    expect(b.glance.nextAction).not.toMatch(/Next learning: the Deal brief objective/);
    expect(b.glance.nextAction).toMatch(/^Work the deal from In Deals \(Acme pilot, Discovery\), never cold/);
  });
});
