/**
 * Operational truth (2026-10-01 preflight). Two seller-facing lies found in production:
 *   - a routing DRY RUN reset the "routing refreshed" clock (no card was applied);
 *   - the IN DEALS tile counted routing cards (0) while HubSpot held 16 open deals, and the lane checked only the
 *     first 40 accounts routing had seen (GXO and Kenco fell past the cap; six deal accounts never appeared).
 */
import { describe, expect, it, vi } from 'vitest';
import { evaluateHealth } from '@/lib/gap/health/health';
import { lastAppliedRoutingRun, loadHealthInputs } from '@/lib/gap/health/load';
import { loadInDealsSummary, type OpenDealReadsLike } from '@/lib/gap/deals/in-deals';

const NOW = new Date('2026-10-01T05:00:00.000Z');
const ago = (h: number) => new Date(NOW.getTime() - h * 3600_000);
const run = (at: Date, payload: Record<string, unknown>) => ({ created_at: at, payload });

describe('routing health means an APPLIED routing run', () => {
  it('old apply + newer dry run: freshness is the old apply (DEGRADED)', () => {
    const pick = lastAppliedRoutingRun([run(ago(0.1), { dryRun: true, failed: [] }), run(ago(75), { dryRun: false, failed: [] })]);
    expect(pick).toEqual(ago(75));
  });
  it('a completed apply counts; a dry run never does; an apply with failed accounts does not', () => {
    expect(lastAppliedRoutingRun([run(ago(1), { dryRun: false, failed: [] })])).toEqual(ago(1));
    expect(lastAppliedRoutingRun([run(ago(1), { dryRun: true, failed: [] })])).toBeNull();
    expect(lastAppliedRoutingRun([run(ago(1), { dryRun: false, failed: [{ accountName: 'X', reason: 'write_failed: boom' }] }), run(ago(30), { dryRun: false, failed: [] })])).toEqual(ago(30));
    // a marker without a readable report is not proof of an applied run
    expect(lastAppliedRoutingRun([run(ago(1), {})])).toBeNull();
    // no dryRun flag at all is not proof it applied anything
    expect(lastAppliedRoutingRun([run(ago(1), { failed: [] })])).toBeNull();
  });
  it('end to end: the health strip reads DEGRADED after a dry run on a 3-day-old apply', async () => {
    const prisma = {
      systemConfig: { findUnique: vi.fn(async () => null) },
      gapAuditEvent: { findMany: vi.fn(async () => [run(ago(0.05), { dryRun: true, failed: [] }), run(ago(75), { dryRun: false, failed: [] })]) },
    };
    const i = await loadHealthInputs(prisma, { env: {} });
    const r = evaluateHealth(i, NOW);
    expect(r.components.find((c) => c.key === 'routing')).toMatchObject({ state: 'DEGRADED', label: 'Routing refreshed 3d ago · cards may be stale' });
  });
});

// ---------------------------------------------------------------- In Deals

type Deal = { id: string; properties: Record<string, string | null> };
const deal = (id: string, name: string, stage = 'appointmentscheduled'): Deal => ({ id, properties: { dealname: name, dealstage: stage, hs_is_closed: 'false', notes_last_updated: '2026-09-25T00:00:00Z' } });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reads(over: Record<string, any> = {}): OpenDealReadsLike & { calls: number } {
  const r = {
    calls: 0,
    async openDeals() { r.calls += 1; return { deals: over.deals ?? [], truncated: false }; },
    async dealAssociations(toType: 'companies' | 'contacts', ids: string[]) {
      r.calls += 1;
      const src = toType === 'companies' ? over.dealCompanies ?? {} : over.dealContacts ?? {};
      return { byId: new Map(ids.map((id) => [id, src[id] ?? []])), truncated: false };
    },
    async companies(ids: string[]) { r.calls += 1; return ids.filter((id) => over.companies?.[id]).map((id) => ({ id, ...over.companies![id] })); },
    async companiesByNames() { r.calls += 1; return []; },
    // only method overrides replace methods (the fixture data keys above are not methods)
    ...Object.fromEntries(Object.entries(over).filter(([, v]) => typeof v === 'function')),
  };
  return r as never;
}

/** GAP's own records: accounts, canonical domain links, people. 45 accounts so a GXO/Kenco shape sits past the old 40 cap. */
function db(extra: { accounts?: Array<{ name: string; hubspot_company_id?: string | null }>; links?: Array<{ account_name: string; canonical_company_id: string }>; personas?: Array<{ account_name: string; email: string | null; hubspot_contact_id: string | null; name?: string; title?: string | null }> } = {}) {
  const filler = Array.from({ length: 41 }, (_, i) => ({ name: `Filler ${i}`, hubspot_company_id: null }));
  const accounts = [...filler, ...(extra.accounts ?? [])].map((a) => ({ hubspot_company_id: null, ...a }));
  const personas = extra.personas ?? [];
  return {
    account: { findMany: vi.fn(async () => accounts) },
    canonicalAccountLink: { findMany: vi.fn(async ({ where }: { where: { canonical_company_id: { in: string[] } } }) => (extra.links ?? []).filter((l) => where.canonical_company_id.in.includes(l.canonical_company_id))) },
    persona: {
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        if ('account_name' in where) {
          const names = (where.account_name as { in: string[] }).in;
          return personas.filter((p) => names.includes(p.account_name)).map((p) => ({ account_name: p.account_name, name: p.name ?? 'Someone', title: p.title ?? null }));
        }
        return personas;
      }),
    },
    buyerInputData: { findMany: vi.fn(async () => []) },
    systemConfig: { findUnique: vi.fn(async () => null), upsert: vi.fn(async () => ({})) },
  };
}

