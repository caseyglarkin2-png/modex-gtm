# Deep-Audit Dossier — Alma Foods (Alma, KS) — idx 08

**Account:** Hormel Foods
**Facility type:** Production Facility (Hormel refrigerated entrees + foodservice BBQ)
**Resolved location:** ~110/114 E First St, Alma, KS 66401
**Locked center:** 39.0110, -96.2879
**Confidence:** high

## Step 0 — Location resolution
Roster gave the address as "215 Missouri St" with coords (39.012236,
-96.289857). The roster point landed on a block in Alma but not on the plant.
Web research (Wabaunsee County business directory, USDA FSIS, Waze, Bandana
job listings) consistently identifies the Hormel/Alma Foods plant at
**110/114 E First Street, Alma KS 66401**. Satellite probing southeast of the
roster pin found a metal industrial plant with process equipment and parked
trailers; Street View (captured 2023-08) confirmed an industrial plant with an
office annex in a small-town industrial pocket. Locked center 39.0110,
-96.2879.

## Key views
- **Wide z17:** Alma is a small Flint Hills town; the plant sits in a modest
  industrial pocket on the SE side, beside a rail line.
- **z18/z19 plant:** A main light-roofed processing building, with dark-roofed
  secondary shop/warehouse buildings to the west and a small office annex in
  front. Open gravel/dirt yard.
- **z20 south yard:** ~8-9 trailers parked in an angled fan along the rail line;
  2-3 more trailers scattered near the dock area.
- **Street View (2023-08):** Open small-town industrial site — gravel streets,
  vehicles parked right up against the buildings, a residential house directly
  across the street. No perimeter fence, no gate, no booth.

## Gate / guard-shack / dock determinations
- **Truck gate: FALSE.** No barrier arm, sliding gate, or controlled
  checkpoint. The site is fully open to the surrounding gravel town streets.
  Single open driveway access (`truckGateCount` 1 reflects the access point,
  not a controlled gate).
- **Guard shack: FALSE.** No booth structure anywhere. A small open
  small-town plant.
- **Remote GS: FALSE** — no gate, not applicable.
- **Docks:** Modest — a few dock doors with trailers backed in along the
  south/SW building faces. Estimated **0-10** band (~7 doors). Low confidence
  from overhead imagery only.
- **Drop yard: TRUE.** ~8-9 trailers parked in an angled row in the south
  yard along the rail. `dropArea` 0-10 band.
- **Ship/Rcv separate: FALSE** — single small dock cluster.

## Yard zones and counts
- **Perimeter:** ~211 m (N-S) × ~164 m (E-W) ≈ **8.5 acres**.
- **Truck gate zone:** none (open site) — `truckGate` geofence left null.
- **Drop yard:** angled trailer row in the south yard along the rail.
- **Dock apron:** south/SW building face.
- **dockDoorCount ≈ 7, trailersVisible ≈ 11, trailerParkingCapacity ≈ 14.**
- **buildingCount 4** — main processing building + office annex + 2 secondary
  shop/warehouse buildings; one integrated facility, not a campus.
- **railServed FALSE** — rail line runs along the SE edge but no spur enters
  the property.

## Web findings
Alma Foods is a Hormel Foods subsidiary in Alma, KS — a ~56,000 sq ft facility
with approximately 110 employees producing Hormel refrigerated entrees and
foodservice barbeque products. Small operation in a small Flint Hills town.

## Final confidence: high
Facility identified and the layout is clear from satellite and Street View.
The site is unambiguously an open, ungated small-town plant. The only soft
figure is the dock-door count (estimated from overhead imagery) — flagged in
`uncertainFields`.
