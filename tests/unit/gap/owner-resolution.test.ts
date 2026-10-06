/**
 * OWNER RESOLUTION (seller dogfood correction, 2026-10-05): one read for NOW's HubSpot-only WHO, an approved
 * hypothesis with no person, and Research Next. Patterns from the four live cases (PepsiCo, FedEx, Walmart, H-E-B),
 * never people. Pure core; the loader is tested apart.
 */
import { describe, expect, it } from 'vitest';
import { resolveOwner, type OwnerCandidateInput, type OwnerResolutionInput } from '@/lib/gap/people/owner-resolution';
import type { EmploymentRead } from '@/lib/gap/people/employment';

const NOW = new Date('2026-10-05T15:00:00Z');
const unverified: EmploymentRead = { state: 'CURRENT_UNVERIFIED', why: 'CRM only.', decidedBy: [], elsewhere: null, verifyNeeded: false };
const left = (company: string): EmploymentRead => ({ state: 'LEFT_COMPANY_CONFIRMED', why: `Current evidence places them at ${company}.`, decidedBy: [], elsewhere: { company, title: 'Director of Distribution Operations', source: 'LinkedIn profile', url: null, at: '2026-09-20' }, verifyNeeded: false });
const conflict: EmploymentRead = { state: 'EMPLOYMENT_CONFLICT', why: 'Apollo reads them as moved out while the CRM says here.', decidedBy: [], elsewhere: { company: null, title: null, source: 'Apollo', url: null, at: null }, verifyNeeded: true };

const gap = (id: number, name: string, title: string, over: Partial<OwnerCandidateInput> = {}): OwnerCandidateInput => ({ key: `gap:${id}`, source: 'gap', personaId: id, name, title, hasEmail: true, employment: unverified, ...over });
const hs = (id: string, name: string, title: string, over: Partial<OwnerCandidateInput> = {}): OwnerCandidateInput => ({ key: `hubspot:${id}`, source: 'hubspot', hubspotContactId: id, name, title, hasEmail: true, location: 'Dallas, Texas, United States', ...over });
const base = (over: Partial<OwnerResolutionInput> = {}): OwnerResolutionInput => ({
  account: { name: 'Acme Foods', entityType: 'manufacturer' },
  purpose: 'HYPOTHESIS_ACTIVATION',
  hypothesis: { id: 'h1', status: 'approved', primaryPersonaId: null, observation: 'Acme Foods plans to invest more than $300 million in a new fulfillment center in Turtlecreek Township.', problemHypothesis: 'My guess is that the network change above moves load onto the physical handoffs that remain.', problemFamily: 'hidden_capacity' },
  candidates: [],
  hubspot: { read: true, count: 0, truncated: false, via: 'linked' },
  now: NOW,
  ...over,
});

describe('PepsiCo pattern: the HubSpot-only operator leads; the VP Supply Chain is the sponsor, never the owner', () => {
  const r = resolveOwner(base({ purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [gap(928, 'michelle schlie', 'vice president supply chain'), hs('219885493392', 'Isaac Scott', 'Sr Director of Transportation - Frito-Lay', { location: 'Orlando, Florida, United States' })], hubspot: { read: true, count: 542, truncated: false, via: 'linked' } }));
  it('the operator is the one eligible owner, preselected as ADD + USE; the sponsor is named apart', () => {
    expect(r.eligible.map((c) => c.name)).toEqual(['Isaac Scott']);
    expect(r.nextStep).toBe('add_and_use');
    expect(r.preselected).toBe('hubspot:219885493392');
    expect(r.headline).toMatch(/in HubSpot, not yet a GAP contact: Isaac Scott, Sr Director of Transportation - Frito-Lay/);
    expect(r.sponsor?.name).toBe('Michelle Schlie');
    expect(r.others.find((o) => o.lane === 'ADJACENT_OPERATOR')?.names).toEqual(['Michelle Schlie']);
  });
  it('a HubSpot email is used as it is: no Apollo, ever', () => {
    expect(r.apollo.allowed).toBe(false);
    expect(r.eligible[0].reasons.join(' ')).toMatch(/HubSpot holds an email \(no Apollo needed\)/);
    expect(JSON.stringify(r)).not.toMatch(/FIND_EMAIL/);
  });
  it('a generic VP never wins on seniority: with nobody else, the answer is find the operator, with the sponsor named', () => {
    const r2 = resolveOwner(base({ purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [gap(928, 'michelle schlie', 'vice president supply chain'), gap(1264, 'karen jordan', 'senior vice president chief supply chain officer na - beverages')] }));
    expect(r2.eligible).toEqual([]);
    expect(r2.nextStep).toBe('find_operator');
    // The sponsor slot follows the one prior's order (adjacent VP before the executive), the same as the brief.
    expect(r2.sponsor?.name).toBe('Michelle Schlie');
    expect(r2.research.needed).toBe(true);
    expect(r2.research.slots[0]).toMatch(/transportation \/ logistics \/ freight \/ fleet operator/);
  });
});

