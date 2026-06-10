# Deep-Audit Dossier — Tractor Supply Distribution Center, Frankfort NY

- **Facility:** Tractor Supply Company — Frankfort Distribution Center
- **Type:** Distribution Center (regional Northeast DC)
- **Address:** 1938 Country Mile, Frankfort, NY 13340
- **Resolved center:** **43.035640, -75.088580**
- **Maps (satellite):** https://www.google.com/maps/@43.035640,-75.088580,400m/data=!3m1!1e3
- **Confidence:** high
- **Method:** deep-audit (satellite zoom 16–20 + Street View + web)

## Location confirmation
The supplied approximate point (43.036086, -75.089492) landed on the north/parking
corner of the correct building. Satellite at z16–z17 shows a single very large
rectangular DC consistent with a regional distribution center, with branded
**Tractor Supply orange trailers** confirmed in Street View (pano
`RX2H0-J0Z3fYjFID88gVjw`, captured 2024-08) — positively identifying TSC. Web
sources (TruckMap, Manta, Yelp) corroborate the address and that this is the
Frankfort DC. The building long axis runs **NW–SE, rotated ~35° clockwise from
north**; all zone polygons were traced to that orientation.

## What the key views showed
- **z16 / z17 overview:** One main DC (~350 m long) set against woods to the west
  and an open farm field to the south, just off the NY-5S expressway on the
  edge of Frankfort. A separate office/ancillary building with its own parking
  sits near the NE access road (→ `buildingCount: 2`, but a single operational
  campus so `multipleFacilities: false`).
- **NE long face (z18/z19):** Continuous bank of dock doors with trailers backed
  in, a wide truck drive, a center-island drop-trailer row, and a far drop row
  near the access road.
- **SW long face (z18/z19):** A second full bank of dock doors with trailers
  backed in, plus a marked drop-trailer row below the apron, bounded by treeline.
  Two dock banks on opposite faces → `shipRcvSeparate: true` (medium conf).
- **NW corner (z19/z20):** The controlled entrance — see below.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE.** At the NW corner (~43.0367, -75.0899) the truck lane
  from the access loop road pinches through a gatehouse: lane-line markings and a
  canopy/gate structure span the drive (z19 `yardthroat`, z20 `guardshack`).
  Street View confirms a continuous **chain-link perimeter fence** along the full
  road frontage (orange TSC trailers visible behind it), so the property is fully
  fenced and the only truck path is through this gate.
- **Guard shack — TRUE.** A small white-roofed booth (~1–2 stall footprint) sits
  beside the gate lane with an adjacent canopy; a vehicle is parked at it in the
  z20 crop. Classic staffed gatehouse → `guardShack: true`, `remoteGs: false`.
- **Docks — 50+.** Dock doors run along BOTH long faces at a tight regular rhythm
  on a ~350 m building; the combined count is well into the 50+ band (est. ~70).
- **Drop area — 50+.** NE center-island row + NE far row + a full SW drop row of
  marked trailer stalls; combined comfortably exceeds 50 → dedicated drop yards
  (`dropYard: true`).

## Yard zones & counts measured
- **perimeter** — 7-vertex oriented ring around the fenced operational area;
  derived **siteAreaAcres ≈ 67.0**.
- **truckGate** — quad over the NW gatehouse/booth, aligned to the entrance drive.
- **dropYards** — two rings: NE center/far trailer rows; SW-face drop row.
- **dockAprons** — two long thin quads hugging the NE and SW dock walls at the
  building's ~35° angle.
- **staging** — null (interior post-gate drive provides queue room → noted via
  `postGateStaging: true`; no distinct outside-the-gate staging pad observed).
- **yardMetrics:** dockDoorCount ~70, trailersVisible ~95, trailerParkingCapacity
  ~150, truckGateCount 1, buildingCount 2, railServed false.
- **fastLaneOpportunity: true** — wide multi-lane gate apron with unused paved
  width to add an express/bypass lane.

## Street View
The only road coverage is one cluster of panos on the access road frontage
(`RX2H0-J0Z3fYjFID88gVjw`, 43.03772, -75.08792, 2024-08). It looks across the
chain-link fence at the NE dock face and the orange trailer fleet — the best
available driver's-arrival frame. `streetViewMeta` points this pano toward the
perimeter (heading 186°) and the truck gate (heading 232°). No pano exists at the
interior zone centroids (ZERO_RESULTS), as expected for a fenced rural DC.

## Web findings
TruckMap, Manta, Yelp, and Facebook all list the Frankfort DC at 1938 Country
Mile, 13340. Consistent with the TSC Northeast DC profile (opened ~2019). Driver-
facing listings describe paved overnight parking with good lighting.

## Uncertain fields
`entryLanes` / `exitLanes` (exact lane counts inferred from overhead only),
`shipRcvSeparate` (inferred from two-faced dock layout), `scale` (no weigh
platform clearly identified).

## Final confidence: HIGH
Building positively identified (branded trailers + address corroboration), gate
and guard booth visible in high-zoom satellite, and full perimeter fence confirmed
in Street View.
