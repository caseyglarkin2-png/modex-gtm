# Kraft Heinz - Garland (TX) - Oscar Mayer

**Address:** 2340 Forest Lane, Garland, TX 75042
**Center coordinates:** 32.90785, -96.6633
**Facility type:** Manufacturer (meat / consumer packaged foods)
**Archetype hint:** #7 (Fast-lane opportunity) — confirmed.
**Confidence:** High

---

## Location verification

The supplied coordinates (32.9082635, -96.6622296 from the maps URL) sit on the
NE quadrant of the property at the truck-gate area. Web research and satellite
probes around the point at z16-z21 confirm the correct facility: the Kraft
Heinz / Oscar Mayer plant at 2340 Forest Lane, Garland. Identifying signals:

- Garland city council records and Connect CRE / Food Processing / Area
  Development articles confirm the 635,000 sq ft Oscar Mayer plant on Forest
  Lane (originally opened 1949; recent $143M expansion adding 250 jobs to an
  843-worker base).
- Yelp / wikimapia entries put "Kraft" at 2340 Forest Ln.
- The Street View pano on Forest Ln captures a "Forest" street sign (5400
  block) and the plant facade with painted lane labels at the gate.
- The plant is the company's largest producer of Lunchables, Oscar Mayer
  Naturals, Velveeta Skillets and Kraft BBQ sauce.

Locked center: **32.90785, -96.6633** (geometric centroid of the connected
building cluster).

## Site overview (z15-z17)

- Large connected industrial complex spanning roughly 355m N-S × 458m E-W
  (~40 acres including paved aprons, drop yards and rail spur corridor).
- Bounded by Forest Lane on the north (multi-lane arterial with center
  median), Hilltop Dr / Jupiter Rd on the east, a freight rail spur on the
  west, and undeveloped land / residential subdivisions on the south.
- Dense Dallas-metro industrial fabric on all sides — clearly **Urban**.
- A single freight rail spur enters from the north (crosses Forest Lane) and
  curves south along the western property line — **rail-served**.

## Truck gate (z19-z21 + Street View)

The truck entrance is at the **NE corner of the property** off Forest Lane,
opposite a signalized intersection. Decisive evidence:

- z21 satellite shows painted lane labels on the inbound pavement, reading
  (left to right when facing south into the plant): **BUSES/VISITORS,
  TRUCKS, TRUCKS, EMPLOYEE/CARS**.
- A separate outbound **TRUCKS** lane is painted on the east side of the
  entry throat.
- A small dark rectangular structure (~1-2 parking-stalls footprint) sits
  squarely in the throat between the inbound flow and the outbound flow —
  a **guard booth** consistent with the rubric.
- A pedestrian crosswalk crosses the throat just inside Forest Lane —
  evidence of a staffed checkpoint that gates the property.
- Street View from Forest Ln (captured 2025-06) confirms a signalized
  driveway entrance with the painted "TRUCKS" / "EMPLOYEE" lane labels and
  a small white booth visible past the lane chevrons.

Determinations:
- `truckGate: true` — controlled, lane-labeled, guarded entrance.
- `guardShack: true` — small staffed booth at the throat of the gate.
- `remoteGs: false` — guard shack is present, so this is not a remote
  / kiosk-only setup.
- `entryLanes: 3` (VISITORS, TRUCKS, TRUCKS — three truck-relevant inbound
  lanes; the bus lane is not counted as truck-relevant).
- `exitLanes: 1` (single outbound TRUCKS lane visible).
- `entryExitTogether: true` — both inbound and outbound flows pass through
  the same gate complex on Forest Lane.
- `fastLaneOpportunity: true` — this is the textbook archetype #7: three
  inbound lanes already painted with role labels, a wide gate apron with
  substantial unused paved width south of the booth where an express /
  bypass lane could be added without civil works.
- `backupSensitive: false` — the gate has very deep stacking room before
  Forest Lane (~50m of apron) and Forest Lane itself is a 6-lane arterial,
  so queue spillback risk is low.

## Yard layout

