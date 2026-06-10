# Deep-Audit Dossier — Tractor Supply Distribution Center, Navarre OH (idx 09)

- **Account:** Tractor Supply Company
- **Facility:** Tractor Supply Distribution Center Navarre OH
- **Type:** Distribution Center
- **Address:** Navarre, OH (southeast edge of town)
- **Resolved center:** 40.7330, -81.5083
- **Confidence:** high
- **Method:** deep-audit (satellite + Street View, 2024-06 imagery)

## Step 0 — Facility confirmation

The point landed on a single very large distribution building on the southeast
side of Navarre OH, open fields to the east and south. Web research confirms
Tractor Supply's Navarre DC — a ~900,000 sq ft building, the chain's largest
distribution center, with 89 loading docks. Satellite and Street View confirm a
fully fenced freight yard with dock banks on both long building faces. Locked
center ~40.7330, -81.5083.

## Key views

- **z18 overview:** one large rectangular building (long axis ~N-S) filling the
  frame, edge-of-town / farmland setting; continuous chain-link perimeter fence
  around the truck yard; trailer drop rows north of the building and along the
  east perimeter road.
- **z19/z20 dock faces:** dock-door rhythm reads on BOTH the east and west long
  faces — two distinct dock banks — with trailers backed in and a deep paved
  apron in front of each.
- **z21 gate (NE corner):** the truck entrance is a controlled gap in the
  perimeter fence at the NE corner, served by a striped, diagonal pre-gate
  staging lane (lane markings = checkpoint pinch). No booth structure at the
  opening.
- **Street View (2024-06, entrance + perimeter):** a continuous chain-link fence
  runs the entire east edge; ~10 frames walked along the entrance show the
  controlled fence gap and staging lane, no guard booth.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Continuous chain-link perimeter fence confirmed in Street
  View along the entire east edge; the truck entrance is a controlled gap in the
  fence at the NE corner with a striped diagonal pre-gate staging lane. A modern
  fenced freight yard, not an open driveway. `truckGateCount: 1`.
- **guardShack = false.** No booth structure visible at the entrance in z19-z21
  satellite or in any of the ~10 Street View frames walked along it.
- **remoteGs = true.** Gate present but no guard shack — kiosk / app / call-box
  check-in implied.
- **preGateStaging = true; postGateStaging = true.** Striped diagonal staging
  lane outside the fence before the gate; deep interior aprons after it.
- **entryExitTogether = true; entryLanes 1 / exitLanes 1.** Single NE gate serves
  both directions; lane counts estimated (flagged).
- **dockDoors = 50+ (89).** Web-confirmed 89 loading docks (900,000 sq ft DC,
  chain's largest); doors visible on both long faces.
- **dropArea = 50+; dropYard = true.** Large trailer drop rows north of the
  building and along the east perimeter road; well into the 50+ band.
- **shipRcvSeparate = true.** Dock banks on both long faces (east and west) —
  two distinct clusters, so ship/receive can run separately.
- **fastLaneOpportunity = true.** Wide gate apron and a long dedicated staging
  lane outside the fence leave ample paved width for an express bypass.
- **drivewayLong = true; backupSensitive = false.** Long approach and deep
  interior aprons give ample stacking; a queue would not spill onto the road.
- **scale = false, rail = false, multipleFacilities = false, multiStep = false.**
  No truck scale; no rail spur into the property (the nearest line runs well west
  and does not serve the site); single building.
- **urbanRural = Rural.** Edge-of-town / farmland setting, open fields east and
  south.

## Yard zones & counts

- **perimeter:** 8-vertex ring tracing the chain-link fence line. ~67.1 ac.
- **truckGate:** quad over the controlled NE-corner fence gap.
- **dropYards (2):** north-of-building trailer rows and the east-perimeter row.
- **dockAprons (2):** long thin quads hugging the east and west dock faces.
- **staging:** quad over the striped diagonal pre-gate lane outside the NE gate.
- **streetViewMeta:** perimeter pano `dLzT00mZbY1CE4pzETc4wA` (heading 262);
  truckGate pano `5HwWJZ6FVgOQO7yJKYfCUg` (heading 283). Both 2024-06.
- **yardMetrics:** dockDoorCount 89, trailersVisible ~180, trailerParkingCapacity
  ~220, truckGateCount 1, buildingCount 1, siteAreaAcres 67.1, railServed false.

## Web findings

- Tractor Supply Navarre DC: ~900,000 sq ft, the chain's largest distribution
  center, 89 loading docks; serves TSC's retail network.

## Final confidence

**High.** Building positively identified (chain's flagship Navarre DC); the
fenced yard, NE controlled gate with pre-gate staging lane, and dual-face dock
banks are clearly read in 2024-06 Street View and tight satellite. Lower-
confidence items — exact lane counts and trailer-count estimates — are flagged in
`uncertainFields`.

### 3-line summary
- Gate: TRUE — controlled gap in the continuous chain-link fence at the NE corner with a striped pre-gate staging lane.
- Guard shack: FALSE — no booth in satellite or ~10 Street View frames; remoteGs true (kiosk/app check-in).
- Confidence: HIGH.
