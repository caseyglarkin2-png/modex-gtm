/**
 * R20: coverage is read from the ledgers, never implied by a cron having run: covered, stale, never and failed are
 * distinct per account and per source-class bundle; the capacity statement is arithmetic over the real cadence and
 * presents one choice when the objectives are not met; the rotation puts priority accounts first and a failing
 * account behind everyone else (starvation protection).
 */
import { describe, expect, it } from 'vitest';
import { coverageReport, discoveryOrder, FAILURE_BACKOFF_MS, groundedRotation, groundedRotationSlots, PRIORITY_TARGET_MS, type GroundedTurn } from '@/lib/gap/signals/coverage';
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
  it('the capacity statement is arithmetic over the real cadence; past the allowance the rotation is bounded and the statement names the decision and the alternative', () => {
    const many = Array.from({ length: 75 }, (_, k) => ({ accountName: `Account ${k}`, reasons: ['priority'] }));
    const r = coverageReport({ now: NOW, profiles: many, grounded: [], newsAt: new Map(), researchAt: new Map(), priority: new Map(), accountsPerRun: 2, runsPerDay: 12 });
    // No priorities: 24 turns a day x 7 days x (1 - the 15% margin) / 4 bundles = 35 accounts rotate; 40 are news only.
    expect(r.capacity).toMatchObject({ accounts: 75, bundles: 4, turnsPerDay: 24, margin: 0.15, rotationSlots: 35, rotatingAccounts: 35, newsOnlyAccounts: 40, fullRotationDays: 5.83, uncappedRotationDays: 12.5, requiredTurnsPerDay: 43, meetsSevenDayTarget: true, coversAllWatched: false, meetsPriorityDailyTarget: true });
    // Batch item 10: the news pass is capped and said so: 10 accounts a run, 12 runs a day, 75 watched: every 15 hours at best.
    expect(r.capacity).toMatchObject({ newsAccountsPerRun: 10, newsHoursPerAccount: 15 });
    expect(r.capacity.choice).toMatch(/capped at 35 accounts/);
    expect(r.capacity.choice).toMatch(/40 watched accounts are checked by the news pass only/);
    expect(r.capacity.choice).toMatch(/12\.5 days per full rotation/);
    expect(r.capacity.choice).toMatch(/runs hourly \(48 turns a day, about 100% more grounded-search calls\)/);
    expect(r.capacity.choice).toMatch(/no spend increase, no cadence change/);
    expect(r.accounts.filter((a) => a.rotation === 'news_only')).toHaveLength(40);
    const few = coverageReport({ now: NOW, profiles: many.slice(0, 35), grounded: [], newsAt: new Map(), researchAt: new Map(), priority: new Map(), accountsPerRun: 2, runsPerDay: 12 });
    expect(few.capacity).toMatchObject({ newsOnlyAccounts: 0, coversAllWatched: true, meetsSevenDayTarget: true });
    expect(few.capacity.choice).toBeNull();
    expect(few.accounts.every((a) => a.rotation === 'rotating')).toBe(true);
    expect(r.classes.some((c) => c.mode === 'manual_only')).toBe(true);
  });
  it('priority accounts take a daily turn each, so the rotation beside them is what the rest of the allowance covers in seven days with the margin (75 watched, 12 priority: 17 rotate, 46 news only)', () => {
    const many = Array.from({ length: 75 }, (_, k) => ({ accountName: `Account ${String(k).padStart(2, '0')}`, reasons: ['priority'] }));
    const priority = new Map(many.slice(0, 12).map((p): [string, string[]] => [p.accountName, ['a chosen person']]));
    const r = coverageReport({ now: NOW, profiles: many, grounded: [], newsAt: new Map(), researchAt: new Map(), priority, accountsPerRun: 2, runsPerDay: 12 });
    expect(r.capacity).toMatchObject({ priorityAccounts: 12, rotationTurnsPerDay: 12, rotationSlots: 17, rotatingAccounts: 17, newsOnlyAccounts: 46, fullRotationDays: 5.67, requiredTurnsPerDay: 48, meetsSevenDayTarget: true, meetsPriorityDailyTarget: true, coversAllWatched: false });
    expect(r.accounts.filter((a) => a.rotation === 'priority')).toHaveLength(12);
    expect(r.capacity.choice).toMatch(/beside the 12 priority accounts/);
    // Priorities alone past the allowance: no rotation at all, said plainly.
    const crowded = coverageReport({ now: NOW, profiles: many, grounded: [], newsAt: new Map(), researchAt: new Map(), priority: new Map(many.slice(0, 30).map((p): [string, string[]] => [p.accountName, ['an open deal']])), accountsPerRun: 2, runsPerDay: 12 });
    expect(crowded.capacity).toMatchObject({ rotationSlots: 0, rotatingAccounts: 0, newsOnlyAccounts: 45, meetsPriorityDailyTarget: false, fullRotationDays: null });
    expect(crowded.capacity.choice).toMatch(/30 priority accounts need 30 turns a day/);
  });
  // Batch item 10: the old sizing (no margin) met the objective with zero slack; "met" now needs the margin to spare.
  it('a rotation sized with no margin (21 beside 12 priorities: exactly 7.0 days) is NOT met: one failed or skipped turn would miss it', () => {
    const many = Array.from({ length: 75 }, (_, k) => ({ accountName: `Account ${String(k).padStart(2, '0')}`, reasons: ['priority'] }));
    const priority = new Map(many.slice(0, 12).map((p): [string, string[]] => [p.accountName, ['a chosen person']]));
    const zero = coverageReport({ now: NOW, profiles: many, grounded: [], newsAt: new Map(), researchAt: new Map(), priority, accountsPerRun: 2, runsPerDay: 12, margin: 0 });
    expect(zero.capacity).toMatchObject({ rotatingAccounts: 21, fullRotationDays: 7, meetsSevenDayTarget: false });
    expect(coverageReport({ now: NOW, profiles: many, grounded: [], newsAt: new Map(), researchAt: new Map(), priority, accountsPerRun: 2, runsPerDay: 12 }).capacity).toMatchObject({ rotatingAccounts: 17, meetsSevenDayTarget: true });
  });
});

