# Deep-Audit Dossier — Ford Kentucky Truck Plant (idx 2)

## Facility
- **Name:** Ford - Kentucky Truck Plant, Louisville KY
- **Type:** Vehicle Assembly Plant (Super Duty, Expedition, Navigator)
- **Address:** 3001 Chamberlain Ln, Louisville, KY 40241
- **Resolved coords:** 38.29400, -85.53350

## Step 0 — Location confirmation
The geocode point (38.290062, -85.530948) landed on the south edge of the plant
property (geocode flagged 2226 m moved). Probing zoom 14-16 around it
immediately revealed a single enormous integrated assembly plant — the Kentucky
Truck Plant — sited between Chamberlain Lane and I-71. Identity is unambiguous:
this is one of Ford's largest North American assembly facilities. Center
adjusted to the building-cluster centroid (~38.2940, -85.5335).

## Key views
- **Zoom 14 context:** KTP dominates an otherwise suburban/woods setting beside
  I-71, surrounded by residential subdivisions — edge-of-metro Louisville.
- **Zoom 16:** Vast contiguous gray-roof assembly building with multiple
  attached and separate structures, finished-vehicle lots, and rail to the NE.
- **NE rail yard (z17):** Extensive on-site rail yard with multi-colored
  auto-rack rail cars and covered rail loading structures — clearly rail-served.
- **SW corner (z18):** A large dedicated **trailer drop yard** packed with
  parked trailers, an internal truck road, and dock doors with trailers backed
  in along the building face; I-71 runs along the south edge.
- **NE employee gate (z19/20):** Employee parking with shuttle vehicles — the
  employee entrance, distinct from the truck route.

## Gate / guard-shack determination
KTP is a secured Ford assembly campus — perimeter fencing and controlled access
roads off Chamberlain Lane, with a distinct truck route serving the SW drop yard
and dock banks. Truck gate: **true**. Ford assembly plants operate staffed
security gatehouses at controlled entrances; gate-area structures are present,
so guard shack is **true** — but marked uncertain because the booth could not be
crisply isolated (plant access roads are private, not Street-View accessible).
With an outer campus gate plus internal checkpoints, `multiStep` is **true**.

## Yard zones and counts
- **Perimeter:** ~344 acres covering the assembly building cluster, drop yard,
  dock aprons, rail yard, and finished-vehicle lots.
- **Drop yard:** Large SW trailer-storage lot near I-71 — `dropYard: true`,
  `dropArea: 50+`.
- **Dock aprons:** Multiple dock banks on different building faces — ship and
  receive run from separate clusters (`shipRcvSeparate: true`).
- **dockDoorCount ~55, trailersVisible ~70, capacity ~150** — overhead estimates.
- **railServed: true.**

## Web/contextual findings
The Kentucky Truck Plant builds the Super Duty, Expedition, and Navigator and is
one of Ford's highest-volume and largest assembly plants. Its scale, on-site
rail, and large trailer yard match the imagery.

## Confidence
**High.** Facility identity and yard layout are unambiguous. Truck gate is
confident. Guard-shack call is high-probability (standard Ford posture) but
flagged because the booth could not be visually pinpointed; door/trailer counts
and scale are honest estimates.

### 3-line summary
- Gate verdict: TRUCK GATE — true (secured assembly campus, fenced, controlled truck route)
- Guard-shack verdict: GUARD SHACK — true (standard Ford gatehouse posture; flagged uncertain — booth not visually isolated)
- Confidence: high
