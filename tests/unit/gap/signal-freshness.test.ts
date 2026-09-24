import { describe, expect, it } from 'vitest';
import { SIGNAL_TYPES } from '@/lib/gap/taxonomy';
import { SIGNAL_TTL_DAYS, freshnessExpiresAt, isFresh } from '@/lib/gap/signals/freshness';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('SIGNAL_TTL_DAYS', () => {
  it('carries a positive integer TTL for every SIGNAL_TYPE in the taxonomy', () => {
    for (const type of SIGNAL_TYPES) {
      const ttl = SIGNAL_TTL_DAYS[type];
      expect(typeof ttl, `missing TTL for ${type}`).toBe('number');
      expect(Number.isInteger(ttl), `TTL for ${type} must be an integer`).toBe(true);
      expect(ttl, `TTL for ${type} must be positive`).toBeGreaterThan(0);
    }
    expect(Object.keys(SIGNAL_TTL_DAYS).sort()).toEqual([...SIGNAL_TYPES].sort());
  });

  it('pins the agreed values', () => {
    expect(SIGNAL_TTL_DAYS).toEqual({
      acquisition: 180,
      new_site: 120,
      site_expansion: 120,
      automation_program: 120,
      job_posting: 45,
      technology_signal: 90,
      news: 45,
      intent: 14,
      website_behavior: 14,
      manual_research: 90,
      other: 45,
    });
  });
});

describe('freshnessExpiresAt', () => {
  const observed = new Date('2026-09-01T00:00:00.000Z');

  it('adds the TTL for the type to observedAt when no explicit expiry is given', () => {
    expect(freshnessExpiresAt('intent', observed).getTime()).toBe(observed.getTime() + 14 * DAY_MS);
    expect(freshnessExpiresAt('acquisition', observed).getTime()).toBe(
      observed.getTime() + 180 * DAY_MS,
    );
  });

  it('treats an explicit null the same as absent', () => {
    expect(freshnessExpiresAt('news', observed, null).getTime()).toBe(
      observed.getTime() + 45 * DAY_MS,
    );
  });

  it('an explicit expiry wins over the TTL', () => {
    const explicit = new Date('2027-01-01T00:00:00.000Z');
    expect(freshnessExpiresAt('news', observed, explicit).getTime()).toBe(explicit.getTime());
  });

  it('does not mutate observedAt', () => {
    const copy = new Date(observed.getTime());
    freshnessExpiresAt('news', copy);
    expect(copy.getTime()).toBe(observed.getTime());
  });
});

describe('isFresh', () => {
  const now = new Date('2026-09-23T12:00:00.000Z');

  it('is fresh strictly before the expiry', () => {
    expect(isFresh(new Date(now.getTime() + 1), now)).toBe(true);
  });

  it('is stale exactly at the expiry instant', () => {
    expect(isFresh(new Date(now.getTime()), now)).toBe(false);
  });

  it('is stale after the expiry', () => {
    expect(isFresh(new Date(now.getTime() - 1), now)).toBe(false);
  });

  it('a null expiry never expires', () => {
    expect(isFresh(null, now)).toBe(true);
    expect(isFresh(undefined, now)).toBe(true);
  });
});
