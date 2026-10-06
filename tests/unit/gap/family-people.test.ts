/**
 * ENTERPRISE GRAPH (2026-10-05): the corporate-family-aware HubSpot contact read. Owner resolution read ONE HubSpot
 * company per account; PepsiCo's transportation directors sit on the Frito-Lay and PBNA records. This read adds the
 * family's people under hard rules: a member is read only through its own linked company (never a domain or name
 * guess), a divested unit never enters, a separate operating company enters with that provenance, one person held
 * at two companies is one person (by HubSpot id, then by the non-reversible email key), caps are deterministic and
 * visible, and a failed member read is said, never thrown.
 */
import { describe, expect, it } from 'vitest';
import { loadFamilyPeople } from '@/lib/gap/people/family-people';
import { loadHubSpotPeopleForCompanies, type HubSpotPeopleReads } from '@/lib/gap/people/hubspot-people';

const NOW = new Date('2026-10-05T15:00:00Z');
type Acct = { name: string; parent_brand: string | null; hubspot_company_id: string | null };

function fake(accounts: Acct[]) {
  return {
    account: {
      findUnique: async ({ where }: { where: { name: string } }) => accounts.find((a) => a.name === where.name) ?? null,
      findMany: async ({ where }: { where: Record<string, unknown> }) => {
        if ('parent_brand' in where) return accounts.filter((a) => a.parent_brand);
        if ('name' in where) return accounts.filter((a) => a.name.toLowerCase().startsWith(String((where.name as { startsWith: string }).startsWith).toLowerCase()));
        if ('hubspot_company_id' in where) return accounts.filter((a) => a.hubspot_company_id && (where.hubspot_company_id as { in: string[] }).in.includes(a.hubspot_company_id));
        return [];
      },
    },
  };
}

type Row = { id: string; properties: Record<string, string | null> };
/** Contacts per HubSpot company; records which companies were asked for; a company in `fail` throws. */
function reads(byCompany: Record<string, Row[]>, fail: string[] = []) {
  const asked: string[] = [];
  const r: HubSpotPeopleReads = {
    contactIdsForCompany: async (companyId, cap) => {
      asked.push(companyId);
      if (fail.includes(companyId)) throw new Error('429');
      const ids = (byCompany[companyId] ?? []).map((x) => x.id);
      return { ids: ids.slice(0, cap), truncated: ids.length > cap };
    },
    readContacts: async (ids) => Object.values(byCompany).flat().filter((x) => ids.includes(x.id)).filter((x, i, all) => all.findIndex((y) => y.id === x.id) === i),
  };
  return { asked, reads: r };
}

const person = (id: string, first: string, last: string, title: string, email: string | null, company: string): Row => ({ id, properties: { firstname: first, lastname: last, jobtitle: title, email, company } });

const PEPSI: Acct[] = [
  { name: 'PepsiCo', parent_brand: null, hubspot_company_id: '111' },
  { name: 'Frito-Lay', parent_brand: 'PepsiCo', hubspot_company_id: '54772621360' },
  { name: 'Gatorade', parent_brand: 'PepsiCo', hubspot_company_id: null },
  { name: 'Quaker Foods', parent_brand: 'PepsiCo', hubspot_company_id: '333' },
];

