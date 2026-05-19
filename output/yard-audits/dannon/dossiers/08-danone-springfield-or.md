# Deep-Audit Dossier — Danone Springfield OR (idx 8)

**Facility:** Danone - Springfield OR
**Type:** Plant-based frozen-dessert plant — So Delicious Dairy Free ice cream (the
only plant-based frozen-dessert plant in North America)
**Address:** 1130 Shelley Street, Springfield, OR 97477
**Resolved coordinates:** 44.065600, -123.043500
**Confidence:** Medium

## Step 0 — Location confirmation
Roster coordinates (44.065549, -123.04481, ROOFTOP, 25 m move) landed inside a
multi-tenant industrial park between Highway 126 and a residential neighborhood.
The park has several similar warehouse buildings, so the exact plant was confirmed
by Street View: a building carries a clear "Danone North America" logo by its
office entrance (Street View Jul 2024). Web research confirms the legacy Turtle
Mountain / So Delicious plant, ~2.5-acre footprint, ~150 employees. Coordinates
confirmed; locked center on the Danone-branded building cluster.

## Key views
- **z17-z18 wide:** Industrial park in a wedge between OR-126 (south) and housing
  (north). Multiple buildings with shared drive aisles; no park-wide perimeter.
- **z19-z20 plant:** The Danone building cluster has heavy rooftop refrigeration
  equipment, process tanks, and reefer trailers parked in a yard between buildings.
- **z21 dock:** A small dock yard with 2-3 reefer trailers backed in; a covered
  conveyor structure crosses the yard linking buildings. Yard is tight/confined.
- **Street View (Jul 2024):** "Danone North America" logo confirmed on the office
  building. A sliding chain-link gate spans the truck/process drive between the
  buildings, enclosing the production yard. Other park tenants (e.g. "Treeline
  CrossFit") are unrelated businesses.

## Gate / guard-shack / dock determinations
- **truckGate: true** — A sliding chain-link gate spans the truck drive aisle into
  the production yard, a clear controlled pinch-point across the truck lane.
- **guardShack: false** — No staffed booth; the gate is a plain sliding chain-link
  gate with no booth beside it. Check-in is at the building office.
- **remoteGs: true** — A controlled gate exists with no guard shack, implying
  keypad / call-box / buzz-in check-in.
- **dockDoors: 0-10** — Small plant; only a handful of dock doors (~8 estimated).
  Low confidence — dock face partly obscured by parked reefers and a conveyor.
- **dropArea: NONE** — No dedicated marked drop-yard stalls.

## Yard zones and counts
- **Perimeter:** ~2.5 acres, the Danone building cluster within the larger park.
- **Truck gate:** 1 — the sliding chain-link gate into the inter-building yard.
- **Dock apron:** Tight courtyard-style yard between buildings; ~6 reefers visible.
- **Drop yard:** None dedicated.
- **Rail:** None.
- **Setting:** Urban — dense Springfield industrial/residential fabric by Hwy 126.
- **backupSensitive:** True — the confined yard means a truck queue would quickly
  choke the shared park drive aisle.

## Web findings
Danone careers / IndustryNet: legacy Turtle Mountain plant (founded 1987),
~2.5-acre site, ~150 employees, sole North American plant-based frozen-dessert
producer (So Delicious bars, sandwiches, pints, CocoWhip). Workforce unionized
in 2020. No published gate/dock operational detail.

## Final confidence
Medium. Facility positively identified via the Danone logo in Street View; the
sliding gate is clearly visible. Dock-door count and lane counts are downgraded
to low confidence — the small confined yard is partly obscured by trailers and a
conveyor structure (listed in uncertainFields).
