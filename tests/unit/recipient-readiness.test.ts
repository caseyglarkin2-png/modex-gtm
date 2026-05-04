import { describe, expect, it } from 'vitest';
import { computeRecipientReadiness, getRecipientReadinessFloor } from '@/lib/revops/recipient-readiness';

describe('recipient readiness scoring', () => {
  it('scores recipients with composed dimensions and tier', () => {
    const readiness = computeRecipientReadiness({
      email_confidence: 92,
      quality_score: 88,
      title: 'VP Distribution',
      role_in_deal: 'Decision maker',
      last_enriched_at: '2026-04-20T00:00:00Z',
    }, new Date('2026-05-04T00:00:00Z'));

    expect(readiness.score).toBeGreaterThanOrEqual(80);
    expect(readiness.tier).toBe('high');
    expect(readiness.stale).toBe(false);
    expect(readiness.breakdown.contact_confidence).toBeGreaterThan(85);
  });

  it('marks stale low-confidence contacts and applies floor by campaign type', () => {
    const readiness = computeRecipientReadiness({
      email_confidence: 30,
      quality_score: 25,
      title: 'Coordinator',
      role_in_deal: 'support',
      last_enriched_at: '2025-12-01T00:00:00Z',
    }, new Date('2026-05-04T00:00:00Z'));

    expect(readiness.tier).toBe('low');
    expect(readiness.stale).toBe(true);
    expect(getRecipientReadinessFloor('trade_show')).toBe(65);
    expect(getRecipientReadinessFloor('unknown-type')).toBe(65);
  });
});
