/**
 * WHO TRUTH, end to end through the loaders (2026-10-05). The Walmart pattern reaches the owner resolution and the
 * brief: a HubSpot-only person whose role was verified as changed (an audit row keyed by the contact id) is set aside
 * from WHO in both, with the verify sentence, while a GAP contact whose record carries a derived role_changed row
 * reads the same way. A verified new title is read instead of the stored one. Nothing is written.
 */
import { describe, expect, it, vi } from 'vitest';
import { loadOwnerResolution } from '@/lib/gap/people/owner-resolution-load';
import type { HubSpotPeopleReads } from '@/lib/gap/people/hubspot-people';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { importHubSpotContactToAccount } from '@/lib/gap/people/account-import';

const NOW = new Date('2026-10-05T15:00:00Z');
const STORED = 'Sr Director - West Transportation Command Center';

const rolePayload = (over: Record<string, unknown> = {}) => ({
  hubspotContactId: '700', accountName: 'Walmart Inc.', name: 'Christina Mannella', storedTitle: STORED, verdict: 'different_role', status: 'role_changed', company: 'Walmart Inc.', title: null, priorTitle: STORED,
  sourceUrl: 'https://www.linkedin.com/in/christian-burton-57161518b/', sourceDate: null, retrievedAt: '2026-10-05T14:00:00Z', evidenceClass: 'profile', tier: 'strong', companyDomains: ['walmart.com'], actor: 'casey@freightroll.com', provider: 'gemini_grounded_search', confidence: 'high',
  summary: 'Christian Burton now leads the West Transportation Command Center; Christina was promoted.', recorded: true, suppressionTouched: false, hubspotWritten: false, apolloSpent: 0, ...over,
});

function prismaWith(opts: { personas?: Array<Record<string, unknown>>; fields?: Record<number, Array<Record<string, unknown>>>; roleRows?: Array<{ subject_id: string; payload: Record<string, unknown> }> } = {}) {
  const writes: string[] = [];
  const guard = (name: string) => vi.fn(async () => { writes.push(name); return {}; });
  return {
    writes,
    account: { findUnique: vi.fn(async ({ where }: { where: { name: string } }) => (where.name === 'Walmart Inc.' ? { name: 'Walmart Inc.', vertical: 'Retail', hubspot_company_id: '8536615003', parent_brand: null } : null)), findMany: vi.fn(async () => []) },
    prospectingHypothesis: { findUnique: vi.fn(async () => null) },
    persona: { findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => (where.account_name ? opts.personas ?? [] : (opts.personas ?? []).filter((p) => (where.id as { in: number[] }).in.includes(p.id as number)))), update: guard('persona.update'), create: guard('persona.create') },
    gapAccountAlias: { findMany: vi.fn(async () => []) },
    accountContactCandidate: { findMany: vi.fn(async () => []) },
    gapWorkSourceMember: { findMany: vi.fn(async () => []) },
    unsubscribedEmail: { findMany: vi.fn(async () => []) },
    contactEnrichment: { findMany: vi.fn(async ({ where }: { where: { persona_id: { in: number[] } } }) => where.persona_id.in.filter((id) => opts.fields?.[id]).map((id) => ({ persona_id: id, fields: opts.fields![id] }))) },
    conversationDisposition: { findMany: vi.fn(async () => []) },
    canonicalAccountLink: { findMany: vi.fn(async () => []) },
    gapAuditEvent: { create: guard('audit.create'), findMany: vi.fn(async ({ where }: { where: { kind?: string; subject_type?: string } }) => (where.kind === 'person.role_verified' && where.subject_type === 'hubspot_contact' ? (opts.roleRows ?? []).map((r) => ({ ...r, created_at: new Date('2026-10-05T14:00:00Z') })) : [])) },
  };
}

const reads: HubSpotPeopleReads = {
  contactIdsForCompany: async () => ({ ids: ['700', '701'], truncated: false }),
  readContacts: async (ids) => [
    { id: '700', properties: { firstname: 'Christina', lastname: 'Mannella', jobtitle: STORED, email: 'c@walmart.com', company: 'Walmart', city: 'Bentonville', state: 'Arkansas', country: 'United States', lastmodifieddate: '2026-09-30T00:00:00Z' } },
    { id: '701', properties: { firstname: 'Doug', lastname: 'Estrada', jobtitle: 'Senior Director - Regional Transportation - Logistics', email: 'd@walmart.com', company: 'Walmart', city: 'Bentonville', state: 'Arkansas', country: 'United States' } },
  ].filter((r) => ids.includes(r.id)),
};

