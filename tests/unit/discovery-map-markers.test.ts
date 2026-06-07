import { describe, expect, it } from 'vitest';
import { selectMapMarkers } from '@/lib/discovery/map-markers';

type Row = { id: string; tier: 'A' | 'B' | 'C' | 'D' };
const r = (id: string, tier: Row['tier']): Row => ({ id, tier });

describe('selectMapMarkers', () => {
  it('returns the input unchanged when at or under the cap', () => {
    const rows = [r('a1', 'A'), r('b1', 'B'), r('c1', 'C')];
    expect(selectMapMarkers(rows, 10)).toBe(rows);
    expect(selectMapMarkers(rows, 3)).toBe(rows);
  });

  it('keeps every Tier A when the set exceeds the cap', () => {
    // A2 sits at rank 4 — a naive top-3 slice would drop it.
    const rows = [r('a1', 'A'), r('b1', 'B'), r('b2', 'B'), r('a2', 'A'), r('c1', 'C'), r('c2', 'C')];
    const out = selectMapMarkers(rows, 3);
    const aIds = out.filter((x) => x.tier === 'A').map((x) => x.id);
    expect(aIds).toEqual(['a1', 'a2']);
  });

  it('fills the remaining budget with the highest-ranked non-A rows, in input order', () => {
    const rows = [r('a1', 'A'), r('b1', 'B'), r('b2', 'B'), r('a2', 'A'), r('c1', 'C'), r('c2', 'C')];
    const out = selectMapMarkers(rows, 4);
    // 2 Tier A are guaranteed, leaving budget 2 for the top non-A (b1, b2), order preserved.
    expect(out.map((x) => x.id)).toEqual(['a1', 'b1', 'b2', 'a2']);
  });

  it('never drops a Tier A even when Tier A alone exceeds the cap', () => {
    const rows = [r('a1', 'A'), r('a2', 'A'), r('a3', 'A'), r('b1', 'B')];
    const out = selectMapMarkers(rows, 2);
    expect(out.map((x) => x.id)).toEqual(['a1', 'a2', 'a3']);
  });
});
