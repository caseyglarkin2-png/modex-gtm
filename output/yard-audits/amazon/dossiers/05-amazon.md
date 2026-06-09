# Yard Audit Dossier — Amazon KCVG Air Hub, Hebron KY (idx 05)

**Type:** Air Hub (air cargo sort + landside ground operations)
**Address:** 289 Wendell H Ford Blvd, Hebron, KY 41048
**Audited center:** 39.03135, -84.65965 (Amazon sort building, landside)
**Method:** deep-audit (satellite + Street View + web)
**Confidence:** medium

---

## Step 0 — Facility confirmation

The supplied coordinates (39.033118, -84.658603) land on the large Amazon sort
building on the south/landside of Cincinnati/Northern Kentucky International
Airport (CVG). Web research confirms this is **Amazon Air's KCVG primary US
sort hub**: an 800,000 sq ft sortation building on a 600+ acre, $1.5B campus
with seven buildings, an aircraft ramp, and a multi-story employee parking
garage, opened August 2021 and operating 24/7.

CVG is a multi-tenant cargo airport. Street View at the campus access road
(39.0300, -84.65806, heading ~70°) clearly shows a building marked **DHL**
behind a barbed-wire chain-link fence to the southeast — that is the DHL US
hub, **not** Amazon. I re-anchored the audit on the genuine Amazon sort
building to the northwest (the long N-S white high-bay building visible at
z17/z18) and its landside truck/ground-ops footprint, deliberately excluding
the airside ramp and the DHL footprint.

The 2022 Street View shows the Amazon sort building still under construction
(dark blue shell); the 2026 satellite shows it completed (white roof). Both
resolve to the same footprint, confirming identity.

---

## Key views

- **z15/z16 overview** — orients the campus: airside ramps with parked freighters
  (DHL/Amazon tails) to the east; Amazon sort building center-west; cargo,
  maintenance, and two large hangars center; farmland to the south.
- **z17 sort building** — long N-S high-bay building, ~525 m × ~190 m footprint,
  rooftop mechanical units; truck dock activity along the east face.
- **z18/z19 east dock face** — trailers/trucks backed along the building's east
  apron, then a wide laydown strip, then employee parking lots.
- **z18 cargo/ground-ops (south)** — the operational heart: cargo buildings with
  docks plus a very large lot packed with ground-service equipment, trucks,
  containers and trailer rows.
- **z18 north end** — a second large building under construction north of the
  sort building (campus expansion) with extensive staging/parking.
- **Street View, access road (2022-05)** — wide multi-lane truck approach running
  N-S between the sort building (west) and employee parking (east); Amazon-marked
  trailers staged roadside; the ground-ops cargo area enclosed by chain-link +
  barbed-wire fence with cones/lane control on the approach.

---

## Gate / guard-shack / dock determinations

- **truckGate: TRUE.** The entire ground-ops/cargo footprint sits inside CVG's
  secured airfield perimeter and is enclosed by chain-link fence with barbed-wire
  top (visible in Street View). Vehicle entry is airport-controlled (SIDA/AOA
  access). This functions as a controlled truck gate, so `truckGate: true`,
  `remoteGs: false`.
- **guardShack: TRUE (inferred, flagged uncertain).** A $1.5B, 24/7 secured air
  cargo hub uses manned vehicle checkpoints; an individual guard booth could not
  be isolated in overhead imagery at this scale, so this is a class-based
  inference listed in `uncertainFields`.
- **multiStep: TRUE (inferred).** Airport perimeter security gate plus a separate
  airside (ramp) access control implies a multi-stage check. Flagged uncertain.
- **Docks: 50+ (`dockDoors: "50+"`).** The sort building east face plus the cargo
  buildings show 50+ truck dock positions with trailers backed in.
- **shipRcvSeparate: TRUE.** Inbound vs outbound flow through physically separate
  dock banks (sort building east face vs cargo-building docks).

---

## Yard zones & counts

- **perimeter** — 6-vertex ring around the landside ground-ops footprint
  (sort building + east dock apron + south staging + access corridor),
  ~118 acres. Excludes airside ramp and DHL.
- **truckGate** — quad over the fence-line/controlled approach on the south
  access road (~39.0281, -84.6579).
- **dropYards** (2) — the large south staging/trailer-equipment lot and the
  east-side equipment/container staging strip.
- **dockAprons** (2) — thin quads hugging the sort building east face and a
  cargo-building dock bank, at the structures' true orientation.
- **staging** — pre-/post-gate truck staging apron on the access corridor.

**yardMetrics:** dockDoorCount ~60; trailersVisible ~70; trailerParkingCapacity
~180; truckGateCount 1; buildingCount 6; siteAreaAcres ~118; railServed false.
Counts are honest overhead estimates and are flagged in `uncertainFields`.

**streetViewMeta:** both perimeter and truckGate have OK Street View coverage
(2022-05 panos on the access road); headings point the camera toward each zone.

---

## Web findings

- Amazon Air KCVG Sort Hub, 289 Wendell H Ford Blvd, Hebron KY 41048;
  Amazon Air's primary US air-cargo hub.
- 800,000 sq ft sortation building; 600+ acre campus; seven buildings;
  aircraft ramp; multi-story parking garage; $1.5B investment; opened Aug 2021;
  open 24 hours; ~2,000 jobs.
- CVG is shared with DHL's main US hub and ABX/ATSG — corroborates the
  multi-tenant, fenced, security-controlled airfield setting.

Sources: Lane Report (2017), Spectrum News 1 KY (2021), Eagle Country 99.3,
Chamber of Commerce, Waze listing.

---

## Final confidence: medium

Building identity, layout, fencing/control, dock scale, and multi-building
campus are well established from satellite + Street View + web. `guardShack`,
`entryLanes`/`exitLanes`, `multiStep`, and exact dock/trailer counts are
inferred at this scale and listed in `uncertainFields`. The site is a secured
airport cargo campus rather than a conventional warehouse with a single visible
barrier-arm + booth, which is why several gate fields are class-based inferences.
