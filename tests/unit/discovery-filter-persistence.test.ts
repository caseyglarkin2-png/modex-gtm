import { describe, expect, it } from 'vitest';
import {
  FILTER_STORAGE_KEY,
  serializeFilters,
  parseStoredFilters,
  urlHasFilters,
  type PersistedFilters,
} from '@/app/discovery/filter-persistence';

const sample: PersistedFilters = {
  tier: 'A',
  corridor: 'Allentown, PA',
  segment: 'shipper',
  minScore: 60,
  all: false,
  needsContacts: true,
};

describe('filter-persistence', () => {
  it('uses a stable storage key', () => {
    expect(FILTER_STORAGE_KEY).toBe('discovery.filters');
  });

  it('round-trips a filter set through serialize/parse', () => {
    expect(parseStoredFilters(serializeFilters(sample))).toEqual(sample);
  });

  it('returns null for empty, malformed, or non-object input', () => {
    expect(parseStoredFilters(null)).toBeNull();
    expect(parseStoredFilters('')).toBeNull();
    expect(parseStoredFilters('not json')).toBeNull();
    expect(parseStoredFilters('"a string"')).toBeNull();
    expect(parseStoredFilters('42')).toBeNull();
  });

  it('coerces missing or wrong-typed fields to safe defaults', () => {
    const out = parseStoredFilters('{"tier":"B","minScore":"high","corridor":123}');
    expect(out).toEqual({
      tier: 'B',
      corridor: null,
      segment: null,
      minScore: null,
      all: false,
      needsContacts: false,
    });
  });

  it('preserves a finite minScore of zero', () => {
    const out = parseStoredFilters('{"minScore":0}');
    expect(out?.minScore).toBe(0);
  });

  describe('urlHasFilters', () => {
    it('is true when any filter param is present', () => {
      for (const key of ['tier', 'corridor', 'segment', 'minScore', 'all', 'needsContacts']) {
        expect(urlHasFilters((k) => (k === key ? 'x' : null))).toBe(true);
      }
    });

    it('is false when no filter param is present (e.g. only tab/weight)', () => {
      expect(urlHasFilters((k) => (k === 'tab' || k === 'weight' ? 'x' : null))).toBe(false);
      expect(urlHasFilters(() => null)).toBe(false);
    });
  });
});
