# Deep-Audit Dossier — Home Depot RDC, Pittston Township PA (idx 13)

**Facility:** Home Depot RDC — Pittston Township, PA (DC #5089; co-located with IFC XD09)
**Address:** 300 Enterprise Way, Pittston Township, PA 18640
**Resolved coordinates:** 41.31555, -75.76660
**Confidence:** High

## Location confirmation
Roster supplied 41.314542, -75.769187 (ROOFTOP, moved 1714 m), which landed just
SW of the building in the access-drive/parking area. Probing satellite at zooms
16-20 around that point positively identified the RDC: a single very large
cross-dock distribution building with a dark roof, dock doors and trailers
backed in along both long faces, an attached trailer drop yard on the NE end,
and employee parking on the SW end — all consistent with a Home Depot Rapid
Deployment Center. The building sits inside CenterPoint Commerce & Trade Park in
Pittston Township, surrounded by other large warehouses. Web search confirmed
300 Enterprise Way as the Home Depot Distribution Center / RDC 5089 (also
referenced as RLC 8618 / XD09). Locked center: 41.31555, -75.76660.

## What the imagery showed
- **Wide (z16-17):** Long cross-dock RDC oriented NE-SW, ~370 m long. Perimeter
  road wraps the building. Dense dock-door rhythm with trailers backed in along
  the long NW face and the long SE face. Employee car parking at the SW end;
  trailer drop yard with multiple rows of parked trailers on the NE end.
- **Truck entrance (z19-20):** The truck driveway leaves the public road at the
  SW corner, runs in past the employee parking, and crosses the property line
  into the truck yard. At that inner crossing point a small guard-booth-sized
  structure sits beside the drive — a checkpoint pinch-point. The entrance apron
  is wide with generous paved width.
- **Street View (Nov 2023):** Panos on the public road show the access drive
  curving up to the building; the building's white wall with green dock-area
  trim and trailers is visible at distance. No barrier at the public road — the
  control point is the inner guard booth set back behind the parking.
- **Drop yard (z19):** Large dedicated trailer storage area on the NE end, many
  rows of parked trailers without tractors — 50+ band easily.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Controlled truck entrance at the SW; a clear inner
  checkpoint where the drive crosses into the yard.
- **guardShack = true.** A small 1-2-vehicle-footprint booth is visible at the
  inner gate point beside the drive (z20 imagery). remoteGs = false accordingly.
- **dockDoors = 50+.** Cross-dock RDC with well over 100 dock doors across the
  two long faces; trailers backed in confirm active loading docks.
- **shipRcvSeparate = true.** Receiving on one long face, shipping on the
  opposite — two physically distinct dock banks (cross-dock architecture).
- **dropYard = true / dropArea = 50+.** Dedicated NE trailer drop yard.
- **postGateStaging = true, drivewayLong = true, fastLaneOpportunity = true.**
  Deep, wide paved apron between the inner gate and the docks.

## Yard zones & counts
- Perimeter geofence captures the whole property (~75 acres) including building,
  drop yard, dock aprons, and employee parking.
- dockDoorCount ≈ 150 (estimate across both long faces).
- trailersVisible ≈ 230; trailerParkingCapacity ≈ 320 (drop yard + dock slots).
- buildingCount = 1; truckGateCount = 1; railServed = false (no spur into the
  property — the rail-served line is elsewhere in the park).

## Web findings
SupplierWiki HD DC list confirms RDC 5089 at 300 Enterprise Way. Greater Pittston
Chamber of Commerce and HD careers pages corroborate an active high-volume
supply-chain operation (warehouse-associate hiring). HD designates the
co-located inbound consolidation as IFC XD09.

## Final confidence
High. Building positively identified; cross-dock RDC layout, gate, guard booth,
docks, and drop yard all clearly read from imagery. Lane counts at the gate are
approximate (listed in uncertainFields).
