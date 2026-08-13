/**
 * Yard-audit geometry: source zone -> GeoJSON ring, and a fail-closed validator.
 *
 * Two source shapes are legitimate and BOTH are supported deliberately:
 *
 *   ring  { ring: [{ lat, lng }, ...] }          — what every site record in
 *                                                  output/yard-audits/ uses today
 *                                                  (traced polygons, 4-11 points,
 *                                                  stored OPEN and clockwise)
 *   box   { south, west, north, east }           — the original axis-aligned
 *                                                  bounding box. No source record
 *                                                  still uses it (surveyed
 *                                                  2026-08-12: 0 of 4,295 zones),
 *                                                  but the shape is kept as a
 *                                                  first-class input so an older
 *                                                  record or an upstream tool that
 *                                                  still emits a box is converted,
 *                                                  not silently mangled.
 *
 * Reading a ring through the box parser is what produced the [null, null] corpus:
 * `b.west` on a `{ring: [...]}` object is `undefined`, and JSON.stringify writes
 * `undefined` inside an array as `null`. Nothing threw. Nothing warned. Every
 * coordinate in the export was null and the files still parsed as JSON.
 *
 * So: normalization is exhaustive (a zone is a ring, a box, absent, or an ERROR —
 * there is no fallthrough), and every generated ring is validated before it is
 * written. Malformed geometry throws. It is never dropped and never emitted.
 */

/** GeoJSON position, [longitude, latitude]. */
export type Position = [number, number];

export interface LatLng {
  lat: number;
  lng: number;
}

