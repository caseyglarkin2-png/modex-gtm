/**
 * Geometry normalization + validator.
 *
 * The validator half is written as a mutation suite: each case starts from a
 * ring that is known-good, breaks exactly one property, and asserts the
 * validator goes red for that specific reason. A validator that has only seen
 * happy-path data is what let an all-null corpus ship.
 */
import { describe, it, expect } from 'vitest';
import {
  GeometryError,
  normalizeZone,
  ringFromBox,
  ringFromLatLngs,
  signedArea,
  validateFeatureCollection,
  validateGeometry,
  validateRing,
  type Position,
} from '../../scripts/yard-audit/geometry';

/** A real Ford Dearborn perimeter: open, clockwise, 4 points. */
const FORD_RING = {
  ring: [
    { lat: 42.314831, lng: -83.170042 },
    { lat: 42.314831, lng: -83.157408 },
    { lat: 42.302847, lng: -83.157408 },
    { lat: 42.302847, lng: -83.172789 },
  ],
};

const GOOD_RING: Position[] = [
  [-83.170042, 42.302847],
  [-83.157408, 42.302847],
  [-83.157408, 42.314831],
  [-83.170042, 42.314831],
  [-83.170042, 42.302847],
];

const fc = (ring: unknown) => ({
  type: 'FeatureCollection',
  features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: {} }],
});

describe('normalizeZone — source shapes', () => {
  it('converts a traced ring to a closed lng/lat ring', () => {
    const r = normalizeZone(FORD_RING, 'ford#perimeter')!;
    expect(r).toHaveLength(5);
    expect(r[0]).toEqual(r[4]);
    for (const [lng, lat] of r) {
      expect(typeof lng).toBe('number');
      expect(typeof lat).toBe('number');
      expect(lng).toBeGreaterThan(-84);
      expect(lat).toBeGreaterThan(42);
    }
  });

  it('orients a clockwise source ring counterclockwise (RFC 7946)', () => {
    expect(signedArea(normalizeZone(FORD_RING, 'x')!)).toBeGreaterThan(0);
  });

  it('still supports the legacy box shape', () => {
    const r = normalizeZone({ south: 42.3, west: -83.17, north: 42.31, east: -83.15 }, 'legacy')!;
    expect(r).toEqual([
      [-83.17, 42.3],
      [-83.15, 42.3],
      [-83.15, 42.31],
      [-83.17, 42.31],
      [-83.17, 42.3],
    ]);
    expect(signedArea(r)).toBeGreaterThan(0);
  });

  it('box and ring describing the same square produce the same ring', () => {
    const box = normalizeZone({ south: 42.3, west: -83.17, north: 42.31, east: -83.15 }, 'b')!;
    const ring = normalizeZone(
      {
        ring: [
          { lat: 42.3, lng: -83.17 },
          { lat: 42.31, lng: -83.17 },
          { lat: 42.31, lng: -83.15 },
          { lat: 42.3, lng: -83.15 },
        ],
      },
      'r',
    )!;
    // Same cycle, possibly rotated — compare as sets of positions plus winding.
    expect(new Set(ring.map(String))).toEqual(new Set(box.map(String)));
    expect(signedArea(ring)).toBeCloseTo(signedArea(box), 12);
  });

  it('treats an absent zone as "no geofence", not an error', () => {
    expect(normalizeZone(null, 'x')).toBeNull();
    expect(normalizeZone(undefined, 'x')).toBeNull();
  });

  it('tolerates a source ring that already repeats its first point', () => {
    const closedSource = { ring: [...FORD_RING.ring, FORD_RING.ring[0]] };
    expect(normalizeZone(closedSource, 'x')).toEqual(normalizeZone(FORD_RING, 'x'));
  });

  // ── the actual production bug ──────────────────────────────────────────────
  it('THROWS on the shape that produced [null, null] instead of emitting nulls', () => {
    // Before the fix, the box parser read .west/.south off a ring object,
    // got undefined, and JSON.stringify turned that into [null, null].
    expect(() => ringFromBox(FORD_RING as never, 'ford')).toThrow(GeometryError);
  });

  it('rejects an unrecognized zone shape rather than guessing', () => {
    expect(() => normalizeZone({ polygon: [] } as never, 'x')).toThrow(/unrecognized zone shape/);
    expect(() => normalizeZone(42 as never, 'x')).toThrow(GeometryError);
  });

  it('rejects malformed source rings', () => {
    expect(() => ringFromLatLngs({ ring: [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }] }, 'x')).toThrow(
      /at least 3/,
    );
    expect(() =>
      ringFromLatLngs({ ring: [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }, { lat: null as never, lng: 5 }] }, 'x'),
    ).toThrow(/non-finite/);
    expect(() =>
      ringFromLatLngs({ ring: [{ lat: NaN, lng: 2 }, { lat: 3, lng: 4 }, { lat: 5, lng: 6 }] }, 'x'),
    ).toThrow(/non-finite/);
    // Collinear points enclose no area — a traced yard never looks like this.
    expect(() =>
      ringFromLatLngs({ ring: [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }, { lat: 2, lng: 2 }] }, 'x'),
    ).toThrow(/degenerate/);
  });

  it('rejects an inverted or empty box', () => {
    expect(() => ringFromBox({ south: 42.4, west: -83.2, north: 42.3, east: -83.1 }, 'x')).toThrow(
      /north .* must exceed south/,
    );
    expect(() => ringFromBox({ south: 42.3, west: -83.1, north: 42.4, east: -83.2 }, 'x')).toThrow(
      /east .* must exceed west/,
    );
    expect(() => ringFromBox({ south: 42.3, west: undefined as never, north: 42.4, east: -83.1 }, 'x')).toThrow(
      /not a finite number/,
    );
  });
});

