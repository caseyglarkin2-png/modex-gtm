/**
 * Live YardFlow reference sites — Primo Brands' 27 facilities (24 US + 3 Canada),
 * the live customer the proximity play anchors on. Synced to Casey's site
 * spreadsheet (table (1).xlsx, 2026-06-10). Mirrored from PRIMO_SITES in
 * scripts/prospect-discovery/score-and-rank.ts so the map can pin them as a
 * visible reference layer with proximity rings. NOTE: this list is duplicated in
 * score-and-rank.ts + primo-proximity-gtm.ts; keep all three in sync.
 *
 * `status` is 'live' for all Primo sites today; the field exists so a broader
 * live/deploying set can be layered in later (per the Sprint 0 reference-set fork).
 */
export interface ReferenceSite {
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  status: 'live' | 'deploying';
}

export const REFERENCE_SITES: ReferenceSite[] = [
  { name: 'US PL Ontario Factory', city: 'Ontario', state: 'CA', lat: 34.0365, lng: -117.5931, status: 'live' },
  { name: 'US PL Hot Springs Factory', city: 'Hot Springs', state: 'AR', lat: 34.6332, lng: -93.0672, status: 'live' },
  { name: 'US DC Hot Springs (WHSE)', city: 'Hot Springs', state: 'AR', lat: 34.5037, lng: -93.0552, status: 'live' },
  { name: 'US PL Allentown Factory', city: 'Breinigsville', state: 'PA', lat: 40.5333, lng: -75.6333, status: 'live' },
  { name: 'US PL Cabazon Factory', city: 'Cabazon', state: 'CA', lat: 33.9164, lng: -116.7873, status: 'live' },
  { name: 'US PL Hawkins Factory', city: 'Hawkins', state: 'TX', lat: 32.5690, lng: -95.2150, status: 'live' },
  { name: 'US PL Hollis Factory', city: 'Hollis', state: 'ME', lat: 43.5950, lng: -70.6450, status: 'live' },
  { name: 'US PL Madison Factory', city: 'Madison', state: 'WI', lat: 43.0558, lng: -89.3268, status: 'live' },
  { name: 'US PL Mecosta Factory', city: 'Stanwood', state: 'MI', lat: 43.5803, lng: -85.2097, status: 'live' },
  { name: 'US PL Poland Spring Factory', city: 'Poland Spring', state: 'ME', lat: 44.0558, lng: -70.3475, status: 'live' },
  { name: 'US PL S Houston Factory', city: 'Houston', state: 'TX', lat: 29.6650, lng: -95.3850, status: 'live' },
  { name: 'US PL Zephyrhills Factory', city: 'Zephyrhills', state: 'FL', lat: 28.2461, lng: -82.1811, status: 'live' },
  { name: 'US PL Allentown NPL Factory', city: 'Breinigsville', state: 'PA', lat: 40.5280, lng: -75.6350, status: 'live' },
  { name: 'US PL Dallas 2 Factory', city: 'Dallas', state: 'TX', lat: 32.6949, lng: -96.9470, status: 'live' },
  { name: 'US PL Kingfield Factory', city: 'Kingfield', state: 'ME', lat: 44.9580, lng: -70.1530, status: 'live' },
  { name: 'US PL Denver Factory', city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903, status: 'live' },
  { name: 'US PL Greenwood Indiana', city: 'Greenwood', state: 'IN', lat: 39.5945, lng: -86.1167, status: 'live' },
  { name: 'US PL McBee Factory', city: 'McBee', state: 'SC', lat: 34.4700, lng: -80.2586, status: 'live' },
  { name: 'US PL Sacramento Factory', city: 'Sacramento', state: 'CA', lat: 38.5158, lng: -121.3809, status: 'live' },
  { name: 'US PL Pasadena Factory', city: 'Pasadena', state: 'TX', lat: 29.5605, lng: -95.1167, status: 'live' },
  { name: 'US PL High Springs Factory', city: 'High Springs', state: 'FL', lat: 29.8283, lng: -82.5967, status: 'live' },
  { name: 'US PL Saratoga Spring Factory', city: 'Saratoga Springs', state: 'NY', lat: 43.0710, lng: -73.7846, status: 'live' },
  { name: 'US PL Hot Springs 2 Factory', city: 'Hot Springs', state: 'AR', lat: 34.6100, lng: -93.0500, status: 'live' },
  { name: 'US DC NFI - Breinigsville', city: 'Breinigsville', state: 'PA', lat: 40.5340, lng: -75.6290, status: 'live' },
  // Canada (added 2026-06-10 from the site spreadsheet; Driver Journey live)
  { name: 'CA PL Guelph Factory', city: 'Guelph', state: 'ON', lat: 43.5448, lng: -80.2482, status: 'live' },
  { name: 'CA PL Hope Factory', city: 'Hope', state: 'BC', lat: 49.3827, lng: -121.4414, status: 'live' },
  { name: 'CA DC Chilliwack Whse', city: 'Chilliwack', state: 'BC', lat: 49.1579, lng: -121.9515, status: 'live' },
];

/** Proximity-ring radii (miles) — aligned to the engine's scorePrimoProximity bands. */
export const PROXIMITY_RING_MILES = [5, 25, 50] as const;

/**
 * Below this distance (mi) a "prospect" is essentially on top of a live reference
 * site — likely the same facility, a co-located building, or a geocode artifact.
 * Cold-pitching such a row is a credibility risk, so the drawer warns before email.
 */
export const REFERENCE_OVERLAP_MI = 0.5;

export interface ReferenceOverlap {
  /** The live site it overlaps, if the name resolves; null when unresolved but still close. */
  site: ReferenceSite | null;
  distanceMiles: number;
}

/** Flag a prospect that sits within REFERENCE_OVERLAP_MI of a live reference site. */
export function referenceOverlap(row: { nearestPrimoName: string; nearestPrimoDistance: number }): ReferenceOverlap | null {
  if (!(row.nearestPrimoDistance < REFERENCE_OVERLAP_MI)) return null;
  return {
    site: REFERENCE_SITES.find((s) => s.name === row.nearestPrimoName) ?? null,
    distanceMiles: row.nearestPrimoDistance,
  };
}