describe('IN DEALS: one authoritative read, from the open deals', () => {
  it('an open deal with no routing card appears; accounts past the old 40-account cap appear; the count is exact', async () => {
    const p = db({
      accounts: [{ name: 'Kroger' }, { name: 'GXO Logistics' }, { name: 'Kenco' }, { name: 'Kenco Logistics Services' }],
      links: [{ account_name: 'GXO Logistics', canonical_company_id: 'domain:gxo.com' }, { account_name: 'Kenco', canonical_company_id: 'domain:kencogroup.com' }, { account_name: 'Kenco Logistics Services', canonical_company_id: 'domain:kencogroup.com' }],
    });
    const r = reads({
      deals: [deal('d1', 'YardFlow - Kroger'), deal('d2', 'GXO - Enterprise', 'qualifiedtobuy'), deal('d3', 'YardFlow - Kenco', 'presentationscheduled')],
      dealCompanies: { d1: ['c1'], d2: ['c2'], d3: ['c3'] },
      companies: { c1: { name: 'Kroger', domain: 'kroger.com' }, c2: { name: 'GXO Logistics', domain: 'gxo.com' }, c3: { name: 'Kenco Logistics', domain: 'www.kencogroup.com' } },
    });
    const s = await loadInDealsSummary(p, { reads: r, now: NOW, fresh: true });
    expect(s.status).toBe('complete');
    // same-company duplicate GAP records (Kenco / Kenco Logistics Services) on one deal: ONE row, not two
    expect(s.accounts.map((a) => [a.accountName, a.alsoRecordedAs])).toEqual([
      ['GXO Logistics', []],
      ['Kenco', ['Kenco Logistics Services']],
      ['Kroger', []],
    ]);
    expect(s.count).toBe(3);
    expect(s.unresolved).toEqual([]);
  });

  it('a person GAP holds on the deal maps it, even when the company name and domain do not', async () => {
    const p = db({ accounts: [{ name: 'Frito-Lay' }], personas: [{ account_name: 'Frito-Lay', email: 'dana@pepsico.com', hubspot_contact_id: 'k9' }] });
    const r = reads({ deals: [deal('d1', 'Snacks pilot')], dealCompanies: { d1: ['c1'] }, dealContacts: { d1: ['k9'] }, companies: { c1: { name: 'Snack Holdings', domain: 'snackholdings.example' } } });
    const s = await loadInDealsSummary(p, { reads: r, now: NOW, fresh: true });
    expect(s.accounts.map((a) => a.accountName)).toEqual(['Frito-Lay']);
    // Batch item 8: each deal carries its HubSpot contacts (Work binds a reply and a meeting to their own deal).
    expect(s.accounts[0].deals.map((d) => [d.id, d.contactIds])).toEqual([['d1', ['k9']]]);
  });

  it('an open deal no GAP account maps to is surfaced as unresolved, never hidden and never an account', async () => {
    const p = db({ accounts: [{ name: 'Kroger' }] });
    const r = reads({ deals: [deal('d1', 'YardFlow - Kroger'), deal('d2', 'Wesco - Pilot and POC', 'qualifiedtobuy')], dealCompanies: { d1: ['c1'], d2: ['c2'] }, companies: { c1: { name: 'Kroger', domain: 'kroger.com' }, c2: { name: 'Wesco International', domain: 'wesco.com' } } });
    const s = await loadInDealsSummary(p, { reads: r, now: NOW, fresh: true });
    expect(s.count).toBe(1);
    expect(s.unresolved).toEqual([{ dealName: 'Wesco - Pilot and POC', stage: 'Qualified to buy', companies: ['Wesco International'] }]);
    expect(p.account.findMany).not.toHaveBeenCalledWith(expect.objectContaining({ data: expect.anything() }));
  });

  it('Lazerspot shape: the deal sits on a HubSpot duplicate of the account company (same exact name, other domain), as the resolver reads it', async () => {
    const p = db({ accounts: [{ name: 'Lazer Logistics' }], links: [{ account_name: 'Lazer Logistics', canonical_company_id: 'domain:lazerlogistics.com' }] });
    const r = reads({
      deals: [deal('d1', 'Lazer')],
      dealCompanies: { d1: ['c1'] },
      companies: { c1: { name: 'Lazerspot', domain: 'lazerspot.com' } },
      companiesByNames: async (names: string[]) => (names.includes('Lazerspot') ? [{ id: 'c1', name: 'Lazerspot', domain: 'lazerspot.com' }, { id: 'c2', name: 'Lazerspot', domain: 'lazerlogistics.com' }] : []),
    });
    const s = await loadInDealsSummary(p, { reads: r, now: NOW, fresh: true });
    expect(s.accounts.map((a) => a.accountName)).toEqual(['Lazer Logistics']);
    expect(s.unresolved).toEqual([]);
  });

  it('a row is named for the record matching the HubSpot company, not the shortest name', async () => {
    const p = db({ accounts: [{ name: 'Kraft Heinz' }, { name: 'Kraft Home' }], personas: [{ account_name: 'Kraft Home', email: 'x@kraftheinzcompany.com', hubspot_contact_id: null }], links: [{ account_name: 'Kraft Heinz', canonical_company_id: 'domain:kraftheinzcompany.com' }] });
    const r = reads({ deals: [deal('d1', 'Kraft Heinz Company - Pilot', 'qualifiedtobuy')], dealCompanies: { d1: ['c1'] }, companies: { c1: { name: 'Kraft Heinz', domain: 'kraftheinzcompany.com' } } });
    const s = await loadInDealsSummary(p, { reads: r, now: NOW, fresh: true });
    expect(s.accounts.map((a) => [a.accountName, a.alsoRecordedAs])).toEqual([['Kraft Heinz', ['Kraft Home']]]);
  });

  it('no open deals: an exact 0, complete', async () => {
    const s = await loadInDealsSummary(db(), { reads: reads({ deals: [] }), now: NOW, fresh: true });
    expect(s).toMatchObject({ status: 'complete', count: 0, accounts: [], unresolved: [] });
  });

  it('HubSpot unavailable: status unavailable and count null, never a false 0', async () => {
    const r = reads({ openDeals: async () => { throw new Error('503 Service Unavailable'); } });
    const s = await loadInDealsSummary(db(), { reads: r, now: NOW, fresh: true });
    expect(s.status).toBe('unavailable');
    expect(s.count).toBeNull();
    expect(s.error).toMatch(/503/);
  });

  it('a truncated association read is incomplete: count null, said so', async () => {
    const p = db({ accounts: [{ name: 'Kroger' }] });
    const r = reads({ deals: [deal('d1', 'YardFlow - Kroger')], companies: { c1: { name: 'Kroger', domain: 'kroger.com' } }, dealAssociations: async () => ({ byId: new Map([['d1', ['c1']]]), truncated: true }) });
    const s = await loadInDealsSummary(p, { reads: r, now: NOW, fresh: true });
    expect(s.status).toBe('unavailable');
    expect(s.count).toBeNull();
  });

  it('a closed deal is excluded even if a read returns it', async () => {
    const closed = { id: 'd9', properties: { dealname: 'Old', dealstage: 'closedlost', hs_is_closed: 'true' } };
    const p = db({ accounts: [{ name: 'Kroger' }] });
    const s = await loadInDealsSummary(p, { reads: reads({ deals: [closed as never], dealCompanies: { d9: ['c1'] }, companies: { c1: { name: 'Kroger', domain: 'kroger.com' } } }), now: NOW, fresh: true });
    expect(s.count).toBe(0);
  });

  it('a corporate family keeps each account its own row (Frito-Lay is not folded into PepsiCo)', async () => {
    const p = db({ accounts: [{ name: 'PepsiCo' }, { name: 'Frito-Lay' }], links: [{ account_name: 'PepsiCo', canonical_company_id: 'domain:pepsico.com' }, { account_name: 'Frito-Lay', canonical_company_id: 'domain:fritolay.com' }] });
    const r = reads({ deals: [deal('d1', 'PepsiCo pilot'), deal('d2', 'Frito-Lay DC')], dealCompanies: { d1: ['c1'], d2: ['c2'] }, companies: { c1: { name: 'PepsiCo', domain: 'pepsico.com' }, c2: { name: 'Frito-Lay', domain: 'fritolay.com' } } });
    const s = await loadInDealsSummary(p, { reads: r, now: NOW, fresh: true });
    expect(s.accounts.map((a) => a.accountName)).toEqual(['Frito-Lay', 'PepsiCo']);
    expect(s.count).toBe(2);
  });

  it('a few HubSpot calls for the whole portal, not one per GAP account; a cached summary is reused with its timestamp', async () => {
    const p = db({ accounts: [{ name: 'Kroger' }] });
    const r = reads({ deals: [deal('d1', 'YardFlow - Kroger')], dealCompanies: { d1: ['c1'] }, companies: { c1: { name: 'Kroger', domain: 'kroger.com' } } });
    const s = await loadInDealsSummary(p, { reads: r, now: NOW, fresh: true });
    expect(r.calls).toBeLessThanOrEqual(4);
    expect(s.checkedAt).toBe(NOW.toISOString());
    const cached = { ...s, checkedAt: new Date(NOW.getTime() - 60_000).toISOString() };
    p.systemConfig.findUnique = vi.fn(async () => ({ value: JSON.stringify(cached) })) as never;
    const r2 = reads({ deals: [] });
    const again = await loadInDealsSummary(p, { reads: r2, now: NOW });
    expect(r2.calls).toBe(0);
    expect(again.checkedAt).toBe(cached.checkedAt);
  });
});