describe('the owner loader reads role evidence recorded against a HubSpot contact id', () => {
  it('Walmart: the HubSpot-only person with a verified role change (new title unknown) is set aside role_changed; without that row she ranks unverified', async () => {
    const withRow = await loadOwnerResolution(prismaWith({ roleRows: [{ subject_id: '700', payload: rolePayload() }] }) as never, { accountName: 'Walmart Inc.', purpose: 'COLD_FIRST_TOUCH', now: NOW }, { hubspotPeople: reads });
    expect(withRow.ok).toBe(true);
    if (!withRow.ok) return;
    const e = withRow.resolution.excluded.find((x) => x.candidate.name === 'Christina Mannella');
    expect(e?.code).toBe('role_changed');
    // The role read's own sentence stands once; the resolver never wraps "Still at ..." inside "Still at ...".
    expect(e?.reason).toMatch(/^Still at Walmart Inc\., but the stored role \("Sr Director - West Transportation Command Center"\) changed per /);
    expect(e?.reason).toMatch(/Verify current remit before using\.$/);
    expect(e?.reason.match(/Still at /g)).toHaveLength(1);
    expect(withRow.resolution.eligible.map((c) => c.name)).toEqual(['Doug Estrada']);
    expect(withRow.resolution.checked).toContain('role currentness (1 set aside)');

    const without = await loadOwnerResolution(prismaWith() as never, { accountName: 'Walmart Inc.', purpose: 'COLD_FIRST_TOUCH', now: NOW }, { hubspotPeople: reads });
    expect(without.ok && without.resolution.eligible.map((c) => c.name)).toEqual(['Christina Mannella', 'Doug Estrada']);
    expect(without.ok && without.resolution.eligible[0].role?.state).toBe('ROLE_UNVERIFIED');
  });
  it('a verified new relevant title is the title the resolver reads for the HubSpot-only person', async () => {
    const r = await loadOwnerResolution(prismaWith({ roleRows: [{ subject_id: '700', payload: rolePayload({ title: 'Vice President, Transportation Operations' }) }] }) as never, { accountName: 'Walmart Inc.', purpose: 'COLD_FIRST_TOUCH', now: NOW }, { hubspotPeople: reads });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const c = r.resolution.eligible.find((x) => x.name === 'Christina Mannella');
    expect(c?.title).toBe('Vice President, Transportation Operations');
    expect(c?.role?.state).toBe('ROLE_CHANGED_CONFIRMED');
    expect(c?.role?.priorTitle).toBe(STORED);
  });
  it('a GAP contact whose record carries a derived role_changed row (no new title) is set aside the same way; a linked contact also reads the contact-id evidence', async () => {
    const personas = [{ id: 50, account_name: 'Walmart Inc.', name: 'Christina Mannella', title: STORED, email: 'c@walmart.com', do_not_contact: false, email_status: 'unverified', hubspot_contact_id: '700' }];
    const fields = { 50: [
      { field_name: 'employment_status', field_value: 'role_changed', source: 'derived', source_timestamp: '2026-10-05T14:00:00Z', confidence: 0.9, last_writer: 'employment_verify:casey' },
      { field_name: 'employment_company', field_value: 'Walmart Inc.', source: 'derived', source_timestamp: '2026-10-05T14:00:00Z', confidence: 0.9, last_writer: 'x' },
      { field_name: 'employment_title', field_value: null, source: 'derived', source_timestamp: '2026-10-05T14:00:00Z', confidence: 0.9, last_writer: 'x' },
      { field_name: 'employment_source_url', field_value: 'https://www.linkedin.com/in/christian-burton-57161518b/', source: 'derived', source_timestamp: '2026-10-05T14:00:00Z', confidence: 0.9, last_writer: 'x' },
      { field_name: 'employment_note', field_value: 'Christian Burton now leads the West TCC.', source: 'derived', source_timestamp: '2026-10-05T14:00:00Z', confidence: 0.9, last_writer: 'x' },
    ] };
    const r = await loadOwnerResolution(prismaWith({ personas, fields }) as never, { accountName: 'Walmart Inc.', purpose: 'COLD_FIRST_TOUCH', now: NOW }, { hubspotPeople: reads });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.resolution.excluded.find((x) => x.candidate.key === 'gap:50')?.code).toBe('role_changed');
    expect(r.resolution.eligible.map((c) => c.name)).toEqual(['Doug Estrada']);
    // Employment is still "here": a changed role is never a departure, never do-not-contact.
    expect(r.resolution.excluded.find((x) => x.candidate.key === 'gap:50')?.candidate.employment?.state).not.toBe('LEFT_COMPANY_CONFIRMED');
    const linkedRow = await loadOwnerResolution(prismaWith({ personas: [{ ...personas[0], id: 51 }], roleRows: [{ subject_id: '700', payload: rolePayload() }] }) as never, { accountName: 'Walmart Inc.', purpose: 'COLD_FIRST_TOUCH', now: NOW }, { hubspotPeople: reads });
    expect(linkedRow.ok && linkedRow.resolution.excluded.find((x) => x.candidate.key === 'gap:51')?.code).toBe('role_changed');
  });
});

