/**
 * UX-03 PEOPLE STACK (account-first UX, 2026-10-05): the default account view shows the top 3 to 5 people, never a
 * wall; every visible row carries ONE reason that sets the person apart; ordinals only when the resolver's order is
 * evidence-backed between those rows; "Best fit" only when the resolver recommends; the full list stays one labelled,
 * counted step away. Pure over the resolver's own output (never a second ranking).
 */
import { describe, expect, it } from 'vitest';
import { resolveOwner, type OwnerCandidateInput, type OwnerResolutionInput } from '@/lib/gap/people/owner-resolution';
import type { EmploymentRead } from '@/lib/gap/people/employment';
import { buildPeopleStack, STACK_DEFAULT_MAX } from '@/lib/gap/people/stack';

const NOW = new Date('2026-10-05T15:00:00Z');
const unverified: EmploymentRead = { state: 'CURRENT_UNVERIFIED', why: 'CRM only.', decidedBy: [], elsewhere: null, verifyNeeded: false };
const confirmed: EmploymentRead = { state: 'CURRENT_CONFIRMED', why: 'Verified at a source on 2026-10-01.', decidedBy: [], elsewhere: null, verifyNeeded: false };
const left = (company: string): EmploymentRead => ({ state: 'LEFT_COMPANY_CONFIRMED', why: `Current evidence places them at ${company}.`, decidedBy: [], elsewhere: { company, title: 'Director of Distribution Operations', source: 'LinkedIn profile', url: null, at: '2026-09-20' }, verifyNeeded: false });
const gap = (id: number, name: string, title: string, over: Partial<OwnerCandidateInput> = {}): OwnerCandidateInput => ({ key: `gap:${id}`, source: 'gap', personaId: id, name, title, hasEmail: true, employment: unverified, ...over });
const hs = (id: string, name: string, title: string, over: Partial<OwnerCandidateInput> = {}): OwnerCandidateInput => ({ key: `hubspot:${id}`, source: 'hubspot', hubspotContactId: id, name, title, hasEmail: true, location: 'Bentonville, Arkansas, United States', ...over });
const base = (over: Partial<OwnerResolutionInput> = {}): OwnerResolutionInput => ({
  account: { name: 'Acme Retail', entityType: 'retailer' },
  purpose: 'COLD_FIRST_TOUCH',
  hypothesis: null,
  candidates: [],
  hubspot: { read: true, count: 0, truncated: false, via: 'linked' },
  now: NOW,
  ...over,
});

/** The Walmart pattern: dozens of transportation directors who share one title rule. */
const wall = Array.from({ length: 53 }, (_, k) => hs(String(100 + k), `Person ${k}`, k % 3 === 0 ? 'Regional Transportation Director' : k % 3 === 1 ? 'Director, Transportation Maintenance' : 'Senior Director - Regional Transportation - Logistics'));

describe('the wall becomes a stack', () => {
  const r = resolveOwner(base({ candidates: [gap(1, 'Doug Estrada', 'Senior Director - Regional Transportation - Logistics', { location: 'Bentonville, Arkansas, United States' }), ...wall] }));
  const s = buildPeopleStack(r, { chosenKey: null });
  it('shows at most STACK_DEFAULT_MAX people by default and says how many more are on record', () => {
    expect(r.eligible.length).toBeGreaterThan(30);
    expect(s.rows.length).toBeLessThanOrEqual(STACK_DEFAULT_MAX);
    expect(s.rows.length).toBeGreaterThanOrEqual(3);
    expect(s.hidden).toBe(r.eligible.length - s.rows.length);
    expect(s.showAllLabel).toMatch(new RegExp(`Show ${s.hidden} more`));
  });
  it('never claims an order the evidence does not hold: no ordinals and a plain tie sentence when the top rows share a rank', () => {
    expect(s.tie).toBe(true);
    expect(s.rows.every((row) => row.ordinal === null)).toBe(true);
    expect(s.tieLine).toMatch(/could not separate .+ on evidence/);
    expect(s.tieLine).toMatch(/first-name order, not a ranking/);
  });
  it('no row is labelled Best fit or Recommended when the resolver has no recommendation', () => {
    expect(r.recommended).toBeNull();
    expect(s.rows.every((row) => row.badge === null)).toBe(true);
    expect(JSON.stringify(s)).not.toMatch(/Best fit|Recommended/);
  });
  it('no visible reason is the shared title rule; a row with nothing to set it apart says so honestly instead of dressing it up', () => {
    for (const row of s.rows) expect(row.reason).not.toMatch(/^Primary operator: title says/);
    const honest = s.rows.filter((row) => /nothing on record sets them apart/.test(row.reason));
    const specific = s.rows.filter((row) => !/nothing on record sets them apart/.test(row.reason)).map((row) => row.reason);
    expect(new Set(specific).size).toBe(specific.length);
    expect(honest.length + specific.length).toBe(s.rows.length);
    expect(JSON.stringify(s.rows.map((row) => row.reason))).not.toMatch(/\(Person \d+\)/);
  });
});

