/**
 * PURPOSE-SPECIFIC OWNER RANKING + RECOMMENDED FOR THIS HYPOTHESIS (WHO truth maintenance, 2026-10-05).
 * The cold first touch stays operator-first. A hypothesis ranks buyer truth, then the CURRENT role, then thesis
 * relevance, then the lane, then named ownership, then scope and geography, then seniority. A site pilot prefers
 * the site or regional operator; a transformation initiative elevates only explicit freight / yard technology
 * ownership. When the top two differ on a strong dimension the resolver names a RECOMMENDED candidate with the first
 * difference in words; Casey still clicks (nobody is preselected). Pure core; patterns, never people.
 */
import { describe, expect, it } from 'vitest';
import { resolveOwner, type OwnerCandidateInput, type OwnerResolutionInput } from '@/lib/gap/people/owner-resolution';
import type { EmploymentRead } from '@/lib/gap/people/employment';

const NOW = new Date('2026-10-05T15:00:00Z');
const unverified: EmploymentRead = { state: 'CURRENT_UNVERIFIED', why: 'CRM only.', decidedBy: [], elsewhere: null, verifyNeeded: false };
const US = 'Dallas, Texas, United States';
const gap = (id: number, name: string, title: string, over: Partial<OwnerCandidateInput> = {}): OwnerCandidateInput => ({ key: `gap:${id}`, source: 'gap', personaId: id, name, title, hasEmail: true, employment: unverified, location: US, ...over });
const hs = (id: string, name: string, title: string, over: Partial<OwnerCandidateInput> = {}): OwnerCandidateInput => ({ key: `hubspot:${id}`, source: 'hubspot', hubspotContactId: id, name, title, hasEmail: true, location: US, ...over });
const network20 = { id: 'h-n2', status: 'approved', primaryPersonaId: null, observation: 'We continue to consolidate sortation facilities, reduce pickup-and-delivery routes and optimize our enterprise linehaul network (Network 2.0).', problemHypothesis: 'My guess is that the change moves load onto the gates, yards and docks you run.', problemFamily: 'hidden_capacity' };
const base = (over: Partial<OwnerResolutionInput> = {}): OwnerResolutionInput => ({
  account: { name: 'Acme Foods', entityType: 'manufacturer' },
  purpose: 'HYPOTHESIS_ACTIVATION',
  hypothesis: network20,
  candidates: [],
  hubspot: { read: true, count: 0, truncated: false, via: 'linked' },
  now: NOW,
  ...over,
});

describe('7. a network-program hypothesis favors the network-program owner over a generic freight operator', () => {
  const people = [
    hs('1', 'Glen Generic', 'Managing Director - Transportation & Logistics', { location: 'Mars, Pennsylvania, United States' }),
    gap(2, 'Jeff Network', 'Vice President - Operations Planning and Engineering - North America', { location: 'Plano, Texas, United States' }),
    hs('3', 'Lisa Air', 'President Air Network Operations', { location: 'Memphis, Tennessee, United States' }),
  ];
  const r = resolveOwner(base({ account: { name: 'FedEx', entityType: '3pl' }, candidates: people, hubspot: { read: true, count: 114, truncated: false, via: 'identity' } }));
  it('the operations planning and engineering owner leads; the transportation MD (ground, named ownership) is next; the air side is third', () => {
    expect(r.eligible.map((c) => c.name)).toEqual(['Jeff Network', 'Glen Generic', 'Lisa Air']);
    expect(r.eligible[0].relevance?.tier).toBe('direct');
    // The air network president names network operations, but the fact is the ground consolidation: related, not direct.
    expect(r.eligible[1].relevance?.tier).toBe('related');
    expect(r.eligible[2].relevance?.tier).toBe('related');
    expect(r.eligible[2].relevance?.why).toMatch(/runs the air network, beside a network program/);
  });
  it('the resolver RECOMMENDS the network-program owner for this hypothesis with the first difference in words; nobody is preselected and the choice stays', () => {
    expect(r.recommended?.key).toBe('gap:2');
    expect(r.recommended?.firstDifference).toBe('thesis relevance');
    expect(r.recommended?.why).toMatch(/runs operations planning and engineering: the fact is a network program/);
    expect(r.preselected).toBeNull();
    expect(r.nextStep).toBe('choose');
    expect(r.headline).toMatch(/GAP does not pick/);
  });
  it('the same people on an AIR network fact rank the air network president first, and say so', () => {
    const air = { ...network20, id: 'h-air', observation: 'With Tricolor, we are redesigning our international air network by deploying our aircraft strategically to optimize asset utilization.' };
    const r2 = resolveOwner(base({ account: { name: 'FedEx', entityType: '3pl' }, hypothesis: air, candidates: people }));
    expect(r2.eligible[0].name).toBe('Lisa Air');
    expect(r2.recommended?.key).toBe('hubspot:3');
    expect(r2.recommended?.firstDifference).toBe('thesis relevance');
  });
});

