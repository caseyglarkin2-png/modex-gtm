/**
 * ROLE TRUTH IN OWNER RESOLUTION (WHO truth maintenance, 2026-10-05). Employment currentness is necessary, not
 * sufficient: a person can still be at the company while the title GAP ranks on has changed. The Walmart pattern:
 * the stored "Sr Director - West Transportation Command Center" is contradicted by current public evidence (another
 * person now leads it; she was promoted), the new title is unknown. She stays in the buyer map, never ranks on the
 * stale title, and is set aside from role-dependent WHO with the verify sentence. With a verified new relevant title
 * she ranks under it; with a verified new irrelevant title she is not an owner for that motion. Family provenance:
 * a person read from a verified child company carries it; a separate operating company is a caution. Pure.
 */
import { describe, expect, it } from 'vitest';
import { resolveOwner, type OwnerCandidateInput, type OwnerResolutionInput, type RoleInput } from '@/lib/gap/people/owner-resolution';
import type { EmploymentRead } from '@/lib/gap/people/employment';

const NOW = new Date('2026-10-05T15:00:00Z');
const likely: EmploymentRead = { state: 'CURRENT_LIKELY', why: 'Apollo and the CRM agree.', decidedBy: [], elsewhere: null, verifyNeeded: false };
const unverified: EmploymentRead = { state: 'CURRENT_UNVERIFIED', why: 'CRM only.', decidedBy: [], elsewhere: null, verifyNeeded: false };
const BENTONVILLE = 'Bentonville, Arkansas, United States';
const hs = (id: string, name: string, title: string, over: Partial<OwnerCandidateInput> = {}): OwnerCandidateInput => ({ key: `hubspot:${id}`, source: 'hubspot', hubspotContactId: id, name, title, hasEmail: true, location: BENTONVILLE, employment: unverified, ...over });
const fulfillment = { id: 'h-wmt', status: 'approved', primaryPersonaId: null, observation: 'Walmart Inc. plans to invest more than $300 million in a new fulfillment center in Turtlecreek Township.', problemHypothesis: 'My guess is that the network change above moves load onto the physical handoffs that remain.', problemFamily: 'hidden_capacity' };
const base = (over: Partial<OwnerResolutionInput> = {}): OwnerResolutionInput => ({
  account: { name: 'Walmart Inc.', entityType: 'retailer' },
  purpose: 'HYPOTHESIS_ACTIVATION',
  hypothesis: fulfillment,
  candidates: [],
  hubspot: { read: true, count: 660, truncated: false, via: 'linked' },
  now: NOW,
  ...over,
});
const STORED = 'Sr Director - West Transportation Command Center';
const changedUnknown: RoleInput = { state: 'ROLE_CHANGED_CONFIRMED', label: 'Role changed (confirmed)', why: 'Christian Burton now leads the West Transportation Command Center (his own profile, 2026-10-05); she was promoted and her new title is not established.', effectiveTitle: null, priorTitle: STORED, usableForRanking: false };
const changedKnown = (title: string): RoleInput => ({ state: 'ROLE_CHANGED_CONFIRMED', label: 'Role changed (confirmed)', why: `Her own profile now reads ${title}.`, effectiveTitle: title, priorTitle: STORED, usableForRanking: true });
const roleConflict: RoleInput = { state: 'ROLE_CONFLICT', label: 'Role conflict: verify current role', why: 'Two current sources name different titles.', effectiveTitle: null, priorTitle: STORED, usableForRanking: false };
const roleConfirmed = (title: string): RoleInput => ({ state: 'ROLE_CURRENT_CONFIRMED', label: 'Role current (confirmed)', why: `Their own profile, 2026-10-01, reads ${title}.`, effectiveTitle: title, priorTitle: null, usableForRanking: true });

describe('2. same employer, verified promotion, new role unknown: the old title is not usable for ranking', () => {
  const people = [hs('1', 'Christina Mannella', STORED, { employment: likely, role: changedUnknown }), hs('2', 'Doug Estrada', 'Senior Director - Regional Transportation - Logistics')];
  const r = resolveOwner(base({ candidates: people }));
  it('she is set aside with the verify sentence, never do-not-contact, never left; the current operator leads', () => {
    const e = r.excluded.find((x) => x.candidate.name === 'Christina Mannella');
    expect(e?.code).toBe('role_changed');
    expect(e?.reason).toBe('Still at Walmart Inc., but the stored transportation role (Sr Director - West Transportation Command Center) changed: Christian Burton now leads the West Transportation Command Center (his own profile, 2026-10-05); she was promoted and her new title is not established. Verify current remit before using.');
    expect(JSON.stringify(e)).not.toMatch(/do_not_contact|left_company|LEFT_COMPANY/);
    expect(r.eligible.map((c) => c.name)).toEqual(['Doug Estrada']);
    expect(r.preselected).toBe('hubspot:2');
  });
  it('the set-aside count names role currentness apart from employment currentness', () => {
    expect(r.checked.find((c) => /role currentness/.test(c))).toBe('role currentness (1 set aside)');
    expect(r.checked.find((c) => /contact currentness/.test(c))).toBe('contact currentness (0 set aside)');
  });
  it('a role conflict is set aside the same way, with its own code', () => {
    const r2 = resolveOwner(base({ candidates: [hs('1', 'Christina Mannella', STORED, { role: roleConflict }), people[1]] }));
    expect(r2.excluded.find((x) => x.candidate.name === 'Christina Mannella')?.code).toBe('role_conflict');
    expect(r2.excluded.find((x) => x.candidate.name === 'Christina Mannella')?.reason).toMatch(/Verify current role/);
  });
  it('buyer truth or a relationship keeps a role-changed person eligible with a caution: the relationship is not role-dependent', () => {
    const r3 = resolveOwner(base({ candidates: [hs('1', 'Christina Mannella', STORED, { role: changedUnknown, buyerTruth: 'answered the first touch' }), people[1]] }));
    const c = r3.eligible.find((x) => x.name === 'Christina Mannella');
    expect(c).toBeTruthy();
    expect(c?.caution).toMatch(/stored transportation role .* changed/);
    expect(r3.preselected).toBeNull();
  });
});

