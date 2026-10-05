/**
 * ADVERSARIAL REVIEW of feat/gap-who-truth (tip 57f66c8f), 2026-10-05. Failing-input tests: each `it` states the
 * expected behaviour and fails on the current code, so the lead can see the exact input and the wrong output.
 * Patterns, never people, except where the dogfood receipt itself names the case (Isaac at PepsiCo).
 */
import { describe, expect, it } from 'vitest';
import { proposeAccountKind } from '@/lib/gap/people/account-kind-review';
import { importHubSpotContactToAccount } from '@/lib/gap/people/account-import';
import { crmEvidence, readEmployment, tierForUrl, type EmploymentEvidence, type EmploymentRead } from '@/lib/gap/people/employment';
import { evidenceFromRolePayload } from '@/lib/gap/people/employment-store';
import { resolveOwner, type OwnerCandidateInput, type OwnerResolutionInput } from '@/lib/gap/people/owner-resolution';
import { readRole } from '@/lib/gap/people/role-currentness';
import { loadSuppressionReview } from '@/lib/gap/suppression/legacy-review';

const NOW = new Date('2026-10-05T15:00:00Z');
const US = 'Dallas, Texas, United States';
const unverified: EmploymentRead = { state: 'CURRENT_UNVERIFIED', why: 'CRM only.', decidedBy: [], elsewhere: null, verifyNeeded: false };
const gap = (id: number, name: string, title: string, over: Partial<OwnerCandidateInput> = {}): OwnerCandidateInput => ({ key: `gap:${id}`, source: 'gap', personaId: id, name, title, hasEmail: true, employment: unverified, location: US, ...over });
const hs = (id: string, name: string, title: string, over: Partial<OwnerCandidateInput> = {}): OwnerCandidateInput => ({ key: `hubspot:${id}`, source: 'hubspot', hubspotContactId: id, name, title, hasEmail: true, location: US, employment: unverified, ...over });
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

describe('Q1: a stale title cannot keep ranking after a verified promotion with no new title', () => {
  it('a ROLE_CHANGED_CONFIRMED person kept eligible by a relationship must not outrank an unverified peer on "current role" (ROLE_RANK scores the unusable state at 3)', () => {
    const changed = { state: 'ROLE_CHANGED_CONFIRMED' as const, label: 'Role changed', why: 'Still at Acme Foods, but the stored role changed per a colleague post; the new title is not established.', effectiveTitle: null, priorTitle: 'Director of Transportation', usableForRanking: false };
    const people = [
      gap(1, 'Pat Promoted', 'Director of Transportation', { relationship: 'met at MODEX', role: changed }),
      gap(2, 'Una Unverified', 'Director of Transportation', { relationship: 'met at MODEX', role: { state: 'ROLE_UNVERIFIED', label: 'Role per the CRM (not verified)', why: 'CRM only.', effectiveTitle: 'Director of Transportation', priorTitle: null, usableForRanking: true } }),
    ];
    const r = resolveOwner(base({ candidates: people }));
    // Both stay eligible (the relationship is not role-dependent): fine. But Pat is read on the stale title and leads.
    expect(r.eligible.map((c) => c.name)).toEqual(['Una Unverified', 'Pat Promoted']);
    // Una leads only because Pat's role is unusable; that is a plain choice, never a recommendation on "current role".
    expect(r.recommended).toBeNull();
  });
});

describe('Q3: a supporting-tier source cannot confirm a role change over strong evidence', () => {
  const ACCOUNT = 'Walmart Inc.';
  const STORED = 'Sr Director - West Transportation Command Center';
  const crm = crmEvidence({ company: 'Walmart', title: STORED, email: 'x@walmart.com', lastModifiedAt: '2026-09-30T00:00:00Z' });
  // What a VERIFY CURRENT ROLE answer sourced from theorg.com becomes (evidenceFromRolePayload): kind web, tier supporting.
  const aggregatorMoved = evidenceFromRolePayload({ verdict: 'different_role', accountName: ACCOUNT, title: null, priorTitle: STORED, sourceUrl: 'https://theorg.com/org/walmart/org-chart/x', sourceDate: '2026-10-01', retrievedAt: '2026-10-05T00:00:00Z', companyDomains: ['walmart.com'] }, '2026-10-05T00:00:00Z');
  it('the aggregator URL grades weak (fixed: tierForUrl reads a people directory as weak, as the employment.ts header says)', () => {
    expect(aggregatorMoved.tier).toBe('weak');
    expect(tierForUrl('https://www.zoominfo.com/p/x/123')).toBe('weak');
  });
  it('an undated strong profile naming the stored role is overridden by the supporting "different_role, no title" row: ROLE_CHANGED_CONFIRMED, excluded from WHO', () => {
    const profile: EmploymentEvidence = { kind: 'profile', tier: 'strong', company: ACCOUNT, title: STORED, at: null, source: 'LinkedIn profile', url: 'https://www.linkedin.com/in/x' };
    const r = readRole({ accountName: ACCOUNT, storedTitle: STORED, evidence: [...crm, profile, aggregatorMoved], now: NOW });
    // At most a conflict to verify; never "Role changed" on a supporting source alone.
    expect(r.state).not.toBe('ROLE_CHANGED_CONFIRMED');
  });
  it('a dated strong profile is overridden too when the supporting row is newer', () => {
    const profile: EmploymentEvidence = { kind: 'profile', tier: 'strong', company: ACCOUNT, title: STORED, at: '2026-09-20T00:00:00Z', source: 'LinkedIn profile', url: 'https://www.linkedin.com/in/x' };
    const r = readRole({ accountName: ACCOUNT, storedTitle: STORED, evidence: [...crm, profile, aggregatorMoved], now: NOW });
    expect(r.state).not.toBe('ROLE_CHANGED_CONFIRMED');
  });
});