describe('validateRing — mutation suite (each case breaks exactly one property)', () => {
  it('GREEN on the unmutated ring', () => {
    expect(validateRing(GOOD_RING, 'r')).toEqual([]);
  });

  it('RED on [null, null] — the exact corpus failure', () => {
    const m = GOOD_RING.map(() => [null, null]);
    const issues = validateRing(m, 'r');
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].problem).toMatch(/null\/undefined/);
  });

  it('RED on a single null coordinate hidden among valid ones', () => {
    const m = GOOD_RING.map((p, i) => (i === 2 ? [null, p[1]] : p));
    expect(validateRing(m, 'r')).toHaveLength(1);
  });

  it('RED on longitude out of range', () => {
    const m = GOOD_RING.map((p, i) => (i === 1 ? [181.5, p[1]] : p));
    expect(validateRing(m, 'r')[0].problem).toMatch(/longitude 181.5 outside/);
  });

  it('RED on latitude out of range', () => {
    const m = GOOD_RING.map((p, i) => (i === 1 ? [p[0], -90.0001] : p));
    expect(validateRing(m, 'r')[0].problem).toMatch(/latitude .* outside/);
  });

  it('RED on an unclosed ring', () => {
    const m = GOOD_RING.slice(0, -1).concat([[-83.16, 42.31]]);
    expect(validateRing(m, 'r')[0].problem).toMatch(/not closed/);
  });

  it('RED on a ring below the minimum position count', () => {
    expect(validateRing(GOOD_RING.slice(0, 3), 'r')[0].problem).toMatch(/at least 4/);
  });

  it('RED on NaN and Infinity', () => {
    expect(validateRing(GOOD_RING.map((p, i) => (i === 0 ? [NaN, p[1]] : p)), 'r')[0].problem).toMatch(
      /NaN\/Infinite/,
    );
    expect(
      validateRing(GOOD_RING.map((p, i) => (i === 0 ? [p[0], Infinity] : p)), 'r')[0].problem,
    ).toMatch(/NaN\/Infinite/);
  });

  it('RED on non-numeric and wrong-arity positions', () => {
    expect(validateRing(GOOD_RING.map((p, i) => (i === 0 ? ['-83.17', p[1]] : p)), 'r')[0].problem).toMatch(
      /non-numeric/,
    );
    expect(validateRing(GOOD_RING.map((p, i) => (i === 0 ? [p[0], p[1], 5] : p)), 'r')[0].problem).toMatch(
      /3 components/,
    );
    expect(validateRing([1, 2, 3, 4], 'r').length).toBeGreaterThan(0);
    expect(validateRing('nope', 'r')[0].problem).toMatch(/not an array/);
  });

  it('GREEN again once the mutations are reverted', () => {
    expect(validateRing(GOOD_RING, 'r')).toEqual([]);
  });
});

describe('validateGeometry / validateFeatureCollection', () => {
  it('accepts Polygon and MultiPolygon deliberately', () => {
    expect(validateGeometry({ type: 'Polygon', coordinates: [GOOD_RING] }, 'g')).toEqual([]);
    expect(
      validateGeometry({ type: 'MultiPolygon', coordinates: [[GOOD_RING], [GOOD_RING]] }, 'g'),
    ).toEqual([]);
  });

  it('finds a bad ring nested inside a MultiPolygon', () => {
    const broken = GOOD_RING.map(() => [null, null]);
    expect(
      validateGeometry({ type: 'MultiPolygon', coordinates: [[GOOD_RING], [broken]] }, 'g').length,
    ).toBeGreaterThan(0);
  });

  it('rejects unsupported and empty geometry', () => {
    expect(validateGeometry({ type: 'Point', coordinates: [1, 2] }, 'g')[0].problem).toMatch(
      /unsupported geometry type/,
    );
    expect(validateGeometry({ type: 'Polygon', coordinates: [] }, 'g')[0].problem).toMatch(/no rings/);
    expect(validateGeometry(null, 'g')[0].problem).toMatch(/missing/);
  });

  it('rejects a structurally malformed collection', () => {
    expect(validateFeatureCollection({ type: 'Nope', features: [] }, 'f')[0].problem).toMatch(
      /expected FeatureCollection/,
    );
    expect(validateFeatureCollection({ type: 'FeatureCollection', features: [] }, 'f')[0].problem).toMatch(
      /empty/,
    );
    expect(
      validateFeatureCollection({ type: 'FeatureCollection', features: [{ type: 'Nope' }] }, 'f')[0].problem,
    ).toMatch(/expected Feature/);
  });

  it('passes a real collection and fails its mutated twin', () => {
    expect(validateFeatureCollection(fc(GOOD_RING), 'f')).toEqual([]);
    expect(validateFeatureCollection(fc(GOOD_RING.map(() => [null, null])), 'f').length).toBe(5);
  });
});
