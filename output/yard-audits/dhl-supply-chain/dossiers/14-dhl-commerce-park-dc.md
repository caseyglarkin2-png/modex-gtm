# DHL Supply Chain — DHL Commerce Park DC, St. George SC (idx 14)

## Location confirmed
- **Park:** DHL Commerce Park, Winding Woods Road off US-78, St. George, SC 29477
- **Audited building:** DHL Commerce Park **Building A**, 4826 Hwy 78, Saint George, SC 29477
- **Resolved center:** 33.177800, -80.535000
- **Confirmation:** DHL Commerce Park is a planned **125-acre, three-building, 1.7M sq ft** $100M campus near St. George serving the Port of Charleston (DHL Group press release 2019; Post and Courier; SC Governor's office). The roster's GEOMETRIC_CENTER coord (33.183087, -80.52853) landed ~700 m NE on an unrelated industrial / aggregate yard — **not** the DHL facility. Web search surfaced "DHL Commerce Park Building A" at 4826 Hwy 78 (CommercialCafe; LoopNet — ~978,805 sq ft, ~74.91-acre lot, Class A, 420 parking spaces). Satellite at that address shows a large finished cross-dock distribution building consistent with the listing. Center corrected to Building A.

## Site / building status — IMPORTANT
Only **one** of the three planned buildings is built. Building A exists; the rest of the 125-acre park is graded/cleared land (future Buildings B and C). Building A appears **largely vacant**: the SW dock face shows a long row of empty marked trailer stalls and almost no trailers anywhere on site. LoopNet lists 4826 Hwy 78 as available for lease — consistent with an empty/marketed building. `multipleFacilities` is therefore false (only one building on the developed parcel).

## Key views
- **Wide (z14/z15/z16):** Large rectangular cross-dock DC set in cleared land amid pine forest. Retention ponds on the E/SE. Access road from Hwy 78 to the SW. Surrounding land graded but undeveloped.
- **SW dock face (z18/z19):** Continuous dock-door bank with a long row of empty marked trailer drop stalls in front.
- **NE dock face (z19):** Second continuous dock-door bank with apron.
- **E corner (z18/z20):** Employee parking lot; access road curves up into the yard.
- **Street View (Hwy 78, 2025-10):** Building A visible across a wide undeveloped field; a roadside leasing/development sign ("SW...") at the access-road entrance. No gate or booth visible from the road.

## Gate / guard-shack / dock determinations
- **truckGate: false** — No barrier arm, sliding gate, or guard-booth checkpoint identified. A single access road runs from Hwy 78 into the truck yard with no controlled pinch-point. **Flagged uncertain** — the building is vacant (any installed gate could be open/undeployed) and imagery resolution limits a definitive call.
- **guardShack: false** — No guard booth visible anywhere.
- **remoteGs: false** — No gate identified (flagged uncertain alongside truckGate).
- **dockDoors: 50+** — Cross-dock building (~979k sq ft) with continuous dock banks on both the SW and NE long faces; estimated ~110 doors.
- **dropArea: 0-10 / dropYard: true** — A dedicated marked trailer-storage area runs along the SW dock apron, but it is essentially empty (building vacant), so trailers actually parked = 0-10.
- **shipRcvSeparate: true** — Docks on two distinct faces (SW and NE).

## Yard zones and counts
- **Perimeter:** ~590 m × ~373 m developed footprint; the Building A parcel is ~**75 acres** (LoopNet 74.91 ac). Full DHL Commerce Park is 125 acres including unbuilt pads.
- **Dock aprons:** two — SW and NE.
- **Drop yard:** one, along the SW apron (currently empty).
- **dockDoorCount ~110, trailersVisible ~3, trailerParkingCapacity ~90, truckGateCount 1, buildingCount 1, railServed false.**

## Web findings
DHL Supply Chain announced DHL Commerce Park in 2019 — a $100M, 125-acre, three-building, 1.7M sq ft distribution park in Dorchester County, SC, to serve the growing Port of Charleston (~450 jobs). Building A (4826 Hwy 78) is built and currently listed for lease.

## Final confidence: medium
The facility was correctly re-identified (roster coord was off by ~700 m) and the building is unambiguously DHL Commerce Park Building A. Layout (cross-dock, two dock faces, drop yard) is clear. Confidence is **medium** because: (1) the building is vacant, so gate/operational features cannot be confirmed in use; (2) only 1 of 3 planned buildings exists; (3) the gate determination is limited by resolution. All flagged in uncertainFields and the dossier.
