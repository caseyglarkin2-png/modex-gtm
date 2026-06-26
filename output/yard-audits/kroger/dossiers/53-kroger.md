# Deep-Audit Dossier — Harris Teeter Distribution Center, Greensboro NC (idx 53)

**Type:** Distribution Center (grocery DC, Harris Teeter / Kroger)
**Address:** 200 Distribution Dr, Greensboro, NC 27410
**Resolved center:** 36.09310, -79.92990
**Confidence:** high
**Method:** deep-audit

## Step 0 — Location confirmation
The supplied coordinates (36.093784, -79.929764) landed directly on a large white-roofed
distribution building ringed by trailers inside an industrial park beside Piedmont Triad
airport (runway visible NW). Web search confirmed Harris Teeter Distribution Center at
200 Distribution Dr, Greensboro NC 27410 (ph 336-294-7200, 24/7 warehouse). The Harris
Teeter heart logo is mounted on the building's NW wall (visible in 2026-02 Street View),
positively identifying the building. Precise center pinned at 36.09310, -79.92990.

## Layout
Large (~500k sqft) rectangular DC rotated ~30° clockwise from north (long axis NE-SW).
- **SW face:** long bank of dock doors with trailers backed in (primary shipping/receiving).
- **W face:** additional docks plus the large drop yard.
- **SE/E face:** a second, physically separate dock bank with trailers backed in
  (→ shipRcvSeparate true). Beyond it: woods (the east property edge).
- **NW front:** Harris Teeter office front + employee parking.
- **North:** an adjacent older tan-roofed HT building with its own docks/trailers
  (→ multipleFacilities/campus true).
- No rail spur on the property.

## Gate / guard determination
- **truckGate: TRUE.** The whole property is wrapped in barbed-wire chain-link fence
  (seen on every west-road Street View pano). The controlled entrance is the NW driveway
  off Distribution Dr (~36.0952,-79.9309): the 2026-02 pano `780YOIbqWLxtMi0aP3JzDQ`
  shows a fence opening with a sliding gate panel and the HT entrance sign. Continuous
  fence everywhere else confirms a single controlled point.
- **guardShack: FALSE (medium confidence).** No distinct windowed booth (1-3 stall
  footprint) seen beside the gate in satellite or Street View. Could be obscured —
  flagged in uncertainFields.
- **remoteGs: TRUE.** Gate present, no visible booth → kiosk / call-box / app check-in.
- **truckGateCount: 1.** Single entrance/exit point (entryExitTogether).

## Yard zones & counts (from z18-z21 satellite)
- **perimeter:** 7-vertex oriented ring tracing the fenced parcel at ~30° rotation;
  area ≈ 22.1 acres.
- **dropYards:** one large rotated quad over the NW/W trailer-storage lot (rows of
  parked trailers without tractors) → dropArea "50+", dropYard true.
- **dockAprons:** two quads — SW dock face and SE/E dock face, each hugging the wall at
  the building angle.
- **dockDoorCount:** ~90 across SW/W/SE faces → dockDoors band "50+".
- **trailersVisible:** ~130; trailerParkingCapacity ~120.
- **buildingCount:** 2 (main DC + adjacent HT building).
- **railServed:** false.

## Street View
- Gate pano `780YOIbqWLxtMi0aP3JzDQ` @ 36.09518,-79.93090 (2026-02), heading 119°
  toward the gate — the frame a driver sees on arrival.
- West-perimeter pano `EF7zHoByIDJ7UDMvrWxMKg` @ 36.09447,-79.93177 (2026-02),
  heading 132° toward the building.

## Web findings
24/7 warehouse / distribution hub for Harris Teeter (Kroger) grocery operations;
truck-driver review sites list it as an active receiving DC. Consistent with the
heavy dock + drop-yard footprint observed.

## Setting
Edge-of-town industrial park adjacent to Piedmont Triad airport; broader area is
non-dense → urbanRural "Rural" per the rubric's tie-break. Not isolated, so
connectivityIssue false.

## Final confidence: HIGH
Building unambiguous, gate and fence clearly imaged, dock/drop counts read from tight
imagery. Only the guard-shack/remote-check-in distinction is medium confidence (no
booth visible but possibly obscured).