describe('loadFamilyPeople', () => {
  it('a verified child contact is included with its provenance; a child with no linked company is not read and says so', async () => {
    const hs = reads({
      '111': [person('1', 'Brad', 'Stroup', 'VP Supply Chain, PBNA', 'b@pepsico.com', 'PepsiCo')],
      '54772621360': [person('219885493392', 'Isaac', 'Scott', 'Sr Director of Transportation - Frito-Lay', 'i@pepsico.com', 'Frito-Lay')],
      '333': [],
    });
    const r = await loadFamilyPeople(fake(PEPSI), 'PepsiCo', NOW, { hubspotPeople: hs.reads });
    expect(r.read).toBe(true);
    expect(r.primary).toEqual({ accountName: 'PepsiCo', companyIds: ['111'], count: 1, truncated: false, via: 'linked' });
    expect(r.people.map((p) => [p.id, p.provenance])).toEqual([
      ['1', { accountName: 'PepsiCo', relation: 'primary', companyId: '111' }],
      ['219885493392', { accountName: 'Frito-Lay', relation: 'subsidiary', companyId: '54772621360' }],
    ]);
    expect(r.family).toEqual([
      { accountName: 'Frito-Lay', relation: 'subsidiary', companyIds: ['54772621360'], count: 1, truncated: false },
      { accountName: 'Quaker Foods', relation: 'subsidiary', companyIds: ['333'], count: 0, truncated: false },
    ]);
    expect(r.searched).toEqual(['PepsiCo (111)', 'Frito-Lay (54772621360)', 'Quaker Foods (333)']);
    expect(r.excluded).toEqual([{ accountName: 'Gatorade', why: 'no linked HubSpot company (never read by a domain or name guess)' }]);
    // Only linked ids were ever asked for: no domain or name lookup exists in this read.
    expect(hs.asked).toEqual(['111', '54772621360', '333']);
    expect(r.capHit).toBe(false);
    expect(JSON.stringify(r)).not.toMatch(/@/);
  });

  it('a divested unit never enters (its company is never read) and the transaction note is the reason; a separate operating company is read with that provenance', async () => {
    const book: Acct[] = [
      { name: 'FedEx', parent_brand: null, hubspot_company_id: '900' },
      { name: 'GENCO, A FedEx Company', parent_brand: 'FedEx', hubspot_company_id: '901' },
      { name: 'FedEx Freight', parent_brand: 'FedEx', hubspot_company_id: '902' },
      { name: 'FedEx Ground', parent_brand: 'FedEx', hubspot_company_id: null },
    ];
    const hs = reads({
      '900': [person('10', 'Glen', 'Chaffee', 'Managing Director - Transportation', 'g@fedex.com', 'FedEx')],
      '901': [person('11', 'Sold', 'Away', 'President, FedEx Supply Chain', 's@fedex.com', 'GENCO')],
      '902': [person('12', 'Ltl', 'Leader', 'VP Operations', 'l@fedex.com', 'FedEx Freight')],
    });
    const r = await loadFamilyPeople(fake(book), 'FedEx', NOW, { hubspotPeople: hs.reads });
    expect(r.people.map((p) => p.id)).toEqual(['10', '12']);
    expect(hs.asked).not.toContain('901');
    expect(r.excluded).toEqual([
      { accountName: 'FedEx Ground', why: 'no linked HubSpot company (never read by a domain or name guess)' },
      { accountName: 'GENCO, A FedEx Company', why: 'divested: FedEx completed the sale of FedEx Supply Chain (the former GENCO) to CMA CGM Group on October 1, 2026 for $1.4 billion; it joins CEVA Logistics, so this role no longer belongs to FedEx (FedEx newsroom, Oct 1, 2026).' },
    ]);
    const ltl = r.people.find((p) => p.id === '12');
    expect(ltl?.provenance).toMatchObject({ accountName: 'FedEx Freight', relation: 'subsidiary', companyId: '902', boundary: { unit: 'FedEx Freight', status: 'separate' } });
    expect(r.people.find((p) => p.id === '10')?.provenance).not.toHaveProperty('boundary');
  });

  it('a duplicate across parent and child is one person: by HubSpot id, then by the email key; the primary row wins', async () => {
    const hs = reads({
      '111': [person('1', 'Karen', 'Darling', 'Senior Director - PBNA Transportation', 'karen@pepsico.com', 'PepsiCo'), person('2', 'Same', 'Id', 'Director', 'same@pepsico.com', 'PepsiCo')],
      '54772621360': [person('2', 'Same', 'Id', 'Director (child copy)', 'same@pepsico.com', 'Frito-Lay'), person('77', 'Karen', 'Darling', 'Sr Director Transportation', 'Karen@PepsiCo.com', 'Frito-Lay'), person('78', 'Only', 'Child', 'Hub Manager', 'o@pepsico.com', 'Frito-Lay')],
      '333': [],
    });
    const r = await loadFamilyPeople(fake(PEPSI), 'PepsiCo', NOW, { hubspotPeople: hs.reads });
    expect(r.people.map((p) => p.id)).toEqual(['1', '2', '78']);
    expect(r.people.find((p) => p.id === '2')?.title).toBe('Director');
    expect(r.people.find((p) => p.id === '1')?.provenance.relation).toBe('primary');
    expect(r.dedupe).toEqual({ byId: 1, byEmail: 1 });
    expect(r.family[0]).toMatchObject({ accountName: 'Frito-Lay', count: 3 });
  });

  it('the caps are visible and deterministic: the same inputs cut the same way; a member beyond the company cap is excluded and says so', async () => {
    const book: Acct[] = [{ name: 'Kroger', parent_brand: null, hubspot_company_id: 'k' }];
    const byCompany: Record<string, Row[]> = { k: [person('k1', 'Ranor', 'Relatores', 'Senior Director of Transportation', 'r@kroger.com', 'Kroger')] };
    for (let i = 1; i <= 4; i += 1) {
      book.push({ name: `Banner ${i}`, parent_brand: 'Kroger', hubspot_company_id: `b${i}` });
      byCompany[`b${i}`] = [person(`p${i}a`, 'A', `Banner${i}`, 'Director Transportation', `a${i}@kroger.com`, `Banner ${i}`), person(`p${i}b`, 'B', `Banner${i}`, 'Director Logistics', `b${i}@kroger.com`, `Banner ${i}`)];
    }
    const run = async () => loadFamilyPeople(fake(book), 'Kroger', NOW, { hubspotPeople: reads(byCompany).reads, caps: { companies: 2, perCompany: 1, total: 3 } });
    const a = await run();
    const b = await run();
    expect(a).toEqual(b);
    expect(a.people.map((p) => p.id)).toEqual(['k1', 'p1a', 'p2a']);
    expect(a.capHit).toBe(true);
    expect(a.family.map((f) => [f.accountName, f.truncated])).toEqual([['Banner 1', true], ['Banner 2', true]]);
    expect(a.excluded).toEqual([
      { accountName: 'Banner 3', why: 'beyond the 2-company cap' },
      { accountName: 'Banner 4', why: 'beyond the 2-company cap' },
    ]);
  });

  it('a member read that fails is excluded as unreadable, never thrown; the primary read still counts', async () => {
    const hs = reads({ '111': [person('1', 'Brad', 'Stroup', 'VP Supply Chain', 'b@pepsico.com', 'PepsiCo')], '54772621360': [], '333': [] }, ['54772621360']);
    const r = await loadFamilyPeople(fake(PEPSI), 'PepsiCo', NOW, { hubspotPeople: hs.reads });
    expect(r.read).toBe(true);
    expect(r.people.map((p) => p.id)).toEqual(['1']);
    expect(r.excluded).toEqual(expect.arrayContaining([{ accountName: 'Frito-Lay', why: 'unreadable: the HubSpot read of company 54772621360 failed' }]));
    expect(r.family.map((f) => f.accountName)).toEqual(['Quaker Foods']);
  });

  it('with no family the primary read is exactly the one owner resolution makes today', async () => {
    const rows = { '8536615003': [person('w1', 'Christina', 'Mannella', 'Sr Director - West Transportation Command Center', 'c@walmart.com', 'Walmart'), person('w2', 'Doug', 'Estrada', 'Senior Director - Regional Transportation', 'd@walmart.com', 'Walmart')] };
    const prisma = fake([{ name: 'Walmart Inc.', parent_brand: null, hubspot_company_id: '8536615003' }]);
    const r = await loadFamilyPeople(prisma, 'Walmart Inc.', NOW, { hubspotPeople: reads(rows).reads });
    const today = await loadHubSpotPeopleForCompanies(['8536615003'], reads(rows).reads, 1000, NOW.getTime());
    expect(r.people.map(({ provenance, ...p }) => (void provenance, p))).toEqual(today?.people);
    expect(r.primary).toEqual({ accountName: 'Walmart Inc.', companyIds: ['8536615003'], count: 2, truncated: today?.truncated, via: 'linked' });
    expect(r.family).toEqual([]);
    expect(r.excluded).toEqual([]);
    expect(r.searched).toEqual(['Walmart Inc. (8536615003)']);
  });

  it('an unknown account, or an account with no company and no family, answers without throwing', async () => {
    const none = await loadFamilyPeople(fake([]), 'Nobody', NOW, { hubspotPeople: reads({}).reads });
    expect(none).toMatchObject({ people: [], read: false, primary: { via: 'none', count: 0 }, excluded: [{ accountName: 'Nobody', why: 'no such GAP account' }] });
    const unlinked = await loadFamilyPeople(fake([{ name: 'Tyson Foods', parent_brand: null, hubspot_company_id: null }]), 'Tyson Foods', NOW, { hubspotPeople: reads({}).reads, company: { configured: () => false } });
    expect(unlinked).toMatchObject({ people: [], read: false, primary: { via: 'none', companyIds: [] }, family: [], searched: [] });
  });
});
