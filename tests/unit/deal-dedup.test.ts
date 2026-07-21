/**
 * The duplicate-deal guard.
 *
 * Regression contract for 2026-07-21: the GTM engine deduped deals by NAME
 * ("YardFlow - {Account}"), so a human-named deal ("Wesco - Pilot and POC",
 * 64 notes, owned by Jake) was invisible to it and an inbound reply minted
 * "YardFlow - Wesco International" as a second, phantom $50k deal on the same
 * company. Dedup must key on the COMPANY ASSOCIATION, with the old name match
 * kept only as a degraded fallback.
 *
 * These are pure-function tests: every dependency is injected, nothing here
 * touches HubSpot.
 */
import { describe, it, expect, vi } from 'vitest';
import { decideDealForAccount, type DealDedupDeps } from '@/lib/hubspot/deal-dedup';

function deps(overrides: Partial<DealDedupDeps> = {}): DealDedupDeps {
  return {
    resolveCompanyId: vi.fn(async () => null),
    findOpenDealAtCompany: vi.fn(async () => null),
    findDealByName: vi.fn(async () => null),
    ...overrides,
  };
}

describe('decideDealForAccount', () => {
  it('LINKS to an open deal already on the company and never creates', async () => {
    const d = deps({
      resolveCompanyId: vi.fn(async () => '55554445576'),
      findOpenDealAtCompany: vi.fn(async () => ({ id: '59419157591' })),
      // The human deal is named "Wesco - Pilot and POC", so the name search
      // would find nothing. It must never be consulted.
      findDealByName: vi.fn(async () => null),
    });

    const decision = await decideDealForAccount(d);

    expect(decision).toEqual({
      action: 'link',
      dealId: '59419157591',
      via: 'company',
      companyId: '55554445576',
    });
    expect(d.findDealByName).not.toHaveBeenCalled();
  });

  it('LINKS regardless of the deal name — the exact Wesco regression', async () => {
    const d = deps({
      resolveCompanyId: vi.fn(async () => '55554445576'),
      findOpenDealAtCompany: vi.fn(async () => ({ id: '59419157591' })),
    });
    const decision = await decideDealForAccount(d, { allowCreate: true });
    expect(decision.action).toBe('link');
  });

  it('CREATES when the company resolves but only has closed deals', async () => {
    const d = deps({
      resolveCompanyId: vi.fn(async () => '55554445576'),
      // findOpenDealAtCompany filters out closed-won/closed-lost, so a company
      // whose only deal is closed looks the same as a company with no deals.
      findOpenDealAtCompany: vi.fn(async () => null),
      findDealByName: vi.fn(async () => null),
    });

    const decision = await decideDealForAccount(d, { allowCreate: true });

    expect(decision).toEqual({ action: 'create', companyId: '55554445576' });
  });

  it('falls back to the NAME match when no company resolves', async () => {
    const d = deps({
      resolveCompanyId: vi.fn(async () => null),
      findDealByName: vi.fn(async () => ({ id: '62958605870' })),
    });

    const decision = await decideDealForAccount(d, { allowCreate: true });

    expect(decision).toEqual({ action: 'update', dealId: '62958605870', via: 'name' });
    expect(d.findOpenDealAtCompany).not.toHaveBeenCalled();
  });

  it('UPDATES on a name match as before (engine-owned "YardFlow - X" stub)', async () => {
    const d = deps({
      resolveCompanyId: vi.fn(async () => '55554445576'),
      findOpenDealAtCompany: vi.fn(async () => null),
      findDealByName: vi.fn(async () => ({ id: '62958605870' })),
    });

    const decision = await decideDealForAccount(d, { allowCreate: true });

    expect(decision).toEqual({ action: 'update', dealId: '62958605870', via: 'name' });
  });

  it('CREATES when nothing resolves and creation is allowed', async () => {
    const decision = await decideDealForAccount(deps(), { allowCreate: true });
    expect(decision).toEqual({ action: 'create', companyId: null });
  });

  it('SKIPS instead of creating when creation is not allowed', async () => {
    const decision = await decideDealForAccount(deps(), { allowCreate: false });
    expect(decision).toEqual({ action: 'skip', companyId: null });
  });

  it('defaults to link-only: no allowCreate flag means never create', async () => {
    const decision = await decideDealForAccount(deps());
    expect(decision.action).toBe('skip');
  });

  it('still LINKS when creation is not allowed (linking is always safe)', async () => {
    const d = deps({
      resolveCompanyId: vi.fn(async () => '99'),
      findOpenDealAtCompany: vi.fn(async () => ({ id: '77' })),
    });
    const decision = await decideDealForAccount(d, { allowCreate: false });
    expect(decision).toEqual({ action: 'link', dealId: '77', via: 'company', companyId: '99' });
  });

  it('still UPDATES a name match when creation is not allowed', async () => {
    const d = deps({ findDealByName: vi.fn(async () => ({ id: '77' })) });
    const decision = await decideDealForAccount(d, { allowCreate: false });
    expect(decision).toEqual({ action: 'update', dealId: '77', via: 'name' });
  });

  it('degrades to the name match when company resolution THROWS', async () => {
    const d = deps({
      resolveCompanyId: vi.fn(async () => {
        throw new Error('HubSpot 500');
      }),
      findDealByName: vi.fn(async () => ({ id: '77' })),
    });

    const decision = await decideDealForAccount(d, { allowCreate: true });

    expect(decision).toEqual({ action: 'update', dealId: '77', via: 'name' });
  });

  it('does NOT create when the company-deal lookup THROWS (fail closed)', async () => {
    const d = deps({
      resolveCompanyId: vi.fn(async () => '55554445576'),
      findOpenDealAtCompany: vi.fn(async () => {
        throw new Error('HubSpot 500');
      }),
      findDealByName: vi.fn(async () => null),
    });

    // A company resolved but we could not read its deals: creating here is
    // exactly how a duplicate gets minted. Refuse.
    const decision = await decideDealForAccount(d, { allowCreate: true });

    expect(decision).toEqual({ action: 'skip', companyId: '55554445576' });
  });

  it('does NOT create when the name lookup THROWS (fail closed)', async () => {
    const d = deps({
      findDealByName: vi.fn(async () => {
        throw new Error('HubSpot 500');
      }),
    });
    const decision = await decideDealForAccount(d, { allowCreate: true });
    expect(decision).toEqual({ action: 'skip', companyId: null });
  });
});
