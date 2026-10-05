/**
 * OWNER RESOLUTION LOADER: the corporate family and the alias proposals (WHO truth maintenance, 2026-10-05).
 * The loader reads the account's own HubSpot company and its verified family's linked companies through one read
 * (family-people.ts), every HubSpot-only candidate carries where it was read, a divested unit never enters, the
 * cap is said, and an employment conflict naming a banner becomes a POSSIBLE ACCOUNT ALIAS proposal (never an alias).
 */
import { describe, expect, it, vi } from 'vitest';
import { loadOwnerResolution } from '@/lib/gap/people/owner-resolution-load';
import type { HubSpotPeopleReads } from '@/lib/gap/people/hubspot-people';

const NOW = new Date('2026-10-05T15:00:00Z');
type Acct = { name: string; vertical: string; parent_brand: string | null; hubspot_company_id: string | null };
type Row = { id: string; properties: Record<string, string | null> };

function prismaWith(accounts: Acct[], personas: Array<Record<string, unknown>> = [], rejected: string[] = []) {
  const writes: string[] = [];
  const guard = (name: string) => vi.fn(async () => { writes.push(name); return {}; });
  return {
    writes,
    account: {
      findUnique: vi.fn(async ({ where }: { where: { name: string } }) => accounts.find((a) => a.name === where.name) ?? null),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        if ('parent_brand' in where && typeof where.parent_brand === 'object' && where.parent_brand && 'not' in (where.parent_brand as object)) return accounts.filter((a) => a.parent_brand);
        if ('parent_brand' in where) return accounts.filter((a) => a.parent_brand === where.parent_brand);
        if ('name' in where && typeof where.name === 'object' && where.name && 'startsWith' in (where.name as object)) return accounts.filter((a) => a.name.toLowerCase().startsWith(String((where.name as { startsWith: string }).startsWith).toLowerCase()));
        if ('hubspot_company_id' in where) return accounts.filter((a) => a.hubspot_company_id && (where.hubspot_company_id as { in: string[] }).in.includes(a.hubspot_company_id));
        return [];
      }),
    },
    prospectingHypothesis: { findUnique: vi.fn(async () => null) },
    persona: { findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => (where.account_name ? personas.filter((p) => p.account_name === where.account_name) : personas.filter((p) => (where.id as { in: number[] }).in.includes(p.id as number)))), update: guard('persona.update'), create: guard('persona.create') },
    gapAccountAlias: { findMany: vi.fn(async () => []), create: guard('alias.create') },
    accountContactCandidate: { findMany: vi.fn(async () => []) },
    gapWorkSourceMember: { findMany: vi.fn(async () => []) },
    unsubscribedEmail: { findMany: vi.fn(async () => []) },
    contactEnrichment: { findMany: vi.fn(async () => []) },
    conversationDisposition: { findMany: vi.fn(async () => []) },
    canonicalAccountLink: { findMany: vi.fn(async () => []) },
    gapAuditEvent: { create: guard('audit.create'), findMany: vi.fn(async () => rejected.map((alias) => ({ payload: { alias, normalized: alias.toLowerCase() } }))) },
  };
}

function reads(byCompany: Record<string, Row[]>) {
  const asked: string[] = [];
  const r: HubSpotPeopleReads = {
    contactIdsForCompany: async (companyId, cap) => {
      asked.push(companyId);
      const ids = (byCompany[companyId] ?? []).map((x) => x.id);
      return { ids: ids.slice(0, cap), truncated: ids.length > cap };
    },
    readContacts: async (ids) => Object.values(byCompany).flat().filter((x) => ids.includes(x.id)).filter((x, i, all) => all.findIndex((y) => y.id === x.id) === i),
  };
  return { asked, reads: r };
}
const person = (id: string, first: string, last: string, title: string, email: string | null, company: string, extra: Record<string, string | null> = {}): Row => ({ id, properties: { firstname: first, lastname: last, jobtitle: title, email, company, city: 'Dallas', state: 'Texas', country: 'United States', ...extra } });

const PEPSI: Acct[] = [
  { name: 'PepsiCo', vertical: 'Food & Beverage', parent_brand: null, hubspot_company_id: '111' },
  { name: 'Frito-Lay', vertical: 'Food & Beverage', parent_brand: 'PepsiCo', hubspot_company_id: '54772621360' },
  { name: 'Gatorade', vertical: 'Unknown', parent_brand: 'PepsiCo', hubspot_company_id: null },
];