/** Axis-aligned bounding box (legacy source shape). */
export interface Box {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** Traced polygon (current source shape). Stored open; may be any winding. */
export interface RingZone {
  ring: LatLng[];
}

/** A geofence zone as it appears in a site record. */
export type Zone = Box | RingZone | null | undefined;

/** Thrown for source geometry that is present but unusable. Never swallowed. */
export class GeometryError extends Error {
  constructor(message: string, readonly context: string) {
    super(`${context}: ${message}`);
    this.name = 'GeometryError';
  }
}

const BOX_KEYS = ['south', 'west', 'north', 'east'] as const;

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function isBox(z: unknown): z is Box {
  return !!z && typeof z === 'object' && BOX_KEYS.every((k) => k in (z as object));
}

export function isRingZone(z: unknown): z is RingZone {
  return !!z && typeof z === 'object' && Array.isArray((z as RingZone).ring);
}

/** Shoelace signed area in coordinate units. Positive = counterclockwise. */
export function signedArea(ring: Position[]): number {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return a / 2;
}

/**
 * Close an open ring and force counterclockwise winding (RFC 7946 right-hand
 * rule for an exterior ring). Box-derived rings are already counterclockwise,
 * traced source rings are clockwise; normalizing both here is what makes the
 * two input shapes produce interchangeable output.
 */
function closeAndOrient(open: Position[], context: string): Position[] {
  const distinct = open.slice();
  // Tolerate a source ring that already repeats its first point — however many
  // times. Popping only one would let [a,b,c,a,a] through as a "closed" ring
  // carrying a spurious duplicate vertex.
  while (
    distinct.length > 1 &&
    distinct[distinct.length - 1][0] === distinct[0][0] &&
    distinct[distinct.length - 1][1] === distinct[0][1]
  ) {
    distinct.pop();
  }

  if (distinct.length < 3) {
    throw new GeometryError(
      `polygon ring needs at least 3 distinct positions, got ${distinct.length}`,
      context,
    );
  }

  const closed: Position[] = [...distinct, [distinct[0][0], distinct[0][1]]];
  const area = signedArea(closed);
  if (area === 0) {
    throw new GeometryError('polygon ring is degenerate (zero area)', context);
  }
  if (area < 0) {
    closed.reverse(); // clockwise -> counterclockwise
  }
  return closed;
}

/** Box -> closed counterclockwise 5-position ring, lng/lat order. */
export function ringFromBox(b: Box, context = 'box'): Position[] {
  for (const k of BOX_KEYS) {
    if (!isFiniteNumber(b[k])) {
      throw new GeometryError(`box.${k} is not a finite number (${JSON.stringify(b[k])})`, context);
    }
  }
  if (b.north <= b.south) {
    throw new GeometryError(`box north (${b.north}) must exceed south (${b.south})`, context);
  }
  if (b.east <= b.west) {
    throw new GeometryError(`box east (${b.east}) must exceed west (${b.west})`, context);
  }
  return [
    [b.west, b.south],
    [b.east, b.south],
    [b.east, b.north],
    [b.west, b.north],
    [b.west, b.south],
  ];
}

/** Traced ring -> closed counterclockwise ring, lng/lat order. */
export function ringFromLatLngs(z: RingZone, context = 'ring'): Position[] {
  const pts = z.ring;
  if (pts.length < 3) {
    throw new GeometryError(`ring has ${pts.length} point(s), need at least 3`, context);
  }
  const open: Position[] = pts.map((p, i) => {
    if (!p || typeof p !== 'object') {
      throw new GeometryError(`ring[${i}] is not a {lat,lng} object`, context);
    }
    if (!isFiniteNumber(p.lat) || !isFiniteNumber(p.lng)) {
      throw new GeometryError(
        `ring[${i}] has non-finite lat/lng (${JSON.stringify(p.lat)}, ${JSON.stringify(p.lng)})`,
        context,
      );
    }
    return [p.lng, p.lat];
  });
  return closeAndOrient(open, context);
}

/**
 * The one entry point the generator uses. Exhaustive by construction:
 * absent -> null (a legitimate "no geofence traced"), ring -> ring, box -> ring,
 * anything else -> GeometryError.
 */
export function normalizeZone(zone: Zone, context: string): Position[] | null {
  if (zone === null || zone === undefined) return null;
  if (typeof zone !== 'object') {
    throw new GeometryError(`zone is a ${typeof zone}, expected an object`, context);
  }
  if (isRingZone(zone)) return ringFromLatLngs(zone, context);
  if (isBox(zone)) return ringFromBox(zone, context);
  throw new GeometryError(
    `unrecognized zone shape (keys: ${Object.keys(zone).join(',') || 'none'})`,
    context,
  );
}

// ── validation ───────────────────────────────────────────────────────────────

export interface ValidationIssue {
  path: string;
  problem: string;
}

/**
 * Every rule a generated ring must satisfy before it may be written.
 *
 * `role` drives the winding rule: RFC 7946 wants an exterior ring
 * counterclockwise and each interior ring (hole) clockwise, so a blanket check
 * would reject legal holes.
 *
 * Known limit, stated rather than papered over: this cannot detect a
 * lat/lng transposition. Every US yard in this corpus has a latitude and a
 * longitude that are both inside the other's legal range, so a swap produces
 * coordinates that are individually valid and merely in the wrong ocean. Guard
 * that at the source-reading layer (there is exactly one, `normalizeZone`) and
 * with the tests that pin lng/lat order, not here.
 */
export function validateRing(
  ring: unknown,
  path: string,
  role: 'exterior' | 'interior' = 'exterior',
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!Array.isArray(ring)) {
    return [{ path, problem: 'ring is not an array' }];
  }
  if (ring.length < 4) {
    issues.push({ path, problem: `ring has ${ring.length} positions, need at least 4 (closed)` });
  }
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i] as unknown;
    const at = `${path}[${i}]`;
    if (!Array.isArray(p)) {
      issues.push({ path: at, problem: 'position is not an array' });
      continue;
    }
    if (p.length !== 2) {
      issues.push({ path: at, problem: `position has ${p.length} components, expected 2` });
      continue;
    }
    const [lng, lat] = p as unknown[];
    if (lng === null || lng === undefined || lat === null || lat === undefined) {
      issues.push({ path: at, problem: `position contains null/undefined (${JSON.stringify(p)})` });
      continue;
    }
    if (typeof lng !== 'number' || typeof lat !== 'number') {
      issues.push({ path: at, problem: `position is non-numeric (${JSON.stringify(p)})` });
      continue;
    }
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      issues.push({ path: at, problem: `position is NaN/Infinite (${JSON.stringify(p)})` });
      continue;
    }
    if (lng < -180 || lng > 180) {
      issues.push({ path: at, problem: `longitude ${lng} outside [-180, 180]` });
    }
    if (lat < -90 || lat > 90) {
      issues.push({ path: at, problem: `latitude ${lat} outside [-90, 90]` });
    }
  }
  if (issues.length === 0) {
    const r = ring as Position[];
    const first = r[0];
    const last = r[r.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      issues.push({ path, problem: 'ring is not closed (first position !== last position)' });
      return issues;
    }
    // A ring can be null-free, in-range and closed and still be junk. These are
    // invariants the generator guarantees, so validating them catches a file
    // written by an older or hand-edited build, not just a fresh one.
    for (let i = 1; i < r.length; i++) {
      if (r[i][0] === r[i - 1][0] && r[i][1] === r[i - 1][1]) {
        issues.push({ path: `${path}[${i}]`, problem: 'duplicate consecutive position' });
      }
    }
    const area = signedArea(r);
    if (area === 0) {
      issues.push({ path, problem: 'ring encloses zero area (degenerate or collinear)' });
    } else if (role === 'exterior' && area < 0) {
      issues.push({
        path,
        problem: 'exterior ring is clockwise; must be counterclockwise (RFC 7946)',
      });
    } else if (role === 'interior' && area > 0) {
      issues.push({
        path,
        problem: 'interior ring (hole) is counterclockwise; must be clockwise (RFC 7946)',
      });
    }
  }
  return issues;
}

