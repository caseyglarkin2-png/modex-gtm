# Deep-Audit Dossier — Kroger Customer Fulfillment Center, Forest Park GA (idx 13)

**Facility:** Kroger Customer Fulfillment Center Forest Park GA
**Type:** Customer Fulfillment Center (Ocado-automated) / grocery e-commerce fulfillment + distribution
**Address:** 2000 Anvil Block Rd, Forest Park, GA 30297 (Gillem Logistics Center, former Fort Gillem)
**Resolved center:** 33.615400, -84.334000
**Confidence:** High
**Method:** deep-audit (satellite probe.ts + Street View + web research)

---

## Step 0 — Location confirmation

The supplied coordinates (33.615033, -84.334513) landed directly on a large
cross/T-shaped industrial building with extensive trailer parking. Web research
confirms 2000 Anvil Block Rd hosts Kroger's Ocado-powered Customer Fulfillment
Center (~375k–419k sq ft, opened 2021) co-located with Kroger's legacy ~1.3M
sq ft distribution center, both inside the Gillem Logistics Center.

Two large Kroger buildings sit on the complex:
- The **big white rectangular building to the NE** = the legacy 1.3M sq ft DC
  (separate, adjacent facility — not audited here).
- The **cross/T-shaped building at the given coords** = the audited Kroger
  fulfillment building, with its own fenced trailer yards and parking.

Positive ID via Street View: a "Kroger — FRESH FOR EVERYONE" trailer is parked
against the perimeter fence facing Anvil Block Rd (pano @ 33.61509, -84.33566,
2025-03). Building, signage placement, dock banks, and trailer yards are all
consistent with the Kroger fulfillment operation. Locked center at
33.615400, -84.334000 (geometric center of the audited building/yard).

## Steps 1-3 — What the imagery showed

**Wide / overview (z15–z17):** The audited property is the cross-shaped
building with employee parking to the north, and dense trailer drop yards
wrapping the west, south, and east/NE sides. Anvil Block Rd curves around the
west and south behind a tree/retention-pond buffer; the complex access road
(Kroger Dr) feeds the property from the north.

**Building / docks (z18–z19):** Long dock banks run along the building wings at
the building's true orientation (long axis NW–SE, rotated ~35° off north).
Trailers are backed in herringbone rows along the east wing (both faces) and
the south face. Total dock doors estimated in the **50+** band.

**Trailer yards (z19):** Dense drop-trailer rows in the west yard (along the
Anvil Block buffer), the south/SE yard, and the east/NE yard. Many trailers are
parked without tractors — a dedicated drop-yard pattern. Estimated 120 trailers
visible, ~170 capacity.

**Entrance (z20–z21 + Street View):** A single entry driveway crosses the
perimeter fence on the NW side off the complex road. At the fence line there is
a **chain-link sliding gate** across the drive. Street View
(pano `LisMFidlEnQ8ld0nKR9Yxg`, 2025-03, heading ~172° looking south)
clearly shows the fence and gate with the driveway passing through into the
employee parking and yard. **No guard booth / shack structure** is visible at
the gate in Street View or in satellite z21 — the gate is unmanned.

## Gate / guard-shack / dock determinations

- **truckGate = TRUE.** Controlled, fenced entrance with a sliding gate across
  the single entry drive. Evidence: SV pano `LisMFidlEnQ8ld0nKR9Yxg` + satellite
  z21 fence-throat.
- **guardShack = FALSE.** No 1–3-vehicle booth structure at the gate in any view.
- **remoteGs = TRUE.** Gate present, no booth → kiosk / badge / app check-in
  implied. (Medium confidence on the exact check-in mechanism — flagged.)
- **postGateStaging = TRUE.** Wide paved holding area inside the gate between the
  employee lot and the dock wings.
- **drivewayLong = TRUE.** Deep gate→dock approach holds well over 3 trucks.
- **fastLaneOpportunity = TRUE.** Wide gate apron and large open paved yard leave
  physical room to add a bypass/express lane.
- **dockDoors = "50+".** Multi-wing dock banks with herringbone trailer backing.
- **dropArea = "50+" / dropYard = TRUE.** Dedicated trailer-storage rows on
  three sides, separate from active dock staging.
- **shipRcvSeparate = FALSE.** No clearly separated ship vs. receive dock clusters
  on different faces; docks read as a unified operation.
- **urbanRural = "Urban".** Inside metro Atlanta's dense industrial fabric, 9 mi
  south of downtown.
- **scale = FALSE, multiStep = FALSE, multipleFacilities = FALSE** (the adjacent
  1.3M DC is a separate property), **railServed = FALSE**.

## Step 6 — Geofences and metrics

All zones traced as oriented polygons at the building's true NW–SE orientation
(not north-aligned boxes).

- **perimeter** — 8-vertex ring tracing the fenced active footprint
  (building + paved yards). Area ≈ **19.0 acres**.
- **truckGate** — small quad across the NW entry-drive gate throat.
- **dropYards** — array of 2 rings: west yard (along Anvil Block buffer) and
  east/NE yard.
- **dockAprons** — array of 2 rings: long thin quads hugging the south dock face
  and the east-wing dock bank at the building angle.
- **staging** — post-gate paved holding area between parking and the dock wings.

**streetViewMeta:**
- truckGate — `hasCoverage: true`, pano `LisMFidlEnQ8ld0nKR9Yxg`, heading 172
  (entrance driveway pano, the frame a driver sees on arrival).
- perimeter — `hasCoverage: false` (interior centroid returns ZERO_RESULTS; no
  public pano inside the yard). All other interior zone centroids also returned
  ZERO_RESULTS — only the road-adjacent gate has coverage.

**yardMetrics:** dockDoorCount ~70, trailersVisible ~120, capacity ~170,
truckGateCount 1, buildingCount 1, siteAreaAcres 19.0, railServed false.
Counts are honest overhead estimates and are flagged in `uncertainFields`.

## Web findings

- Kroger + Ocado named Forest Park, GA for a high-tech CFC; $55M investment,
  400+ jobs; broke ground 2019, soft-launched Dec 2020 / operational 2021.
- Facility ~375,000 sq ft (some sources ~419,317 sq ft), four levels of robotics
  + humans, serves the Atlanta delivery market.
- Co-located with Kroger's existing ~1.3M sq ft distribution center in the
  Gillem Logistics Center on the former Fort Gillem Army base.
- Ryan Companies served as design-build contractor.

## Final confidence

**High.** Building positively identified (Kroger-branded trailer + address +
footprint), gate and guard-shack determinations confirmed in Street View, dock
and trailer bands read clearly from tight satellite. Counts and the exact
unmanned-check-in mechanism are the only soft spots, flagged in
`uncertainFields`.
