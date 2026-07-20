import { describe, expect, it } from 'vitest';
import { scoreMicrositeSession, type MicrositeEngagementAnalyticsInput } from '@/lib/microsites/analytics';
import { computeIntentScore } from '@/lib/microsites/hubspot-intent';

/**
 * The stack audit flagged "two different 0-100 intent formulas". They are kept
 * as TWO functions on purpose, and this file is the contract that documents +
 * pins the split so "intent score" means exactly one thing per consumer:
 *
 *   computeIntentScore   -> the CRM intent_score written to HubSpot (sales sort
 *                           + qualification). Continuous, +10 post-threshold floor.
 *   scoreMicrositeSession -> the internal session-engagement score (dashboard
 *                           ranking + the high-intent notification gate).
 *                           Bucketed, starts at 0.
 *
 * If either weighting changes, update the pinned numbers below deliberately.
 */

function buildSession(overrides: Partial<MicrositeEngagementAnalyticsInput> = {}): MicrositeEngagementAnalyticsInput {
  return {
    account_name: 'Acme',
    account_slug: 'acme',
    person_name: 'Jane Ops',
    person_slug: 'jane-ops',
    path: '/for/acme/jane-ops',
    sections_viewed: [],
    cta_ids: [],
    variant_history: [],
    scroll_depth_pct: 0,
    duration_seconds: 0,
    updated_at: new Date('2026-07-20T10:00:00.000Z'),
    ...overrides,
  };
}

describe('computeIntentScore (the CRM intent_score authority)', () => {
  it('has a +10 post-threshold floor even for an empty session', () => {
    // It only runs AFTER a session crossed the threshold, so crossing is worth points.
    expect(computeIntentScore(buildSession(), 0, 0)).toBe(10);
  });

  it('scores a moderate CTA session on a continuous curve', () => {
    // 10 floor + 95/3=31.67 + 78/5=15.6 + 3*3=9 + 1 CTA*8=8 = 74.27 -> 74
    const session = buildSession({
      sections_viewed: ['hero', 'problem', 'proof'],
      scroll_depth_pct: 78,
      duration_seconds: 95,
      cta_ids: ['book'],
      variant_history: ['jane-ops'],
    });
    expect(computeIntentScore(session, 0, 0)).toBe(74);
  });

  it('clamps a maxed session to 100 and credits rich media past halfway', () => {
    // 10 + 40(dur cap) + 20(scroll cap) + 15(sections cap) + 10(audio>=50) + 25(cta cap) = 120 -> 100
    const session = buildSession({
      sections_viewed: ['a', 'b', 'c', 'd', 'e', 'f'],
      scroll_depth_pct: 100,
      duration_seconds: 300,
      cta_ids: ['a', 'b', 'c', 'd'],
      variant_history: ['v1', 'v2'],
      path: '/proposal/acme',
    });
    expect(computeIntentScore(session, 95, 0)).toBe(100);
  });
});

describe('scoreMicrositeSession (the internal session-engagement score)', () => {
  it('starts from 0 for an empty session (it also decides the threshold)', () => {
    expect(scoreMicrositeSession(buildSession())).toBe(0);
  });

  it('scores the same moderate CTA session with coarse buckets', () => {
    // sections>=3 +15, scroll>=60 +10, dur>=60 +10, cta>0 +30 = 65
    const session = buildSession({
      sections_viewed: ['hero', 'problem', 'proof'],
      scroll_depth_pct: 78,
      duration_seconds: 95,
      cta_ids: ['book'],
      variant_history: ['jane-ops'],
    });
    expect(scoreMicrositeSession(session)).toBe(65);
  });
});

describe('the intended split (one meaning per consumer)', () => {
  const moderate = buildSession({
    sections_viewed: ['hero', 'problem', 'proof'],
    scroll_depth_pct: 78,
    duration_seconds: 95,
    cta_ids: ['book'],
    variant_history: ['jane-ops'],
  });

  it('the two scores are different scales by design (CRM 74 vs session 65)', () => {
    expect(computeIntentScore(moderate, 0, 0)).not.toBe(scoreMicrositeSession(moderate));
  });

  it('only the CRM score has a nonzero floor for an empty session', () => {
    const empty = buildSession();
    expect(computeIntentScore(empty, 0, 0)).toBe(10);
    expect(scoreMicrositeSession(empty)).toBe(0);
  });

  it('both are bounded to [0, 100] and rise with engagement', () => {
    const empty = buildSession();
    const maxed = buildSession({
      sections_viewed: ['a', 'b', 'c', 'd', 'e', 'f'],
      scroll_depth_pct: 100,
      duration_seconds: 300,
      cta_ids: ['a', 'b', 'c', 'd'],
      variant_history: ['v1', 'v2'],
      path: '/proposal/acme',
    });
    for (const s of [empty, moderate, maxed]) {
      for (const v of [computeIntentScore(s, 0, 0), scoreMicrositeSession(s)]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
    expect(computeIntentScore(empty, 0, 0)).toBeLessThan(computeIntentScore(moderate, 0, 0));
    expect(computeIntentScore(moderate, 0, 0)).toBeLessThan(computeIntentScore(maxed, 95, 0));
    expect(scoreMicrositeSession(empty)).toBeLessThan(scoreMicrositeSession(moderate));
    expect(scoreMicrositeSession(moderate)).toBeLessThan(scoreMicrositeSession(maxed));
  });
});
