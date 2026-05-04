import { describe, expect, it } from 'vitest';
import {
  buildFailureClusters,
  buildRetryRecommendations,
  buildWeeklyFailureTrend,
  classifyFailure,
} from '@/lib/revops/failure-intelligence';

describe('failure intelligence', () => {
  it('classifies common failure categories', () => {
    expect(classifyFailure('550 mailbox unavailable')).toBe('invalid-email');
    expect(classifyFailure('429 rate limit reached')).toBe('provider-throttle');
    expect(classifyFailure('Readiness floor policy violated')).toBe('policy-block');
    expect(classifyFailure('Delivery rejected by domain policy')).toBe('domain-reject');
    expect(classifyFailure('')).toBe('unknown');
  });

  it('clusters failures and emits retry recommendations', () => {
    const clusters = buildFailureClusters([
      { id: '1', accountName: 'A', occurredAt: new Date(), errorMessage: '550 mailbox unavailable' },
      { id: '2', accountName: 'A', occurredAt: new Date(), errorMessage: '429 rate limit reached' },
      { id: '3', accountName: 'B', occurredAt: new Date(), errorMessage: '429 rate limit reached' },
    ]);
    expect(clusters[0]?.className).toBe('provider-throttle');
    expect(clusters[0]?.count).toBe(2);

    const recs = buildRetryRecommendations([
      { id: '1', accountName: 'A', occurredAt: new Date(), errorMessage: '550 mailbox unavailable' },
      { id: '2', accountName: 'B', occurredAt: new Date(), errorMessage: '429 rate limit reached' },
    ]);
    expect(recs.some((entry) => entry.className === 'provider-throttle' && entry.recommended === 'retry-later')).toBe(true);
    expect(recs.some((entry) => entry.className === 'invalid-email' && entry.recommended === 'no-retry')).toBe(true);
  });

  it('builds weekly trend points with deterministic windows', () => {
    const now = new Date('2026-05-04T00:00:00.000Z');
    const trend = buildWeeklyFailureTrend([
      { occurredAt: new Date('2026-04-29T10:00:00.000Z') },
      { occurredAt: new Date('2026-04-30T10:00:00.000Z') },
      { occurredAt: new Date('2026-03-10T10:00:00.000Z') },
    ], 4, now);
    expect(trend).toHaveLength(4);
    expect(trend[2]?.total).toBe(2);
  });
});
