# GM - Fort Wayne Assembly, Roanoke IN — Deep Audit

**Address:** 12200 Lafayette Center Rd, Roanoke, IN 46783
**Resolved center:** 40.9655, -85.2995
**Type:** Vehicle Assembly Plant (Chevrolet Silverado 1500 / GMC Sierra 1500, GMT T1XX platform)
**Confidence:** High (facility identity); Medium on guard-booth detail.

## Step 0 — Locating the facility
The roster's approximate coordinates (40.923, -85.301) landed in open farmland roughly 5 km south of the plant — the first wide satellite crop showed only fields and ponds. Web research (Wikipedia, GM Authority) gave the published plant coordinates of ~40°58'03"N 85°18'10"W (≈40.9675, -85.3028). A z15 satellite crop there immediately showed the correct facility: a multi-million-square-foot assembly complex with a multi-track auto-rack rail yard along its north edge and vast finished-vehicle storage lots ringing the buildings. Center re-pinned to 40.9655, -85.2995.

Identity confirmed by:
- Scale and form of the building (≈4.6M sq ft under roof; body shops, paint, general assembly, sequence center).
- The auto-rack rail yard on the north property line — the signature of a finished-vehicle assembly plant.
- The acres of marshalling lots filled with finished pickups.
- Former Pontiac Truck & Bus plant, operating since 1986; GM has reinvested heavily (the $632M 2023 announcement) for future truck production.

## What the key views showed
- **Wide (z15):** Whole complex. Rail yard top; main assembly building center/east; storage and parts lots wrapping south and west; I-469/US-24 interchange to the east. Rural/farmland surroundings.
- **North rail crop (z16):** Multiple parallel rail tracks running the full width of the north edge with rail cars present — auto-rack loading. **Rail-served = true, unambiguous.**
- **SW / south entry (z17):** Main admin/employee entrance off Lafayette Center Rd, large employee lots, wide entry aprons crossing grassy setbacks. Road sits well back behind berms.
- **West side (z17):** Perimeter ring road circling the property; large flat-roof building (likely sequence/parts) with truck access; bare-ground material lots.
- **West/SW dock crops (z18-19):** Dock banks with trailers backed in on the SW corner of the building; parts-receiving doors.
- **East crop (z18):** Employee parking, service road, stormwater pond, perimeter road.

## Gate / guard-shack / dock determinations
- **Truck gate (true):** Fully fenced, controlled-access GM campus. A continuous perimeter ring road and fence line enclose the property; truck/material traffic enters from Lafayette Center Rd (south) and a separate west access; finished vehicles leave by rail and truck. Entries are clearly pinch-pointed checkpoints, not open driveways.
- **Guard shack (true, flagged uncertain):** Inferred from GM assembly-plant security standard and the controlled entry geometry. Street View panos all sit on the public highway / ramp behind wide grassy berms and do not penetrate the private drives, so the booth structure itself is not directly resolvable. Listed in `uncertainFields`.
- **remoteGs (false):** Staffed presence assumed at this plant scale.
- **Docks (50+):** Loading docks distributed across multiple building faces plus dedicated parts-receiving banks west/southwest; trailers visibly backed in. Overhead-only estimate (~55 doors).
- **Ship/receive separate (true):** Inbound parts/material docks on the west are physically distinct from finished-vehicle (rail + truck) outbound on the north.

## Yard zones and counts
- **Perimeter:** 7-vertex ring tracing the fenced property — rail yard (N), Lafayette Center Rd / berm (S), storage lots (E/W). ~716 acres (GM published figure).
- **Drop yards:** (1) west-side trailer staging lot; (2) north strip near the rail yard for trailer/rail marshalling.
- **Dock apron:** long thin quad hugging the west dock wall.
- **Truck gate zone:** south entry off Lafayette Center Rd.
- **yardMetrics:** dockDoorCount ~55, trailersVisible ~45, trailerParkingCapacity ~120, truckGateCount 2, buildingCount 4, siteAreaAcres 716, railServed true.

## Street View
No usable ground-level coverage of the gates: all nearby panos are on the public Lafayette Center Rd / I-469 ramp behind grassy berms, facing away from the private drives. `hasCoverage: false` recorded for both perimeter and truckGate.

## Web findings
- Wikipedia "Fort Wayne Assembly": 4.6M sq ft, 716 acres, builds Silverado/Sierra 1500 on GMT T1XX; former Pontiac Truck & Bus; operating since 1986.
- GM Authority / IEDC: ~4,287 employees, 1,300+ trucks/day; $632M 2023 reinvestment for future truck production.
- Rail auto-rack loading on the north edge confirmed in imagery.

## Final confidence
**High** on facility identity, location, rail service, scale, dock band, and drop-yard presence. **Medium** specifically on the guard-booth structure (assumed, not directly imaged) and exact lane/dock counts (overhead estimates). Flagged: scale, entryLanes, exitLanes, dockDoorCount, guardShack.

**Gate verdict:** Truck gate present — fenced controlled-access campus, multiple checkpointed entries.
**Guard-shack verdict:** Likely present (GM standard); not directly imaged, flagged uncertain.
**Confidence:** High.