describe('FedEx pattern: a carrier ranks its network owners by the carrier doctrine AND the hypothesis', () => {
  const fact = { id: 'h2', status: 'approved', primaryPersonaId: null, observation: 'We continue to consolidate sortation facilities, reduce pickup-and-delivery routes and optimize our enterprise linehaul network (Network 2.0).', problemHypothesis: 'My guess is that the change moves load onto the gates, yards and docks you run.', problemFamily: 'hidden_capacity' };
  const people = [
    gap(2187, 'Jeffrey Tallman', 'Vice President - Operations Planning and Engineering - North America', { location: 'Plano, Texas, United States' }),
    hs('1', 'Glen Chaffee', 'Managing Director - Transportation & Logistics', { location: 'Mars, Pennsylvania, United States' }),
    hs('2', 'Vinay DSouza', 'Senior Vice President - Global Assets, Infrastructure and Ops Technology', { location: 'Pittsburgh, Pennsylvania, United States' }),
    hs('3', 'Ram Balakumar', 'Managing Director of Operations', { location: 'Denver, Colorado, United States' }),
    hs('4', 'Mike Tiefenthaler', 'District Managing Director- Operations', { location: 'Champaign, Illinois, United States', company: 'FedEx Ground' }),
    hs('5', 'Lisa Lisson', 'President Air Network Operations', { location: null }),
    hs('6', 'Alun Cornish', 'Vice President Network Operations', { location: 'Enfield, England, United Kingdom' }),
    gap(71, 'Scott Temple', 'President, FedEx Supply Chain', { doNotContact: true }),
    hs('7', 'Courtney Keen', 'Vice President, Chief Financial Officer (CFO) FedEx Logistics and Supply Chain'),
    hs('8', 'Chris Nichols', 'Vice President, Global Sales Operations'),
  ];
  const r = resolveOwner(base({ account: { name: 'FedEx', entityType: '3pl' }, hypothesis: fact, candidates: people, hubspot: { read: true, count: 114, truncated: false, via: 'identity' } }));
  it('the North America operations planning / engineering owner leads on the network fact; a district director never outranks the network', () => {
    expect(r.eligible[0].name).toBe('Jeffrey Tallman');
    expect(r.eligible[0].relevance?.tier).toBe('direct');
    expect(r.eligible[0].reasons.join(' ')).toMatch(/Thesis fit: runs operations planning and engineering: the fact is a network program/);
    const names = r.eligible.map((c) => c.name);
    expect(names.indexOf('Jeffrey Tallman')).toBeLessThan(names.indexOf('Ram Balakumar'));
    expect(names.indexOf('Ram Balakumar')).toBeLessThan(names.indexOf('Mike Tiefenthaler'));
  });
  it('a divested unit is set aside with the transaction named; a UK network VP is another region; finance and sales are never owners', () => {
    expect(r.excluded.find((e) => e.candidate.name === 'Scott Temple')).toMatchObject({ code: 'divested_entity' });
    expect(r.excluded.find((e) => e.candidate.name === 'Scott Temple')?.reason).toMatch(/sale of FedEx Supply Chain .* to CMA CGM Group on October 1, 2026/);
    expect(r.excluded.find((e) => e.candidate.name === 'Alun Cornish')).toMatchObject({ code: 'other_region' });
    expect(r.eligible.map((c) => c.name)).not.toContain('Courtney Keen');
    expect(r.eligible.map((c) => c.name)).not.toContain('Chris Nichols');
  });
  it('the ops technology SVP is the tech slot (a co-buyer), not an owner of a network fact; a technology fact makes them eligible', () => {
    expect(r.tech?.name).toBe('Vinay DSouza');
    expect(r.eligible.map((c) => c.name)).not.toContain('Vinay DSouza');
    expect(r.others.find((o) => o.lane === 'TRANSFORMATION_TECH')?.names).toContain('Vinay DSouza');
    const techFact = resolveOwner(base({ account: { name: 'FedEx', entityType: '3pl' }, hypothesis: { ...fact, observation: 'FedEx is deploying Dexterity autonomous trailer-loading robots and new sortation automation across its hubs.', problemHypothesis: 'My guess is the automation is layered onto non-deterministic yard processes.' }, candidates: people }));
    expect(techFact.eligible.map((c) => c.name)).toContain('Vinay DSouza');
    expect(techFact.eligible.find((c) => c.name === 'Vinay DSouza')?.relevance?.tier).toBe('direct');
  });
  it('several plausible network owners require a human choice: nobody is preselected', () => {
    // Two North America network planners tie on function and relevance.
    const two = resolveOwner(base({ account: { name: 'FedEx', entityType: '3pl' }, hypothesis: fact, candidates: [people[0], hs('9', 'Pat Network', 'Vice President Network Operations - North America', { location: 'Memphis, Tennessee, United States' })] }));
    expect(two.nextStep).toBe('choose');
    expect(two.preselected).toBeNull();
    expect(two.headline).toMatch(/^2 plausible owners for this hypothesis: choose one\. GAP does not pick\./);
  });
  it('the air network president is a direct operator with less named ownership: behind the ground network owners', () => {
    const names = r.eligible.map((c) => c.name);
    expect(names).toContain('Lisa Lisson');
    expect(names.indexOf('Jeffrey Tallman')).toBeLessThan(names.indexOf('Lisa Lisson'));
  });
});

