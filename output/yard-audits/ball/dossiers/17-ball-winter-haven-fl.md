# Ball - Winter Haven FL (idx 17)

**Type:** Beverage Can Plant (bodies) — formerly Florida Can Manufacturing
**Resolved address:** 100 Florida Can Way, Winter Haven, FL 33880
**Coordinates (building center):** 27.944050, -81.712350 (geocode ROOFTOP on the street address)
**Confidence:** medium

## Step -1 — Verification: CONFIRMED (operator self, owned)
Ball Corporation closed the $160M acquisition of Florida Can Manufacturing's Winter Haven aluminum can plant on 2025-02-04 and folded it into its North American beverage-packaging network; the plant is currently operating. No divestiture/closure signal.
- Tier 1: Ball company PR, "Ball Corporation Further Optimizes North American Network with Florida Can Manufacturing Acquisition," 2025-02-04 (ball.com/newswire/article/124245).
- Corroboration: Packaging Dive / Food Dive coverage of the acquisition; reported ~70-acre, 800,000+ sqft complex, ~4,000 cans/min.

## Step 0 — Building lock
The address geocoded ROOFTOP directly onto a large single manufacturing building on the rural SW edge of Winter Haven, surrounded by farmland, retention ponds and canals. Satellite confirms a can-plant footprint (one very large white-roof building, process silos/tanks at the north, employee parking + office to the south). Locked without needing to move the pin.

## What the imagery showed
- **Wide (z17) + tight (z18/z19):** One dominant manufacturing building (~280m square, ~74k m²). South side = office entrance + employee parking rows. North side = the truck/process side.
- **North face (z19):** The shipping side. A dock line runs along the north wall; a covered loading canopy and a bank of ~10-12 trailers backed in at the NE corner. Process utilities (compressor building with blue roof, a red-top tank, two large circular tanks / water treatment, silos) sit in the north yard.
- **East side:** A very large paved/graded open lot — the drop-yard / expansion pad, largely empty in current imagery but sized to hold 50+ trailers.
- **South:** Office frontage, a small standalone reception/canopy building (red trim), and a long employee parking field. No docks on the south.

## Gate / guard-shack / dock determinations
- **Truck gate:** No Street View coverage anywhere near the site (rural; metadata ZERO_RESULTS on every nearby query). Satellite shows a single open loop driveway from the south with no visible barrier arm or booth, so scored **truckGate = false** — flagged uncertain (a new plant of this size may have a gate not resolvable from overhead).
- **Guard shack:** none visible → **false**. remoteGs **false**.
- **Docks:** concentrated on the **north / NE** face (dock line + covered canopy + trailer bank). Band **10-25** (~18 est.). This is an outbound-heavy can plant — the trailer staging and drop-yard are the operational pinch.
- **Drop yard:** **true** — NE trailer bank + the large east lot. dropArea band **25-50**.

## Yard zones & counts
- Perimeter (oriented ~E-W): ~73 acres (matches the reported ~70-acre complex).
- dockDoorCount ~18 · trailersVisible ~12 · trailerParkingCapacity ~80 · truckGateCount 1 · buildingCount 1 · railServed false.

## Setting
Rural — SW edge of Winter Haven, farmland/ponds on all sides. urbanRural = Rural. connectivityIssue false (a mid-size FL city is adjacent).

## Final confidence: medium
Building identity and layout are solid; the gate/guard fields and exact dock count are limited by no Street View + white-roof overhead ambiguity.
