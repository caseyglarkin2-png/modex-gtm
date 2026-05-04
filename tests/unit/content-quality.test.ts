import { describe, expect, it } from 'vitest';
import {
  CONTENT_QUALITY_SEND_BLOCK_THRESHOLD,
  evaluateContentQuality,
} from '@/lib/content-quality';

describe('content quality contract', () => {
  it('returns all contract dimensions and weighted score', () => {
    const result = evaluateContentQuality(
      'Acme Foods team, here is a short summary. Next step: reply this week to schedule a 15-minute review.',
      'Acme Foods',
    );

    expect(result.scores).toHaveProperty('clarity');
    expect(result.scores).toHaveProperty('personalization');
    expect(result.scores).toHaveProperty('cta_strength');
    expect(result.scores).toHaveProperty('compliance_risk');
    expect(result.scores).toHaveProperty('deliverability_risk');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('marks low-quality content as blocked under threshold', () => {
    const result = evaluateContentQuality('act now free!!! click here now', 'Blue Rail');
    expect(result.score).toBeLessThan(CONTENT_QUALITY_SEND_BLOCK_THRESHOLD);
    expect(result.blockedByThreshold).toBe(true);
    expect(result.flags.length).toBeGreaterThan(0);
    expect(result.fixes.length).toBeGreaterThan(0);
  });
});
