# GM CCA - Charlotte Parts Distribution Center, Charlotte NC — Deep Audit

## Resolved location
- Prompt gave **10815 Quality Dr, Charlotte, NC 28269** — the zip is wrong. The
  facility is in **Steele Creek (zip 28278)**, southwest Charlotte. My first probe at
  the 28269-area coords (35.3346, -80.7948) landed on a north-Charlotte retail strip —
  not the facility.
- Google geocode of "10815 Quality Dr, Charlotte, NC 28278" returns a **ROOFTOP** hit at
  **35.1391925, -80.9879849**, which lands squarely on a large white-roofed distribution
  building in the Steele Creek industrial park.
- Web research confirms this is **GM Customer Care & Aftersales (CCA) Charlotte Parts
  Distribution Center**: 352,000 sq ft, opened 1999, ships ~420,000 customer orders/month,
  with a $23M modernization investment announced by GM in 2024.
- **Locked center: 35.1393, -80.9879.**

## Key views
- **Wide satellite (z16-17):** Steele Creek logistics park beside a retention pond. The GM
  PDC is the central white-roofed building, long axis running NW-SE (rotated ~35° from
  north), flanked by other large tenant warehouses to the SE/E.
- **Building (z18):** Dock banks with trailers on BOTH long faces — a drop-trailer row +
  backed-in trailers on the NW apron, and backed-in trailers along the SE face feeding a
  large shared truck court. Office front + employee parking on the NE end.
- **NW apron (z19):** Long row of dropped trailers in stalls along the NW edge; rail line
  visible just beyond in the wooded buffer.
- **SE court (z18):** Big trailer court between GM and the neighbor building, many trailers
  (incl. a Boar's Head reefer at a neighbor dock) — a shared multi-tenant court.
- **NE office / gate (Street View 2019 + 2022):** Two-story glass office front with open
  employee parking; a chain-link fence with a **sliding gate** separates the office area
  from the fenced truck yard. Trailers visible behind the fence.
- **In-yard panos (2025):** The Street View car drove inside the SE court — open paved area,
  tractors coupled at the docks, no gate at the court itself (the control point is the
  office-to-yard fence gate).

## Gate / guard-shack / dock determinations
- **truckGate = true.** Chain-link perimeter fence on the truck-yard side with a sliding
  gate across the driveway from the office/parking into the fenced yard (2019/2022 SV).
- **guardShack = false (low confidence).** No staffed booth at the gate in Street View, and
  no separate booth footprint beside the lane in z20 satellite. Flagged uncertain.
- **remoteGs = true (low confidence).** Controlled gate, no confirmed booth — kiosk / badge /
  remote check-in implied.
- **dockDoors = "50+".** Dock-door banks on BOTH long faces (~30-35 each, ~65 total).
- **dropArea = "25-50".** NW drop-trailer row + large SE shared court; ~50 trailers visible
  (borderline 50+, called 25-50 conservatively).
- **dropYard = true.** Dedicated NW drop row and SE trailer court separate from dock staging.
- **shipRcvSeparate = true.** Two physically separate dock faces (NW and SE), each with its
  own truck court.
- **railServed = false.** An active rail line (rail cars + a locomotive present) runs along
  the SW edge in the treed buffer OUTSIDE the fence; no spur enters the building. Truck-served.

## Yard zones / counts
- **Perimeter:** ~22 acres (building, two truck courts, office/employee parking, treed buffer).
- **Drop yards:** two rings — the NW apron drop row and the SE shared trailer court.
- **Dock aprons:** two strips, one hugging each long building face at the ~35° angle.
- **Truck gate:** the office-to-yard sliding-gate fence line on the NE side.
- **Building:** 1 (the ~352k sq ft PDC).
- **dockDoorCount ~65, trailersVisible ~50, trailerParkingCapacity ~90** (overhead estimates).

## Web findings
- GM CCA Charlotte PDC: 352,000 sq ft, opened 1999, ~420,000 customer orders/month,
  ~150 employees; $23M modernization announced 2024 (maximize storage, reduce physical
  strain, speed order fulfillment). Phone (704) 587-4700.

## Confidence: HIGH
Facility positively identified (ROOFTOP geocode + web confirmation of the GM CCA PDC).
Dual-face cross-dock layout, drop yards, fenced truck gate, and adjacent (non-serving) rail
all clear from imagery. Guard-booth presence and exact lane counts are low-confidence
(flagged) — Street View shows the gated fence but no booth.
