# Deep-Audit Dossier — Pepperidge Farm, Bloomfield CT (idx 08)

## Facility
- **Name:** Pepperidge Farm - Bloomfield CT
- **Type:** Manufacturing - bakery (fresh breads, rolls, croutons, stuffing)
- **Address:** 1414 Blue Hills Avenue, Bloomfield, CT 06002
- **Resolved center:** 41.86885, -72.71900

## Location confirmation
Roster coords (41.868955, -72.718849, ROOFTOP, moved 2020 m) landed on the
correct building. Satellite probes z16-z21 show a single large dark-roofed
industrial building consistent with a 265,000 sq ft bakery. Web search
(Yelp, Manta, Bakery Online) confirms Pepperidge Farm at 1414 Blue Hills Ave,
producing breads/rolls/croutons/stuffing — a former Bakery "Plant of the Year"
award winner. Center adjusted slightly SE to the building centroid.

## Key views
- **Wide (z16-17):** Single building set back from Blue Hills Avenue, which runs
  NW-SE along the SW side. Industrial park context — other large warehouses
  adjacent. Solar array on land to the east. Woodland around the north/east.
- **North face (z20):** Long dock bank with ~15+ trailers backed in to dock
  doors; truck circulation road wraps the north side.
- **NW corner (z20):** Dedicated trailer drop yard — multiple rows of parked
  trailers without tractors (~20+ trailers, capacity higher).
- **SE end (z19-20):** Process silos, additional dock/truck positions on the
  SE face, employee parking with a flag/monument circle facing the road.
- **Entrances:** Two driveways onto Blue Hills Avenue.

## Gate / guard-shack determination
- **truckGate: FALSE.** The NW driveway meets Blue Hills Avenue at a signalized
  intersection (traffic light) and is a wide-open paved entrance — Street View
  (2025-07, heading 25-35°) shows no barrier arm, no sliding/swing gate, no
  checkpoint pinch-point. The SE driveway is likewise an open road junction.
  Some perimeter fencing exists along the inner driveway, but the entrances
  themselves are uncontrolled.
- **guardShack: FALSE.** No staffed booth at either entrance. A small utility
  cabinet sits at the NW driveway mouth — not a guard booth (no multi-window
  structure, no booth footprint beside a gate lane).
- **remoteGs: FALSE.** No gate at all, so no remote check-in classification.

## Yard zones and counts
- **Perimeter:** ~33 acres; box {S 41.86640, W -72.72120, N 41.87055, E -72.71690}.
- **truckGate box:** placed at the NW driveway mouth (primary truck route to the
  drop yard / north docks) for reference, though the gate flag is false.
- **dropYards:** one — NW-corner trailer storage lot.
- **dockAprons:** two — long north-face apron and the SE-side dock apron.
- **staging:** none clearly identifiable.
- **yardMetrics:** dockDoorCount ~38 (band 25-50), trailersVisible ~42,
  trailerParkingCapacity ~55, 2 truck entrances, 1 building, ~33 acres,
  not rail-served.

## Web findings
1414 Blue Hills Ave, Bloomfield CT — Pepperidge Farm wholesale bakery, phone
(860) 286-6400; 265,000 sq ft plant producing fresh breads, rolls, croutons,
and stuffing; previously recognized as a Bakery "Plant of the Year."

## Final confidence
**High.** Building positively identified and corroborated; gate/guard-shack
determinations backed by clear 2025-07 Street View of both entrances. Dock and
trailer counts are honest overhead estimates (flagged in uncertainFields).

### 3-line summary
- Gate verdict: NO truck gate — both driveways open and uncontrolled.
- Guard-shack verdict: NO guard shack at either entrance.
- Confidence: high.
