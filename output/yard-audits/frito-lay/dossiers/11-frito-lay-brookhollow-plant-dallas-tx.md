# Deep-Audit Dossier — Frito-Lay Brookhollow Plant, Dallas TX (idx 11)

## Resolved location
- **Roster address was wrong.** Roster listed "1500 N Cockrell Hill Rd, Dallas, TX 75211" with
  geocoded coords 32.762606, -96.894419 — that point is a generic SW-Dallas industrial park
  with no Frito-Lay plant.
- **Correct address: 1141 Regal Row, Dallas, TX 75247** — confirmed by PotatoPro
  ("Frito Lay - Brookhollow (Dallas)"), Waze ("Frito-Lay Brookhollow, 1141 Regal Row"),
  Yellowpages and Superpages.
- **Locked center: 32.82925, -96.88540** — the large manufacturing building in the
  Brookhollow / Stemmons (I-35E) industrial corridor, NW Dallas near Love Field.
- **Positive ID:** 2024/2025 Street View shows a red Frito-Lay wall sign on the east face of
  the building, plus a row of bulk material silos at the north end and a rail spur on the
  south side — all consistent with a snack-manufacturing plant (PotatoPro lists it as
  producing extruded snacks, pretzels and tortilla chips).

## Key views
- **Satellite z17-z20:** Large rectangular building with dense rooftop process equipment
  (chillers, ducting, exhaust). Bulk storage silos along the north edge. Rail spur along the
  south/southwest edge with rail cars present in older imagery. Site is tightly hemmed by
  other companies' warehouses on the south and west — a constrained urban parcel.
- **Street View (east side, 2024/2025):** Red Frito-Lay sign on building face; iron + chain-link
  perimeter fence enclosing the office front, employee parking, and dock yard; sliding gates
  at the access points; trailers backed into docks behind the fence.
- **Street View (south/rail side, 2019):** Covered hopper / tank rail cars parked against the
  building on the rail spur — confirms rail service for bulk inbound ingredients.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The whole property is fenced; vehicle access is via sliding gates in
  the chain-link / iron fence (one at the east office/parking entrance, one at the dock-yard
  entrance). No open uncontrolled driveway exists.
- **guardShack = false.** No staffed booth (1-3-vehicle footprint structure) is visible at
  any gate in Street View or satellite imagery. This is an older urban plant with
  self-managed sliding gates.
- **remoteGs = true.** Gate present, no guard shack — implies kiosk / call-box / badge check-in.
- **dockDoors = "10-25".** Dock doors with trailers backed in are visible along the east and
  north building faces. Exact count is partly obscured by the fence and adjacent buildings;
  estimate ~16 doors, low confidence.
- **scale = false, multiStep = false.** No truck scale or second checkpoint visible.

## Yard zones and counts
- **perimeter:** S 32.8286, W -96.8863, N 32.8299, E -96.8845 — the fenced property,
  ~6 acres (building footprint alone ~4.2 acres).
- **truckGate zone:** east-side gate cluster near the office front / dock yard.
- **dockApron:** strip along the north/east building face where trailers back in.
- **dropYards / staging:** none clearly delineated — the site is space-constrained; trailer
  parking is the dock apron itself. dropArea estimated "0-10".
- **yardMetrics:** ~16 dock doors, ~6 trailers visible, ~12 trailer capacity, 2 truck gates,
  1 building, ~6 acres, rail-served = true.

## Web findings
- PotatoPro: Frito-Lay Brookhollow (Dallas) — production site, subsidiary of Frito-Lay North
  America, producing extruded snacks, pretzels, tortilla chips.
- Waze / Yellowpages / Superpages confirm 1141 Regal Row, Dallas TX 75247.

## Final confidence
**Medium.** Facility identity is certain (red Frito-Lay sign, silos, rail spur). Gate and
guard-shack calls are solid. Dock-door and trailer counts are honest estimates limited by the
dense urban fabric and fence obstruction — flagged in uncertainFields.