describe('8. the cold first touch keeps the operator-first order (lane and named ownership before anything thesis-shaped)', () => {
  it('cold FedEx: the North America planning VP leads the ground network, then the transportation MD, then the air president; no recommendation is made for a cold touch', () => {
    const people = [
      hs('1', 'Glen Generic', 'Managing Director - Transportation & Logistics'),
      gap(2, 'Jeff Network', 'Vice President - Operations Planning and Engineering - North America'),
      hs('3', 'Lisa Air', 'President Air Network Operations'),
    ];
    const r = resolveOwner(base({ account: { name: 'FedEx', entityType: '3pl' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: people }));
    expect(r.eligible.map((c) => c.name)).toEqual(['Jeff Network', 'Glen Generic', 'Lisa Air']);
    expect(r.recommended).toBeNull();
  });
  it('cold and hypothesis may prefer different people: a senior transportation director (cold) against a linehaul director (network program)', () => {
    const people = [gap(1, 'Tina Trans', 'Senior Director of Transportation'), gap(2, 'Pete Plan', 'Director of Linehaul Operations')];
    const cold = resolveOwner(base({ purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: people }));
    const hyp = resolveOwner(base({ candidates: people }));
    expect(cold.eligible[0].name).toBe('Tina Trans');
    expect(hyp.eligible[0].name).toBe('Pete Plan');
    expect(hyp.recommended?.key).toBe('gap:2');
  });
});

describe('9. a site pilot may prefer the site or regional operator', () => {
  it('the DC general manager leads a VP of transportation for a site pilot, and the network VP is the sponsor-shaped alternate', () => {
    const people = [gap(1, 'Vic Vp', 'Vice President Transportation', { location: 'Bentonville, Arkansas, United States' }), gap(2, 'Gina Gm', 'General Manager, Cincinnati Distribution Center', { location: 'Cincinnati, Ohio, United States' })];
    const r = resolveOwner(base({ purpose: 'SITE_PILOT', hypothesis: null, candidates: people }));
    expect(r.eligible.map((c) => c.name)).toEqual(['Gina Gm', 'Vic Vp']);
    expect(r.recommended?.key).toBe('gap:2');
    expect(r.recommended?.firstDifference).toBe('site fit');
    const cold = resolveOwner(base({ purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: people }));
    expect(cold.eligible.map((c) => c.name)).toEqual(['Vic Vp']);
  });
});

describe('10. a transformation initiative elevates only explicit freight / yard technology ownership', () => {
  it('a transportation technology director leads the transportation VP; a generic innovation title is never eligible', () => {
    const people = [gap(1, 'Vic Vp', 'Vice President Transportation'), gap(2, 'Tess Tech', 'Director, Transportation Technology'), gap(3, 'Ivy Innov', 'Vice President of Innovation')];
    const r = resolveOwner(base({ purpose: 'TRANSFORMATION_INITIATIVE', hypothesis: null, candidates: people }));
    expect(r.eligible.map((c) => c.name)).toEqual(['Tess Tech', 'Vic Vp']);
    expect(r.recommended?.key).toBe('gap:2');
    expect(r.recommended?.firstDifference).toBe('technology ownership');
  });
});

describe('the recommendation is first-difference reasoning, never a score', () => {
  it('two directors of transportation that differ only on seniority or geography get no recommendation: a choice', () => {
    const people = [gap(1, 'Dee Director', 'Director of Transportation'), gap(2, 'Sid Senior', 'Senior Director of Transportation')];
    const r = resolveOwner(base({ candidates: people }));
    expect(r.eligible.length).toBe(2);
    expect(r.recommended).toBeNull();
  });
  it('buyer truth is the first difference and is said as such', () => {
    const people = [gap(1, 'Dee Director', 'Director of Transportation'), gap(2, 'Bo Buyer', 'Director of Transportation', { buyerTruth: 'answered the first touch' })];
    const r = resolveOwner(base({ candidates: people }));
    expect(r.recommended?.key).toBe('gap:2');
    expect(r.recommended?.firstDifference).toBe('buyer truth');
  });
  it('a sole eligible person is preselected as before and carries no separate recommendation', () => {
    const r = resolveOwner(base({ candidates: [gap(1, 'Dee Director', 'Director of Transportation')] }));
    expect(r.preselected).toBe('gap:1');
    expect(r.recommended).toBeNull();
  });
  it('a broad transportation title never beats a direct thesis fit on seniority alone', () => {
    const people = [gap(1, 'Evan Evp', 'Executive Vice President, Transportation'), gap(2, 'Lin Linehaul', 'Director of Linehaul Operations')];
    const r = resolveOwner(base({ account: { name: 'Acme Parcel', entityType: 'carrier' }, candidates: people }));
    expect(r.eligible[0].name).toBe('Lin Linehaul');
  });
});
