# Deep-Audit Dossier — NFI Distribution Center, Perris CA (Site 06)

- **Facility:** NFI Distribution Center, 657 W Nance St, Perris, CA 92571
- **Type:** Distribution Center (third-party logistics, NFI Industries / Cal Cartage)
- **Resolved center:** `33.853513, -117.239060`
- **Maps (satellite):** https://www.google.com/maps/@33.853513,-117.239060,400m/data=!3m1!1e3
- **Method:** deep-audit · **Confidence:** high

## Location confirmation
Supplied coordinates (`33.854552, -117.240935`) landed at the NW corner of the
target building, slightly off the footprint center. Web research confirmed the
address as **657 W Nance St** (note the "W"): an 864,000 SF two-story cross-dock
distribution center on a ~43-acre parcel, leased/operated by NFI, expandable to
1.1M SF, with **112 dock-high doors, 298 auto spaces and 224 trailer spaces**
(REBusinessOnline, Newmark, ConnectCRE press on the lease renewal). Satellite at
z16–z17 positively identified the matching large rectangular cross-dock building
on the north side of W Nance St, west of I-215, with neighbors consistent with
the reporting (Home Depot/General Mills/Amazon big-boxes nearby). Center relocked
to the building footprint centroid.

## Key views
- **z16/z17 overview** — single very large rectangular DC, long axis E-W, fronting
  W Nance St on the south. Large vacant dirt lot to the west (the expansion parcel,
  excluded from the active geofence); neighboring 3PL yards east; truck/auto storage
  and other DCs north.
- **North face (z18 dropyard)** — long north dock apron with a row of trailers
  (red/green/white/blue) backed in, then a wide paved truck/drop yard, then the
  perimeter road. This is the primary dock + drop-yard face.
- **South face (z19/z20 SE)** — second dock apron with white trailers backed in,
  confirming the **cross-dock** layout (docks on both opposing long faces).
- **Front / entrance (z20/z21 SW + Street View 2026-02)** — two-story glass office
  entry at the SW, wrought-iron perimeter fence along Nance, gated driveway throat.

## Gate / guard-shack / dock determinations
- **truckGate = TRUE.** A **sliding wrought-iron gate** spans the entrance driveway
  at the SW corner off W Nance St (red signage on the gate panel). Confirmed in
  Street View (pano `XD2_EEmoJ-ak0GS2vqwaEw`, captured 2026-02, looking N/NW into
  the throat) and in z21 satellite of the driveway throat.
- **guardShack = FALSE.** No staffed booth beside the entrance lane in either z20/z21
  satellite or Street View — the gated throat carries only landscaped islands, no
  1–3-stall booth footprint.
- **remoteGs = TRUE.** Gate present, no guard booth → kiosk / call-box / app check-in.
- **dockDoors = 50+.** Published 112 dock-high doors; visually consistent with the
  long trailer rows on both N and S faces.
- **shipRcvSeparate = TRUE.** Physically separate dock banks on the north and south
  building faces (cross-dock).

## Yard zones & counts
- **perimeter** — fenced operational yard, ~35.8 acres from the polygon (full
  assessor parcel ~43 ac including the west expansion dirt lot, excluded here).
- **truckGate** — SW driveway throat off W Nance St.
- **dropYards** — the broad striped truck/trailer yard along the north dock apron
  (published 224 trailer spaces → dropArea band 50+).
- **dockAprons** — two strips: north dock apron and south dock apron (cross-dock).
- **staging** — deep post-gate apron inside the entrance (postGateStaging TRUE;
  drivewayLong TRUE — 3+ truck approach).
- **yardMetrics** — dockDoorCount 112 (published), trailerParkingCapacity 224
  (published), trailersVisible ~70 (estimate), truckGateCount 1, buildingCount 1,
  siteAreaAcres 35.8, railServed false.
- **fastLaneOpportunity = TRUE** — wide entrance apron with unused paved width inside
  the gate; room for an express/bypass lane.
- **backupSensitive = FALSE** — W Nance St is a wide divided road with turn lanes;
  gate is set well back with ample stacking.

## Setting
- **urbanRural = Rural.** Edge-of-town Inland-Empire logistics corridor; ranch/
  residential lots and open land directly across W Nance St to the south. Per the
  rubric tiebreak ("small-town industrial" → Rural). connectivityIssue FALSE
  (large metro-adjacent corridor, coverage fine).

## Web findings
- REBusinessOnline / Newmark / ConnectCRE / Inland Empire Business Journal: NFI
  renewed an **864,000 SF** lease at the Perris Distribution Center, 657 W Nance St
  — two-story cross-dock, 36' clear, ESFR, LED, **112 dock-high doors, 298 auto
  spaces, 224 trailer spaces, ~43-acre parcel**, expandable to 1.1M SF, near I-215.
  Both the dock count and trailer-space count corroborate the visual bands.

## Final confidence
**High.** Facility unambiguously identified and corroborated by multiple published
sources; gate/guard-shack determinations verified in current (2026-02) Street View;
dock and drop bands match published figures. Low-confidence items flagged:
`trailersVisible` (overhead estimate), `exitLanes` (inferred 1), `fastLaneOpportunity`
(judgment from apron width).