**Post-gate staging (`postGateStaging: true`)** — A large paved apron sits
between the truck gate and the dock face, roughly 120m deep before the dock
doors. Lane chevrons direct truck flow south into the dock approach.

**Driveway long (`drivewayLong: true`)** — The post-gate approach to the
dock face is ~120m long and 4-5 lanes wide; comfortably holds 3+ tractors in
queue between the gate and the docks.

**Dock doors (`dockDoors: "50+"`)** — Two principal dock banks, plus
additional smaller doors:
- **North face dock bank** (z20 image 08): A continuous bank running the
  full length of the north building face. ~25-30 trailer slots visible
  with trailers backed in perpendicular. This is the primary outbound /
  finished-goods dock.
- **East face dock bank** (z19 image 12 / image 13): A second dock cluster
  on the east side of the building with ~15 doors.
- Smaller dock pockets on the south and west faces.
- Total estimate: **50+ doors** across the campus, consistent with a
  635k sq ft Oscar Mayer plant running Lunchables, Velveeta and BBQ
  production lines.

**Ship/receive separate (`shipRcvSeparate: true`)** — Two distinct dock
banks on different building faces (north + east) is the classic split
shipping/receiving signature, plausible for a multi-product CPG plant.

**Drop yard (`dropYard: true`)** — Two dedicated trailer-storage areas
separate from active dock staging:
1. **North drop yard** — along the north fence line between the truck gate
   and the rail spur. ~25-30 trailer stalls.
2. **East drop yard** — along the east fence line between the building
   and Hilltop Dr. ~20-25 trailers.
- Plus diagonally-parked trailers in the staging apron near the truck gate
  (5-8 more).

**Drop area band (`dropArea: "50+"`)** — Combined drop capacity comfortably
exceeds 50 trailer-without-tractor stalls.

**No truck scale (`scale: false`)** — No rectangular weigh pad with a
scale house visible in the gate throat or on the apron.

**Single connected campus (`multipleFacilities: false`)** — Despite the
mass-and-volume of the plant, all wings are physically interconnected as
one Oscar Mayer manufacturing complex. Not a multi-building campus in the
rubric sense.

## Yard metrics

| Metric | Value | Source |
| --- | --- | --- |
| `dockDoorCount` | 55 | Combined north + east + smaller faces; high-end estimate. |
| `trailersVisible` | 60 | Sum of trailers at docks + drop yards in z19/z20 imagery. |
| `trailerParkingCapacity` | 75 | Total drop yard + staging capacity. |
| `truckGateCount` | 1 | Single gate complex on Forest Lane. |
| `buildingCount` | 1 | Single connected plant. |
| `siteAreaAcres` | 40.2 | Computed from perimeter bbox (355m × 458m). |
| `railServed` | true | Spur enters from north and runs along west boundary. |

## Web findings

- **Garland city alert (2019)**: $143M expansion partnership between Kraft
  Heinz and the City of Garland modernizing the plant; 250 new jobs added.
- **Food Processing magazine**: Garland is Kraft Heinz's largest producer of
  Lunchables and Oscar Mayer Naturals.
- **MEAT+POULTRY (2019)**: Plant has operated continuously on Forest Lane
  since 1949 (originally National Dairy / Oscar Mayer).
- **Yelp / wikimapia**: Confirms 2340 Forest Ln address.
- Total footprint: 635,000+ sq ft over multiple expansions.

The longevity of the plant and the recent capital injection both argue for
high freight-volume CPG operations consistent with the heavy dock + drop
yard signatures visible from overhead.

## Final classification summary

- **Gate verdict:** TRUE — controlled, guarded, 3-inbound-lane entrance off
  Forest Lane with painted lane labels (VISITORS/TRUCKS/EMPLOYEE).
- **Guard-shack verdict:** TRUE — small booth in the entry throat,
  corroborated by both z21 satellite and Street View.
- **Confidence:** HIGH — facility identity is unambiguous, imagery is high
  resolution (Maxar 2026), gate evidence is decisive in both satellite and
  Street View. The reference #7 archetype calibration in the classify
  prompt also names this specific facility as the canonical example.
