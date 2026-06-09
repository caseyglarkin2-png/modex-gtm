# Deep-Audit Dossier — Sam's Club Distribution Center, Villa Rica GA (idx 05)

**Facility:** Sam's Club Distribution Center (Saddle Creek Logistics 3PL operation)
**Type:** Distribution Center
**Address:** 140 Fleet Dr, Villa Rica, GA 30180
**Resolved center:** 33.74110, -84.94720
**Confidence:** high
**Method:** deep-audit (satellite + Street View + web)

---

## Step 0 — Locating the building

The supplied coordinates (33.745843, -84.944767) were city-level and landed
~0.5 km north of the building, on a mixed industrial park (self-storage, small
warehouses). Web research established two key facts: (1) 140 Fleet Dr is a
Saddle Creek Logistics 3PL site operated as the "Sam's Distribution Center,"
and (2) the facility is "more than 430,000 sq ft" at the corner of Fleet Drive
and Andrews Way — i.e. a single very large building, not the 66,000 sq ft figure
that some directories list (that is the office footprint).

Probing satellite outward from the approximate point, the only building matching
a 430k+ sq ft Sam's-grade DC is the large white-roof warehouse to the southwest,
fronting the E-W private road (Fleet Dr) with a fenced perimeter, a drop yard on
the west, a long dock bank on the south, a second dock bank plus office and a
several-hundred-stall employee lot on the east. Street View along the frontage
confirmed a fully fenced active distribution facility. Locked center
33.74110, -84.94720.

---

## Key views

- **Wide satellite (z16–z17):** large white-roof DC dominating the SW of the
  industrial park; drop yard (W), dock banks (S and E), employee parking + office
  (E). Single dominant footprint.
- **Tight satellite (z18–z20):** west drop yard packed with trailers in marked
  rows (no tractors); south face = long continuous dock-door bank with trailers
  backed in; east face = second dock bank plus the office and car lot.
- **Street View, road frontage (2024-02):** continuous chain-link perimeter
  fence the length of the property; cars behind it in the employee lot; the metal
  warehouse wall behind that.
- **Street View, NE entrance (pano `pb9v7eEbu4Oo6Zh_pz1kWA`):** the truck gate —
  a wide gravel truck drive with a sliding chain-link gate (seen open), tractors
  (Freightliner day cabs) and trailers staged on the gravel inside, dock doors of
  the main building visible to the right/behind, and a small maintenance/shop
  building set deep in the yard.

---

## Gate / guard-shack / dock determinations

- **truckGate = true.** A controlled truck entrance at the NE corner off Fleet
  Dr: a rolling/sliding chain-link gate spans the truck drive, with the whole
  property ringed by chain-link fence. Open driveways elsewhere do not breach the
  fence line; this is the truck control point.
- **guardShack = false.** No staffed booth beside the gate in any Street View
  heading. The only on-yard structure is a maintenance/shop building set well
  back from the gate lane — not a 1–3-space guard booth at the checkpoint.
- **remoteGs = true.** Gate present, no shack → check-in is by kiosk / call-box /
  app rather than a manned booth.
- **dockDoors = "50+".** A long door bank runs the south face and a second bank
  the east face; many bays show trailers backed in. Comfortably 50+ across faces.
- **shipRcvSeparate = true.** Two physically distinct dock clusters on different
  building faces (south and east).

---

## Yard zones and counts

- **perimeter** — 7-vertex ring tracing the fence line around the whole property
  (drop yard W, building center, parking/office E); ~36.9 acres (shoelace).
- **truckGate** — oriented quad over the NE gravel truck entrance off Fleet Dr.
- **dropYards** — one ring over the west trailer-storage lot (multiple marked
  rows full of parked trailers).
- **dockAprons** — two rings: a long thin quad along the south dock wall, and one
  along the east dock face.
- **staging** — the gravel tractor-staging area inside the NE gate, before the
  docks (post-gate).
- **yardMetrics (overhead estimates):** dockDoorCount ~70, trailersVisible ~140,
  trailerParkingCapacity ~180, truckGateCount 1, buildingCount 2 (main DC + small
  shop), siteAreaAcres 36.9, railServed false. Counts flagged in
  `uncertainFields` as honest overhead estimates.

**Street View metadata:** truckGate pano `pb9v7eEbu4Oo6Zh_pz1kWA`
(33.74303, -84.94659), heading 181° toward the gate; perimeter pano
`jg9KdcvqVQ0-6czolnFMZg` (33.74257, -84.94846), heading 145° toward the building.

---

## Web findings

- 140 Fleet Dr, Villa Rica GA 30180 = Saddle Creek Logistics site, operated as
  the Sam's Distribution Center (a Sam's Club-dedicated 3PL DC).
- Described as 430,000+ sq ft at Fleet Dr & Andrews Way; ~46+ staff on directory
  listings (the active employee lot suggests a much larger headcount).
- Saddle Creek runs full 3PL warehousing / omnichannel fulfillment from the site.

Sources: sclogistics.com (Villa Rica location), Yelp, BBB, YellowPages,
TruckMap, CMac.ws.

---

## Other classification notes

- **urbanRural = Rural** — edge-of-town Villa Rica, small-industrial setting
  bordered by woods; per the tie-break rule, Rural.
- **fastLaneOpportunity = true** — very wide gravel gate apron with unused width;
  room for an express/bypass lane.
- **postGateStaging / drivewayLong = true** — deep gravel yard from the gate to
  the docks holds well over 3 trucks.
- **backupSensitive = false** — low-traffic industrial road, ample stacking room
  inside the fence.
- **scale / multiStep = false** — no truck scale or second checkpoint visible.
- **dropYard = true** — dedicated west trailer-storage lot, separate from active
  dock staging.

**Final confidence:** high. Building identity, gate, guard-shack absence, dock
banks, and drop yard are all clearly resolved from satellite + 2024-02 Street
View; only the exact door/trailer counts are estimates.
