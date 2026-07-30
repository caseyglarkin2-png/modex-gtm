import { describe, it, expect } from 'vitest';
import { lifecycleTarget } from '@/lib/revops/qualification/apply';
import { buildDailyStats } from '@/lib/revops/qualification/notify';
import type { VerdictDiff } from '@/lib/revops/qualification/types';

const row = (over: Partial<VerdictDiff>): VerdictDiff =>
  ({
    contactId: '1', name: 'A B', email: 'a@b.com', companyId: 'c', companyName: 'Co',
    icpScore: 0, tamTier: 'A', seniority: '', role: '', jobtitle: '', currentLifecycle: 'lead',
    currentVerdict: 'none', newVerdict: 'mql', changed: true, reason: '', hasPulse: false,
    ...over,
  }) as VerdictDiff;

describe('lifecycleTarget', () => {
  it('sql verdict always promotes to SQL stage', () => {
    expect(lifecycleTarget(row({ newVerdict: 'sql' }))).toBe('salesqualifiedlead');
    expect(lifecycleTarget(row({ newVerdict: 'sql', currentLifecycle: 'marketingqualifiedlead' }))).toBe('salesqualifiedlead');
  });
  it('never demotes: sql verdict on an already-SQL or customer contact is a no-op', () => {
    expect(lifecycleTarget(row({ newVerdict: 'sql', currentLifecycle: 'salesqualifiedlead' }))).toBeNull();
    expect(lifecycleTarget(row({ newVerdict: 'sql', currentLifecycle: 'customer' }))).toBeNull();
  });
  it('mql verdict promotes to Engaged only with a pulse', () => {
    expect(lifecycleTarget(row({ newVerdict: 'mql', hasPulse: true }))).toBe('marketingqualifiedlead');
    expect(lifecycleTarget(row({ newVerdict: 'mql', hasPulse: false }))).toBeNull();
  });
  it('mql with pulse never demotes past Engaged', () => {
    expect(lifecycleTarget(row({ newVerdict: 'mql', hasPulse: true, currentLifecycle: 'salesqualifiedlead' }))).toBeNull();
  });
  it('none verdict never touches lifecycle', () => {
    expect(lifecycleTarget(row({ newVerdict: 'none' }))).toBeNull();
  });
});

describe('buildDailyStats', () => {
  const base = {
    scope: 'incremental', sinceHours: 26, contacts: 120,
    counts: { none: 50, mql: 60, sql: 10 }, changes: 7, applied: 7, promoted: 3,
    newSqls: 2, warnings: [] as string[],
  };
  it('summarises a run with new SQLs', () => {
    const msg = buildDailyStats(base);
    expect(msg).toContain('last 26h');
    expect(msg).toContain('120 contacts');
    expect(msg).toContain('7 verdict change(s), 7 written, 3 lifecycle promotion(s)');
    // Wording changed 2026-07-30: the line used to shout "2 NEW SQL(s) — details
    // above" and point at the per-SQL identity roster, which no longer exists.
    expect(msg).toContain('2 new SQL(s)');
    expect(msg).toContain('morning brief');
  });
  it('says so on quiet days and surfaces warnings', () => {
    const msg = buildDailyStats({ ...base, newSqls: 0, warnings: ['contacts truncated at 3000'] });
    expect(msg).toContain('No new SQLs today');
    expect(msg).toContain('⚠️ contacts truncated');
  });
});
