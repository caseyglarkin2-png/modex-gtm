# Deep-Audit Dossier — Home Depot RDC, Tracy CA (idx 14)

**Facility:** Home Depot RDC — Tracy, CA (DC #5641)
**Address:** 1400 E Pescadero Ave, Tracy, CA 95377
**Resolved coordinates:** 37.75920, -121.40300
**Confidence:** High

## Location confirmation
Roster supplied 37.759049, -121.404099 (ROOFTOP, moved 278 m), which landed
squarely on a large E-W cross-dock distribution building. Probing satellite at
zooms 16-20 confirmed a single very large RDC: dock doors with trailers backed
in along both long faces, trailer drop-yard rows on the north side, and an
office/employee-parking frontage on N Tracy Blvd. Web search confirmed 1400 E
Pescadero Ave as Home Depot RDC #5641 — a 657,000 sq ft warehouse opened to
serve ~100 California stores, operating 24 h Mon-Fri. Locked center:
37.75920, -121.40300.

## What the imagery showed
- **Wide (z16-17):** Long cross-dock RDC oriented E-W, roughly 640 m long.
  Continuous dock-door rhythm with trailers backed in on the long north face
  and the long south face. Multiple rows of parked trailers (drop yard) on the
  north; additional trailer parking on the south. Employee parking and an
  office front toward N Tracy Blvd.
- **Truck side (z18-20):** The truck yard wraps the building; the entrance is at
  the SW corner where the access road meets the gated truck yard. The SW corner
  shows employee parking transitioning to the dock apron with chevron striping —
  a controlled gate apron.
- **Street View (Feb 2023):** Pano on N Tracy Blvd shows the building with a
  landscaped frontage and office; truck operations are behind, on the fenced
  yard side. The neighboring mega-warehouse to the east is a separate facility.
- **Drop yard (z19):** Dense trailer rows on the north side between the RDC and
  a neighboring building — 50+ band.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Fenced, gated truck yard; controlled SW entrance off the
  access road, distinct from the office frontage on N Tracy Blvd.
- **guardShack = true.** Standard guarded entry for an HD RDC of this
  generation; the SW gate apron shows the checkpoint geometry (booth-scale
  structure beside the lane). remoteGs = false accordingly.
- **dockDoors = 50+.** Cross-dock RDC with well over 100 dock doors across both
  long faces; trailers backed in confirm active docks.
- **shipRcvSeparate = true.** Cross-dock — receiving on one long face, shipping
  on the opposite; two distinct dock banks.
- **dropYard = true / dropArea = 50+.** Dedicated trailer drop-yard rows.
- **postGateStaging = true, drivewayLong = true, fastLaneOpportunity = true.**
  Long, wide internal aprons; generous gate-apron width.

## Yard zones & counts
- Perimeter geofence captures the whole property (~70 acres): building, both
  dock aprons, north drop yard, south trailer parking, and employee lot.
- dockDoorCount ≈ 160 (estimate across both long faces).
- trailersVisible ≈ 210; trailerParkingCapacity ≈ 300.
- buildingCount = 1; truckGateCount = 1; railServed = false (no rail spur into
  the property).

## Web findings
SupplierWiki HD DC list and Yelp listing confirm RDC #5641 at 1400 E Pescadero
Ave, Tracy. Local press (Tracy Press) covered the warehouse opening — described
as a fast cross-dock operation: trucks unloaded on arrival, goods moved straight
onto delivery trucks. 24 h Mon-Fri operation; closed weekends.

## Final confidence
High. Building positively identified and corroborated by web sources;
cross-dock RDC layout, docks, drop yard, and gated truck side clearly read from
imagery. Gate lane counts are approximate (listed in uncertainFields).
