/**
 * R20: coverage is read from the ledgers, never implied by a cron having run: covered, stale, never and failed are
 * distinct per account and per source-class bundle; the capacity statement is arithmetic over the real cadence and
 * presents one choice when the objectives are not met; the rotation puts priority accounts first and a failing
 * account behind everyone else (starvation protection).
 */
import { describe, expect, it } from 'vitest';
import { coverageReport, discoveryOrder, FAILURE_BACKOFF_MS, type GroundedTurn } from '@/lib/gap/signals/coverage';
import { SOURCE_CLASS_BUNDLES } from '@/lib/gap/signals/grounded-discovery';

const NOW = new Date('2026-10-06T20:00:00Z');
const day = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
const turn = (accountName: string, daysAgo: number, bundle: number, error: string | null = null): GroundedTurn => ({ accountName, at: day(daysAgo), classes: [...SOURCE_CLASS_BUNDLES[bundle]], error });
const profiles = [
  { accountName: 'PepsiCo', reasons: ['priority', 'gap_thesis'] },
  { accountName: 'FedEx', reasons: ['priority'] },
  { accountName: 'Kroger', reasons: ['gap_thesis'] },
  { accountName: 'Dannon', reasons: ['priority'] },
];

describe('coverageReport', () => {
  it('states per bundle and per account come from the ledgers: covered within the target, stale beyond it, never when no turn, failed when the last turn failed and nothing fresh stands', () => {
    const r = coverageReport({
      now: NOW,
      profiles,
      grounded: [turn('PepsiCo', 1, 0), turn('PepsiCo', 9, 1), turn('FedEx', 2, 0), turn('FedEx', 0.5, 1, 'gemini error; openai_web error'), turn('Kroger', 20, 0)],
      newsAt: new Map([['PepsiCo', day(0.2)], ['Kroger', day(20)]]),
      researchAt: new Map([['PepsiCo', day(3)]]),
      priority: new Map([['FedEx', ['a first touch in motion']]]),
    });
    const pepsi = r.accounts.find((a) => a.accountName === 'PepsiCo')!;
    expect(pepsi.bundles.map((b) => b.state)).toEqual(['covered', 'stale', 'never', 'never']);
    expect(pepsi.state).toBe('covered');
    expect(pepsi.lastResearchAt).toBe(day(3));
    const fedex = r.accounts.find((a) => a.accountName === 'FedEx')!;
    // The failed turn is not "no news": the bundle reads failed; the account is a priority whose newest pass is two
    // days old (past its one-day target) and whose last attempt failed: FAILED, never "nothing new".
    expect(fedex.bundles[1].state).toBe('failed');
    expect(fedex.lastGroundedFailed).toBe(true);
    expect(fedex.priority).toBe(true);
    expect(fedex.state).toBe('failed');
    expect(r.accounts.find((a) => a.accountName === 'Kroger')!.state).toBe('stale');
    expect(r.accounts.find((a) => a.accountName === 'Dannon')!.state).toBe('never');
    expect(r.counts).toEqual({ covered: 1, stale: 1, never: 1, failed: 1, priority: 1 });
  });
  it('the capacity statement is arithmetic over the real cadence and offers one quantified choice when the seven-day objective is not met', () => {
    const many = Array.from({ length: 75 }, (_, k) => ({ accountName: `Account ${k}`, reasons: ['priority'] }));
    const r = coverageReport({ now: NOW, profiles: many, grounded: [], newsAt: new Map(), researchAt: new Map(), priority: new Map(), accountsPerRun: 2, runsPerDay: 12 });
    expect(r.capacity).toMatchObject({ accounts: 75, bundles: 4, turnsPerDay: 24, fullRotationDays: 12.5, requiredTurnsPerDay: 43, meetsSevenDayTarget: false, meetsPriorityDailyTarget: true });
    expect(r.capacity.choice).toMatch(/12\.5 days per full rotation/);
    expect(r.capacity.choice).toMatch(/runs hourly \(48 turns a day, about 100% more grounded-search calls\)/);
    expect(r.capacity.choice).toMatch(/Nothing is changed here/);
    const few = coverageReport({ now: NOW, profiles: many.slice(0, 40), grounded: [], newsAt: new Map(), researchAt: new Map(), priority: new Map(), accountsPerRun: 2, runsPerDay: 12 });
    expect(few.capacity.meetsSevenDayTarget).toBe(true);
    expect(few.capacity.choice).toBeNull();
    expect(r.classes.some((c) => c.mode === 'manual_only')).toBe(true);
  });
});

describe('discoveryOrder', () => {
  const lastAt = new Map([['PepsiCo', NOW.getTime() - 3 * 86_400_000], ['FedEx', NOW.getTime() - 1 * 86_400_000], ['Kroger', NOW.getTime() - 10 * 86_400_000], ['Dannon', 0]]);
  it('priority accounts come first (least recently asked), then the rest least recently asked; names break ties', () => {
    const order = discoveryOrder(profiles, { now: NOW, lastAt, priority: new Set(['FedEx', 'PepsiCo']) }).map((p) => p.accountName);
    expect(order).toEqual(['PepsiCo', 'FedEx', 'Dannon', 'Kroger']);
  });
  it('an account whose last turn failed within the backoff goes behind every account that has not failed, priority or not; after the backoff it rejoins its tier', () => {
    const failed = new Map([['PepsiCo', NOW.getTime() - 60 * 60_000]]);
    const order = discoveryOrder(profiles, { now: NOW, lastAt, lastFailedAt: failed, priority: new Set(['FedEx', 'PepsiCo']) }).map((p) => p.accountName);
    expect(order).toEqual(['FedEx', 'Dannon', 'Kroger', 'PepsiCo']);
    const later = discoveryOrder(profiles, { now: new Date(NOW.getTime() + FAILURE_BACKOFF_MS + 1), lastAt, lastFailedAt: failed, priority: new Set(['FedEx', 'PepsiCo']) }).map((p) => p.accountName);
    expect(later[0]).toBe('PepsiCo');
  });
});
