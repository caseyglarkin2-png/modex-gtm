# Deep-Audit Dossier — NFI Distribution Center, Breinigsville PA (idx 01)

- **Account:** NFI Industries
- **Facility:** NFI Distribution Center Breinigsville PA
- **Type:** Distribution Center
- **Address:** 200 Nestle Way, Breinigsville, PA 18031
- **Resolved center:** 40.56790, -75.63500
- **Confidence:** high
- **Method:** deep-audit (satellite + Street View, 2025-05 imagery)

## Step 0 — Facility confirmation

The supplied coordinates (40.567597, -75.636086) landed on the south wall of a
long white-roofed industrial building inside a dense Lehigh Valley industrial
park (Breinigsville / Upper Macungie Twp). Web research confirms 200 Nestle Way
is an NFI Industries distribution center: 384,500 SF, built 2021, 36 ft clear,
off I-78 Exit 49 (NFI facility profile PDF; LoopNet; bippermedia listing).

Positive building ID was clinched in Street View: looking west into the truck
entrance off Nestle Way (pano `eK1Ypep7U5qFhimzTfVzJw`, panos along the road),
the building face carries the blue **"NFI"** logo and NFI-blue accent panels.
The same blue/white NFI building is seen from the south perimeter road (pano
`8e6EvxSowR8LTYuOqkemJw`). This is the correct building, not an office or
neighbor. Locked center ~40.56790, -75.63500.

## Key views

- **z18 overview (40.5682,-75.6348):** single building filling ~60% of frame,
  long axis E-W with a slight rotation (east end dips south). Dock face is the
  **north** side (dark band with backed-in trailers); south side is a solid
  wall with a landscaped berm. North yard holds a stormwater pond and diagonal
  trailer-parking rows.
- **z19/z20 dock band (north face):** continuous regular dock-door rhythm with
  several trailers backed in along the full ~700 ft north wall. Dock leveler
  rhythm consistent with a 50+ door bank.
- **z19 east end (40.5680,-75.6330):** the dock bank wraps the NE corner and a
  **separate angled dock/trailer cluster sits on the building's EAST face**,
  with an employee car lot to its south — evidence for physically separate
  ship/receive clusters.
- **z21 gate (40.56848,-75.63258):** the truck entrance off Nestle Way is a
  **divided drive with TWO yellow/black barrier arms** (one over the inbound
  lane, one over the outbound), split by a landscaped median, plus a tall
  light/camera pole. No guard-booth footprint beside the lanes.
- **Street View (entrance, heading 250-270):** divided entry drive runs deep
  toward the docks; barrier arms set back from the road; NFI building visible
  ahead. No staffed booth.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Two striped barrier arms across a divided in/out drive
  at the SE corner where the property meets Nestle Way; clear controlled
  checkpoint. Single gate location (`truckGateCount: 1`).
- **guardShack = false; remoteGs = true.** No 1-3-space staffed booth is visible
  at the gate in satellite or Street View. The automated arms imply a kiosk /
  call-box / app check-in — remote guard service.
- **Entry/exit:** one divided entrance throat with split lanes (1 in, 1 out), so
  both `entryExitTogether` and `entryExitSeparate` are false (it is neither two
  separate property-edge gates nor a single shared lane). `entryLanes: 1`,
  `exitLanes: 1`.
- **drivewayLong = true; postGateStaging = true.** ~120 m of divided drive plus a
  large interior apron between the gate and the north dock face hold 3+ trucks.
- **dockDoors = 50+.** Single continuous north-face dock bank (~700 ft) plus the
  east-end cluster; ~70 doors estimated from overhead (flagged low-confidence).
- **dropArea = 25-50; dropYard = true.** Three diagonal trailer-storage rows in
  the north and east yard, separate from active dock staging.
- **shipRcvSeparate = true (medium conf.).** North dock bank + distinct east-face
  dock/trailer cluster read as two physically separate dock clusters.
- **scale = false, rail = false, multipleFacilities = false, multiStep = false.**
  No truck scale, no rail spur, single building, no second checkpoint stage.
- **urbanRural = Rural.** Edge-of-town industrial park ringed by farmland, woods,
  a pond, and a residential subdivision; Rural per the tie-break rule.
- **backupSensitive = false.** Deep divided drive + interior apron give ample
  stacking; a queue would not spill onto Nestle Way.
- **fastLaneOpportunity = false.** Single in / single out; no obvious unused
  paved width for an express bypass at the gate.

## Yard zones & counts

- **perimeter:** 5-vertex ring tracing the fence line — north dock yard
  (incl. pond margin) down the east gate apron to the employee lot, across the
  south berm road. ~22.5 acres.
- **truckGate:** rotated quad over the divided entrance throat at the SE corner.
- **dropYards (3):** north-west diagonal row, north-central diagonal row near the
  pond, and the east-end angled cluster.
- **dockAprons (1):** long thin quad hugging the north dock wall at the building's
  E-W angle.
- **streetViewMeta:** truckGate pano `eK1Ypep7U5qFhimzTfVzJw` (heading 270, into
  the entrance); perimeter pano `8e6EvxSowR8LTYuOqkemJw` (heading 10, north
  toward the south building face). Both 2025-05.
- **yardMetrics:** dockDoorCount ~70, trailersVisible ~28, trailerParkingCapacity
  ~90, truckGateCount 1, buildingCount 1, siteAreaAcres 22.5, railServed false.

## Web findings

- 200 Nestle Way: NFI Industries DC, 384,500 SF, built 2021, 36 ft clear height,
  off I-78 Exit 49 near I-476 (NFI facility-profile PDF, LoopNet).
- NFI has multiple Lehigh Valley sites (e.g., 910 Nestle Way, 254,000 SF) —
  this audit is scoped to the 200 Nestle Way building only.
- Listed/operated by NFI; the street name reflects the park's Nestlé-water DC
  heritage. Treated as NFI's operation per the brief.

## Final confidence

**High.** Building positively identified by NFI branding in Street View and the
NFI facility address. Gate (two barrier arms, no booth) and dock face (north +
east clusters) are clearly read. Lower-confidence items — exact door count,
trailer capacity, and ship/receive separation — are flagged in `uncertainFields`.

### 3-line summary
- Gate: TRUE — divided in/out drive with two yellow/black barrier arms off Nestle Way (SE corner).
- Guard shack: FALSE — no staffed booth; automated arms => remoteGs true (kiosk/app check-in).
- Confidence: HIGH.