describe('the account-scoped import accepts a verified family company only when the owner action names it (review S7)', () => {
  const accounts = [
    { name: 'PepsiCo', hubspot_company_id: 'P1', parent_brand: null },
    { name: 'Frito-Lay', hubspot_company_id: 'F1', parent_brand: 'PepsiCo' },
    { name: 'FedEx Supply Chain', hubspot_company_id: 'D1', parent_brand: 'FedEx' },
  ];
  const calls: string[] = [];
  const tx = {
    persona: { create: vi.fn(async () => { calls.push('persona.create'); return { id: 9 }; }), update: vi.fn(async () => ({})) },
    contactEnrichment: { upsert: vi.fn(async () => ({ id: 1 })) },
    contactEnrichmentField: { upsert: vi.fn(async () => ({})) },
    gapAuditEvent: { create: vi.fn(async ({ data }: { data: { payload: Record<string, unknown> } }) => { calls.push(`audit:${JSON.stringify(data.payload.viaFamily ?? null)}`); return { id: 'a1' }; }) },
  };
  const prisma = {
    account: {
      findUnique: vi.fn(async ({ where }: { where: { name: string } }) => accounts.find((a) => a.name === where.name) ?? null),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        if ('parent_brand' in where) return accounts.filter((a) => a.parent_brand);
        if ('name' in where) return accounts.filter((a) => a.name.toLowerCase().startsWith(String((where.name as { startsWith: string }).startsWith).toLowerCase()));
        return [];
      }),
    },
    persona: { findFirst: vi.fn(async () => null) },
    $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  const reads = { readContact: async () => ({ id: 'C1', properties: { firstname: 'Fran', lastname: 'Frito', jobtitle: 'Senior Director, Transportation', email: 'fran@pepsico.com' } }), companyIdsForContact: async () => ['F1'] };
  it('refuses without the family company; accepts with it and records where the person was read from', async () => {
    const without = await importHubSpotContactToAccount(prisma as never, { accountName: 'PepsiCo', hubspotContactId: 'C1', actor: 'casey@freightroll.com', now: NOW }, { reads, sync: async () => undefined });
    expect(without).toMatchObject({ ok: false, reason: 'contact_not_associated' });
    const withFamily = await importHubSpotContactToAccount(prisma as never, { accountName: 'PepsiCo', hubspotContactId: 'C1', actor: 'casey@freightroll.com', now: NOW, familyCompanyId: 'F1' }, { reads, sync: async () => undefined });
    expect(withFamily).toMatchObject({ ok: true, status: 'created', personaId: 9 });
    expect(withFamily.ok && withFamily.notes.join(' ')).toMatch(/Read from the Frito-Lay record \(a PepsiCo family company\)/);
    expect(calls).toContain('audit:{"accountName":"Frito-Lay","companyId":"F1"}');
  });
  it('a company id that is not a verified family member is refused, and a divested unit never qualifies', async () => {
    const stranger = await importHubSpotContactToAccount(prisma as never, { accountName: 'PepsiCo', hubspotContactId: 'C1', actor: 'casey@freightroll.com', now: NOW, familyCompanyId: 'ZZZ' }, { reads: { ...reads, companyIdsForContact: async () => ['ZZZ'] }, sync: async () => undefined });
    expect(stranger).toMatchObject({ ok: false, reason: 'contact_not_associated' });
    expect(stranger.ok === false && stranger.detail).toMatch(/ZZZ is not a verified family company of PepsiCo/);
    const fedex = { ...prisma, account: { ...prisma.account, findUnique: vi.fn(async ({ where }: { where: { name: string } }) => (where.name === 'FedEx' ? { name: 'FedEx', hubspot_company_id: 'X1', parent_brand: null } : accounts.find((a) => a.name === where.name) ?? null)) } };
    const divested = await importHubSpotContactToAccount(fedex as never, { accountName: 'FedEx', hubspotContactId: 'C1', actor: 'casey@freightroll.com', now: NOW, familyCompanyId: 'D1' }, { reads: { ...reads, companyIdsForContact: async () => ['D1'] }, sync: async () => undefined });
    expect(divested).toMatchObject({ ok: false, reason: 'contact_not_associated' });
  });
});