describe('Walmart pattern: a huge contact universe never defaults to generic seniority; relevance narrows', () => {
  const people = [
    hs('1', 'Pat Vp', 'Vice President Supply Chain', { location: 'Bentonville, Arkansas, United States' }),
    hs('2', 'Sam Ops', 'Senior Director Operations', { location: 'Bentonville, Arkansas, United States' }),
    hs('3', 'Chris Trans', 'Sr Director - West Transportation Command Center', { location: 'Bentonville, Arkansas, United States' }),
    hs('4', 'Dana Ful', 'Director, Fulfillment Center Transportation', { location: 'Columbus, Ohio, United States' }),
    hs('5', 'Lee Store', 'Store Manager', { location: 'Cincinnati, Ohio, United States' }),
    hs('6', 'Fin Ance', 'Director Transportation Finance'),
    hs('7', 'Ivy Innov', 'Director of Innovation'),
  ];
  const r = resolveOwner(base({ account: { name: 'Walmart Inc.', entityType: 'retailer' }, candidates: people, hubspot: { read: true, count: 660, truncated: false, via: 'linked' } }));
  it('only transportation owners are eligible; the VP Supply Chain, the generic senior director, finance, innovation and a store never are', () => {
    expect(r.eligible.map((c) => c.name).sort()).toEqual(['Chris Trans', 'Dana Ful']);
    expect(r.sponsor?.name).toBe('Pat Vp');
    expect(r.others.flatMap((o) => o.names)).toEqual(expect.arrayContaining(['Sam Ops', 'Fin Ance', 'Ivy Innov', 'Lee Store']));
  });
  it('both are plausible for a fulfillment center fact, so Casey chooses; the fulfillment transportation director is directly relevant', () => {
    expect(r.nextStep).toBe('choose');
    expect(r.eligible.every((c) => c.relevance?.tier === 'direct')).toBe(true);
  });
});

