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
  validateRingAgainstAnchor,
  haversineKm,
  ANCHOR_MAX_KM,
  type Position,
} from '../../scripts/yard-audit/geometry';
import { shapeBounds, shapeRing } from '../../src/lib/demo/geofence-geometry';

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

  it('collapses however many trailing duplicates the source carries', () => {
    const doubled = { ring: [...FORD_RING.ring, FORD_RING.ring[0], FORD_RING.ring[0]] };
    const out = normalizeZone(doubled, 'x')!;
    expect(out).toEqual(normalizeZone(FORD_RING, 'x'));
    expect(validateRing(out, 'r')).toEqual([]); // no spurious repeated vertex
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
    // Pin the ringFromLatLngs guard specifically. `/at least 3/` alone also
    // matches closeAndOrient's "at least 3 distinct positions", so deleting the
    // guard under test would leave the suite green.
    expect(() => ringFromLatLngs({ ring: [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }] }, 'x')).toThrow(
      /ring has 2 point\(s\), need at least 3/,
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
    // Pin the top-level guard, not the per-position fallback which shares the
    // phrase 'position is not an array'.
    expect(validateRing('nope', 'r')).toEqual([{ path: 'r', problem: 'ring is not an array' }]);
  });

  it('RED on a ring that is closed, in range, and still junk', () => {
    // Null-free, in-range and closed is not the same as valid.
    const flat: Position[] = [[-83.1, 42.3], [-83.1, 42.3], [-83.1, 42.3], [-83.1, 42.3]];
    expect(validateRing(flat, 'r').some((i) => /duplicate consecutive/.test(i.problem))).toBe(true);
    expect(validateRing(flat, 'r').some((i) => /zero area/.test(i.problem))).toBe(true);

    const collinear: Position[] = [[0, 0], [1, 1], [2, 2], [0, 0]];
    expect(validateRing(collinear, 'r')[0].problem).toMatch(/zero area/);
  });

  it('RED on a clockwise exterior ring, GREEN for a clockwise hole', () => {
    const cw = [...GOOD_RING].reverse();
    expect(validateRing(cw, 'r')[0].problem).toMatch(/exterior ring is clockwise/);
    expect(validateRing(cw, 'r', 'interior')).toEqual([]);
    expect(validateRing(GOOD_RING, 'r', 'interior')[0].problem).toMatch(/hole.*counterclockwise/);
  });

  it('accepts a Polygon with a legal clockwise hole', () => {
    // Clockwise, as RFC 7946 requires of an interior ring.
    const hole = [
      [-83.166, 42.305],
      [-83.166, 42.309],
      [-83.162, 42.309],
      [-83.162, 42.305],
      [-83.166, 42.305],
    ];
    expect(validateGeometry({ type: 'Polygon', coordinates: [GOOD_RING, hole] }, 'g')).toEqual([]);
  });

  it('GREEN again once the mutations are reverted', () => {
    expect(validateRing(GOOD_RING, 'r')).toEqual([]);
  });
});

/**
 * The repo already had a ring-or-box reader: src/lib/demo/geofence-geometry.ts,
 * written when schema v2 introduced oriented polygons. The demo-pack path was
 * migrated to it; the yard-audit exporters never were, which is the whole bug.
 * geometry.ts is the exporters' fail-closed layer (it throws, closes, and
 * orients, none of which shapeRing does) — but the two must never disagree
 * about what a shape MEANS, so pin that here.
 */
describe('agreement with src/lib/demo/geofence-geometry', () => {
  const shapes = [
    FORD_RING,
    { south: 42.3, west: -83.17, north: 42.31, east: -83.15 },
  ];

  it('normalizeZone covers the same vertices shapeRing does, for both shapes', () => {
    for (const s of shapes) {
      const mine = new Set(normalizeZone(s as never, 'x')!.map((p) => `${p[0]},${p[1]}`));
      const theirs = new Set(shapeRing(s as never).map((p) => `${p.lng},${p.lat}`));
      expect(mine).toEqual(theirs); // mine is closed, so the repeated vertex collapses
    }
  });

  it('normalizeZone produces the same bounds shapeBounds reports', () => {
    for (const s of shapes) {
      const ring = normalizeZone(s as never, 'x')!;
      const [[south, west], [north, east]] = shapeBounds(s as never);
      expect(Math.min(...ring.map((p) => p[1]))).toBeCloseTo(south, 12);
      expect(Math.max(...ring.map((p) => p[1]))).toBeCloseTo(north, 12);
      expect(Math.min(...ring.map((p) => p[0]))).toBeCloseTo(west, 12);
      expect(Math.max(...ring.map((p) => p[0]))).toBeCloseTo(east, 12);
    }
  });
});

describe('validateRingAgainstAnchor — the transposition guard', () => {
  // Real Ford Dearborn: ring centroid and geocoded coords agree to ~100 m.
  const ring = normalizeZone(FORD_RING, 'x')!;
  const anchor = { lat: 42.3088, lng: -83.1651 };

  it('GREEN when the traced ring agrees with the geocoded address', () => {
    expect(validateRingAgainstAnchor(ring, anchor, 'r')).toEqual([]);
  });

  it('RED on a lat/lng transposition, and SAYS it is a transposition', () => {
    // The exact bug validateRing structurally cannot catch: both values stay
    // inside the other's legal range, so every range check still passes.
    const swapped: Position[] = ring.map((p) => [p[1], p[0]]);
    expect(validateRing(swapped, 'r').filter((i) => /outside/.test(i.problem))).toEqual([]);
    const issues = validateRingAgainstAnchor(swapped, anchor, 'r');
    expect(issues).toHaveLength(1);
    expect(issues[0].problem).toMatch(/lat\/lng SWAPPED/);
  });

  it('RED on a dropped minus sign', () => {
    const flipped: Position[] = ring.map((p) => [-p[0], p[1]]);
    expect(validateRingAgainstAnchor(flipped, anchor, 'r')[0].problem).toMatch(/km from the record/);
  });

  it('RED on a ring traced on the wrong parcel', () => {
    const elsewhere = { lat: 34.05, lng: -118.24 }; // Los Angeles
    expect(validateRingAgainstAnchor(ring, elsewhere, 'r')[0].problem).toMatch(/wrong parcel/);
  });

  it('carries no hemisphere or country assumption — it is relative to the anchor', () => {
    // Same shape, in Australia. Valid there, and valid here.
    const au: Position[] = [
      [151.2, -33.87],
      [151.21, -33.87],
      [151.21, -33.86],
      [151.2, -33.86],
      [151.2, -33.87],
    ];
    expect(validateRingAgainstAnchor(au, { lat: -33.865, lng: 151.205 }, 'r')).toEqual([]);
  });

  it('tolerates the worst honest disagreement in the corpus with room to spare', () => {
    // Measured max 2026-08-12 was 1.34 km on a large multi-building campus.
    expect(ANCHOR_MAX_KM).toBeGreaterThan(1.34 * 10);
    // ...and is still three orders of magnitude short of a transposition.
    expect(haversineKm({ lat: 40, lng: -85 }, { lat: -85, lng: 40 })).toBeGreaterThan(10000);
  });

  it('is inert when the record carries no anchor, rather than guessing', () => {
    expect(validateRingAgainstAnchor(ring, undefined, 'r')).toEqual([]);
    expect(validateRingAgainstAnchor(ring, { lat: NaN, lng: 0 }, 'r')).toEqual([]);
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
