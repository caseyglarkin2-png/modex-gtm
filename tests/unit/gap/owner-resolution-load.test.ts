/**
 * OWNER RESOLUTION: the loader (2026-10-05). HubSpot first (the linked company, else the account identity), GAP
 * personas with their currentness, staged candidates and relationships; the hypothesis must belong to the account;
 * nothing is written and nothing calls Apollo.
 */
import { describe, expect, it, vi } from 'vitest';
import { loadOwnerResolution } from '@/lib/gap/people/owner-resolution-load';
import type { HubSpotPeopleReads } from '@/lib/gap/people/hubspot-people';
import type { OpportunityReads } from '@/lib/gap/opportunity/active-opportunity';

const NOW = new Date('2026-10-05T15:00:00Z');

function reads(rows: Array<{ id: string; properties: Record<string, string | null> }>, byCompany: Record<string, string[]>): HubSpotPeopleReads {
  return {
    contactIdsForCompany: async (companyId) => ({ ids: byCompany[companyId] ?? [], truncated: false }),
    readContacts: async (ids) => rows.filter((r) => ids.includes(r.id)),
  };
}

function prismaWith(seed: { account: any; personas?: any[]; hypotheses?: any[]; candidates?: any[]; members?: any[]; links?: any[]; unsubscribed?: string[] }) {
  const writes: string[] = [];
  const guard = (name: string) => vi.fn(async () => { writes.push(name); return {}; });
  return {
    writes,
    account: { findUnique: vi.fn(async ({ where }: any) => (where.name === seed.account.name ? seed.account : null)) },
    prospectingHypothesis: { findUnique: vi.fn(async ({ where }: any) => (seed.hypotheses ?? []).find((h) => h.id === where.id) ?? null) },
    persona: {
      findMany: vi.fn(async ({ where }: any) => (where.account_name ? (seed.personas ?? []).filter((p) => p.account_name === where.account_name) : (seed.personas ?? []).filter((p) => where.id.in.includes(p.id)))),
      update: guard('persona.update'),
      create: guard('persona.create'),
    },
    gapAccountAlias: { findMany: vi.fn(async () => []) },
    accountContactCandidate: { findMany: vi.fn(async () => seed.candidates ?? []) },
    gapWorkSourceMember: { findMany: vi.fn(async () => seed.members ?? []) },
    unsubscribedEmail: { findMany: vi.fn(async ({ where }: any) => (seed.unsubscribed ?? []).filter((e) => where.email.in.includes(e)).map((email) => ({ email }))) },
    contactEnrichment: { findMany: vi.fn(async () => []) },
    conversationDisposition: { findMany: vi.fn(async () => []) },
    canonicalAccountLink: { findMany: vi.fn(async () => seed.links ?? []) },
    gapAuditEvent: { create: guard('audit.create') },
  };
}

const HS: Array<{ id: string; properties: Record<string, string | null> }> = [
  { id: '100', properties: { firstname: 'Jose', lastname: 'Huerta', jobtitle: 'Director of Transportation', city: 'Schertz', state: 'Texas', country: 'United States', email: 'h@heb.com', hs_email_optout: null, company: 'Heb', lastmodifieddate: '2026-07-17T07:02:15Z' } },
  { id: '218964806213', properties: { firstname: 'Dakota', lastname: 'Socha', jobtitle: 'transportation & reverse logistics', city: 'San Antonio', state: 'Texas', country: 'United States', email: 'socha.dakota@heb.com', hs_email_optout: null, company: 'Heb', lastmodifieddate: '2026-08-18T17:45:54Z', apollo_employment_status: 'moved_out', apollo_verified_at: '2026-09-11T00:00:00Z' } },
  { id: '101', properties: { firstname: 'Carson', lastname: 'Landsgard', jobtitle: 'EVP Supply Chain and Logistics', email: 'c@heb.com', hs_email_optout: null, company: 'Heb' } },
];

