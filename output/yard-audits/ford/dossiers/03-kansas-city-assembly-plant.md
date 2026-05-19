# Deep-Audit Dossier — Ford Kansas City Assembly Plant (idx 3)

## Facility
- **Name:** Ford - Kansas City Assembly Plant, Claycomo MO
- **Type:** Vehicle Assembly Plant (F-150 + Transit)
- **Address:** 8121 US Highway 69, Claycomo, MO 64119
- **Resolved coords:** 39.20250, -94.47700

## Step 0 — Location confirmation
The geocode point (39.203916, -94.475386) landed on the assembly plant. Probing
zoom 14-16 confirmed a single very large integrated assembly plant in Claycomo,
bordered by US-69 and woods, with a rail yard to the SE. Identity is
unambiguous — Kansas City Assembly Plant. Center adjusted to building centroid.

## Key views
- **Zoom 14/15 context:** KCAP sits in a wooded, small-town edge-of-metro
  setting in Claycomo with a separate detached building to the south and a rail
  yard at the SE corner.
- **Zoom 16:** Vast contiguous assembly building with finished-vehicle lots and
  attached/separate structures.
- **SE rail yard (z17):** Substantial multi-track rail yard runs into the
  property, auto-rack rail cars visible — clearly rail-served.
- **NE building face (z18):** Trailers parked along the building face — drop
  yard / trailer storage.
- **SE truck gate (Street View):** **Decisive** — a small multi-window guard
  booth with a uniformed guard standing beside it, a kiosk/card-reader pedestal,
  a stop sign, and a concrete median splitting in/out lanes. Trailers backed
  into dock doors visible just beyond the gate.

## Gate / guard-shack determination
Street View at the SE plant access road is conclusive. **Truck gate: true** —
controlled entrance with a stop sign, card-reader pedestal, and median-divided
in/out lanes. **Guard shack: true** — a clear multi-window booth staffed by a
uniformed guard. Because the booth exists, `remoteGs` is false. The booth plus a
separate kiosk pedestal indicates a layered check-in (`multiStep: true`). The
median splits one entrance into in/out lanes, so `entryExitTogether: true`.

## Yard zones and counts
- **Perimeter:** ~565 acres covering the assembly building cluster, finished-
  vehicle lots, drop yards, dock aprons, and rail yard.
- **Drop yards:** NE building-face trailer storage and a yard near the rail
  yard — `dropYard: true`, `dropArea: 50+`.
- **Dock aprons:** Dock banks on the west face and the NE/SE faces — ship and
  receive run from separate clusters.
- **dockDoorCount ~50, trailersVisible ~60, capacity ~130** — overhead estimates.
- **railServed: true.**

## Web/contextual findings
KCAP builds the F-150 and Transit on two high-volume lines and is one of Ford's
largest plants by employment. Scale, rail, and large trailer yards match the
imagery.

## Confidence
**High.** Facility identity is unambiguous, and the truck gate / guard shack are
directly confirmed in Street View. Door/trailer counts and the presence of a
truck scale are honest overhead estimates, flagged in `uncertainFields`.

### 3-line summary
- Gate verdict: TRUCK GATE — true (Street View shows controlled gate, median-split lanes, kiosk)
- Guard-shack verdict: GUARD SHACK — true (Street View shows staffed multi-window booth)
- Confidence: high
