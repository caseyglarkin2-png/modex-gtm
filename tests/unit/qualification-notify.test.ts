import { describe, it, expect, vi } from 'vitest';
import * as notify from '../../src/lib/revops/qualification/notify';
import { buildDailyStats } from '../../src/lib/revops/qualification/notify';

// ---------------------------------------------------------------------------
// The buildSqlAlert suite was deleted on 2026-07-30 along with the function it
// covered. It asserted the exact thing Casey asked us to stop doing: that a
// Slack message contained a promoted contact's name, email, company, and tier.
//
// What replaces it below is the inverse — a guard that the identity ping does
// not come back, and that the surviving run summary goes to the ops channel
// rather than #yardflow-intent.
// ---------------------------------------------------------------------------

describe('per-SQL identity ping stays removed', () => {
  it('does not export buildSqlAlert or notifyNewSqls', () => {
    // A future refactor that reintroduces either name fails here, which is the
    // point: the deletion is a product decision, not a cleanup.
    expect('buildSqlAlert' in notify).toBe(false);
    expect('notifyNewSqls' in notify).toBe(false);
  });

  it('never puts a contact name or email in the run summary', () => {
    const msg = buildDailyStats({
      scope: 'incremental',
      sinceHours: 24,
      contacts: 120,
      counts: { none: 100, mql: 15, sql: 5 },
      changes: 4,
      applied: 4,
      promoted: 2,
      newSqls: 3,
      warnings: [],
    });
    expect(msg).not.toMatch(/@[a-z0-9.-]+\.[a-z]{2,}/i); // no email addresses
    expect(msg).toContain('3 new SQL(s)');
    expect(msg).toContain('morning brief');
  });

  it('does not leave a dangling "details above" reference', () => {
    // The line used to forward-reference the roster message that no longer exists.
    const msg = buildDailyStats({
      scope: 'full',
      contacts: 10,
      counts: { none: 8, mql: 1, sql: 1 },
      changes: 1,
      applied: 1,
      promoted: 0,
      newSqls: 1,
      warnings: [],
    });
    expect(msg).not.toContain('details above');
  });
});

// ---------------------------------------------------------------------------
// notifyDailyStats delta gate (2026-07-09 A+ Slack pass): quiet days are silent.
// Channel routing added 2026-07-30.
// ---------------------------------------------------------------------------

vi.mock('../../src/lib/microsites/intent-notifications', () => ({
  sendSlackNotification: vi.fn(async () => true),
}));

describe('notifyDailyStats delta gate', () => {
  const stats = (over: Record<string, unknown> = {}) => ({
    scope: 'incremental',
    sinceHours: 24,
    contacts: 120,
    counts: { none: 100, mql: 15, sql: 5 },
    changes: 0,
    applied: 0,
    promoted: 0,
    newSqls: 0,
    warnings: [] as string[],
    ...over,
  });

  it('stays silent on a zero-change day', async () => {
    const { notifyDailyStats } = await import('../../src/lib/revops/qualification/notify');
    const { sendSlackNotification } = await import('../../src/lib/microsites/intent-notifications');
    vi.mocked(sendSlackNotification).mockClear();
    const posted = await notifyDailyStats(stats());
    expect(posted).toBe(false);
    expect(sendSlackNotification).not.toHaveBeenCalled();
  });

  it('posts when verdicts changed', async () => {
    const { notifyDailyStats } = await import('../../src/lib/revops/qualification/notify');
    const { sendSlackNotification } = await import('../../src/lib/microsites/intent-notifications');
    vi.mocked(sendSlackNotification).mockClear();
    const posted = await notifyDailyStats(stats({ changes: 3, applied: 3 }));
    expect(posted).toBe(true);
    expect(sendSlackNotification).toHaveBeenCalledOnce();
  });

  it('routes the run summary to the ops channel, not intent', async () => {
    const { notifyDailyStats } = await import('../../src/lib/revops/qualification/notify');
    const { sendSlackNotification } = await import('../../src/lib/microsites/intent-notifications');
    vi.mocked(sendSlackNotification).mockClear();
    await notifyDailyStats(stats({ changes: 3, applied: 3 }));
    expect(sendSlackNotification).toHaveBeenCalledWith(expect.any(String), 'ops');
  });

  it('posts when there are warnings even with zero changes', async () => {
    const { notifyDailyStats } = await import('../../src/lib/revops/qualification/notify');
    const { sendSlackNotification } = await import('../../src/lib/microsites/intent-notifications');
    vi.mocked(sendSlackNotification).mockClear();
    const posted = await notifyDailyStats(stats({ warnings: ['contact fetch capped'] }));
    expect(posted).toBe(true);
  });
});