describe('Q6: sameFirstWord collapses two companies, and strong evidence cannot catch the departure', () => {
  const profileAt = (company: string): EmploymentEvidence => ({ kind: 'profile', tier: 'strong', company, title: 'Vice President, Transportation', at: '2026-09-20T00:00:00Z', source: 'LinkedIn profile', url: 'https://www.linkedin.com/in/x' });
  it.each([
    ['Dollar General', 'Dollar Tree'],
    ['Schneider National', 'Schneider Electric'],
    ['Old Dominion Freight Line', 'Old Dominion University'],
    // 'Pilot Company' / 'Pilot Freight Services' stays a known limit: a one-word spelling that LEADS a longer one
    // ("NFI" / "NFI Industries") is the same employer by the #396 rule, and nothing in the names distinguishes a
    // namesake; Casey, an alias or identity catches it. Documented in OWNER_RESOLUTION.md.
    ['Performance Food Group', 'Performance Team'],
  ])('a recent own profile at %s\'s namesake %s reads as LEFT, not CURRENT_CONFIRMED here', (account, other) => {
    const r = readEmployment({ accountName: account, evidence: [...crmEvidence({ company: account, title: 'VP Transportation', email: null, lastModifiedAt: null }), profileAt(other)], now: NOW });
    expect(r.state).toBe('LEFT_COMPANY_CONFIRMED');
  });
});

describe('Q7: the title-share rule proposes carrier doctrine from a shipper\'s private-fleet keywords', () => {
  it('a food distributor with six private-fleet titles is proposed "3PL / Logistics" with strength strong', () => {
    const p = proposeAccountKind({ accountName: 'Acme Foodservice', vertical: 'Unknown', scout: null, sites: null, titles: ['Vice President, Fleet Operations', 'Director of Fleet Services', 'Driver Manager', 'Manager, Intermodal', 'Senior Director, Transportation', 'Director, Dedicated Fleet'] });
    expect(p.proposed).toBeNull();
  });
});

describe('Q9: the current-role dimension (#2 for a hypothesis) is gamed by one Apollo title refresh', () => {
  it('the air president with ROLE_CURRENT_LIKELY outranks the unverified planning VP on a Network 2.0 fact and is RECOMMENDED on "current role"', () => {
    const likely = { state: 'ROLE_CURRENT_LIKELY' as const, label: 'Role current (likely)', why: 'Supporting evidence agrees with the stored role at FedEx: Apollo employment check, 2026-09-11.', effectiveTitle: 'President Air Network Operations', priorTitle: null, usableForRanking: true };
    const unv = (t: string) => ({ state: 'ROLE_UNVERIFIED' as const, label: 'Role per the CRM (not verified)', why: 'CRM only.', effectiveTitle: t, priorTitle: null, usableForRanking: true });
    const people = [
      hs('1', 'Glen Generic', 'Managing Director - Transportation & Logistics', { role: unv('Managing Director - Transportation & Logistics') }),
      gap(2, 'Jeff Network', 'Vice President - Operations Planning and Engineering - North America', { role: unv('Vice President - Operations Planning and Engineering - North America') }),
      hs('3', 'Lisa Air', 'President Air Network Operations', { role: likely }),
    ];
    const r = resolveOwner(base({ account: { name: 'FedEx', entityType: '3pl' }, candidates: people, hubspot: { read: true, count: 114, truncated: false, via: 'identity' } }));
    expect(r.eligible[0].name).toBe('Jeff Network');
    expect(r.recommended?.key).toBe('gap:2');
  });
});

