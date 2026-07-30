import { describe, it, expect } from 'vitest';
import {
  hasAccountIntent,
  ACCOUNT_TRIGGER_SQL_THRESHOLD,
} from '../../src/lib/revops/qualification/model';
import { PING_THRESHOLD } from '../../src/lib/pounce/score';
import { normalizeScore } from '../../src/lib/pounce/fit';
import type { QualCompany } from '../../src/lib/revops/qualification/types';

// ---------------------------------------------------------------------------
// The pounce ping threshold and the account-promotion threshold must agree.
//
// They did not. Slack pinged at a RAW score of 8; this gate demanded a
// NORMALIZED 60; news normalizes at x5.5, so a ping-worthy trigger arrived as
// 44 and promoted nobody. A raw 11 was required. Every pounce alert at 8, 9 or
// 10 interrupted a human and produced no downstream work. Coca-Cola and Amazon
// both fired at raw 8 on 2026-07-30.
//
// These tests lock the invariant rather than the number, so tuning either side
// keeps them in step.
// ---------------------------------------------------------------------------

const company = (over: Partial<QualCompany> = {}): QualCompany =>
  ({
    id: 'co1',
    name: 'Test Co',
    tam: 'in',
    tamTier: 'A',
    intentScore: 0,
    lastIntentAt: '',
    triggerScore: 0,
    ...over,
  }) as QualCompany;

describe('pounce heat promotes the accounts it pings about', () => {
  it('promotes an account whose trigger only just cleared the ping bar', () => {
    const justPingWorthy = normalizeScore(PING_THRESHOLD, 'news');
    expect(hasAccountIntent(company({ triggerScore: justPingWorthy }))).toBe(true);
  });

  it('keeps the promotion bar at or below the ping bar', () => {
    // The invariant in one line: anything worth interrupting a human for is
    // worth promoting the committee for.
    expect(ACCOUNT_TRIGGER_SQL_THRESHOLD).toBeLessThanOrEqual(
      normalizeScore(PING_THRESHOLD, 'news'),
    );
  });

  it('regression: a raw score of 8 from a news trigger promotes', () => {
    // The exact case that was silently failing. Coca-Cola and Amazon, 2026-07-30.
    expect(hasAccountIntent(company({ triggerScore: normalizeScore(8, 'news') }))).toBe(true);
  });

  it('still refuses an account with no heat at all', () => {
    expect(hasAccountIntent(company())).toBe(false);
    expect(hasAccountIntent(null)).toBe(false);
  });

  it('still refuses trigger heat below the bar', () => {
    expect(hasAccountIntent(company({ triggerScore: ACCOUNT_TRIGGER_SQL_THRESHOLD - 1 }))).toBe(
      false,
    );
  });

  it('clawd triggers, which are already 0-100, are unaffected', () => {
    // scale is 1 for clawd, and it only pushes at relevance >= 60.
    expect(hasAccountIntent(company({ triggerScore: normalizeScore(60, 'clawd') }))).toBe(true);
  });

  // Reading intent is a separate path and must keep its own freshness rule.
  it('reading intent still requires a recent lastIntentAt', () => {
    const now = Date.parse('2026-07-30T12:00:00Z');
    const stale = new Date(now - 40 * 86_400_000).toISOString();
    const fresh = new Date(now - 2 * 86_400_000).toISOString();
    expect(hasAccountIntent(company({ intentScore: 85, lastIntentAt: stale }), now)).toBe(false);
    expect(hasAccountIntent(company({ intentScore: 85, lastIntentAt: fresh }), now)).toBe(true);
  });
});
