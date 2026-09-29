/**
 * Release B2: the CANDIDATE ACCOUNT queue and the ONE account creation contract.
 * GAP never creates an account on its own: ADD ACCOUNT is Casey's click, and
 * even then the contract checks the exact name, the normalized name
 * (siblings), curated aliases, the domain and HubSpot first. MAP TO EXISTING
 * records an alias; RESEARCH MORE and IGNORE are recorded decisions.
 */
import { describe, expect, it } from 'vitest';
import { accountCreationCheck, createGapAccount, decideCandidate, scoutCandidate } from '@/lib/gap/entity/candidates';

type Rec = Record<string, unknown>;
function fakePrisma(seed: { accounts?: string[]; aliases?: Array<{ alias: string; normalized_alias: string; account_name: string }>; domains?: Array<{ account_name: string; domain: string }> } = {}) {
  const accounts: Rec[] = (seed.accounts ?? []).map((name) => ({ name }));
  const aliases: Rec[] = [...(seed.aliases ?? [])];
  const candidates: Rec[] = [];
  const audits: Rec[] = [];
  const match = (row: Rec, where: Rec = {}): boolean =>
    Object.entries(where).every(([k, v]) => {
      if (k === 'OR') return (v as Rec[]).some((w) => match(row, w));
      if (v && typeof v === 'object' && 'startsWith' in (v as Rec) && k === 'name') return String(row[k] ?? '').toLowerCase().startsWith(String((v as Rec).startsWith).toLowerCase());
      if (v && typeof v === 'object' && 'startsWith' in (v as Rec)) return String(row[k] ?? '').toLowerCase().startsWith(String((v as Rec).startsWith).toLowerCase());
      if (v && typeof v === 'object' && 'in' in (v as Rec)) return ((v as Rec).in as unknown[]).includes(row[k]);
      return row[k] === v;
    });
  const p = {
    accounts,
    aliases,
    candidates,
    audits,
    account: {
      findUnique: async ({ where }: { where: Rec }) => accounts.find((a) => a.name === where.name) ?? null,
      findMany: async ({ where }: { where?: Rec } = {}) => accounts.filter((a) => match(a, where)),
      findFirst: async ({ where }: { where: Rec }) => accounts.find((a) => match(a, where)) ?? null,
      create: async ({ data }: { data: Rec }) => {
        if (accounts.some((a) => a.name === data.name)) throw new Error('unique');
        accounts.push(data);
        return data;
      },
    },
    gapAccountAlias: {
      findUnique: async ({ where }: { where: Rec }) => aliases.find((a) => a.normalized_alias === where.normalized_alias) ?? null,
      findMany: async ({ where }: { where?: Rec } = {}) => aliases.filter((a) => match(a, where)),
      create: async ({ data }: { data: Rec }) => {
        const row = { id: `al${aliases.length}`, ...data };
        aliases.push(row);
        return row;
      },
    },
    canonicalCompany: { findMany: async ({ where }: { where: Rec }) => (seed.domains ?? []).filter((d) => d.domain === where.domain).map((d) => ({ domain: d.domain, account_links: [{ account_name: d.account_name }] })) },
    gapAccountCandidate: {
      findUnique: async ({ where }: { where: Rec }) => candidates.find((c) => (where.id ? c.id === where.id : c.company_key === where.company_key)) ?? null,
      upsert: async ({ where, create, update }: { where: Rec; create: Rec; update: Rec }) => {
        const cur = candidates.find((c) => c.company_key === where.company_key);
        if (cur) return Object.assign(cur, update);
        const row = { id: `c${candidates.length}`, decision: 'open', ...create };
        candidates.push(row);
        return row;
      },
      update: async ({ where, data }: { where: Rec; data: Rec }) => Object.assign(candidates.find((c) => c.id === where.id || c.company_key === where.company_key)!, data),
    },
    gapWorkSourceMember: { findMany: async () => [] },
    gapAuditEvent: { create: async ({ data }: { data: Rec }) => (audits.push(data), data) },
  };
  return p;
}

const noHubspot = { hubspotByDomain: async () => null, hubspotByName: async () => null };
const NOW = new Date('2026-09-29T15:00:00.000Z');

