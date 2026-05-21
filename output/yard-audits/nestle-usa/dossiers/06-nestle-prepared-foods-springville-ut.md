# Deep-Audit Dossier — Nestlé Prepared Foods, Springville UT (idx 6)

## Facility
- **Name:** Nestlé Prepared Foods - Springville UT
- **Type:** Frozen food manufacturing plant (Stouffer's / Lean Cuisine frozen entrees)
- **Address:** 815 W Ray Klauck Way (a.k.a. Raymond Klauck Way), Springville, UT 84663
- **Locked center:** 40.18870, -111.62380

## Step 0 — Location confirmation
Roster coordinate (40.18909, -111.624768, ROOFTOP, moved 3225 m) landed on the
western edge of the correct building. Satellite probes at z16-z18 showed a
large industrial complex; web search confirmed Nestlé Prepared Foods at 815
Raymond Klauck Way, Springville — a Stouffer's frozen-meals factory, opened
1987, 1000+ employees, USDA-classified "Large", running 7 production lines.
The center building matches a frozen-food manufacturing plant (extensive dock
operations, large refrigerated/process structure, big trailer yard). Locked
center adjusted to the building centroid at 40.18870, -111.62380.

## Key views
- **z16-z17 overview:** Central plant complex inside an industrial park at the
  foot of the Wasatch range; employee parking to the south, trailer drop yard
  to the SE/E, railroad along the E boundary.
- **z19 E dock face:** Many trailers backed into a dock bank; a rail spur
  crosses the yard pavement and curves into the property.
- **z19 NE dock face:** Second dock bank with trailers backed in.
- **z19 drop yard:** Large dedicated trailer lot packed with 80-110+ parked
  trailers; UP rail line parallels the east edge.
- **Street View (2023-09):** Continuous chain-link perimeter fencing along
  Ray Klauck Way on the W and N; personnel gates visible; trucks observed
  staging on Ray Klauck Way west of the plant.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE (medium confidence).** The whole property is fully fenced
  (chain-link confirmed in several Street Views). Trucks enter via an internal
  access road wrapping the NW/N of the plant and curving down the NE corner
  into the secured drop yard. A controlled truck gate is near-certain for a
  fenced 1000-employee Nestlé plant of this scale; the exact barrier arm was
  not resolvable in 2023 imagery.
- **Guard shack — FALSE / uncertain.** No windowed guard booth was positively
  identified beside the truck lane. A small structure near the NE corner reads
  as a maintenance/utility shed. Classified guardShack false, remoteGs true
  (kiosk / app check-in implied) — low confidence on this pair.
- **Docks — 25-50 band.** Dock banks on the building's E and NE faces with
  trailers backed in; ~35-50 doors counted across faces.
- **Drop yard — 50+ band, dropYard true.** Dedicated trailer-storage lot SE/E
  of the plant, 80-110+ trailers visible.
- **Rail-served — TRUE.** A rail spur runs into the property and crosses the
  yard pavement; a Union Pacific main line also parallels the east boundary.

## Yard zones & counts
- **Perimeter:** ~490 m N-S x ~300 m E-W, ~38 acres.
- **Truck gate zone:** NE corner where the access road enters the yard.
- **Drop yards:** one large lot on the SE/E.
- **Dock aprons:** E face apron and NE face apron (two clusters → shipRcvSeparate true, medium confidence).
- **dockDoorCount ~45, trailersVisible ~110, capacity ~150, buildings 3.**

## Web findings
- Stouffer's frozen-meals factory; opened 1987; 1000+ employees in Utah County;
  7 production lines; USDA "Large" classification (Deseret News, Nestlé careers,
  Wikimapia, FSIS).

## Final confidence: MEDIUM
Location and physical layout are unambiguous and well-imaged. The guard-shack
determination and exact lane counts could not be fully resolved from 2023
imagery, so those fields are flagged uncertain.
