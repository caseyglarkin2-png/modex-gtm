# DHL Supply Chain — Keurig DC, Union City GA (idx 12)

## Location confirmed
- **Address:** 6000 Studio Way, Union City, GA 30291
- **Resolved center:** 33.572741, -84.534200 (building is long E-W; roster coord 33.572741,-84.535507 landed near the W end, center adjusted east)
- **Confirmation:** Web search confirms "DHL Supply Chain (Keurig)" at 6000 Studio Way, Union City GA 30291 (Waze, Nextdoor, Loc8NearMe, Foursquare; phone 678-561-9698). Satellite shows a single very large cross-dock distribution building consistent with a dedicated beverage DC.

## Key views
- **Wide (z16/z17):** Large rectangular cross-dock DC running E-W (~440 m long). Dock doors with trailers backed in along the full N face and full S face. Drop-yard trailer rows on the S side. Employee parking lot at the SW corner. Wooded buffers on N, E, and partly S; I-85 corridor to the SE.
- **Dock faces (z20):** Dense rows of trailers backed into doors on both N and S faces. Drop/parking rows of trailers in the S yard.
- **W end (z19/z20):** Office face with employee/visitor parking; access road enters from Studio Way at the SW.
- **Street View (2019-07, 2025-04, 2025-10):** W/SW office face fronts car parking. A "DEAD END / NO TRACTOR TRAILERS BEYOND THIS POINT" sign marks the visitor side. Looking down the access drive (2025-10 capture) there is a chain-link perimeter fence and a gate where the truck drive crosses into the dock yard. The N and S roads (Studio Way continuation) are screened by deep wooded buffers — the dock yards are set far back.

## Gate / guard-shack / dock determinations
- **truckGate: true** — Chain-link perimeter fence separates the office/car-parking area from the truck yard; a gate sits across the truck access drive at the fence line. The "NO TRACTOR TRAILERS BEYOND THIS POINT" sign confirms truck traffic is funneled through the controlled gate, separate from visitor traffic.
- **guardShack: false / remoteGs: true** — No large multi-window staffed guard booth is visible at the gate in any Street View capture; the gate structure is small. Classified as a gated entry with remote/kiosk check-in. **Medium-confidence** call — flagged in uncertainFields (gate structure small and partly tree-obscured).
- **dockDoors: 50+** — Cross-dock building with continuous dock-door banks the full ~440 m length of both the N and S faces; dense trailers backed in on both. Estimated ~120 total doors.
- **dropArea: 50+ / dropYard: true** — Marked trailer-storage rows in the S yard hold many trailers without tractors.
- **shipRcvSeparate: true** — Two distinct dock banks on different building faces (N and S).

## Yard zones and counts
- **Perimeter:** ~411 m N-S × ~533 m E-W ≈ **54 acres** (includes wooded buffers).
- **Truck gate:** boxed at the SW access point.
- **Dock aprons:** two — full-length N apron and full-length S apron.
- **Drop yard:** one large trailer-storage zone along the S side.
- **dockDoorCount ~120, trailersVisible ~90, trailerParkingCapacity ~110, truckGateCount 1, buildingCount 1, railServed false.**

## Web findings
DHL Supply Chain operates this as a dedicated distribution/logistics hub for Keurig in the Atlanta region (Fulton County, Atlanta MSA). Listed across multiple business directories as "DHL Supply Chain (Keurig)" — a warehouse / distribution / shipping facility.

## Final confidence: high
Facility unambiguously identified and address corroborated; imagery clear. The truckGate call is well-supported by Street View. The guardShack/remoteGs split is the one medium-confidence area (small gate structure) and is flagged; overall site confidence remains high.
