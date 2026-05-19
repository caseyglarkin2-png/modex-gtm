# Deep-Audit Dossier — Progressive Processing (Dubuque, IA)

**Roster idx:** 3
**Type:** Production Facility
**Resolved center:** 42.48790, -90.76610
**Confidence:** High

## Location resolution
The roster address ("11400 Stratton Dr") and coordinates (42.41162,
-90.658333, "APPROXIMATE", 9396 m off) were **wrong**. Web research established
the correct address: **1205 Chavenelle Court, Dubuque, IA 52002**, in the
Dubuque Industrial Center West. Coordinates 42.48810, -90.76661 were confirmed
by satellite probing at z16-z17, which showed a large (~348,000 sq ft)
single-building production plant with a trailer drop yard — matching the
facility. Web confirms: Progressive Processing LLC, a wholly owned Hormel
subsidiary, opened 2010, ~400 employees, makes Hormel Compleats microwave
meals, chunk-chicken items, bacon toppings and SPAM products.

## Key views
- **z16/z17 overview** — large single plant building in an industrial park,
  parking lot to the east, trailer drop yard to the SW, loop access road.
- **South dock face (z19)** — clear dock face along the south building wall
  with ~20+ trailers backed in plus tanks/equipment.
- **SW trailer yard (z19)** — multiple rows of parked trailers (~30-40),
  partly on gravel.
- **Access loop (z20)** — wide open paved truck apron south of the docks; no
  gate, booth, or fence.
- **Street View (Chavenelle Court, 2023-05)** — public industrial-park road;
  the plant sits behind a wide landscaped lawn with trees. No perimeter fence,
  no gate, no guard booth visible. Street View does not extend into the plant
  driveway.

## Gate / guard-shack / dock determinations
- **truckGate = false** — Open access; no barrier arm, sliding gate, or
  checkpoint at the entrance, and no perimeter fence around the property.
  Typical modern industrial-park layout.
- **guardShack = false** — No staffed booth anywhere on the property.
- **remoteGs = false** — No gate, so remote check-in does not apply.
- **drivewayLong = true** — Long landscaped approach plus a very wide internal
  truck apron holds a 3+ truck queue.
- **fastLaneOpportunity = true** — Large unused paved apron width south of the
  dock face leaves room for a bypass/express lane.
- **dockDoors = 25-50** — Clear dock face along the south wall with 20+ trailer
  positions plus additional doors. Overhead estimate.
- **dropArea = 25-50** — Multiple rows of parked trailers (~30-40) in the SW
  drop yard.
- **dropYard = true** — Dedicated SW trailer-storage lot, partly unpaved.

## Yard zones and counts
- **Perimeter:** ~37 acres in the Dubuque Industrial Center West.
- **Drop yards:** SW trailer-row lot plus a smaller trailer area near the
  south dock apron.
- **Dock apron:** wide paved strip along the south building face.
- **Staging:** no separately defined staging zone (the wide apron serves it).
- **yardMetrics:** ~30 dock doors, ~55 trailers visible, ~80 trailer capacity,
  1 open truck entrance, 1 main building, not rail-served.

## Web findings
- Progressive Processing LLC: Hormel-owned, opened January 2010, ~400
  employees, 348,000 sq ft; first new Hormel plant in 25+ years.
- Products: Hormel Compleats meals, chunk-chicken, bacon toppings, SPAM.

## Final confidence
**High.** Facility positively re-identified after correcting a badly wrong
roster address/coordinate. Open-site classification (no gate/guard/fence) is
clear from imagery. `urbanRural` is a borderline industrial-park-on-metro-edge
call scored Rural and flagged uncertain; lane counts and the exact dock count
are honest overhead estimates.