describe('Apollo "current" confirms the employer, never the role', () => {
  it('a HubSpot-only person Apollo marks current reads CURRENT_LIKELY for employment and ROLE_UNVERIFIED for the role (the CRM title is never counted twice)', async () => {
    const apolloReads: HubSpotPeopleReads = {
      contactIdsForCompany: async () => ({ ids: ['702'], truncated: false }),
      readContacts: async () => [{ id: '702', properties: { firstname: 'Darryl', lastname: 'Phillips', jobtitle: 'Regional Vice President-Logistics', email: 'x@walmart.com', company: 'Walmart', apollo_employment_status: 'current', apollo_verified_at: '2026-09-11T00:00:00Z', city: 'Bentonville', state: 'Arkansas', country: 'United States' } }],
    };
    const r = await loadOwnerResolution(prismaWith() as never, { accountName: 'Walmart Inc.', purpose: 'COLD_FIRST_TOUCH', now: NOW }, { hubspotPeople: apolloReads });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.resolution.eligible[0]?.employment?.state).toBe('CURRENT_LIKELY');
    expect(r.resolution.eligible[0]?.role?.state).toBe('ROLE_UNVERIFIED');
  });
});

describe('the brief reads the same role truth: NOW never names a person on a contradicted title', () => {
  const base = (over: Partial<AccountInputs> = {}): AccountInputs => ({
    account: { name: 'Walmart Inc.', tier: null, priorityBand: null, vertical: 'Retail', parentBrand: null, hubspotCompanyId: '8536615003', recordUpdatedAt: null },
    aliases: [], aliasesAddedAt: null, domains: ['walmart.com'], siblings: [], watched: false, watchReasons: [], facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [],
    personas: [],
    hubspotPeople: null,
    candidates: [], memberships: [], firstTouches: [], conversation: null, opportunity: { status: 'CLEAR', detail: 'no open deal' }, pack: null, microsite: null, facilityFact: null, roi: null,
    ...over,
  } as unknown as AccountInputs);
  const changed = { state: 'ROLE_CHANGED_CONFIRMED' as const, why: 'Christian Burton now leads the West TCC; her new title is not established.', effectiveTitle: null, priorTitle: STORED, usableForRanking: false };
  it('the HubSpot-only person with a changed role fills no slot; the regional transportation director is WHO', () => {
    const b = buildAccountBrief(base({ hubspotPeople: { people: [{ id: '700', name: 'Christina Mannella', title: STORED, location: 'Bentonville, Arkansas, United States', hasEmail: true, role: changed }, { id: '701', name: 'Doug Estrada', title: 'Senior Director - Regional Transportation - Logistics', location: 'Bentonville, Arkansas, United States', hasEmail: true }], truncated: false } }), NOW);
    expect(b.people.primary?.name).toBe('Doug Estrada');
    expect(b.people.alternate?.name).not.toBe('Christina Mannella');
    const inLanes = b.people.lanes.flatMap((l) => l.people).find((p) => p.name === 'Christina Mannella');
    expect(inLanes?.role?.state).toBe('ROLE_CHANGED_CONFIRMED');
  });
  it('a verified new relevant title is the title the buyer map reads', () => {
    const b = buildAccountBrief(base({ hubspotPeople: { people: [{ id: '700', name: 'Christina Mannella', title: STORED, location: 'Bentonville, Arkansas, United States', hasEmail: true, role: { ...changed, effectiveTitle: 'Vice President, Transportation Operations', usableForRanking: true } }], truncated: false } }), NOW);
    expect(b.people.primary?.name).toBe('Christina Mannella');
    expect(b.people.primary?.title).toBe('Vice President, Transportation Operations');
  });
});
