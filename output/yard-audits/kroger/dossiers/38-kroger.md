# Deep-Audit Dossier — idx 38 · Anderson Bakery (Kroger Bakery Plant)

**Address:** 433 Sayre St, Anderson, SC 29624
**Resolved center:** 34.489292, -82.654568
**Type:** Bakery Plant (bread/cake) · operated by The Kroger Co.
**Confidence:** High
**Method:** deep-audit (satellite + Street View, captured 2026-03)

## Location confirmation (Step 0)
Given coords (34.489154, -82.654637) landed directly on the target. Web search
confirmed 433 Sayre St = "Anderson Bakery," a Kroger Co. bread/cake plant.
Street View along Sayre St shows the brick wall lettered **"ANDERSON BAKERY ·
433 SAYRE STREET"**, positively identifying the building. The large industrial
plant fronting Sayre St (west side), oriented roughly NW-SE at ~30-40° off
north, is the bakery. (The separate large white building to the SE in the wide
view is an unrelated facility, excluded.)

## Key views
- **z17/z18 wide:** Single connected L-shaped plant fronting Sayre St on the
  west; truck operations (docks + drop yard) on the NE/east; employee/car
  parking on the SW; tree line on the east. Building sits at an angle, so the
  perimeter and all sub-zones are traced as rotated polygons.
- **z19/z20 yard:** NE building face has a long bank of dock doors with ~10-15
  trailers backed in; the open NE yard holds rows of ~25-35 angled drop
  trailers (clear dedicated drop yard).
- **Street View entrance (north driveway off Sayre St, 2026-03):** truck
  driveway runs between the office wing (left) and the main bakery wall (right);
  a **chain-link sliding gate + fence line crosses the truck lane** a short
  distance in, with trailers/a truck parked just beyond. Cones/bollards mark the
  lane. The approach from the public road to the gate is short.

## Gate / guard-shack / dock determinations
- **truckGate = true** — chain-link sliding gate + perimeter fence across the
  truck lane, visible in multiple Street View headings (110-130°).
- **guardShack = false / remoteGs = true** — no distinct standalone booth with
  multi-side windows beside the lane. The office wing abuts the gate; check-in
  is most likely office/badge rather than a dedicated shack. Flagged uncertain
  (medium confidence on this pair).
- **dockDoors = "10-25"** — long single dock bank on the NE face; ~15-20 doors
  estimated from backed trailers (banded, flagged uncertain).
- **dropYard = true / dropArea = "25-50"** — dedicated open trailer-storage yard
  on the NE with rows of parked drop trailers.

## Yard zones & counts measured
- **perimeter:** 8-vertex rotated ring tracing the fenced parcel; ~7.5 acres
  (shoelace ≈ 6.3 ac on traced vertices; rounded up modestly for trace
  conservatism).
- **truckGate:** quad at the north entrance pinch off Sayre St.
- **dropYards:** one ring over the NE angled-trailer yard.
- **dockAprons:** one long rotated quad hugging the NE dock face.
- **staging:** none clearly delineated (postGateStaging inferred true from the
  paved holding area inside the gate before the docks).
- Metrics: dockDoorCount ~18, trailersVisible ~28, capacity ~40, 1 truck gate,
  1 building, rail false (no spur).

## Setting / other flags
- **urbanRural = Urban** — within Anderson, SC city fabric; residential streets
  immediately east, commercial Sayre St frontage. connectivityIssue false.
- **backupSensitive = true** — short approach + gate close to Sayre St; an
  inbound queue could spill onto the public road.
- **entryExitTogether = true**, entryLanes 1 / exitLanes 1, single gate.
- No truck scale, no campus (single building), ship/receive not separated.

## Web findings
Kroger Co. bakery (Baking Business directory lists The Kroger Co.; local
listings confirm "Anderson Bakery" producing bread and cake at 433 Sayre St,
24/7 operation). Corroborates a single-product bakery plant with active truck
dock operations.

## Final confidence
**High** on location, gate presence, dock/drop-yard layout, and perimeter.
Medium on the guardShack-vs-remote check-in distinction and the exact dock-door
count (both flagged in uncertainFields).