describe('H-E-B pattern: a departed favorite is set aside upstream, with useful words, never do-not-contact', () => {
  const people = [
    gap(1306, 'dakota socha', 'transportation & reverse logistics', { employment: left('ADUSA Distribution'), location: 'San Antonio, Texas, United States' }),
    hs('219873724254', 'Jose Huerta', 'Director of Transportation', { location: 'Schertz, Texas, United States' }),
    gap(1318, 'troy shaw', 'director global logistics', { location: 'San Antonio, Texas, United States' }),
    gap(9, 'Kay Conflict', 'Director of Transportation', { employment: conflict }),
  ];
  const r = resolveOwner(base({ account: { name: 'H-E-B', entityType: 'retailer' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: people, hubspot: { read: true, count: 51, truncated: false, via: 'identity' } }));
  it('the departed person is excluded with the new employer named, in seller words', () => {
    const e = r.excluded.find((x) => x.candidate.name === 'Dakota Socha');
    expect(e).toMatchObject({ code: 'left_company' });
    expect(e?.reason).toBe('Historical H-E-B contact. Current-employer evidence now points to ADUSA Distribution (Director of Distribution Operations). Not eligible for H-E-B outreach.');
    expect(JSON.stringify(e)).not.toMatch(/stale_persona|do_not_contact|DNC/);
  });
  it('a conflict is excluded until verified; owner resolution continues to the current operator', () => {
    expect(r.excluded.find((x) => x.candidate.name === 'Kay Conflict')).toMatchObject({ code: 'employment_conflict' });
    expect(r.eligible.map((c) => c.name)).toEqual(['Jose Huerta', 'Troy Shaw']);
    expect(r.eligible[0].action).toBe('add_then_use');
  });
  it('the ranking happens before any send gate: the departed person is never first, whatever the title', () => {
    expect(r.eligible.map((c) => c.name)).not.toContain('Dakota Socha');
    expect(r.checked.find((c) => /contact currentness/.test(c))).toBe('contact currentness (2 set aside)');
  });
});

describe('the human choice boundary', () => {
  it('exactly one GAP operator, no conflict: preselected as USE; Casey still presses the button (nothing here acts)', () => {
    const r = resolveOwner(base({ candidates: [gap(5, 'Tom Ops', 'Transportation Operations Manager'), gap(6, 'Val Vp', 'Vice President Supply Chain')] }));
    expect(r.nextStep).toBe('use');
    expect(r.preselected).toBe('gap:5');
  });
  it('a separate-entity flag is selectable with a caution but never preselected', () => {
    const r = resolveOwner(base({ account: { name: 'FedEx', entityType: '3pl' }, candidates: [hs('1', 'Lou Log', 'Managing Director Transportation, FedEx Logistics', { location: 'Memphis, Tennessee, United States' })] }));
    expect(r.eligible[0].caution).toMatch(/FedEx Logistics is a separate operating company/);
    expect(r.preselected).toBeNull();
    expect(r.nextStep).toBe('choose');
  });
  it('do-not-contact, opted-out and unsubscribed people are set aside with the reason, never silently dropped', () => {
    const r = resolveOwner(base({ candidates: [gap(1, 'A Dnc', 'Director of Transportation', { doNotContact: true }), hs('2', 'B Opt', 'Director of Transportation', { optedOut: true }), gap(3, 'C Unsub', 'Director of Transportation', { unsubscribed: true })] }));
    expect(r.excluded.map((e) => e.code).sort()).toEqual(['do_not_contact', 'opted_out', 'unsubscribed']);
    expect(r.nextStep).toBe('find_operator');
  });
  it('a staged candidate or a bare relationship is shown, never selectable as the owner', () => {
    const r = resolveOwner(base({ candidates: [{ key: 'staged:1', source: 'staged', name: 'Stan Staged', title: 'Director of Transportation', hasEmail: false }, { key: 'member:1', source: 'relationship', name: 'Rel Ation', title: 'Director of Transportation', hasEmail: false, relationship: 'met at Inland26' }] }));
    expect(r.eligible).toEqual([]);
    expect(r.others[0].names).toEqual(['Stan Staged (staged candidate)', 'Rel Ation (relationship, not a contact)']);
  });
  it('purpose changes eligibility: a plant director is an owner for a site pilot, never for a cold first touch', () => {
    const plant = [gap(1, 'Pam Plant', 'Plant Manager', { location: 'Reno, Nevada, United States' })];
    expect(resolveOwner(base({ purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: plant })).eligible).toEqual([]);
    expect(resolveOwner(base({ purpose: 'SITE_PILOT', hypothesis: null, candidates: plant })).eligible.map((c) => c.name)).toEqual(['Pam Plant']);
  });
  it('a transportation tech owner is eligible for a transformation initiative, and for a hypothesis only when it lands on their technology', () => {
    const tech = [hs('1', 'Tess Tech', 'Director of Transportation Systems', { location: 'Dallas, Texas, United States' })];
    expect(resolveOwner(base({ purpose: 'TRANSFORMATION_INITIATIVE', hypothesis: null, candidates: tech })).eligible.map((c) => c.name)).toEqual(['Tess Tech']);
    expect(resolveOwner(base({ candidates: tech })).eligible).toEqual([]);
    const auto = resolveOwner(base({ hypothesis: { id: 'h', status: 'approved', primaryPersonaId: null, observation: 'Acme is deploying autonomous yard trucks and a new TMS across its DCs.', problemHypothesis: 'My guess is the yard is where it breaks.', problemFamily: 'automation_readiness' }, candidates: tech }));
    expect(auto.eligible.map((c) => c.name)).toEqual(['Tess Tech']);
  });
  it('the HubSpot read is said plainly when it could not happen', () => {
    const none = resolveOwner(base({ candidates: [], hubspot: { read: false, count: 0, truncated: false, via: 'none' } }));
    expect(none.headline).toMatch(/HubSpot people were not read \(no HubSpot company resolves for this account\)/);
    const cut = resolveOwner(base({ candidates: [], hubspot: { read: true, count: 1000, truncated: true, via: 'linked' } }));
    expect(cut.headline).toMatch(/only the first 1000 associated contacts/);
  });
});

describe('currentness ranks AFTER scope and seniority among eligible people (carrier dogfood 2026-10-05)', () => {
  // At NFI and J.B. Hunt, GAP transportation managers (Apollo and the CRM agree: likely current) ranked above a
  // Senior Vice President of Transportation Services from HubSpot (nobody has checked yet). The departed and the
  // conflicted are already set aside upstream; among the eligible, the network owner leads and currentness only
  // breaks a tie.
  const likely: EmploymentRead = { state: 'CURRENT_LIKELY', why: 'Apollo and the CRM agree.', decidedBy: [], elsewhere: null, verifyNeeded: false };
  it('an SVP of transportation nobody has verified outranks a likely-current transportation manager', () => {
    const r = resolveOwner(base({ account: { name: 'NFI Industries', entityType: '3pl' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [gap(1, 'Mia Mgr', 'Transportation Manager', { employment: likely, location: 'Orlando, Florida, United States' }), hs('2', 'Sam Svp', 'Senior Vice President of Transportation Services', { location: 'Cherry Hill, New Jersey, United States' })] }));
    expect(r.eligible.map((c) => c.name)).toEqual(['Sam Svp', 'Mia Mgr']);
  });
  it('between two directors of transportation that tie on everything else, the likely-current one leads', () => {
    const r = resolveOwner(base({ account: { name: 'NFI Industries', entityType: '3pl' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [gap(1, 'Una Unverified', 'Director of Transportation Operations', { employment: unverified, location: 'Dallas, Texas, United States' }), gap(2, 'Lee Likely', 'Director of Transportation Operations', { employment: likely, location: 'Dallas, Texas, United States' })] }));
    expect(r.eligible.map((c) => c.name)).toEqual(['Lee Likely', 'Una Unverified']);
  });
});
