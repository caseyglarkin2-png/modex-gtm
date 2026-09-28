/**
 * Phase 2 A2: read-only "did a HubSpot deal appear at a GAP-touched account
 * within 60 / 120 days of the first GAP send". No causality, no writes.
 */
import { describe, expect, it, vi } from 'vitest';
import { firstTouchByAccount, observeDealsAfterFirstTouch } from '@/lib/gap/learning/deal-observation';
import { DIRECT_SENT, DRAFT_SENT, MANUAL_SENT } from '@/lib/gap/execution/draft-ledger';
import { fakeHubSpot } from './fixtures/fake-hubspot-opportunity';

const T0 = new Date('2026-06-01T12:00:00.000Z');
const days = (n: number) => new Date(T0.getTime() + n * 86_400_000).toISOString();

function prismaFake(ledger: Array<{ kind: string; subject_id: string; payload: Record<string, unknown> }>) {
  const writes = vi.fn();
  return {
    writes,
    gapAuditEvent: { findMany: vi.fn(async () => ledger.map((r) => ({ ...r, created_at: new Date(String(r.payload.sentAt ?? T0)) }))), create: writes, update: writes },
    routingDecision: { findMany: vi.fn(async () => [{ id: 'dec-d', account_name: 'Acme' }]), update: writes },
    account: { findUnique: vi.fn(async () => ({ hubspot_company_id: 'c-acme' })), update: writes },
    canonicalAccountLink: { findMany: vi.fn(async () => []) },
    persona: { findMany: vi.fn(async () => []) },
  };
}

describe('firstTouchByAccount', () => {
  it('takes the earliest Gmail-proven send per account across direct, manual and draft-sent rows', async () => {
    const p = prismaFake([
      { kind: DIRECT_SENT, subject_id: 'dec-a', payload: { accountName: 'Acme', sentAt: days(10) } },
      { kind: MANUAL_SENT, subject_id: 'dec-b', payload: { accountName: 'Acme', sentAt: days(2) } },
      { kind: DRAFT_SENT, subject_id: 'dec-d', payload: { sentAt: days(1) } },
      { kind: DIRECT_SENT, subject_id: 'dec-z', payload: { accountName: 'Zeta', sentAt: days(5) } },
    ]);
    const m = await firstTouchByAccount(p);
    expect(m.get('Acme')!.toISOString()).toBe(days(1));
    expect(m.get('Zeta')!.toISOString()).toBe(days(5));
  });
});

describe('observeDealsAfterFirstTouch', () => {
  const ledger = [{ kind: DIRECT_SENT, subject_id: 'dec-a', payload: { accountName: 'Acme', sentAt: T0.toISOString() } }];

  it('buckets deals created after the first touch into 60 / 120 day windows; earlier deals are context only', async () => {
    const hs = fakeHubSpot({
      companyDeals: { 'c-acme': ['d-old', 'd-45', 'd-90', 'd-200'] },
      deals: [
        { id: 'd-old', closed: 'true', created: days(-30) },
        { id: 'd-45', closed: 'false', name: 'Acme pilot', created: days(45) },
        { id: 'd-90', closed: 'true', created: days(90) },
        { id: 'd-200', closed: 'false', created: days(200) },
      ],
    });
    const p = prismaFake(ledger);
    const [o] = await observeDealsAfterFirstTouch(p, hs, { now: new Date(days(130)) });
    expect(o).toMatchObject({ accountName: 'Acme', status: 'observed', firstTouchAt: T0.toISOString(), dealsBeforeFirstTouch: 1 });
    if (o.status !== 'observed') throw new Error('unreachable');
    expect(o.windows[0]).toMatchObject({ days: 60, closed: true });
    expect(o.windows[0].deals.map((d) => d.id)).toEqual(['d-45']);
    expect(o.windows[1]).toMatchObject({ days: 120, closed: true });
    expect(o.windows[1].deals.map((d) => d.id).sort()).toEqual(['d-45', 'd-90']);
    // Read only: nothing written anywhere.
    expect(p.writes).not.toHaveBeenCalled();
    expect(hs.calls.every((c) => !/^(create|update|write)/.test(c))).toBe(true);
  });

  it('a window that has not elapsed is reported open, not as "no deal"', async () => {
    const hs = fakeHubSpot({ companyDeals: { 'c-acme': [] } });
    const [o] = await observeDealsAfterFirstTouch(prismaFake(ledger), hs, { now: new Date(days(30)) });
    if (o.status !== 'observed') throw new Error('expected observed');
    expect(o.windows.map((w) => w.closed)).toEqual([false, false]);
  });

  it('an unreadable identity or HubSpot failure is unknown, never "no deal"', async () => {
    const failing = fakeHubSpot({ fail: { byId: new Error('HubSpot 503') } });
    const [o] = await observeDealsAfterFirstTouch(prismaFake(ledger), failing, { now: new Date(days(130)) });
    expect(o).toMatchObject({ status: 'unknown', reason: 'hubspot_error' });
  });
});