describe('Frozen contract: the Pepsi Isaac workflow (legacy flag review) must stay reachable', () => {
  it('a do-not-contact GAP contact whose CRM titles disagree is set aside as role_conflict, so the panel never offers "Review the legacy flag" (owner-resolution.ts:383 precedes :391; panel keys the review on code do_not_contact)', () => {
    const conflict = { state: 'ROLE_CONFLICT' as const, label: 'Role conflict: verify current role', why: 'HubSpot names a different role from the stored one.', effectiveTitle: null, priorTitle: null, usableForRanking: false };
    const r = resolveOwner(base({ account: { name: 'PepsiCo', entityType: null }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [gap(13, 'Dr. Isaac Scott', 'Sr Director of Transportation - Frito-Lay', { doNotContact: true, role: conflict })] }));
    expect(r.excluded.map((e) => e.code)).toContain('do_not_contact');
  });
  it('a CRM wording difference between the GAP title and the HubSpot title is read as ROLE_CONFLICT and blocks ranking (5 personas set aside in the 20-account dogfood)', () => {
    const stored = 'Senior Director, Transportation and Fleet Services';
    const hubspotTitle = 'Sr Director Transportation';
    const r = readRole({ accountName: 'Acme Foods', storedTitle: stored, crmTitle: hubspotTitle, evidence: crmEvidence({ company: 'Acme Foods', title: hubspotTitle, email: null, lastModifiedAt: null }), now: NOW });
    expect(r.usableForRanking).toBe(true);
  });
});

describe('Q4: a family-provenance person is offered as add_then_use but the account-scoped import refuses the click', () => {
  it('resolveOwner marks a subsidiary-record person add_then_use; importHubSpotContactToAccount answers contact_not_associated for the same person', async () => {
    const r = resolveOwner(base({ account: { name: 'PepsiCo', entityType: 'manufacturer' }, purpose: 'COLD_FIRST_TOUCH', hypothesis: null, candidates: [hs('C1', 'Fran Frito', 'Senior Director, Transportation', { provenance: { accountName: 'Frito-Lay', relation: 'subsidiary', companyId: 'F1' } })] }));
    expect(r.eligible[0]?.action).toBe('add_then_use');
    expect(r.nextStep).toBe('add_and_use');
    const prisma = { account: { findUnique: async () => ({ name: 'PepsiCo', hubspot_company_id: 'P1', parent_brand: null }) } };
    const imp = await importHubSpotContactToAccount(prisma, { accountName: 'PepsiCo', hubspotContactId: 'C1', actor: 'casey@freightroll.com', now: NOW }, { reads: { readContact: async () => ({ id: 'C1', properties: { firstname: 'Fran', lastname: 'Frito', email: 'fran@fritolay.com' } }), companyIdsForContact: async () => ['F1'] } });
    // Without the provenance company the account-scoped import still refuses (the frozen rule); the owner action
    // passes the verified family company it read the person from, and the import accepts it only after re-verifying
    // the family (who-truth-integration.test.ts).
    expect(imp).toMatchObject({ ok: false, reason: 'contact_not_associated' });
    expect(imp.ok === false && imp.detail).toMatch(/not with PepsiCo/);
  });
});

describe('Q10: a deliberately reverted clear does not hold the flag', () => {
  it('override_history reads "clear" even when the latest decision restored the flag on purpose, so the clear is allowed again', async () => {
    const prisma = {
      persona: { findUnique: async () => ({ id: 13, name: 'Pat Persona', account_name: 'Acme Foods', email: 'pat@acme.com', do_not_contact: true, email_status: 'bounced', hubspot_contact_id: null }) },
      unsubscribedEmail: { findFirst: async () => null },
      emailLog: { findMany: async () => [
        { status: 'bounced', bounce_type: null, sent_at: '2026-03-27T12:00:00Z', delivered_at: null, subject: null, reply_count: 0 },
        { status: 'delivered', bounce_type: null, sent_at: '2026-03-28T12:00:00Z', delivered_at: '2026-03-28T12:00:00Z', subject: 'Re: yards', reply_count: 0 },
      ] },
      gapAuditEvent: { findMany: async () => [
        { id: 'a', kind: 'suppression.corrected', actor: 'casey@freightroll.com', created_at: '2026-09-01T00:00:00Z', payload: {} },
        { id: 'b', kind: 'suppression.correction_reverted', actor: 'casey@freightroll.com', created_at: '2026-09-02T00:00:00Z', payload: { note: 'restored on purpose: the buyer asked us to stop' } },
      ] },
    };
    const review = await loadSuppressionReview(prisma, 13, { now: NOW, contract: async () => ({ blocked: true, reason: null, keys: ['modex_do_not_contact'], unknownLegs: [], legsRead: { clawd: true, hubspot: true, modex: true, sendgrid: true, verbal: true } }) });
    expect(review?.sources.find((s) => s.source === 'override_history')?.detail).toMatch(/reverted/);
    expect(review?.clear.allowed).toBe(false);
  });
});
