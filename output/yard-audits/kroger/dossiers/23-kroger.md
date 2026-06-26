# Deep-Audit Dossier — idx 23 — Crossroad Farms Dairy (Kroger)

**Facility:** Crossroad Farms Dairy (Dairy Plant) — Kroger-owned, Plant #1080
**Address:** 400 S Shortridge Rd, Indianapolis, IN 46219
**Resolved center:** 39.76560, -86.04180
**Confidence:** High
**Method:** deep-audit

## Step 0 — Location confirmation
The supplied coords (39.765108, -86.041373) land directly on a large white-roofed
industrial plant. Web search confirms this is Crossroad Farms Dairy, a ~230,000 sq ft
Kroger milk/beverage/ice-cream plant opened 1972 (dairyfoods.com, foodengineeringmag.com,
buzzfile "Kroger Limited Partnership II"). Street View at the front shows a Crossroad Farms
monument sign + cow statue + windsock on silos — positively the dairy, distinct from the
Kroger DC buildings visible to the N and S in the z16 frame. The plant is bounded by I-465
ramps to the W, a rail line + S Shortridge Rd to the E, woods to the N, and a loop road to
the S. Coords are accurate; nudged center slightly N to building centroid.

## Key views
- **z16/z17 wide:** Large single plant footprint with extensive reefer-trailer yards
  wrapping the W/SW/N edges along the I-465 embankment; dense residential subdivision
  immediately E across Shortridge; other industrial/DC clusters N and S (a campus-adjacent
  industrial corridor, but this property is one facility).
- **z18/z19 tight:** White plant building with rooftop process equipment + silos. Dock
  banks on the W building face and an interior dock court; detached cooler/dock building to
  the W. Car parking lots on the E (Shortridge) side. Large open paved apron to the S.
- **Street View (Shortridge Rd, 2022-09 / 2024-07):** Front fence line is continuous
  chain-link. Single vehicle entrance = open driveway gap with the Crossroad Farms brick
  monument sign and cow statue beside it. No barrier arm, no sliding gate, no staffed booth.
  Flagpoles, employee lot, plant building with silos behind.

## Gate / guard / dock determinations
- **truckGate = false.** Perimeter is fenced, but the lone entrance off Shortridge is an
  uncontrolled open driveway shared by cars and trucks. No barrier arm, gate, or checkpoint
  pinch-point. (Flagged uncertain — fenced site with an open gap.)
- **guardShack = false.** The brick structure at the entrance is the monument sign, not a
  guard booth. No staffed booth anywhere at the entrance.
- **remoteGs = false.** No gate present, so remote check-in does not apply.
- **postGateStaging = true; drivewayLong = true.** A deep paved apron south of the building
  gives 3+ trucks of internal queuing room before the docks.
- **fastLaneOpportunity = true.** Wide entrance apron and deep yard — physical room to add a
  dedicated truck bypass lane.
- **dockDoors = "25-50" (~28).** West building face + interior dock court + detached cooler
  dock building; many trailers backed in (partial occlusion).
- **dropArea = "50+"; dropYard = true.** Long rows of unhitched reefer trailers along the N,
  NW and SW edges along the I-465 ramp — large dedicated trailer storage.

## Yard zones & counts
- **Perimeter:** 7-vertex ring tracing the fenced lot — Shortridge/rail on the E (true N-S),
  the I-465 ramp angling NW-SW on the W, woods on the N, loop road on the S. ~33 acres.
- **truckGate:** quad over the open Shortridge driveway entrance.
- **dropYards:** three rings — N edge, the long W/SW ramp-side rows, and a S/SW cluster.
- **dockApron:** one ring on the W building face dock line.
- **staging:** S paved apron (post-gate queuing).
- **Metrics:** ~28 dock doors, ~70 trailers visible, ~110 trailer capacity, 1 gate,
  2 buildings (main plant + detached cooler/dock), rail-adjacent but not rail-served.

## Web findings
Kroger Plant #1080, opened 1972, ~230,000 sq ft, ~250-499 employees; produces milk,
beverages, water, ice cream and novelties; serves Indianapolis/Chicago + national ice-cream
distribution. Operated by Kroger Limited Partnership II.

## Final confidence: High
Facility identity, layout, dock and drop-yard reads are unambiguous. Open-gate call rests on
2022/2024 Street View of the single entrance; flagged in uncertainFields along with the
dock-door count estimate.
