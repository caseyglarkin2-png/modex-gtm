# Deep-Audit Dossier — Pepperidge Farm, Lakeland FL (idx 10)

## Facility
- **Name:** Pepperidge Farm - Lakeland FL
- **Type:** Manufacturing - bakery and crackers (bread, cookies, crackers,
  pastries, frozen breads for the Southeastern US)
- **Address:** 2222 Interstate Drive, Lakeland, FL 33805
- **Resolved center:** 28.07405, -81.98150

## Location confirmation
Roster coords (28.074353, -81.981258, ROOFTOP, moved 5684 m) landed on the
correct building. Satellite probes z16-z22 show a large industrial bakery on
the north side of Interstate Drive, flanked by I-4. The address 2222 Interstate
Drive matches. Note: a separate "PACE" building stands across Interstate Drive
to the south — distinct facility, not part of this audit. The Pepperidge Farm
plant opened in 1987. Yelp marks the retail/outlet listing as CLOSED, but the
2026 Maxar imagery shows an active operation (trailers at docks, running
process equipment), so it was audited as operational.

## Key views
- **Wide (z16-18):** Large single industrial building, complex process roof;
  employee parking on the north; trailers along the south and SW; I-4 on the NW.
- **South face (z20):** Long dock bank with ~15-24 trailers backed in plus many
  empty dock positions; deep paved apron.
- **NW corner (z20):** Trailer drop yard with parked trailers (no tractors).
- **Entrance (z21-22):** Truck driveway crosses Interstate Drive and enters
  through a single gap in the perimeter fence.

## Gate / guard-shack determination
- **truckGate: TRUE.** A continuous chain-link perimeter fence runs along
  Interstate Drive. The truck driveway enters through one controlled gap in the
  fence (~28.0733, -81.9819). Web listings explicitly state that visitors must
  "show a driver's license at the gate" to get a parking pass — confirming a
  manned/controlled entry.
- **guardShack: TRUE.** A small ~1-vehicle-footprint structure sits on the east
  side of the driveway opening at the property line — a gatehouse/guard booth.
  A second small structure is visible near the dock apron at the entry.
- **remoteGs: FALSE.** Guard shack present, so not remote/kiosk check-in.

## Yard zones and counts
- **Perimeter:** ~38 acres; box {S 28.07270, W -81.98400, N 28.07600, E -81.97850}.
- **truckGate box:** the fenced driveway opening on Interstate Drive.
- **dropYards:** one — NW-corner trailer storage.
- **dockAprons:** one — long south-face dock apron.
- **staging:** postGateStaging inferred (deep apron inside the gate).
- **yardMetrics:** dockDoorCount ~44 (band 25-50), trailersVisible ~24,
  trailerParkingCapacity ~40, 1 truck gate, 1 building, ~38 acres,
  not rail-served.

## Web findings
2222 Interstate Drive, Lakeland FL — Pepperidge Farm bakery/cracker plant for
the Southeastern US; phone (863) 688-4000; opened 1987. Public outlet access
historically on Saturdays with driver's license required at the gate (the gate
detail corroborates the controlled-entry classification).

## Final confidence
**High.** Building positively identified; the fenced perimeter, single
controlled driveway, and gatehouse structure are clearly visible at z21-22, and
the "driver's license at the gate" web detail independently confirms a manned
gate. Dock and trailer counts are honest overhead estimates (flagged).

### 3-line summary
- Gate verdict: YES — single controlled truck gate through a fenced perimeter.
- Guard-shack verdict: YES — small gatehouse/booth at the driveway opening.
- Confidence: high.