describe('3. same employer, verified new relevant title: rank using the new title, never the stored one', () => {
  it('her verified new title (a transportation remit) is the title GAP reads and shows; the stored title is the prior', () => {
    const r = resolveOwner(base({ candidates: [hs('1', 'Christina Mannella', STORED, { employment: likely, role: changedKnown('Vice President, Transportation Operations') }), hs('2', 'Doug Estrada', 'Senior Director - Regional Transportation - Logistics')] }));
    const c = r.eligible.find((x) => x.name === 'Christina Mannella');
    expect(c?.title).toBe('Vice President, Transportation Operations');
    expect(c?.read.seniority).toBe(4);
    expect(c?.reasons.join(' ')).toMatch(/Role: Role changed \(confirmed\)\. Her own profile now reads Vice President, Transportation Operations\./);
    expect(c?.reasons.join(' ')).toMatch(/was Sr Director - West Transportation Command Center/);
    // The verified current role leads an unverified one for a hypothesis, and the recommendation says so.
    expect(r.eligible[0].name).toBe('Christina Mannella');
    expect(r.recommended?.firstDifference).toBe('current role');
  });
});

describe('4. same employer, verified new irrelevant title: not an owner for that motion', () => {
  it('a verified move to merchandising makes her "others", not eligible and not a conflict', () => {
    const r = resolveOwner(base({ candidates: [hs('1', 'Christina Mannella', STORED, { employment: likely, role: changedKnown('Vice President, Merchandising Operations') }), hs('2', 'Doug Estrada', 'Senior Director - Regional Transportation - Logistics')] }));
    expect(r.eligible.map((c) => c.name)).toEqual(['Doug Estrada']);
    expect(r.excluded.find((x) => x.candidate.name === 'Christina Mannella')).toBeUndefined();
    expect(r.others.flatMap((o) => o.names)).toContain('Christina Mannella');
  });
});

describe('a confirmed current role ranks above an unverified one for a hypothesis, and is only a tie-break for the cold touch', () => {
  const people = [hs('1', 'Una Unverified', 'Senior Director of Transportation'), hs('2', 'Vera Verified', 'Director of Transportation', { role: roleConfirmed('Director of Transportation'), employment: likely })];
  it('hypothesis: the verified director leads the unverified senior director; cold: seniority leads', () => {
    const hyp = resolveOwner(base({ candidates: people }));
    expect(hyp.eligible.map((c) => c.name)).toEqual(['Vera Verified', 'Una Unverified']);
    expect(hyp.recommended?.firstDifference).toBe('current role');
    const cold = resolveOwner(base({ purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: people }));
    expect(cold.eligible.map((c) => c.name)).toEqual(['Una Unverified', 'Vera Verified']);
  });
});

describe('family provenance: a person read from a verified child company carries it; a separate company is a caution', () => {
  it('a Frito-Lay contact under PepsiCo says where they were read; the checked line counts the family', () => {
    const r = resolveOwner(base({
      account: { name: 'PepsiCo', entityType: 'manufacturer' },
      purpose: 'COLD_FIRST_TOUCH',
      hypothesis: null,
      candidates: [hs('9', 'Fay Frito', 'Senior Director Transportation', { provenance: { accountName: 'Frito-Lay', relation: 'subsidiary', companyId: '54772621360' } })],
      hubspot: { read: true, count: 580, truncated: false, via: 'linked', family: { companies: 1, count: 38, capHit: false, searched: ['PepsiCo (56630459299)', 'Frito-Lay (54772621360)'], excluded: ['Gatorade: no linked HubSpot company (not read)'] } },
    }));
    expect(r.eligible[0].reasons.join(' ')).toMatch(/Source: HubSpot \(Frito-Lay, a PepsiCo subsidiary\), not yet a GAP contact/);
    expect(r.checked.find((c) => /HubSpot contacts/.test(c))).toBe('HubSpot contacts (580, via the linked company; 38 from 1 family company; family companies searched: PepsiCo (56630459299), Frito-Lay (54772621360); not read: Gatorade: no linked HubSpot company (not read))');
  });
  it('a separate operating company in the family is selectable with a caution and never preselected', () => {
    const r = resolveOwner(base({ account: { name: 'FedEx', entityType: '3pl' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [hs('9', 'Lou Ltl', 'Vice President Linehaul Operations', { provenance: { accountName: 'FedEx Freight', relation: 'subsidiary', companyId: '77', separate: 'FedEx Freight is the LTL company (a separate network): confirm the remit before a parcel-network motion.' } })] }));
    expect(r.eligible[0].caution).toMatch(/FedEx Freight is the LTL company/);
    expect(r.preselected).toBeNull();
  });
  it('the cap is said plainly when the family read was cut', () => {
    const r = resolveOwner(base({ candidates: [], hubspot: { read: true, count: 1000, truncated: true, via: 'linked', family: { companies: 3, count: 400, capHit: true, searched: [], excluded: [] } } }));
    expect(r.headline).toMatch(/HubSpot returned only the first 1000 associated contacts/);
    expect(r.checked.find((c) => /HubSpot contacts/.test(c))).toMatch(/cap hit/);
  });
});
