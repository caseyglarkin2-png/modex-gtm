# GM - Flint Assembly, Flint MI — Deep-Audit Dossier

**Facility:** Flint Truck Assembly (Flint Assembly)
**Address:** 3100 Van Slyke Rd, Flint, MI 48507
**Type:** Vehicle Assembly Plant (heavy-duty pickup)
**Resolved center:** 42.9851, -83.7169
**Method:** deep-audit (satellite + Street View + web)
**Confidence:** high

## Location confirmation
The roster coordinate was city-level. First wide probe near the supplied address
landed on a school campus north of the plant, so I re-pinned by web search and
Wikipedia, which give the plant center at **42.9851, -83.7169** and confirm
~5.2M sq ft of building on a ~159-acre core parcel, built 1947 (GM's oldest
operating assembly plant), building Chevrolet Silverado HD and GMC Sierra HD
(sole source for dual-rear-wheel HD models). A z16 probe of that coordinate
showed the unmistakable large integrated assembly complex: dense old dark
roofline, a 2016 white paint-shop building, rail corridor along the west edge,
and finished-vehicle lots to the north. Street View on Van Slyke Rd shows the
brick administration building with flags and a "Flint Assembly" sign, fronted by
a chain-link perimeter fence — positive ID.

## What the key views showed
- **Wide / full complex (z15):** Multi-building campus bounded by I-475 + an
  active rail corridor on the west and Van Slyke Rd on the east. Extensive
  finished-vehicle / trailer lots on the west and north; the colorful pixel
  fields are parked vehicles and trailers.
- **Core (z18):** The original 1947 assembly building — dense, multi-roof,
  heavily built. Hard to count individual dock bays through the old roofline.
- **South logistics yard (z17/z19):** The clearest freight feature — a large
  white cross-dock building with trailers backed against its faces, and organized
  rows of dozens of trailers (XTRA and others) plus outdoor steel/frame material
  storage. This is the inbound parts cross-dock + trailer drop yard.
- **East / Van Slyke (z18 + Street View 270°, pano uJIvAjBoMLv_culaXrN_KA):**
  Chain-link perimeter fence with gated openings; brick admin building; fenced
  employee parking. Confirms a secured perimeter.
- **South access road (Street View 270°/200°, pano xXgQ6Z3bfvjk8mIdFwhHHg):**
  XTRA-branded and other trailers parked behind perimeter chain-link along the
  logistics-yard frontage — the truck-gate frontage for the drop yard.
- **North (z17):** Golf course / floodplain across I-475; finished-vehicle rail-
  load lot with parked vehicles and rail in the bottom-right.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Fully fenced campus (chain-link confirmed in Street View)
  with multiple controlled truck entrances: the south logistics-yard gate off the
  access road, a west/rail-side plant gate, and the south Bristol-side access.
- **guardShack = true (uncertain).** GM assembly plants of this scale run staffed
  gatehouses at controlled truck entrances. The individual booth could not be
  crisply isolated overhead and the residential streets along Van Slyke block a
  tight Street View of the truck lanes, so it is flagged uncertain.
- **remoteGs = false** (guardShack assessed present).
- **dockDoors = 25-50.** ~45 doors counted across the south cross-dock building
  and the main-plant dock aprons; uncertain due to the dense old roofline.
- **shipRcvSeparate = true.** Inbound parts cross-dock + trailer staging in the
  south logistics yard; finished-vehicle shipping marshals from the north rail-
  load and vehicle lots — separate clusters on opposite ends.
- **multiStep = true.** Outer perimeter gate plus internal vehicle-control
  checkpoints between plant, finished-vehicle lots, and the logistics yard.

## Yard zones and counts measured
- **perimeter** — 9-vertex oriented ring tracing the fenced campus from the north
  finished-vehicle lots down the west rail corridor to the south logistics yard
  and back up the Van Slyke east edge. ~320 acres (campus extent, larger than the
  159-acre building-core figure).
- **truckGate** — quad at the south logistics-yard entrance off the access road.
- **dropYards** — two: the south cross-dock trailer yard (50+ trailers in rows)
  and the west-side trailer line near the rail yard.
- **dockAprons** — one traced on the south cross-dock building's loading face.
- **yardMetrics:** dockDoorCount ~45, trailersVisible ~110, capacity ~200,
  truckGateCount ~3, buildingCount ~8, siteAreaAcres ~320, railServed true.

## Web findings
Wikipedia / GM media / GM Authority: continuous operation since 1947; ~5.2M sq ft;
~5,374 workers (2022); Silverado HD / Sierra HD incl. sole-source dually; 2016
$600M paint-shop investment at 3848 Van Slyke Rd; recent additional GM investment
announced for the plant. Active rail service confirmed by the west-boundary rail
yard and north auto-rack load lots.

## Final confidence: high
Facility positively identified and freight features (drop yard, cross-dock, rail,
fenced gates) clearly visible. guardShack, exact dock-door count, lane counts, and
truck-gate count are honest estimates and are flagged in `uncertainFields`.
