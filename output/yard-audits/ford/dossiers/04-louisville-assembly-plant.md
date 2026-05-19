# Deep-Audit Dossier — Ford Louisville Assembly Plant (idx 04)

## Facility
- **Name:** Ford - Louisville Assembly Plant, Louisville KY
- **Type:** Vehicle Assembly Plant (Ford Escape, Lincoln Corsair)
- **Address:** 2000 Fern Valley Rd, Louisville, KY 40213
- **Resolved center:** 38.15470, -85.72850

## Step 0 — Location confirmation
Roster geocode (38.156554, -85.727294, ROOFTOP, moved 15 m) landed on the
plant rooftop. Satellite probes at z15-z17 confirm the unmistakable large
assembly complex immediately south of Louisville International Airport / UPS
Worldport, bounded by Fern Valley Rd to the north, Grade Lane to the west, and
a CSX rail corridor to the south. Web research (Wikipedia, Ford Authority,
AmericanAutoWorker) confirms ~3.15M sq ft of building and ~180 acres of
building footprint within a larger fenced campus. Center adjusted slightly to
the building centroid.

## Key views
- **z15/z16 wide:** Single large assembly complex with vehicle storage lots to
  the north, rail yard along the south side, trailer/dock clusters west and
  south. Airport on the NW edge.
- **East side (z18/z20):** A blue-roofed gate booth with gate arms and
  crosswalk markings controls the internal road between the plant and the
  finished-vehicle storage lots — a clear secondary checkpoint.
- **South side (z18/z19):** Rail yard with auto-rack rail cars the full length
  of the building; rows of parked trailers (drop yard). Dock doors with
  trailers backed in along the south building face.
- **West side (Grade Lane, z18/z19 + Street View):** Continuous perimeter
  chain-link fencing; large trailer drop yard with dozens of trailers/containers
  and railcars.
- **Street View:** Fern Valley Rd main entrance shows the Ford-branded
  employee/visitor entry with a canopy; perimeter fencing runs along Grade Lane
  and Fern Valley Rd frontages.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Secured campus with continuous perimeter fencing;
  controlled truck driveway off Fern Valley Rd into the west dock/yard area,
  plus a distinct internal vehicle-control gate on the east side.
- **guardShack = true (uncertain).** Ford assembly plants run staffed
  gatehouses; a booth with gate arms is clearly visible at the internal east
  checkpoint. The perimeter truck-gate booth itself could not be crisply
  isolated because Street View panos sit on the secured campus loop road.
- **remoteGs = false.** Staffed gatehouse model.
- **multiStep = true.** Outer perimeter truck gate plus a separate internal
  vehicle-control checkpoint before the finished-vehicle lots.
- **dockDoors = 25-50.** ~45 doors counted across south and west faces.
- **shipRcvSeparate = true.** Separate dock banks on south and west faces plus
  a distinct east-side finished-vehicle dispatch.

## Yard zones and counts
- **Perimeter:** ~277 acres (full fenced campus including storage lots).
- **Drop yards:** West-side trailer yard along Grade Lane; south trailer rows
  near the rail corridor.
- **Dock aprons:** South building face; west building face.
- **Metrics:** ~45 dock doors, ~90 trailers visible, ~160 trailer capacity,
  2 truck gates, 6 buildings, rail-served = true.

## Web findings
- Wikipedia / Ford Authority / AmericanAutoWorker: ~3.15M sq ft, ~180 acres
  building footprint, adjacent to Louisville International Airport.
- WDRB: Ford has expanded Louisville operations via nearby land purchases.

## Final confidence: HIGH
Facility unambiguous; layout, rail service, docks, and fencing clearly read
from imagery. Guard-shack at the perimeter truck gate and exact dock count are
the only uncertain items.
