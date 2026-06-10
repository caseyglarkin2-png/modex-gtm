# Deep-Audit Dossier — NFI Cross-Dock Bethlehem PA (idx 3)

- **Facility:** NFI Cross-Dock Bethlehem PA (NFI Industries / NFI - Cal Cartage)
- **Type:** Cross-Dock
- **Address:** 3051 Commerce Center Blvd, Bethlehem, PA 18015
- **Resolved center:** 40.6074017, -75.3243256
- **Method:** deep-audit (satellite probe + Street View + web)
- **Confidence:** high

## Location confirmation (Step 0)

The supplied approximate coords (40.608848, -75.324584) landed inside the
**Majestic Bethlehem Center** big-box industrial park (built on the former
Bethlehem Steel land in South Bethlehem), between several large distribution
buildings. Web research resolved the exact address: 3051 Commerce Center Blvd =
**Majestic Bethlehem Center Building 1B**, a ~538,650 sf Class-A
warehouse/distribution building on a ~24-acre lot, **78 dock-high doors**,
36' clear, with a guard house. It is operated by **NFI - Cal Cartage** (the
geocode 40.6074017,-75.3243256 returns "NFI - Cal Cartage, 3051 Commerce Center
Blvd"). Some stale directory listings mislabel the entrance "Lowe's DC" — the
current operator at the address is NFI.

The park contains multiple neighbors (Walmart DC at 3215, Lowe's, others), so I
specifically locked onto the building whose main entrance and central truck
court sit at the geocode. That building is the east structure of the central
pair, with dock doors facing the shared central court.

## Key views

- **Wide z15/z16 context** — confirmed a multi-building DC park, the NFI parcel
  is the center-right big-box with a shared central truck court on its west side
  and an east perimeter dock drive.
- **z18/z19 central corridor** — dock doors with trailers backed in on BOTH
  walls of the central court (NFI's west face + the neighbor building's east
  face). A small structure sits on a median island mid-court.
- **z20 gatehouse (40.60855,-75.32475)** — decisive: a small (~1-2 vehicle
  footprint) **guard booth** on a median island that splits the truck lane into
  an in-lane and out-lane, flanked by landscaped islands forming a pinch-point,
  with perimeter chain-link fence. A vehicle is parked at the booth.
- **Street View (2021-09)** — the entry driveway off Commerce Center Blvd with a
  monument sign and visitor parking; a road-level frame across the perimeter
  fence shows the fenced court, trailers ("LTL Logistics" markings) and the
  gatehouse behind the fence.
- **z18 south (40.6066,-75.3236)** — a large unpaved **gravel drop yard**
  packed with 60-80 parked trailers, bounded south by a ravine/tree line, with a
  separate **rail yard** (multiple tracks + rail cars) beyond.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Fenced central truck court entered from Commerce Center
  Blvd; a gatehouse on a median island creates a controlled checkpoint with
  separate in/out lanes. Open driveway control is clearly present.
- **guardShack = true.** Staffed booth on the median (multi-side windows,
  vehicle parked at it); corroborated by the listing's "guard house with
  restroom." remoteGs = false accordingly.
- **postGateStaging = true / drivewayLong = true.** The court between the gate
  and the dock faces runs ~300 m and holds a deep truck queue inside the fence.
- **fastLaneOpportunity = true.** The court and approach are wide enough (double
  lanes around the median booth) to add an express/bypass lane.
- **dockDoors = "50+".** Listing = 78 doors; satellite shows dense dock rhythm
  with trailers backed in on the west (court) face plus an east-face bank.
- **dropArea = "50+" / dropYard = true.** Dedicated gravel trailer-storage lot
  south of the perimeter road, 60-80 trailers, distinct from court staging.
- **entryExitTogether = true, entryLanes 1 / exitLanes 1** at the single
  gatehouse split.

## Yard zones & counts measured

- **perimeter** — 7-vertex oriented ring tracing the leased Bldg-1B parcel
  (building body + central-court frontage + east drive + south parking + south
  gravel drop yard), rotated ~20° to match the building's NNW-SSE long axis.
- **truckGate** — tight quad around the median gatehouse pinch-point.
- **dockAprons[]** — two long thin quads: the west dock face along the central
  court and the east-face dock bank, each at the building's angle.
- **dropYards[]** — one ring over the south gravel trailer-storage lot.
- **staging** — court strip between the gatehouse and the dock faces.
- **yardMetrics:** dockDoorCount 78, trailersVisible ~95, capacity ~130,
  truckGateCount 1, buildingCount 1, siteAreaAcres ~24, railServed false.

## Street View coverage

All three traced zones have Street View panos (captured 2021-09):
- perimeter → pano `K9ZwPR-rxYjIYW3GM6rIqg`, heading 87°
- truckGate → pano `sJU29OkVMO1mfD_IUCv4CA`, heading 267° (best driver-arrival frame, looking across the fence at the gatehouse)
- dropYards → pano `Lwj0h0bHB_OnJcRZxHb_qg`, heading 172°

## Web findings

- LoopNet / Majestic Realty / CommercialCafe: 3051 Commerce Center Blvd =
  Majestic Bethlehem Center Bldg 1B, ~536-538k sf, 78 dock doors, 36' clear,
  ~24-acre lot, guard house with restroom.
- Operator: NFI - Cal Cartage (NFI Industries 3PL).

## Uncertainty

- **shipRcvSeparate** left false but flagged: docks exist on both the west court
  face and the east face, but overhead imagery can't confirm they run as
  physically separate ship-vs-receive clusters.
- **trailerParkingCapacity** (~130) is an overhead estimate.
- **railServed = false:** the south rail yard is legacy/regional infrastructure
  separated by a ravine, not a private spur into the NFI docks.

**Final confidence: high.** Facility positively identified; gate and guard shack
unambiguous on z20 satellite; dock and drop-yard counts well supported by
imagery and the leasing listing.