describe('the account creation check runs before any account exists', () => {
  it('refuses an exact name, a normalized sibling, an alias of another account, and a known domain', async () => {
    const p = fakePrisma({ accounts: ['Harbor Foods', 'Costa Farms, LLC'], aliases: [{ alias: 'HFG', normalized_alias: 'hfg', account_name: 'Harbor Foods' }], domains: [{ account_name: 'Harbor Foods', domain: 'harborfoods.com' }] });
    expect(await accountCreationCheck(p, { name: 'Harbor Foods' }, noHubspot)).toMatchObject({ ok: false, reason: 'exists' });
    expect(await accountCreationCheck(p, { name: 'Costa Farms' }, noHubspot)).toMatchObject({ ok: false, reason: 'possible_duplicate', matches: ['Costa Farms, LLC'] });
    expect(await accountCreationCheck(p, { name: 'HFG' }, noHubspot)).toMatchObject({ ok: false, reason: 'alias_of', matches: ['Harbor Foods'] });
    expect(await accountCreationCheck(p, { name: 'Harbor Foods Group', domain: 'harborfoods.com' }, noHubspot)).toMatchObject({ ok: false, reason: 'domain_of', matches: ['Harbor Foods'] });
  });

  it('an accented name is the same company as its plain spelling', async () => {
    const p = fakePrisma({ accounts: ['Nestle USA'] });
    expect(await accountCreationCheck(p, { name: 'Nestlé USA' }, noHubspot)).toMatchObject({ ok: false, reason: 'possible_duplicate', matches: ['Nestle USA'] });
  });

  it('a HubSpot company is reported (and linked on create), never created', async () => {
    const p = fakePrisma();
    const r = await accountCreationCheck(p, { name: 'AkzoNobel', domain: 'akzonobel.com' }, { hubspotByDomain: async () => ({ id: '999', name: 'AkzoNobel' }), hubspotByName: async () => null });
    expect(r).toMatchObject({ ok: true, hubspotCompanyId: '999' });
  });
});

describe('createGapAccount: the one creation contract', () => {
  it('needs an actor and a reason; creates one watched-band account, links HubSpot, records the company as an alias, audits', async () => {
    const p = fakePrisma();
    expect(await createGapAccount(p, { name: 'AkzoNobel', company: 'Akzo Nobel N.V.', vertical: 'chemicals', reason: '', actor: 'casey@freightroll.com', now: NOW }, noHubspot)).toMatchObject({ ok: false, reason: 'reason_required' });
    const r = await createGapAccount(p, { name: 'AkzoNobel', company: 'Akzo Nobel N.V.', vertical: 'chemicals', reason: 'MMYQB subscriber, paint plants', actor: 'casey@freightroll.com', now: NOW }, { ...noHubspot, hubspotByName: async () => ({ id: '999', name: 'AkzoNobel' }) });
    expect(r).toMatchObject({ ok: true, accountName: 'AkzoNobel' });
    expect(p.accounts[0]).toMatchObject({ name: 'AkzoNobel', vertical: 'chemicals', priority_band: 'C', hubspot_company_id: '999', source: 'gap_candidate' });
    expect(p.aliases.map((a) => a.alias)).toEqual(['Akzo Nobel N.V.']);
    expect(p.audits.map((a) => a.kind)).toContain('entity.account_created');
  });

  it('refuses when the check finds a duplicate, and creates nothing', async () => {
    const p = fakePrisma({ accounts: ['Costa Farms, LLC'] });
    const r = await createGapAccount(p, { name: 'Costa Farms', company: 'Costa Farms', vertical: 'agriculture', reason: 'x', actor: 'casey@freightroll.com', now: NOW }, noHubspot);
    expect(r).toMatchObject({ ok: false, reason: 'possible_duplicate' });
    expect(p.accounts).toHaveLength(1);
  });
});