/** Validate one GeoJSON geometry. Polygon and MultiPolygon are both accepted. */
export function validateGeometry(geometry: unknown, path: string): ValidationIssue[] {
  if (!geometry || typeof geometry !== 'object') {
    return [{ path, problem: 'geometry is missing' }];
  }
  const g = geometry as { type?: unknown; coordinates?: unknown };
  if (g.type === 'Polygon') {
    if (!Array.isArray(g.coordinates) || g.coordinates.length === 0) {
      return [{ path: `${path}.coordinates`, problem: 'Polygon has no rings' }];
    }
    return g.coordinates.flatMap((r, i) =>
      validateRing(r, `${path}.coordinates[${i}]`, i === 0 ? 'exterior' : 'interior'),
    );
  }
  if (g.type === 'MultiPolygon') {
    if (!Array.isArray(g.coordinates) || g.coordinates.length === 0) {
      return [{ path: `${path}.coordinates`, problem: 'MultiPolygon has no polygons' }];
    }
    return g.coordinates.flatMap((poly, pi) => {
      if (!Array.isArray(poly) || poly.length === 0) {
        return [{ path: `${path}.coordinates[${pi}]`, problem: 'polygon has no rings' }];
      }
      return poly.flatMap((r, i) =>
        validateRing(r, `${path}.coordinates[${pi}][${i}]`, i === 0 ? 'exterior' : 'interior'),
      );
    });
  }
  return [{ path: `${path}.type`, problem: `unsupported geometry type ${JSON.stringify(g.type)}` }];
}

/** Validate a whole FeatureCollection. Empty result means the file is safe to write. */
export function validateFeatureCollection(fc: unknown, path: string): ValidationIssue[] {
  if (!fc || typeof fc !== 'object') return [{ path, problem: 'not an object' }];
  const c = fc as { type?: unknown; features?: unknown };
  if (c.type !== 'FeatureCollection') {
    return [{ path: `${path}.type`, problem: `expected FeatureCollection, got ${JSON.stringify(c.type)}` }];
  }
  if (!Array.isArray(c.features)) {
    return [{ path: `${path}.features`, problem: 'features is not an array' }];
  }
  if (c.features.length === 0) {
    return [{ path: `${path}.features`, problem: 'FeatureCollection is empty' }];
  }
  return c.features.flatMap((f, i) => {
    const fp = `${path}.features[${i}]`;
    const feat = f as { type?: unknown; geometry?: unknown };
    if (feat?.type !== 'Feature') {
      return [{ path: `${fp}.type`, problem: `expected Feature, got ${JSON.stringify(feat?.type)}` }];
    }
    return validateGeometry(feat.geometry, `${fp}.geometry`);
  });
}
