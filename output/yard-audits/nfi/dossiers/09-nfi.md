# Deep-Audit Dossier — NFI Distribution Center, Moreno Valley CA (idx 09)

- **Account:** NFI Industries
- **Facility:** NFI Distribution Center Moreno Valley CA
- **Type:** Distribution Center
- **Address:** 24385 Nandina Ave, Moreno Valley, CA 92551
- **Resolved center:** 33.86465, -117.23858
- **Confidence:** medium
- **Method:** deep-audit (satellite + Street View, 2026-02 imagery)

## Step 0 — Facility confirmation

The approximate point landed in the dense Inland Empire industrial fabric south
of March ARB / the Meridian business park (Moreno Valley). The LoopNet listing
for 24385 Nandina Ave — a Class-A cross-dock with 224 dock-high doors and 653
trailer stalls — pins the building. Satellite (z18) shows a single large
screen-walled distribution building with interior truck courts on the north and
south faces, consistent with the spec. Locked center ~33.86465, -117.23858.

## Key views

- **z18 overview:** one large rectangular building filling most of the frame,
  screen-walled / landscaped office faces on the north (Nandina) and east public
  frontages; truck operations are interior, entered through a defined opening in
  the north screen wall.
- **z20 dock courts:** continuous dock lines read on BOTH the north and south
  building faces — a true cross-dock. Both courts hold deep paved aprons and
  rows of parked trailers.
- **z20 truck entrance (~33.8660, -117.2385):** a controlled opening in the
  north screen wall off Nandina Ave; the throat is wide (estimated ~2 lanes each
  way). No barrier arm resolvable at the public road line in Feb-2026 imagery.
- **Street View (entrance + perimeter):** screen-walled office frontages, not
  open gated truck lanes; the truck opening sits back from the road.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Property is fully fenced / screen-walled; the truck dock
  courts are interior and reached through a single defined opening in the north
  screen wall — a controlled pinch-point. Flagged uncertain (no barrier arm
  visible at the road line, but access is plainly controlled). `truckGateCount: 1`.
- **guardShack = false.** No standalone 1-3-stall staffed booth visible at the
  truck entrance in z20 satellite or Street View. The two public frontages are
  landscaped office faces with screen walls.
- **remoteGs = true.** Controlled truck entrance with no booth structure implies
  kiosk / app / remote check-in, typical of a modern Class-A spec cross-dock.
- **entryExitTogether = true; entryLanes 2 / exitLanes 2.** Entry and exit share
  the north opening; lane counts estimated from the throat width (flagged).
- **dockDoors = 50+ (224).** LoopNet states 224 dock-high doors; confirmed
  visually as continuous dock lines on the N and S faces.
- **dropArea = 50+; dropYard = true.** LoopNet states 653 trailer stalls; large
  drop yards on the south/southwest and north courts full of parked trailers.
- **shipRcvSeparate = true.** True cross-dock — dock banks on opposite (N and S)
  building faces.
- **postGateStaging = true; drivewayLong = true; fastLaneOpportunity = true.**
  Deep interior aprons in both courts give ample holding; wide drive lanes
  wrapping the building leave room for a bypass/express lane.
- **scale = false, rail = false, multipleFacilities = false, multiStep = false.**
  No truck scale, no rail spur, single building, no second checkpoint stage.
- **urbanRural = Urban.** Dense Inland Empire industrial fabric adjacent to
  March ARB / Meridian business park, Moreno Valley metro.
- **backupSensitive = false.** Interior courts provide deep stacking room.

## Yard zones & counts

- **perimeter:** 8-vertex ring tracing the screen-walled property edge. ~57.8 ac.
- **truckGate:** quad over the controlled north opening off Nandina Ave.
- **dropYards (2):** south court trailer rows and the north court rows.
- **dockAprons (2):** long thin quads hugging the north and south dock faces.
- **streetViewMeta:** perimeter pano `5r3YRjxfMxN_v6R4Xgh50A` (heading 178);
  truckGate pano `EWLTXQ393YrwRnPLrc9l4A` (heading 198). Both 2026-02.
- **yardMetrics:** dockDoorCount 224, trailersVisible ~180, trailerParkingCapacity
  653, truckGateCount 1, buildingCount 1, siteAreaAcres 57.8, railServed false.

## Web findings

- 24385 Nandina Ave: Class-A cross-dock, 224 dock-high doors, 653 trailer
  stalls (LoopNet). Operated by NFI per the account brief.

## Final confidence

**Medium.** Building positively identified via the LoopNet spec and the
N/S cross-dock layout. Gate type (controlled screen-wall opening, no booth) and
exact lane counts are the lower-confidence items, flagged in `uncertainFields`.

### 3-line summary
- Gate: TRUE — controlled opening in the north screen wall off Nandina Ave; no barrier arm visible at the road.
- Guard shack: FALSE — no staffed booth; controlled access => remoteGs true (kiosk/app check-in).
- Confidence: MEDIUM.