describe('candidate decisions', () => {
  it('scouting stores the verdict and evidence on one candidate row per company', async () => {
    const p = fakePrisma();
    const scout = async () => ({ company: 'Harbor Foods Group', verdict: 'LIKELY_ICP' as const, entityType: 'shipper' as const, domain: 'harborfoods.com', what: 'Foodservice distributor', why: 'A shipper with cited network evidence (1 claim).', network: [{ claim: '12 DCs', url: 'https://harborfoods.example' }], freight: [], unknowns: [], basis: 'web' as const });
    const r = await scoutCandidate(p, { company: 'Harbor Foods Group', actor: 'casey@freightroll.com', now: NOW }, { scout });
    expect('verdict' in r && r.verdict).toBe('LIKELY_ICP');
    // the same company again within a day is not a second web pass (cost control); force overrides
    expect(await scoutCandidate(p, { company: 'Harbor Foods Group, Inc.', actor: 'casey@freightroll.com', now: NOW }, { scout })).toMatchObject({ refused: 'recently_scouted' });
    await scoutCandidate(p, { company: 'Harbor Foods Group, Inc.', actor: 'casey@freightroll.com', now: NOW, force: true }, { scout });
    expect(p.candidates).toHaveLength(1);
    expect(p.candidates[0]).toMatchObject({ verdict: 'LIKELY_ICP', entity_type: 'shipper', domain: 'harborfoods.com', decision: 'open' });
  });

  it('IGNORE and RESEARCH MORE are recorded with who decided; an unknown decision is refused', async () => {
    const p = fakePrisma();
    expect(await decideCandidate(p, { company: 'Acme Trucking', decision: 'ignored', actor: 'casey@freightroll.com', now: NOW })).toMatchObject({ ok: true });
    expect(p.candidates[0]).toMatchObject({ decision: 'ignored', decided_by: 'casey@freightroll.com' });
    expect(await decideCandidate(p, { company: 'Acme Trucking', decision: 'added' as never, actor: 'x', now: NOW })).toMatchObject({ ok: false, reason: 'invalid_decision' });
  });
});

describe('the candidate queue', () => {
  const members = [
    { company: 'Harbor Foods Group', title: 'VP Supply Chain', relationship_context: 'MMYQB subscriber', work_source: { id: 's1', name: 'MMYQB' } },
    { company: 'Harbor Foods Group, Inc.', title: 'Director Logistics', relationship_context: 'MMYQB subscriber', work_source: { id: 's1', name: 'MMYQB' } },
    { company: 'Summit Logistics Group', title: 'CEO', relationship_context: null, work_source: { id: 's2', name: 'Inland26' } },
    { company: 'Costa Farms', title: 'COO', relationship_context: 'Met at Inland26', work_source: { id: 's2', name: 'Inland26' } },
    { company: 'Ignored Co', title: 'x', relationship_context: null, work_source: { id: 's2', name: 'Inland26' } },
  ];
  const candidates = [
    { company: 'Harbor Foods Group', company_key: 'harbor foods group', verdict: 'LIKELY_ICP', entity_type: 'shipper', domain: 'harborfoods.com', scout: { why: 'A shipper with cited network evidence (1 claim).', what: 'Foodservice distributor', network: [{ claim: '12 DCs', url: 'https://h.example' }], freight: [], unknowns: ['Who runs yard operations'] }, decision: 'open', scouted_at: new Date('2026-09-29') },
    { company: 'Ignored Co', company_key: 'ignored', verdict: null, decision: 'ignored' },
  ];
  const prisma = {
    gapWorkSourceMember: { findMany: async () => members },
    gapAccountCandidate: { findMany: async () => candidates },
  };

  it('groups spellings, carries why / evidence / relationship source / unknowns, orders LIKELY first and NOT ICP last, hides decided', async () => {
    const { loadCandidateQueue } = await import('@/lib/gap/entity/candidates');
    const q = await loadCandidateQueue(prisma, {});
    expect(q.map((c) => c.company)).toEqual(['Harbor Foods Group', 'Costa Farms', 'Summit Logistics Group']);
    const h = q[0];
    expect(h).toMatchObject({ people: 2, verdict: 'LIKELY_ICP', why: 'A shipper with cited network evidence (1 claim).', sources: ['MMYQB'], relationship: ['MMYQB subscriber'], unknowns: ['Who runs yard operations'] });
    expect(h.network).toEqual([{ claim: '12 DCs', url: 'https://h.example' }]);
    // unscouted: the free name rule already says what it can
    expect(q[2]).toMatchObject({ verdict: 'NOT_ICP', scouted: false, why: expect.stringMatching(/3PL/) });
    expect(q[1]).toMatchObject({ verdict: null, scouted: false });
  });
});