describe('groundedRotation (R20 follow-up: the bounded, deterministic rotating population)', () => {
  const p = (accountName: string, tier: string | null, band: string | null) => ({ accountName, tier, band });
  const population = [p('Zeta', 'Tier 1', null), p('Alpha', null, 'C'), p('Kilo', 'Tier 2', 'A'), p('Bravo', 'Tier 1', 'B'), p('Echo', null, null), p('Delta', 'Tier 1', 'A'), p('Mike', null, 'A')];
  it('the slots are the turns the allowance leaves after a daily turn per priority, over seven days, less the margin, per bundle; never negative', () => {
    expect(groundedRotationSlots({ turnsPerDay: 24, bundles: 4, priorityCount: 0 })).toBe(35);
    expect(groundedRotationSlots({ turnsPerDay: 24, bundles: 4, priorityCount: 12 })).toBe(17);
    // Batch item 10: with no margin the bound was 21, exactly seven days (21 x 4 / 12): zero slack for a lost turn.
    expect(groundedRotationSlots({ turnsPerDay: 24, bundles: 4, priorityCount: 12, margin: 0 })).toBe(21);
    expect(groundedRotationSlots({ turnsPerDay: 24, bundles: 4, priorityCount: 24 })).toBe(0);
    expect(groundedRotationSlots({ turnsPerDay: 24, bundles: 4, priorityCount: 40 })).toBe(0);
  });
  it('every priority account rotates; the rest are chosen by tier, then band, then name, up to the slots; the order of the input never changes the choice', () => {
    const r = groundedRotation(population, { priority: new Set(['Echo']), slots: 3 });
    expect(r.priority.map((x) => x.accountName)).toEqual(['Echo']);
    expect(r.rotating.map((x) => x.accountName)).toEqual(['Delta', 'Bravo', 'Zeta']);
    expect(r.newsOnly.map((x) => x.accountName)).toEqual(['Kilo', 'Mike', 'Alpha']);
    const shuffled = groundedRotation([...population].reverse(), { priority: new Set(['Echo']), slots: 3 });
    expect(shuffled.rotating.map((x) => x.accountName)).toEqual(['Delta', 'Bravo', 'Zeta']);
    expect(shuffled.newsOnly.map((x) => x.accountName)).toEqual(['Kilo', 'Mike', 'Alpha']);
  });
  it('with room for everyone nobody is news only; with no slots only the priorities rotate', () => {
    expect(groundedRotation(population, { priority: new Set(), slots: 50 }).newsOnly).toHaveLength(0);
    const none = groundedRotation(population, { priority: new Set(['Alpha', 'Kilo']), slots: 0 });
    expect(none.priority.map((x) => x.accountName)).toEqual(['Kilo', 'Alpha']);
    expect(none.rotating).toHaveLength(0);
    expect(none.newsOnly).toHaveLength(5);
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
  it('a priority account asked within its daily target is not ahead of the rotation: it waits its turn by recency, so twelve priorities never take every turn of the day', () => {
    const justAsked = new Map([['PepsiCo', NOW.getTime() - 2 * 3_600_000], ['FedEx', NOW.getTime() - PRIORITY_TARGET_MS - 1], ['Kroger', NOW.getTime() - 10 * 86_400_000], ['Dannon', 0]]);
    const order = discoveryOrder(profiles, { now: NOW, lastAt: justAsked, priority: new Set(['FedEx', 'PepsiCo']) }).map((p) => p.accountName);
    // FedEx is due (past a day): first. PepsiCo was asked two hours ago: behind the accounts asked longer ago.
    expect(order).toEqual(['FedEx', 'Dannon', 'Kroger', 'PepsiCo']);
  });
});