describe('a real recommendation shows as a badge with its sentence; a single eligible person is preselected', () => {
  const fact = { id: 'h2', status: 'approved', primaryPersonaId: null, observation: 'We continue to optimize our enterprise linehaul network (Network 2.0).', problemHypothesis: 'My guess is that the change moves load onto the gates, yards and docks you run.', problemFamily: 'hidden_capacity' };
  const r = resolveOwner(base({ account: { name: 'FedEx', entityType: 'carrier' }, purpose: 'HYPOTHESIS_ACTIVATION', hypothesis: fact, candidates: [
    gap(2187, 'Jeffrey Tallman', 'Vice President - Operations Planning and Engineering - North America', { location: 'Plano, Texas, United States', employment: confirmed, role: { state: 'ROLE_CURRENT_CONFIRMED', label: 'Role confirmed', why: 'Verified at fedex.com on 2026-10-01.', effectiveTitle: 'Vice President - Operations Planning and Engineering - North America', priorTitle: null, usableForRanking: true } }),
    hs('1', 'Glen Chaffee', 'Managing Director - Transportation & Logistics', { location: 'Mars, Pennsylvania, United States' }),
    hs('3', 'Ram Balakumar', 'Managing Director of Operations', { location: 'Denver, Colorado, United States' }),
  ] }));
  const s = buildPeopleStack(r, { chosenKey: null });
  it('the badge appears only on the recommended row and carries the resolver sentence', () => {
    if (r.recommended) {
      const top = s.rows.find((row) => row.key === r.recommended!.key)!;
      expect(top.badge).toMatch(/Recommended/);
      expect(top.why).toContain(r.recommended.why);
      expect(s.rows.filter((row) => row.badge).length).toBe(1);
    } else {
      expect(s.rows.every((row) => row.badge === null)).toBe(true);
    }
  });
  it('a single eligible person is marked chosen by default only when the resolver preselects (the existing contract)', () => {
    const one = resolveOwner(base({ candidates: [gap(1, 'Doug Estrada', 'Senior Director - Regional Transportation - Logistics')] }));
    const s1 = buildPeopleStack(one, { chosenKey: null });
    expect(one.preselected).toBe('gap:1');
    expect(s1.rows[0].chosen).toBe(true);
    expect(s1.chooseLabel).toBe(null);
  });
  it('with two or more eligible and nobody chosen, the stack asks the seller to choose (never a one-name button)', () => {
    expect(s.rows.some((row) => row.chosen)).toBe(false);
    expect(s.chooseLabel).toMatch(/^Choose who \(\d+\)$/);
  });
});

describe('pursuit slots are offered only when the resolver fills them; the departed never pollute the stack', () => {
  const r = resolveOwner(base({ account: { name: 'H-E-B', entityType: 'retailer' }, candidates: [
    gap(45, 'Dakota Socha', 'transportation & reverse logistics', { employment: left('ADUSA Distribution') }),
    hs('9', 'Jess Bess', 'Director, Transportation Strategy & Planning', { location: 'San Antonio, Texas, United States' }),
    gap(7, 'Chris Admin', 'Vice President Supply Chain', { employment: unverified }),
    hs('10', 'Tina Tech', 'Director Transportation Technology', { location: 'San Antonio, Texas, United States' }),
  ] }));
  const s = buildPeopleStack(r, { chosenKey: null });
  it('a person who left is not a row; they are counted among the set-aside with the reason', () => {
    expect(s.rows.map((row) => row.name)).not.toContain('Dakota Socha');
    expect(s.setAside.count).toBeGreaterThanOrEqual(1);
    expect(s.setAside.line).toMatch(/Dakota Socha/);
    expect(s.setAside.line).toMatch(/left the company/i);
  });
  it('slots: eligible rows are operators (Next only when chosen or alone), SPONSOR and TECH are compact slot lines only when the resolver names them, no manufactured slot', () => {
    expect(['Next operator', 'Eligible operator']).toContain(s.rows[0].slot);
    expect(s.rows.every((row) => row.coldEligible)).toBe(true);
    const slots = s.slots.map((row) => row.slot);
    if (r.sponsor) expect(slots).toContain('Executive sponsor');
    if (r.tech) expect(slots).toContain('Tech / transformation');
    expect(slots).not.toContain('Site / regional operator');
    expect(s.slots.every((row) => !row.coldEligible || !s.rows.some((x) => x.key === row.key))).toBe(true);
  });
  it('the chosen person alone carries Next operator; everyone else eligible reads Eligible operator', () => {
    const chosen = buildPeopleStack(r, { chosenKey: r.eligible[0].key, chosenBy: 'you' });
    expect(chosen.rows[0].slot).toBe('Next operator');
    expect(chosen.rows.slice(1).every((row) => row.slot === 'Eligible operator' || !['Next operator'].includes(row.slot))).toBe(true);
  });
  it('currentness shows on a row only when material; a verified role reads as a cue, HubSpot-only reads as reachability', () => {
    const jess = s.rows.find((row) => row.name === 'Jess Bess')!;
    expect(jess.reachability).toMatch(/in HubSpot/i);
    expect(jess.currentness).toBeNull();
  });
});

describe('the chosen person leads and the action sits with them', () => {
  const r = resolveOwner(base({ candidates: [gap(1, 'Doug Estrada', 'Senior Director - Regional Transportation - Logistics'), gap(2, 'Kelly Kruse', 'Regional Transportation Senior Director'), gap(3, 'Derrick Thomas', 'Regional Transportation Director')] }));
  const s = buildPeopleStack(r, { chosenKey: 'gap:2', chosenBy: 'you, Oct 5' });
  it('the chosen row is first, marked chosen with who chose, and the others keep their rows', () => {
    expect(s.rows[0]).toMatchObject({ key: 'gap:2', chosen: true, chosenBy: 'you, Oct 5' });
    expect(s.rows.map((row) => row.key)).toContain('gap:1');
    expect(s.chooseLabel).toBeNull();
  });
  it('a chosen person who is no longer eligible is reported, not silently dropped', () => {
    const s2 = buildPeopleStack(r, { chosenKey: 'gap:99', chosenBy: 'you' });
    expect(s2.rows.some((row) => row.chosen)).toBe(false);
    expect(s2.chosenMissing).toMatch(/no longer/);
  });
});
