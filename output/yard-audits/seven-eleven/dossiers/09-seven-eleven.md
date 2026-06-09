# Deep-Audit Dossier — 7-Eleven CDC Woodridge IL (E.A. Sween Chicago)

- **Facility:** 7-Eleven Combined Distribution Center Woodridge IL (operated by E.A. Sween)
- **Type:** Combined Distribution Center (fresh-food CDC, multi-tenant unit)
- **Audited address:** 10441 Beaudin Blvd, Unit 200, Woodridge, IL 60517
- **Resolved center:** 41.696970, -88.035200
- **Confidence:** medium
- **Method:** deep-audit (satellite + Street View + web)

## Step 0 — Location confirmation

The supplied coordinates (41.696892, -88.035613) land inside the Internationale
Centre industrial park in Woodridge, just east of I-355. Geocoding the supplied
address `10441 Beaudin Blvd, Woodridge, IL 60517` returns a **ROOFTOP** hit at
41.69684, -88.03532 — squarely on the center distribution building of a row of
three large cross-park warehouses.

Web research shows E.A. Sween operates a Chicago CDC that distributes fresh food
(sandwiches, milk, bread, bakery) to 7-Eleven stores, running a route-delivery
fleet. E.A. Sween's corporate/contact listing also appears at **10350 Argonne
Dr** (#200/#500) in the same park, ~1.5 km east. The "Unit 200" on the supplied
Beaudin address indicates E.A. Sween occupies one unit/bay of a **multi-tenant**
spec warehouse. I audited the building the supplied address pins (the Beaudin
center building), per the task. It is a genuine distribution warehouse
consistent with the facility type — not an office.

Building footprint measured from a centered z17 frame: ~37 m wide x ~114 m long,
oriented NNW-SSE (rotated ~25° clockwise from north). Single east-facing dock
bank; office and employee parking on the west and south; truck court on the east
shared with the neighboring (east) warehouse.

## Key views

- **z16/z17 wide:** three large warehouses in a row off I-355; center building
  is the target. Dense industrial fabric all around — Urban.
- **z18/z20 center building:** confirms NNW-SSE building, dock apron strip on the
  east wall, car parking lined with trees on the west drive.
- **z20 dock face (N & S halves):** the center unit's own east dock bank shows a
  concrete apron with light trailer presence at capture; the heavily-docked
  trailer rows visible across the court belong to the **neighboring east
  building**, not this unit.
- **Street View, south driveway throat (2025-05):** the entrance from Beaudin
  Blvd into the shared court is a **wide open driveway** — no barrier arm, no
  gate, no booth at the public road. Enter/exit through the same opening.
- **Street View, inside court / parking edge (2022-10):** an ornamental steel
  **fence with a gate** separates the employee parking lot from the dock
  truck-yard (a SWIFT trailer sits behind it). This is an **internal yard
  fence**, not a road-edge controlled truck gate.

## Gate / guard-shack / dock determinations

- **truckGate = false.** The truck approach from Beaudin Blvd is an open,
  uncontrolled driveway into a shared court. No barrier, no checkpoint pinch at
  the public road (2025-05 Street View).
- **guardShack = false.** No staffed booth at any entrance to this unit's yard.
- **remoteGs = false.** No controlled truck gate at the road, so no kiosk/app
  check-in is implied. (Note the *internal* fence gate exists, but it is not a
  road-edge truck checkpoint.)
- **dockDoors = "10-25".** Single east-facing dock bank along the ~114 m wall;
  estimated ~18 doors. Low-confidence count — flagged.

## Yard zones and counts

- **perimeter:** 7-vertex oriented ring tracing the building plus its west
  parking drive and its share of the east truck court, bounded by the perimeter
  drives. Area ≈ **3.42 acres**.
- **truckGate zone:** the open driveway throat where the court meets Beaudin Blvd
  (oriented to the entrance drive).
- **dockApron:** one long thin quad hugging the east dock wall at the building's
  ~25° angle.
- **dropYards:** none dedicated for this unit (`[]`).
- **staging:** null (no distinct pre-/post-gate stall area for this unit beyond
  the open court).
- **yardMetrics:** dockDoorCount ~18, trailersVisible ~4 (this unit's docks),
  trailerParkingCapacity ~12, truckGateCount 1, buildingCount 1, 3.42 acres,
  railServed false.

## Street View metadata

- **perimeter** centroid (41.696907, -88.035274): pano `P_sr0uUyx6xtCZxHzek5Hw`
  (2022-10), heading **93°** toward the building. hasCoverage true.
- **truckGate** centroid (41.696303, -88.034821): pano `yibpTTpnOOToUOQelGptWw`
  (2022-10), heading **277°** toward the gate area. hasCoverage true.

## Web findings

- E.A. Sween Company runs EAS Combined Distribution Centers; the Chicago CDC
  serves 7-Eleven (and others) with a route-delivery fleet, 365 days/year.
- Multi-tenant park; E.A. Sween's address carries a unit number (Unit 200),
  consistent with occupying part of a spec building rather than a standalone DC.
- Corporate/contact listing also at 10350 Argonne Dr in the same park.

## Final confidence

**Medium.** The building is positively identified and the gate/guard-shack calls
are clear and high-confidence (open uncontrolled driveway, no booth). Confidence
is held at medium because this is a **multi-tenant** unit: exact dock-door count
for E.A. Sween's specific bay, drop capacity, and where this unit's footprint
ends vs. neighboring tenants cannot be pinned precisely from overhead imagery.
Those counts are flagged in `uncertainFields`.