describe('review fixes: no duplicate slips past the check', () => {
  it('accents, apostrophes and "&" in the first letters are compared normalized, never by a raw prefix', async () => {
    const p = fakePrisma({ accounts: ["L'Oréal USA", 'Häagen-Dazs', 'P&G'] });
    expect(await accountCreationCheck(p, { name: 'LOreal USA' }, noHubspot)).toMatchObject({ ok: false, reason: 'possible_duplicate', matches: ["L'Oréal USA"] });
    expect(await accountCreationCheck(p, { name: 'Haagen Dazs' }, noHubspot)).toMatchObject({ ok: false, reason: 'possible_duplicate' });
    expect(await accountCreationCheck(p, { name: 'P and G' }, noHubspot)).toMatchObject({ ok: false, reason: 'possible_duplicate', matches: ['P&G'] });
  });

  it('an alias stored under the legacy key is found from the PLAIN spelling too', async () => {
    const p = fakePrisma({ accounts: ['Nestle Holdings'], aliases: [{ alias: 'Nestlé USA', normalized_alias: 'nestl usa', account_name: 'Nestle Holdings' }] });
    expect(await accountCreationCheck(p, { name: 'Nestle USA' }, noHubspot)).toMatchObject({ ok: false, reason: 'alias_of', matches: ['Nestle Holdings'] });
  });

  it('the company spelling is checked too: already mapped, or an alias of another account, refuses BEFORE anything is created', async () => {
    const p = fakePrisma({ accounts: ['Acme Foods'], aliases: [{ alias: 'Acme Intl', normalized_alias: 'acme intl', account_name: 'Acme Foods' }] });
    const r = await createGapAccount(p, { name: 'Acme International', company: 'Acme Intl', vertical: 'cpg', reason: 'x', actor: 'casey@freightroll.com', now: NOW }, noHubspot);
    expect(r).toMatchObject({ ok: false, reason: 'alias_of', matches: ['Acme Foods'] });
    expect(p.accounts).toHaveLength(1);
  });

  it('a HubSpot company already linked to a GAP account refuses as that account', async () => {
    const p = fakePrisma({ accounts: ['PepsiCo'] });
    (p.accounts[0] as Record<string, unknown>).hubspot_company_id = '111';
    const r = await accountCreationCheck(p, { name: 'Frito-Lay North America', domain: 'pepsico.com' }, { hubspotByDomain: async () => ({ id: '111', name: 'PepsiCo' }), hubspotByName: async () => null });
    expect(r).toMatchObject({ ok: false, reason: 'hubspot_of', matches: ['PepsiCo'] });
  });

  it('HubSpot not configured or failing is said, never reported as "not found"', async () => {
    const p = fakePrisma();
    expect(await accountCreationCheck(p, { name: 'New Co' }, { ...noHubspot, configured: () => false })).toMatchObject({ ok: true, notes: ['HubSpot was not checked (not configured here).'] });
    const r = await accountCreationCheck(p, { name: 'New Co' }, { hubspotByDomain: async () => null, hubspotByName: async () => { throw new Error('429'); } });
    expect(r).toMatchObject({ ok: true, hubspotCompanyId: null, notes: [expect.stringMatching(/could not be checked \(429\)/)] });
  });

  it('a decided candidate cannot be ignored afterwards', async () => {
    const p = fakePrisma();
    await createGapAccount(p, { name: 'Brand New Co', vertical: 'cpg', reason: 'x', actor: 'casey@freightroll.com', now: NOW }, noHubspot);
    expect(await decideCandidate(p, { company: 'Brand New Co', decision: 'ignored', actor: 'x', now: NOW })).toMatchObject({ ok: false, reason: 'already_decided' });
  });
});
