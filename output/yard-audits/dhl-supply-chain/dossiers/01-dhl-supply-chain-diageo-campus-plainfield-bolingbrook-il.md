# Deep-Audit Dossier — idx 01

## Facility
DHL Supply Chain - Diageo Campus - Plainfield/Bolingbrook IL
Dedicated Customer Distribution Center (spirits) — 1701 Remington Blvd, Bolingbrook, IL 60490

## Location resolved
Roster coords (41.649974, -88.143696, ROOFTOP) landed directly on a large
single-story distribution warehouse oriented NW-SE off Remington Blvd. Web
search confirms "DHL Supply Chain - Diageo" operates at 1701 Remington Blvd,
Bolingbrook IL 60490 (Diageo North America spirits distribution; lease renewed
2021). Street View on the NW gate shows "DHL" branding on the building and
"DHL ZIM" signage — positive ID. Locked center ≈ 41.6499, -88.1437.

## Key views
- **z16/z17 context** — Large diagonal warehouse with dock doors on both long
  faces. A separate large building sits immediately east (different facility).
  Quarry/excavation to the west, farmland north, Remington Blvd along the
  south/southwest.
- **z18 building** — Cross-dock layout: trailers backed in along both the east
  and west faces.
- **NW corner (z20 + Street View 2019-07)** — Truck gate located here: a
  chain-link cantilever sliding gate across the truck driveway. Driver
  instruction sign at the fence.
- **East/west truck lanes** — Long rows of parked unhitched trailers (drop
  yard) flanking the building.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Chain-link cantilever sliding gate confirmed across the
  truck driveway at the NW corner. The whole property is chain-link fenced.
- **guardShack = false.** No booth structure at the gate. The driver-instruction
  sign reads: "Form single line on right side of driveway / Wait in truck until
  you reach front of line / Pull up to fence to check in." This describes a
  fence-side check-in, not a manned booth.
- **remoteGs = true.** Gate present + no guard shack + "pull up to fence to
  check in" = remote/kiosk/call-box check-in.
- **dockDoors = 50+.** Cross-dock building, dock doors on both long faces, many
  trailers backed in on each side. Estimated ~90 doors total.
- **dropArea / dropYard = true, 50+.** Dozens of unhitched trailers parked in
  rows along the west truck lane.

## Yard zones & counts
- Perimeter: whole fenced property, ≈47 acres.
- truckGate: NW-corner sliding gate.
- dropYards: west-side trailer rows.
- dockAprons: two — west face and east face.
- dockDoorCount ≈ 90 (band 50+ confident); trailersVisible ≈ 95;
  trailerParkingCapacity ≈ 60; truckGateCount 1; buildingCount 1; rail not
  served.

## Web findings
DHL Supply Chain - Diageo at 1701 Remington Blvd, Bolingbrook IL — Diageo North
America spirits distribution facility, DHL-operated; lease renewed Dec 2021.
Roster notes it as a marquee electrification site (Orange EV 2015, Nikola
hydrogen Class 8 2024).

## Confidence
**high** — facility positively identified, gate and remote-check-in clearly
documented in Street View. Dock count and trailer capacity are honest overhead
estimates (flagged in uncertainFields).
