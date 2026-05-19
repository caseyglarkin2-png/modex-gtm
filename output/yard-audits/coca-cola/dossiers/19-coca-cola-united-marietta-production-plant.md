# Deep-Audit Dossier — idx 19

## Coca-Cola UNITED — Marietta Production Plant, GA

**Facility type:** Bottling / Manufacturing Plant
**Resolved location:** ~33.97480, -84.54320 — 1091 Industrial Park Dr, Marietta, GA 30062
**Confidence:** High

## Location resolution
The roster-supplied coordinates (33.935695, -84.503652, address "699 Franklin
Gateway SE") landed in a residential apartment complex roughly 5 km southeast of
the real plant. The Coca-Cola UNITED "Marietta" location page lists the actual
address as **1091 Industrial Park Dr, Marietta, GA 30062**, and a Waze listing
for "Coca-Cola Bottling Company United" corroborates it. Satellite probing of
that address showed a large industrial complex, and Street View along Industrial
Park Dr / Franklin Gateway confirmed it: the **Coca-Cola script logo** is
mounted on the building facade alongside a row of stainless **bottling silos** —
unambiguous for a Coca-Cola production plant. Per the company page this is "the
only glass, and bag-in-the-box facility in the state of Georgia."

## Key views
- **Wide satellite (z16-17):** Large grey/white-roofed production-warehouse
  building set between Industrial Park Dr (curved road, south/west) and an active
  rail line (north). Employee parking fronts the road; the truck yard wraps the
  north side.
- **Tight satellite (z19-20):** North side of the building is a long dock face
  with trailers backed in, plus a drop-trailer parking area holding ~38 trailers
  in marked rows with directional arrows painted on the pavement.
- **Street View (front, Franklin Gateway):** Coca-Cola logo + silos confirm ID.
- **Street View (Industrial Park Dr entrance):** Open curb-cut driveway into the
  property; employee/visitor parking is open to the road.
- **Street View (truck-yard side):** Chain-link perimeter fencing encloses the
  truck yard and drop trailers; no barrier arm or sliding gate seen across the
  truck driveway.

## Gate / guard-shack / dock determinations
- **Truck gate — FALSE (flagged uncertain):** The truck yard is fenced with
  chain-link, but the entrance driveway off Industrial Park Dr is an open,
  uncontrolled curb cut. No barrier arm, no sliding gate seen across multiple
  Street View headings. A gate could exist outside Street View coverage, so it
  is listed in uncertainFields.
- **Guard shack — FALSE:** No standalone 1-3-vehicle-footprint booth at the
  entrance. The small structures near the entry belong to the building cluster.
- **Remote GS — FALSE:** No gate, so no remote check-in implied.
- **Docks — 25-50 band:** ~30 dock doors estimated along the north building
  face from zoom-20 imagery.

## Yard zones & counts
- **Perimeter:** Whole property between Industrial Park Dr and the rail line —
  roughly 16.5 acres, irregular footprint.
- **Drop yard:** North-side trailer-parking area, ~38 trailers visible,
  estimated ~45-trailer capacity. Marked stalls with painted directional arrows.
- **Dock apron:** North face of the main building where trailers back in.
- **Staging:** Internal paved yard between entrance and docks gives deep
  (3+ truck) queue room — postGateStaging true, drivewayLong true.
- **Buildings:** Main production/warehouse + office wing + a separate
  maintenance/shop structure in the yard (multipleFacilities left false — single
  operational cluster).
- **Rail:** Line runs immediately north of the property but no spur appears to
  enter — railServed false, flagged uncertain.

## Web findings
- Coca-Cola UNITED Marietta Production page: address 1091 Industrial Park Dr;
  produces TCCC beverages plus warehouse storage/distribution; the only
  glass + bag-in-the-box facility in Georgia / within UNITED.
- Facility came to Coca-Cola UNITED in the April 2017 TCCC territory transaction
  covering Atlanta and seven Georgia territories.

## Final confidence
**High** on identity, layout, docks, and drop yard. The truck-gate call is
FALSE but flagged uncertain because Street View could not fully cover the truck
driveway. Rail-served flagged uncertain.
