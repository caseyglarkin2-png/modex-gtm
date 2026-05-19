# Deep-Audit Dossier — Coca-Cola Atlanta Syrup Plant (idx 1)

## Facility
- **Name:** Coca-Cola Atlanta Syrup Plant
- **Type:** Concentrate / Syrup Plant
- **Address:** 3791 Browns Mill Rd SE, Atlanta, GA 30354
- **Locked coordinates:** 33.65735, -84.39335

## Step 0 — Location confirmation
The roster point (33.654623, -84.393365) sat near the southern trailer yard.
Web search returned a corroborating coordinate (33.6573516, -84.3933703). A z18
satellite probe at that point showed a large gray-roofed industrial building
with extensive diagonal trailer parking and red Coca-Cola branded trucks parked
on the apron. Street View on Browns Mill Rd SE (captured 2025-03) shows a
"VISITOR ENTRANCE" sign and a roadside "3791" address marker directly in front
of the facility, positively confirming this is the Atlanta Syrup Plant. The
plant fronts I-75 to the west and is bounded by an active rail line to the east.

## Key views
- **z17/z18 overview:** Single large manufacturing building with attached
  warehouse, plus a few smaller satellite structures (guardhouse-adjacent
  buildings, a maintenance/scale-house-sized building near the east yard).
  Surrounded by paved truck yard.
- **z19/z20 entrance:** Truck driveway from Browns Mill Rd SE leads to a
  checkpoint with a guard canopy/booth and a barrier across the truck lane.
- **North face:** Bank of dock doors with red Coca-Cola trucks parked at the
  apron; trailer parking to the north.
- **South & east yard:** Dozens of diagonal trailer-parking stalls — a true
  on-site drop yard.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Street View shows a checkpoint structure near the
  flagpoles; z20 satellite shows a barrier line across the inbound truck lane.
- **guardShack = true.** A small staffed booth / covered canopy sits beside the
  truck lane at the entrance drive, separate from the main building.
- **remoteGs = false** — a staffed booth is present.
- **dockDoors = 25-50.** Dock banks visible on the north face (red trucks
  backed in) and a second bank on the southwest face; estimated ~35 doors total.
- **shipRcvSeparate = true (medium confidence)** — two distinct dock clusters
  on different building faces.

## Yard zones and counts
- **Perimeter:** ~33 acres along the I-75 frontage, bounded by rail to the east.
- **Drop yards:** Two large diagonal-stall trailer lots (south/east and north),
  ~120 trailers visible, capacity ~160.
- **Dock aprons:** North face apron and southwest face apron.
- **Staging:** Paved apron at the entrance drive, both pre- and post-gate.
- **Rail served:** Active rail line on the east boundary with a spur into the
  south yard.
- **truckGateCount:** 1 controlled truck entrance.
- **buildingCount:** ~4 (main plant + warehouse + small ancillary structures).

## Web findings
Waze, Apple Maps, LoopNet (APN 14-0066-LL-089-6) and Manta all list the
facility as the Coca-Cola Atlanta Syrup Plant / Syrup Branch at this address;
contact (404) 676-5151. It is a long-standing TCCC company-owned concentrate
plant.

## Final confidence
**High.** Location positively confirmed by address marker and visitor-entrance
signage in Street View; gate, guard booth, dock banks and drop yard all visible
in satellite and Street View imagery. `scale` and `shipRcvSeparate` flagged as
uncertain.
