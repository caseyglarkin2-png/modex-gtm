# Yard Audit — Walmart Regional DC 4047, Atlanta GA

**Type:** General Merchandise Distribution Center
**Address:** 6500 Trade Water Pkwy SW, Atlanta (Union City), GA
**Resolved center:** 33.7146, -84.6001
**Maps (satellite):** https://www.google.com/maps/@33.7146,-84.6001,400m/data=!3m1!1e3
**Confidence:** medium
**Method:** deep-audit (satellite z14-z20 + Street View)

---

## Location confirmation

The supplied coordinates (33.714103, -84.600675) landed on the north dock wall of
a large white-roofed distribution building inside the dense Fulton County / Union
City logistics corridor SW of Atlanta. Self-corrected the center ~150m SE to the
true building centroid (33.7146, -84.6001).

Web research did not surface a public listing tying "DC 4047" to a precise pin —
the area's best-known Walmart facility is the 1.2M sq ft e-commerce FC on S Fulton
Pkwy, which is a different, much larger building. The building at the supplied
Trade Water Pkwy address is a ~350m-long double-loaded cross-dock DC, consistent
with the named facility and address, so it was audited as the target. The address,
coordinates, and building type all corroborate.

## Key views

- **z14/z15/z16 wide:** confirmed the broader setting — a dense industrial park of
  dozens of large warehouses; the target is one long cross-dock building set back
  against a creek and wooded buffer on its west and south sides.
- **z16/z17 building:** long building running NW-SE (rotated ~10-15° off E-W), with
  a large paved drop yard immediately north, dock faces on both long sides,
  and the office/employee-parking block at the east end where the access road
  arrives.
- **z18/z19 north face + drop yard:** dock doors with trailers backed in along the
  north wall; drop yard holds 40+ trailers in angled rows plus an extra trailer
  strip further north.
- **z18 south face (se):** dock doors with trailers backed in along the south wall
  too — a second, physically separate dock bank.
- **z19/z20 east yard throat:** the access road meets the truck yard as an open
  paved connection; no booth, arm, or gate structure resolved.

## Gate / guard-shack / dock determinations

- **Truck gate — FALSE (uncertain).** A single private access road runs ~0.4 km
  from Trade Water Pkwy through woods into the yard. At the yard mouth
  (33.7144, -84.5993) the entry is an open paved connection: no barrier arm,
  sliding/swing gate, or striped checkpoint pinch-point visible at z19/z20, and
  the 2019-08 and 2025 Street View approaches show open roadway. Chain-link
  perimeter fencing IS present (clearly visible along the south property line in
  Street View pano `_IsxNyII9-4vuVSrnCDIEw`), so the lot is fenced — but the truck
  entrance itself reads as uncontrolled from available imagery. Flagged uncertain:
  a manned gate could sit beyond Street View reach up the private drive.
- **Guard shack — FALSE.** No 1-3-space booth beside the entrance; the only small
  east-end structures are the office / employee-parking block.
- **Remote GS — FALSE.** No confirmed gate, so no remote check-in inferred.
- **Docks — "50+".** Estimated ~70 dock doors across both building faces (north
  face the primary bank). Overhead estimate, banded.
- **Ship/Rcv separate — TRUE.** Double-loaded cross-dock with two distinct dock
  banks on opposite (north and south) building faces.

## Yard zones and counts

- **Perimeter:** 7-vertex oriented ring tracing the fenced property (building +
  north drop yard + east/south truck aprons), ~42.8 acres.
- **Truck gate zone:** small rotated quad at the east yard throat aligned to the
  access drive.
- **Drop yard:** one large oriented quad north of the building (50+ stalls).
- **Dock aprons:** two thin rotated strips, one hugging the north dock wall and one
  hugging the south dock wall, each at the building's true ~10-15° angle.
- **yardMetrics:** dockDoorCount ~70 · trailersVisible ~75 · trailerParkingCapacity
  ~80 · truckGateCount 1 · buildingCount 1 · siteAreaAcres 42.8 · railServed false
  (no rail spur; creek/woods bound the property).

## Street View

- **truckGate:** pano `2dN9RCcL7eUg9FXkF4xlOQ` (2019-08, 33.71428,-84.59835) on the
  private approach road, heading 278° toward the yard mouth — the driver's-arrival
  frame.
- **perimeter:** pano `_IsxNyII9-4vuVSrnCDIEw` (2025-02, 33.71393,-84.59699) on
  Trade Water Pkwy, heading 280° toward the property; shows the perimeter fence
  line.

## Web findings

No facility-specific operational detail (gate procedure, driver reviews) found for
this exact building under "DC 4047". The surrounding corridor is heavy logistics;
the larger Walmart e-commerce FC nearby is a separate property and was not audited.

## Final confidence

**Medium.** Building, perimeter, docks, and drop yard are well-resolved. The gate
verdict is the main uncertainty: imagery shows an open, fenced-but-uncontrolled
truck entrance, but a manned checkpoint could exist up the private drive beyond
Street View coverage — hence truckGate/guardShack/remoteGs flagged uncertain.
