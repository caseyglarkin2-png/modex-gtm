import { describe, expect, it } from 'vitest';
import {
  buildRecommendedAngle,
  buildRecommendedAngleCitations,
} from '@/lib/agent-actions/account-command-center';

describe('buildRecommendedAngle (existing string contract preserved — S1-T3)', () => {
  it('still returns a plain string for existing callers', () => {
    const result = buildRecommendedAngle(
      {
        action: 'content_context',
        provider: 'modex',
        status: 'ok',
        summary: '',
        cards: [{ title: 'Research Summary', body: 'Lead with throughput pressure.' }],
        data: {},
        nextActions: [],
        freshness: {
          fetchedAt: '2026-05-07T00:00:00.000Z',
          stale: false,
          source: 'live',
          status: 'fresh',
          dimensions: {},
        } as never,
      },
      'fallback',
    );
    expect(typeof result).toBe('string');
    expect(result).toBe('Lead with throughput pressure.');
  });

  it('falls back when no Research Summary card exists', () => {
    const result = buildRecommendedAngle(null, 'fallback angle');
    expect(result).toBe('fallback angle');
  });
});

describe('buildRecommendedAngleCitations (S1-T3 sibling)', () => {
  it('returns empty array when evidence summary is null', () => {
    expect(buildRecommendedAngleCitations(null)).toEqual([]);
  });

  it('returns empty array when latestClaims is empty', () => {
    expect(buildRecommendedAngleCitations({ latestClaims: [] })).toEqual([]);
  });

  it('caps at 2 citations by default and prefers fresh over aging over stale', () => {
    const result = buildRecommendedAngleCitations({
      latestClaims: [
        { id: 'a', claim: 'Stale claim', sourceUrl: 'https://example.com/a', freshness: 'stale', observedAt: '2026-05-01T00:00:00.000Z' },
        { id: 'b', claim: 'Aging claim', sourceUrl: 'https://example.com/b', freshness: 'aging', observedAt: '2026-05-04T00:00:00.000Z' },
        { id: 'c', claim: 'Fresh claim', sourceUrl: 'https://example.com/c', freshness: 'fresh', observedAt: '2026-05-06T00:00:00.000Z' },
        { id: 'd', claim: 'Fresher claim', sourceUrl: 'https://example.com/d', freshness: 'fresh', observedAt: '2026-05-07T00:00:00.000Z' },
      ],
    });
    expect(result).toHaveLength(2);
    expect(result[0].url).toBe('https://example.com/d');
    expect(result[1].url).toBe('https://example.com/c');
  });

  it('honors maxCitations override', () => {
    const result = buildRecommendedAngleCitations({
      latestClaims: [
        { id: 'a', claim: 'A', sourceUrl: 'https://example.com/a', freshness: 'fresh', observedAt: '2026-05-07T00:00:00.000Z' },
        { id: 'b', claim: 'B', sourceUrl: 'https://example.com/b', freshness: 'fresh', observedAt: '2026-05-07T00:00:00.000Z' },
        { id: 'c', claim: 'C', sourceUrl: 'https://example.com/c', freshness: 'fresh', observedAt: '2026-05-07T00:00:00.000Z' },
      ],
    }, { maxCitations: 1 });
    expect(result).toHaveLength(1);
  });

  it('truncates long claim text to fit a chip label', () => {
    const longClaim = 'x'.repeat(200);
    const [citation] = buildRecommendedAngleCitations({
      latestClaims: [
        { id: 'a', claim: longClaim, sourceUrl: 'https://example.com/a', freshness: 'fresh', observedAt: '2026-05-07T00:00:00.000Z' },
      ],
    });
    expect(citation.label.length).toBeLessThanOrEqual(64);
    expect(citation.label.endsWith('...')).toBe(true);
  });
});
