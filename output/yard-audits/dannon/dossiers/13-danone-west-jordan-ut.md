# Deep-Audit Dossier — Danone West Jordan UT (idx 13)

## Facility
- **Name:** Danone - West Jordan UT
- **Type:** Fresh yogurt plant
- **Address:** 6165 West Dannon Way, West Jordan, UT 84081
- **Resolved coordinates:** 40.58110, -112.03600 (plant complex center)

## Step 0 — Location confirmation
The roster coordinate (40.582873, -112.039893, RANGE_INTERPOLATED) landed on
the correct street (Dannon Way — literally named for the plant) but ~400 m
west of the plant complex itself. Probing east located the actual facility.
- Web research confirms 6165 Dannon Way, West Jordan is The Dannon Company
  Western Division — a 51.17-acre site, 13 production lines, ~310 employees,
  opened 1997 (originally a bottled-water plant), produces Activia, Danimals,
  Oikos, Light + Fit, Danonino; runs 24/7.
- The satellite imagery shows an unmistakable yogurt/dairy plant: a large
  multi-building manufacturing complex with extensive process tanks and bulk
  silos on the west side, a large dock apron and trailer drop yard on the east/
  SE. Big-D Construction lists the "Dannon Yogurt Processing Facility" project.
The locked center is the manufacturing-complex centroid.

## Key views
- **z16/z17 overview:** Large industrial district in West Jordan (SLC metro).
  The plant complex occupies the center-right; a southern portion of the
  51-acre parcel is undeveloped/vacant land.
- **z18/z19 plant tight:** Multi-building manufacturing block. Process tanks
  and bulk silos line the west side. A large dock apron with ~30 doors and a
  bank of backed-in trailers occupies the east/SE; a dedicated drop yard with
  rows of parked trailers (50+) sits to the SE.
- **Street View (2024/2025):** The entire plant is enclosed by a tall iron
  perimeter fence — confirmed on the north (Dannon Way), NE, and east frontages.
  The vehicle entrance off Dannon Way has a kerbed checkpoint island in the
  driveway. The entrance area was cluttered with staged construction/expansion
  material (consistent with the $4M expansion noted for 2026).

## Gate / guard-shack / dock determinations
- **truckGate = true.** The plant is fully perimeter-fenced with a controlled
  vehicle entrance off Dannon Way (kerbed checkpoint island). A 24/7 plant of
  this scale operates a gated entry.
- **guardShack = false (uncertain).** No freestanding guard booth could be
  clearly resolved beside the truck lane in available satellite/Street View;
  the entrance area was partly obscured by staged expansion material. Flagged
  in uncertainFields.
- **remoteGs = true (uncertain).** Gated, fenced entrance with no confirmed
  guard booth — remote/kiosk check-in inferred. Flagged uncertain alongside
  guardShack; this is the field most likely to need human review.
- **dockDoors = "25-50".** Large dock apron on the east/SE building face with
  ~30 doors estimated and many trailers backed in — honest overhead estimate,
  low confidence.
- **dropArea = "50+" / dropYard = true.** Extensive trailer drop yard in the SE
  with rows of parked trailers — a heavy freight operation.
- **fastLaneOpportunity = true.** Wide entrance apron and broad internal
  roadways with unused paved width — physical room for a bypass/express lane.
- **scale = false (uncertain).** No truck scale clearly identified; flagged.

## Yard zones and counts
- **perimeter:** the full 51-acre parcel, ~40.5792–40.5830 lat, ~-112.0388 to
  -112.0334 lng — site area ~51 acres (per roster).
- **truckGate zone:** the Dannon Way driveway entrance near 40.5825, -112.0367.
- **dropYards:** the SE trailer-storage lot.
- **dockAprons:** the east/SE dock apron in front of the loading-door bank.
- **staging:** post-gate paved area between the entrance and the dock yard.
- **Metrics:** ~30 dock doors, ~45 trailers visible, ~70 trailer capacity,
  1 truck gate, 2 buildings, ~51 acres, not rail-served.

## Web findings
- The Dannon Company Western Division, 6165 Dannon Way — established 1997,
  51.17-acre site, 13 production lines, ~310 employees, runs 24/7.
- Produces Activia, Danimals, Oikos, Light + Fit, Danonino.
- Local news (KUTV/Fox13, 2018) documents resident complaints about plant
  odor — corroborates an active, high-throughput dairy operation.
- A $4M expansion was underway in 2026; staged construction material visible
  at the entrance is consistent with this.

## Final confidence
**Medium.** Facility positively identified (address, brand research, plant
layout — all high confidence). truckGate is well supported (full perimeter
fence + checkpoint-island entrance). The guard-shack determination is the
weak point: no booth could be conclusively resolved, partly due to staged
expansion material obscuring the entrance — guardShack/remoteGs flagged for
human review. Dock-door and trailer counts are honest overhead estimates.
