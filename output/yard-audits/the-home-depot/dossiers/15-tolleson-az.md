# Deep-Audit Dossier — Home Depot RDC, Tolleson AZ (idx 15)

**Facility:** Home Depot RDC — Tolleson, AZ (DC #5643)
**Address:** 9081 W Washington St, Tolleson, AZ 85353
**Resolved coordinates:** 33.44480, -112.25300
**Confidence:** High

## Location confirmation
Roster supplied 33.445211, -112.25435 (ROOFTOP, moved 1320 m), which landed near
the NW corner of the RDC. Probing satellite at zooms 15-20 confirmed a single
large E-W cross-dock distribution building with dock doors and dense trailer
rows on its south face, a residential subdivision directly to the north, and an
office/employee-parking frontage. Web search confirmed 9081 W Washington St as
Home Depot RDC #5643 (also referenced via a W Jefferson St entrance), open 24 h
Mon-Fri. Locked center: 33.44480, -112.25300.

## What the imagery showed
- **Wide (z15-16):** Long E-W RDC building. Dense dock-door rhythm with trailers
  backed in along the long south face. A large trailer drop yard with many rows
  of parked trailers extends south of the building. An **E-W rail line runs
  through the property**, immediately south of the trailer drop yard.
- **Setting:** Residential subdivisions abut the property to the north; the
  surrounding area is dense Phoenix-metro industrial/residential fabric — Urban.
- **Truck side (z18-20):** Truck yard entrance at the SW/W corner off the road.
  Employee parking and office front; the gated truck yard is to the side/rear.
- **Street View (Jul 2024):** Pano on S 91st Ave shows the RDC building (office
  front) on the east side of the road; truck operations are on the fenced yard
  side.
- **Drop yard (z19):** Many rows of parked trailers on the south side; the rail
  line and a secondary parking area lie just beyond — 50+ band.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Controlled, gated truck-yard entrance. Driver reviews
  explicitly describe checking in at a gate.
- **guardShack = true.** Web driver reviews directly state "friendly staff at
  the guard shack" and report waits of "over an hour to enter" — a staffed guard
  booth with heavy check-in queuing. remoteGs = false accordingly.
- **backupSensitive = true.** Reviews of 1+ hour gate waits, with the gate close
  to public roads and limited stacking room, mean a truck queue spills toward
  the road. preGateStaging = true (drivers wait outside the gate).
- **dockDoors = 50+.** Cross-dock RDC with well over 100 dock doors; trailers
  backed in confirm active docks.
- **dropYard = true / dropArea = 50+.** Dedicated trailer drop yard on the south.
- **railServed = true.** A rail line runs E-W through the property south of the
  drop yard.
- **shipRcvSeparate = uncertain.** Most dock activity reads on the south face;
  separate ship/receive banks not clearly confirmed — flagged.

## Yard zones & counts
- Perimeter geofence captures the property (~55 acres): building, south dock
  apron, south trailer drop yard, and employee parking.
- dockDoorCount ≈ 130 (estimate).
- trailersVisible ≈ 240; trailerParkingCapacity ≈ 330.
- buildingCount = 1; truckGateCount = 1; railServed = true.

## Web findings
SupplierWiki HD DC list confirms RDC #5643 at 9081 W Washington St, Tolleson.
Multiple driver-facing review sites (3.9-star, ~192 reviews) corroborate a
staffed guard shack and notable gate-wait pain — a strong, on-point YardFlow
signal: this facility's drivers are explicitly complaining about gate dwell.
Open 24 h Mon-Fri, closed weekends.

## Final confidence
High. Building positively identified and corroborated by web sources. Gate and
guard shack are independently confirmed by driver reviews, which also flag a
real gate-throughput problem. Gate lane counts and ship/receive separation are
approximate (listed in uncertainFields).
