# Deep-Audit Dossier — Hormel Atlanta Plant (Tucker, GA) — idx 09

**Account:** Hormel Foods
**Facility type:** Production Facility (Hormel chili, Dinty Moore stew; bacon line closed 2025)
**Resolved location:** 3367 Montreal Industrial Way, Tucker, GA 30084
**Locked center:** 33.8393, -84.2506
**Confidence:** medium

## Step 0 — Location resolution
Both the roster coordinates (33.86701, -84.188105) and the roster address
("3700 Mountain Industrial Blvd") were incorrect — that point sits ~6 km
northeast in a commercial/residential area near a road intersection. Web
research (Hormel "Our Locations", Waze, USDA FSIS, Yelp) consistently gives
the real address as **3367 Montreal Industrial Way, Tucker GA 30084**, with
coordinates ~33.8392, -84.2510. Satellite probing there revealed a large
processing plant with dock banks and trailers; Street View showed a sign
reading **"ATLANTA PLANT ... SAFETY ... AWARD WINNER"** — positive ID.

## Key views
- **Wide z15/z17:** Plant sits in a dense industrial corridor of Tucker
  (DeKalb County, Atlanta metro), surrounded by warehouses; bounded by
  Montreal Industrial Way to the north and a rail line + interstate to the SE.
- **z18 plant:** Single large connected processing building; employee parking
  wraps the north and east; trailers parked north and east.
- **z19 east face:** Dock bank with ~14-16 trailers backed in, plus a separate
  row of ~8-12 trailers parked along the east edge (drop yard).
- **z19 south face:** Process equipment along the south, backing onto woods.
- **Street View (captured 2026-01):** Plant has a perimeter chain-link fence
  enclosing the parking lots. Plant sign visible. Truck driveways are open
  gaps in the fence/treeline; no barrier arm or guard booth seen.

## Gate / guard-shack / dock determinations
- **Truck gate: FALSE (medium confidence).** The property is perimeter
  chain-link fenced, but the truck driveways from Montreal Industrial Way and
  the east perimeter road are open driveway gaps — no barrier arm, sliding
  gate, or controlled checkpoint identified. Street View coverage does not
  reach the dock-yard entrance directly, hence medium confidence.
- **Guard shack: FALSE.** No guard booth identified at any truck entrance.
  A small structure near a driveway appears to be a utility/picnic structure
  beside employee parking, not a gate booth.
- **Remote GS: FALSE** — no gate, not applicable.
- **Docks:** East dock face shows ~14-16 trailers backed in; additional doors
  on other faces. Total estimated **25-50** band (~28 doors) — overexposed
  roof imagery, so an estimate.
- **Drop yard: TRUE.** ~8-12 trailers parked along the east property edge,
  separate from the active dock bank. `dropArea` 10-25 band.
- **Ship/Rcv separate: FALSE** — dock activity concentrated on the east face.

## Yard zones and counts
- **Perimeter:** ~256 m (N-S) × ~203 m (E-W) ≈ **12.8 acres**.
- **Truck gate zone:** open driveway off Montreal Industrial Way (NE).
- **Drop yard:** east-edge trailer row.
- **Dock apron:** east-facing dock apron.
- **dockDoorCount ≈ 28, trailersVisible ≈ 32, trailerParkingCapacity ≈ 40.**
- **buildingCount 1** — single connected processing complex; neighboring
  large buildings are separate companies, not part of this facility.
- **railServed FALSE** — rail line runs SE of the property beyond a tree
  buffer; no spur enters the site.

## Web findings
The Hormel Atlanta Plant (built 1969) produces Hormel chili and Dinty Moore
stew. The precooked-bacon line was closed in 2025 and 135 of ~350 employees
were laid off in August 2025, so the operation is running reduced. A May 2025
USDA recall of ~256,000 lbs of canned beef stew (foreign material) was tied
to this plant.

## Final confidence: medium
Facility positively re-identified (roster location was ~6 km off and the
address was wrong). The layout, docks and drop yard are clear. Confidence is
medium because the gate/guard-shack call relies on satellite plus
peripheral Street View — the truck-dock entrance itself is not directly
covered by Street View — and the dock-door count is an estimate from
overexposed imagery.
