# Ball - Fort Atkinson WI — Deep Yard Audit

**Type:** Beverage Can Plant (bodies) · **Confidence:** high
**Resolved center:** 42.9438, -88.8340 · [satellite](https://www.google.com/maps/@42.9438,-88.8340,400m/data=!3m1!1e3)
**Address:** 105 E Blackhawk Dr, Fort Atkinson, WI 53538

## Verification (Step -1) — CONFIRMED
Ball's own Feb-2025 locations map lists Fort Atkinson WI. Corroborated by "Ball Metal Beverage Container / Ball Corporation" listings and active production-technician job posts at Fort Atkinson. Long-running plant, not among Ball's closures. Owner-operated.

## Location resolution (Step 0)
Roster gave no coordinates and noted that 201 E Cramer St is a nearby dunnage node (not the plant). Directory listings resolved the plant to **105 E Blackhawk Dr**, which geocoded rooftop to 42.9437, -88.8340. Satellite confirmed a manufacturing complex (grey pitched-roof hall + white process hall) with a rail spur — consistent with a can plant, distinct from the Cramer St warehouse.

## Views
- **z17/z18:** grey pitched-roof production hall (N) joined to a white flat-roof process hall (S) dense with rooftop equipment; employee parking to the W; a large paved truck apron along the E face; farmland to the N/E; a neighboring (different-tenant) building across a treed buffer to the SE.
- **Rail:** a spur leaves the N-S mainline and runs **into the plant along the east face** — this is the only rail-served site of the five.
- **z20 detail:** the two small fenced structures on the east apron are **utility/electrical compounds** (transformers/switchgear), not a guard booth or truck scale.
- **Street View (Jul 2024):** metal-sided plant with an open entrance drive off Blackhawk Dr (at the rail grade crossing) running back along the east apron; no guard booth or barrier arm.

## Gate / guard / docks
- **Truck gate:** FALSE (flagged medium) — open entrance drive; no guard booth or barrier arm. Utility compounds nearby are not a gatehouse/scale.
- **Docks:** ~15 doors on the east face facing the truck apron (modest external bank; some volume moves via the rail spur). Band **10-25**. No clear ship/receive split → `shipRcvSeparate` false.
- **Drop / staging:** no dedicated trailer-storage lot; trailers stage on the east working apron (`dropYard` false, `dropArea` 0-10). Internal apron before docks (`postGateStaging`, `drivewayLong` true).

## Yard metrics
Dock doors ~15 (10-25) · trailers visible ~5 · capacity ~25 · gates 1 · buildings 1 (connected halls) · ~24 acres · **rail: YES — spur into the east face**.

## Setting
SE edge of Fort Atkinson (small town, ~12k), farmland to the N/E → **Rural**. Cell coverage fine (not isolated). `multipleFacilities` false. Note: the entrance sits at a rail grade crossing on Blackhawk Dr.

## Final confidence: high
Building and operator unambiguous and well-verified; rail spur clearly confirmed. Flagged: open gate call, exact dock count and acreage are overhead estimates.
