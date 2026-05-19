# Deep-Audit Dossier — idx 21

## Mondelez Fort Worth Distribution Center — Fort Worth, TX

**Status: RESOLVED — confidence HIGH** (re-audit of an earlier low-confidence stub)

### Step 0 — Location
Confirmed address: **16200 Three Wide Dr, Ste 172, Fort Worth TX 76177** — the
IDI / Speedway Distribution Center **Building C** (a ~316,128 SF Class-A
distribution building delivered 2018) in the AllianceTexas logistics corridor
adjacent to Texas Motor Speedway. Google geocode returned a ROOFTOP match at
`33.0315793, -97.3007312`; satellite confirmed a large completed cross-dock
distribution building consistent with the listing. Locked center:
`33.03158, -97.30073`.

> The earlier stub mislabeled this site "Garland, TX" and could not resolve it.
> It is in Fort Worth — corrected here.

### Steps 1-5 — Audit

**Building & layout.** A long single cross-dock warehouse running roughly
east-west. Dock banks on **both** the north and south faces — the north face
carries the heavy trailer activity and a trailer drop yard; the south face has
a second dock bank fronting the office and employee car-parking. Ship/receive
read as physically separate clusters.

**Docks.** Continuous dock-door rhythm along the full north face plus the
south dock bank — estimated ~115 doors total for a building of this footprint
(`dockDoors: 50+`; exact count flagged uncertain).

**Drop yard.** A dedicated trailer-storage area along the north side holds
multiple rows of parked trailers with no tractors — a clear drop yard
(`dropYard: true`, `dropArea: 50+`).

**Truck gate.** The truck court is fully enclosed by chain-link fence. Street
View (Dec 2024) at the SE corner shows a **sliding chain-link gate** across the
truck driveway where it enters the fenced truck court between Building C and
the building to its east. `truckGate: true`.

**Guard shack.** No staffed guard booth was visible at the gate — a sliding
chain-link gate only, implying kiosk / app / call-box check-in
(`remoteGs: true`). The south-side driveway to the office face is an open
employee/visitor entrance with no control. `guardShack` flagged uncertain
(a small booth could be obscured by trailers in the available panos).

**Fast lane.** The truck-court gate apron is wide with substantial unused
paved width and deep stacking depth — physical room for an express bypass
lane (`fastLaneOpportunity: true`).

**Setting.** AllianceTexas is an edge-of-metro master-planned logistics park
surrounded by open land, FM-156, and the speedway — graded **Rural** per the
rubric tie-breaker (speculative-industrial park, not dense metro fabric).

**Geofence.** Perimeter captures the building plus the north truck/drop yard
and the south car-parking apron: ~367 m N-S x ~588 m E-W ≈ **53 acres**.

**Rail.** No rail spur into the property — `railServed: false`.

### Verdicts
- **Gate verdict:** truck gate present — sliding chain-link gate on a fully
  fenced truck court.
- **Guard-shack verdict:** no guard shack observed — remote (kiosk/app)
  check-in inferred; flagged uncertain.
- **Confidence:** high.