describe('loadOwnerResolution', () => {
  it('an unlinked account reads its HubSpot people through the account identity (persona email domains), and the linked persona is one candidate, not two', async () => {
    const prisma = prismaWith({
      account: { name: 'H-E-B', vertical: 'Retail', hubspot_company_id: null, parent_brand: 'H-E-B' },
      personas: [{ id: 1306, account_name: 'H-E-B', name: 'dakota socha', title: 'transportation & reverse logistics', email: 'socha.dakota@heb.com', do_not_contact: false, email_status: 'unverified', hubspot_contact_id: '218964806213' }],
    });
    const opp: OpportunityReads = {
      companiesById: async () => ({ companies: [], missing: [] }),
      companiesByDomains: async (domains: string[]) => ({ companies: domains.some((d: string) => /heb\.com/.test(d)) ? [{ id: '45149181990', name: 'Heb' }] : [], truncated: false }),
      companiesByNames: async () => ({ companies: [], truncated: false }),
      associations: async () => ({ byId: new Map(), truncated: false }),
      dealsById: async () => [],
    } as unknown as OpportunityReads;
    const r = await loadOwnerResolution(prisma as any, { accountName: 'H-E-B', purpose: 'COLD_FIRST_TOUCH', now: NOW }, { hubspotPeople: reads(HS, { '45149181990': ['100', '218964806213', '101'] }), company: { reads: opp, configured: () => true } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.hubspot).toMatchObject({ companyIds: ['45149181990'], via: 'identity' });
    const keys = r.resolution.eligible.map((c) => c.key).concat(r.resolution.excluded.map((e) => e.candidate.key));
    expect(keys).toContain('gap:1306');
    expect(keys).not.toContain('hubspot:218964806213');
    // Apollo's moved_out on the live HubSpot row raises a conflict for the GAP persona: set aside, not the owner.
    expect(r.resolution.excluded.find((e) => e.candidate.key === 'gap:1306')).toMatchObject({ code: 'employment_conflict' });
    expect(r.resolution.eligible.map((c) => c.name)).toEqual(['Jose Huerta']);
    expect(r.resolution.nextStep).toBe('add_and_use');
    expect(r.resolution.sponsor?.name).toBe('Carson Landsgard');
    expect(r.resolution.checked[1]).toMatch(/HubSpot contacts \(3, via the account identity\)/);
    expect(prisma.writes).toEqual([]);
  });

  it('a linked account reads the linked company; a hypothesis at another account is refused; an unknown account too', async () => {
    const prisma = prismaWith({ account: { name: 'Walmart Inc.', vertical: 'Retail', hubspot_company_id: '8536615003', parent_brand: null }, hypotheses: [{ id: 'h1', account_name: 'FedEx', status: 'approved', primary_persona_id: null, observation: 'x', problem_hypothesis: 'y', problem_family: 'hidden_capacity' }] });
    const r = await loadOwnerResolution(prisma as any, { accountName: 'Walmart Inc.', purpose: 'HYPOTHESIS_ACTIVATION', hypothesisId: 'h1', now: NOW }, { hubspotPeople: reads([], {}) });
    expect(r).toEqual({ ok: false, reason: 'hypothesis_not_at_account' });
    expect(await loadOwnerResolution(prisma as any, { accountName: 'Nope', purpose: 'COLD_FIRST_TOUCH', now: NOW })).toEqual({ ok: false, reason: 'account_not_found' });
    const ok = await loadOwnerResolution(prisma as any, { accountName: 'Walmart Inc.', purpose: 'COLD_FIRST_TOUCH', now: NOW }, { hubspotPeople: reads(HS, { '8536615003': ['100'] }) });
    expect(ok.ok && ok.hubspot.via).toBe('linked');
    // The fixture row's CRM company is "Heb" at a Walmart account: read like a persona (review S3), that is a
    // conflict, so the person is set aside with the reason rather than eligible.
    expect(ok.ok && ok.resolution.eligible.map((c) => c.key)).toEqual([]);
    expect(ok.ok && ok.resolution.excluded.find((e) => e.candidate.key === 'hubspot:100')?.code).toBe('employment_conflict');
  });

  it('with no HubSpot company and no domain, the answer says so and still reads GAP contacts, staged candidates and relationships', async () => {
    const prisma = prismaWith({
      account: { name: 'Tyson Foods', vertical: 'Food', hubspot_company_id: null, parent_brand: null },
      personas: [{ id: 7, account_name: 'Tyson Foods', name: 'Rick Barrett', title: 'Director of Transportation', email: null, do_not_contact: false, email_status: null, hubspot_contact_id: null }],
      candidates: [{ id: 3, full_name: 'Stan Staged', title: 'VP Transportation', email: null }],
      members: [{ id: 'm1', name: 'Ryan Heman', kind: 'person', title: null, persona_id: null, relationship_context: 'met at Inland26', work_source: { name: 'Inland26', source_type: 'conference' } }],
    });
    const r = await loadOwnerResolution(prisma as any, { accountName: 'Tyson Foods', purpose: 'COLD_FIRST_TOUCH', now: NOW }, { company: { configured: () => true } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.hubspot.via).toBe('none');
    expect(r.resolution.eligible.map((c) => c.key)).toEqual(['gap:7']);
    expect(r.resolution.others.flatMap((o) => o.names)).toEqual(expect.arrayContaining(['Stan Staged (staged candidate)', 'Ryan Heman (relationship, not a contact)']));
    expect(r.resolution.checked[1]).toBe('HubSpot contacts (no HubSpot company resolves)');
  });
});

describe('review S3: a HubSpot-only person Apollo marked moved_out is set aside, never eligible, never preselected', () => {
  it('sole HubSpot operator with apollo_employment_status=moved_out', async () => {
    const prisma = {
      account: { findUnique: vi.fn(async () => ({ name: 'Walmart Inc.', vertical: 'Retail', hubspot_company_id: '8536615003', parent_brand: null })) },
      persona: { findMany: vi.fn(async () => []) },
      gapAccountAlias: { findMany: vi.fn(async () => []) },
      accountContactCandidate: { findMany: vi.fn(async () => []) },
      gapWorkSourceMember: { findMany: vi.fn(async () => []) },
      unsubscribedEmail: { findMany: vi.fn(async () => []) },
      contactEnrichment: { findMany: vi.fn(async () => []) },
      conversationDisposition: { findMany: vi.fn(async () => []) },
    };
    const rows = [
      { id: '777', properties: { firstname: 'Gone', lastname: 'Person', jobtitle: 'Senior Director Transportation', email: 'g@walmart.com', hs_email_optout: null, company: 'Walmart', apollo_employment_status: 'moved_out', apollo_verified_at: '2026-09-11T00:00:00Z', city: 'Bentonville', state: 'Arkansas', country: 'United States' } },
      { id: '778', properties: { firstname: 'Here', lastname: 'Person', jobtitle: 'Director of Transportation', email: 'h@walmart.com', hs_email_optout: null, company: 'Walmart', apollo_employment_status: null, apollo_verified_at: null, city: 'Bentonville', state: 'Arkansas', country: 'United States' } },
    ];
    const hubspotPeople = { contactIdsForCompany: async () => ({ ids: rows.map((r) => r.id), truncated: false }), readContacts: async (ids: string[]) => rows.filter((r) => ids.includes(r.id)) };
    const r = await loadOwnerResolution(prisma as any, { accountName: 'Walmart Inc.', purpose: 'COLD_FIRST_TOUCH', now: NOW }, { hubspotPeople });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.resolution.excluded.find((e) => e.candidate.key === 'hubspot:777')).toMatchObject({ code: 'employment_conflict' });
    expect(r.resolution.eligible.map((c) => c.key)).toEqual(['hubspot:778']);
    expect(r.resolution.preselected).toBe('hubspot:778');
  });
});