describe('the loader reads the verified family', () => {
  it('11/14. a Frito-Lay contact is a candidate with its provenance; Gatorade (no linked company) is named as not read; one person at both companies is one candidate', async () => {
    const hs = reads({
      '111': [person('1', 'Brad', 'Stroup', 'VP Supply Chain, Warehouse CoE, PBNA', 'b@pepsico.com', 'PepsiCo'), person('9', 'Karen', 'Darling', 'Senior Director - PBNA Transportation', 'k@pepsico.com', 'PepsiCo')],
      '54772621360': [person('219885493392', 'Isaac', 'Scott', 'Sr Director of Transportation - Frito-Lay', 'i@pepsico.com', 'Frito-Lay'), person('9', 'Karen', 'Darling', 'Senior Director - PBNA Transportation', 'k@pepsico.com', 'Frito-Lay')],
    });
    const prisma = prismaWith(PEPSI);
    const r = await loadOwnerResolution(prisma as never, { accountName: 'PepsiCo', purpose: 'COLD_FIRST_TOUCH', now: NOW }, { hubspotPeople: hs.reads });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(hs.asked).toEqual(['111', '54772621360']);
    expect(r.family).toMatchObject({ companies: 1, count: 1, capHit: false, searched: ['PepsiCo (111)', 'Frito-Lay (54772621360)'], excluded: ['Gatorade: no linked HubSpot company (never read by a domain or name guess)'], dedupe: { byId: 1, byEmail: 0 } });
    const isaac = r.resolution.eligible.find((c) => c.name === 'Isaac Scott');
    expect(isaac?.provenance).toMatchObject({ accountName: 'Frito-Lay', relation: 'subsidiary', companyId: '54772621360' });
    expect(isaac?.reasons.join(' ')).toMatch(/Source: HubSpot \(Frito-Lay, a PepsiCo subsidiary\)/);
    expect(r.resolution.eligible.filter((c) => c.name === 'Karen Darling')).toHaveLength(1);
    expect(r.resolution.checked.find((c) => /HubSpot contacts/.test(c))).toMatch(/3, via the linked company; 1 from 1 family company; family companies searched: PepsiCo \(111\), Frito-Lay \(54772621360\); not read: Gatorade/);
    // The family line counts what the child company read (2 rows) before the dedupe; the resolver's line counts people.
    expect(r.hubspot.detail).toMatch(/^linked HubSpot company 111; family: Frito-Lay \(subsidiary, \d\); not read: Gatorade/);
    expect(prisma.writes).toEqual([]);
  });
  it('13. a divested unit under FedEx never enters the read, and the cap is visible', async () => {
    const FEDEX: Acct[] = [
      { name: 'FedEx', vertical: '3PL / Logistics', parent_brand: null, hubspot_company_id: '500' },
      { name: 'FedEx Supply Chain', vertical: 'Unknown', parent_brand: 'FedEx', hubspot_company_id: '501' },
      { name: 'FedEx Freight', vertical: 'Unknown', parent_brand: 'FedEx', hubspot_company_id: '502' },
    ];
    const hs = reads({
      '500': [person('1', 'Jeff', 'Tallman', 'Vice President - Operations Planning and Engineering - North America', 'j@fedex.com', 'FedEx'), person('2', 'Glen', 'Chaffee', 'Managing Director - Transportation & Logistics', 'g@fedex.com', 'FedEx Ground')],
      '501': [person('11', 'Scott', 'Temple', 'President', 's@fedex.com', 'FedEx Supply Chain')],
      '502': [person('21', 'Lou', 'Ltl', 'Vice President Linehaul Operations', 'l@fedex.com', 'FedEx Freight')],
    });
    const r = await loadOwnerResolution(prismaWith(FEDEX) as never, { accountName: 'FedEx', purpose: 'COLD_FIRST_TOUCH', now: NOW }, { hubspotPeople: hs.reads, cap: 2 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(hs.asked).not.toContain('501');
    expect(r.family.excluded.some((e) => /FedEx Supply Chain: divested/.test(e))).toBe(true);
    expect(r.resolution.eligible.map((c) => c.name)).not.toContain('Scott Temple');
    // The total cap (2) is hit by the primary company; the family read is cut and the resolution says so.
    expect(r.family.capHit).toBe(true);
    expect(r.resolution.headline).toMatch(/HubSpot returned only the first 2 associated contacts/);
  });
  it('a separate operating company member (FedEx Freight) is read, and its people are a caution, never preselected', async () => {
    const FEDEX: Acct[] = [
      { name: 'FedEx', vertical: '3PL / Logistics', parent_brand: null, hubspot_company_id: '500' },
      { name: 'FedEx Freight', vertical: 'Unknown', parent_brand: 'FedEx', hubspot_company_id: '502' },
    ];
    const hs = reads({ '500': [], '502': [person('21', 'Lou', 'Ltl', 'Vice President Linehaul Operations', 'l@fedex.com', 'FedEx Freight')] });
    const r = await loadOwnerResolution(prismaWith(FEDEX) as never, { accountName: 'FedEx', purpose: 'COLD_FIRST_TOUCH', now: NOW }, { hubspotPeople: hs.reads });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.resolution.eligible[0]?.name).toBe('Lou Ltl');
    expect(r.resolution.eligible[0]?.caution).toMatch(/FedEx Freight is the LTL company/);
    expect(r.resolution.preselected).toBeNull();
  });
});

describe('16/19. alias proposals come from employment conflicts, never from name similarity, and alter nothing until confirmed', () => {
  const HEB: Acct[] = [{ name: 'H-E-B', vertical: 'Retail', parent_brand: null, hubspot_company_id: '45149181990' }];
  const hs = reads({
    '45149181990': [
      person('100', 'Jose', 'Huerta', 'Director of Transportation', 'h@heb.com', 'Heb'),
      person('101', 'Cara', 'Market', 'Director of Logistics', 'c@heb.com', 'Central Market'),
      person('102', 'Dan', 'Market', 'Transportation Manager', 'd@heb.com', 'Central Market'),
      person('103', 'Dee', 'Delta', 'Director of Transportation', 'e@heb.com', 'Delta Dental'),
    ],
  });
  it('Central Market (two CRM rows) is proposed with its evidence; the people stay set aside as conflicts until Casey confirms; nothing is written', async () => {
    const prisma = prismaWith(HEB);
    const r = await loadOwnerResolution(prisma as never, { accountName: 'H-E-B', purpose: 'COLD_FIRST_TOUCH', now: NOW }, { hubspotPeople: hs.reads });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.aliasProposals.map((p) => [p.company, p.canonical])).toEqual(expect.arrayContaining([['Central Market', 'H-E-B']]));
    const cm = r.aliasProposals.find((p) => p.company === 'Central Market');
    expect(cm?.evidence.join(' ')).toMatch(/2 HubSpot contacts/);
    expect(r.resolution.excluded.filter((e) => e.code === 'employment_conflict').map((e) => e.candidate.name)).toEqual(expect.arrayContaining(['Cara Market', 'Dan Market']));
    expect(prisma.writes).toEqual([]);
  });
  it('17. once the alias exists, the same people are eligible and no proposal repeats', async () => {
    const prisma = prismaWith(HEB);
    prisma.gapAccountAlias.findMany = vi.fn(async () => [{ alias: 'Central Market' }]);
    const r = await loadOwnerResolution(prisma as never, { accountName: 'H-E-B', purpose: 'COLD_FIRST_TOUCH', now: NOW }, { hubspotPeople: hs.reads });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.resolution.eligible.map((c) => c.name)).toEqual(expect.arrayContaining(['Cara Market', 'Dan Market']));
    expect(r.aliasProposals.map((p) => p.company)).not.toContain('Central Market');
  });
  it('a rejected spelling is not proposed again; "Delta Dental" is a conflict, proposed only on its evidence, never on the shared word', async () => {
    const prisma = prismaWith(HEB, [], ['Central Market']);
    const r = await loadOwnerResolution(prisma as never, { accountName: 'H-E-B', purpose: 'COLD_FIRST_TOUCH', now: NOW }, { hubspotPeople: hs.reads });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.aliasProposals.map((p) => p.company)).not.toContain('Central Market');
    const dd = r.aliasProposals.find((p) => p.company === 'Delta Dental');
    expect(dd?.evidence.join(' ')).toMatch(/1 HubSpot contact/);
    expect(r.resolution.excluded.find((e) => e.candidate.name === 'Dee Delta')?.code).toBe('employment_conflict');
  });
});
