import { describe, expect, it } from 'vitest';

import { buildProximityRecord, exportProximity } from '@/lib/intel/export/proximity';
import { decodeCursor } from '@/lib/intel/export/cursor';

const GEN = '2026-06-14T00:00:00.000Z';

const ACCOUNT = {
  slug: 'boston-beer-company',
  account_name: 'The Boston Beer Company',
  account_domain: 'bostonbeer.com',
  composite_score: 84.2,
  proximity_score: 91,
  nearest_distance_mi: 2.9,
  corridor_density: 3.1,
  fit_score: 72.5,
  yard_audit: {
    facilities: 5,
    truck_gated_pct: 20,
    dock_doors: 71,
    trailer_cap: 300,
    top_archetype: '#3 (No Gate / No GS)',
    recommended_entry: 'Lead with offline-tolerant check-in.',
  },
  dossier_url: 'https://yardflow.ai/for/boston-beer-company',
};

describe('buildProximityRecord', () => {
  it('keys idempotency on <domain>:<generatedAt> so a recompute writes a new row', () => {
    const rec = buildProximityRecord(ACCOUNT, GEN);
    expect(rec.idempotency_key).toBe('bostonbeer.com:2026-06-14T00:00:00.000Z');
    expect(rec.occurred_at).toBe(GEN);
    expect(rec.updated_at).toBe(GEN);
  });

  it('carries the complete composite plus the breakdown and yard_audit block', () => {
    const rec = buildProximityRecord(ACCOUNT, GEN);
    expect(rec.account_name).toBe('The Boston Beer Company');
    expect(rec.account_domain).toBe('bostonbeer.com');
    expect(rec.composite_score).toBe(84.2); // the number clawd fuses
    expect(rec.proximity_score).toBe(91);
    expect(rec.fit_score).toBe(72.5);
    expect(rec.corridor_density).toBe(3.1);
    expect(rec.nearest_distance_mi).toBe(2.9);
    expect((rec.yard_audit as Record<string, unknown>).top_archetype).toBe('#3 (No Gate / No GS)');
    expect((rec.yard_audit as Record<string, unknown>).truck_gated_pct).toBe(20);
    expect(rec.dossier_url).toBe('https://yardflow.ai/for/boston-beer-company');
  });

  it('falls back to the slug when no domain is known', () => {
    const rec = buildProximityRecord({ ...ACCOUNT, account_domain: null }, GEN);
    expect(rec.idempotency_key).toBe('boston-beer-company:2026-06-14T00:00:00.000Z');
    expect(rec.account_domain).toBeUndefined();
  });
});

describe('exportProximity (live snapshot)', () => {
  it('returns the full snapshot envelope with proximity-bearing items', () => {
    const env = exportProximity(null, 500);
    expect(env.stream).toBe('proximity');
    expect(env.items.length).toBeGreaterThan(0);
    expect(env.nextCursor).toBeNull(); // a 500-limit page holds the whole set
    for (const item of env.items) {
      expect(typeof item.proximity_score).toBe('number');
      expect(item.idempotency_key).toContain(env.watermark);
      expect('composite_score' in item).toBe(true); // present, number or null
    }
    // The composite upgrade: a real share of accounts carry the complete score.
    const withComposite = env.items.filter((i) => typeof i.composite_score === 'number');
    expect(withComposite.length).toBeGreaterThan(10);
  });

  it('keyset-pages through the whole snapshot exactly once, in order, no overlap', () => {
    const full = exportProximity(null, 500).items.map((i) => i.idempotency_key);

    const paged: string[] = [];
    let cursor: string | null = null;
    let guard = 0;
    do {
      const env = exportProximity(cursor, 5);
      paged.push(...env.items.map((i) => i.idempotency_key));
      cursor = env.nextCursor;
      guard += 1;
    } while (cursor && guard < 100);

    expect(paged).toEqual(full); // same items, same order, exactly once
    expect(new Set(paged).size).toBe(paged.length); // no duplicates across pages
    expect(decodeCursor(exportProximity(null, 5).nextCursor)).not.toBeNull(); // cursor is well-formed
  });

  it('shares one generatedAt watermark across every record', () => {
    const env = exportProximity(null, 500);
    for (const item of env.items) expect(item.occurred_at).toBe(env.watermark);
  });
});
