# Deep-Audit Dossier — idx 02

## Facility
DHL Supply Chain - IDS Fulfillment HQ DC - Plainfield IN
Multi-Customer E-Commerce Fulfillment Center — 9431 Allpoints Parkway,
Plainfield, IN 46168

## Location resolved
Roster coords (39.739272, -86.353432, ROOFTOP) landed on a large white-roofed
warehouse in the AllPoints Midwest logistics park, Plainfield IN. Web search
confirms IDS Fulfillment (acquired by DHL Supply Chain May 2025) operates its
HQ DC at 9431 Allpoints Parkway, Plainfield IN 46168 — described as a ~780,000
sq ft facility. Building fronts Allpoints Parkway with car parking and two
retention ponds on the north. Locked center ≈ 39.7392, -86.3534.

## Key views
- **z17/z18** — Single large warehouse oriented N-S, dock doors on both the
  east and west long faces, trailers backed in on both.
- **North end** — Employee car parking, two retention ponds, office frontage on
  Allpoints Parkway.
- **South / SW / SE corners** — Perimeter truck drive wraps the building; east
  and west truck lanes hold rows of unhitched trailers. Grass buffers, no
  fence.
- **Entrance (Street View 2019-06)** — Main driveway from Allpoints Parkway
  runs straight to car parking / office. No gate, no booth, no fence.

## Gate / guard-shack / dock determinations
- **truckGate = false.** Open-campus DC. The Allpoints Parkway driveway is
  unobstructed — no barrier arm, no sliding/swing gate, no checkpoint pinch
  point. No perimeter fence anywhere around the truck yards.
- **guardShack = false.** No booth structure at any entrance.
- **remoteGs = false.** No gate at all, so no remote check-in.
- **dockDoors = 50+.** Cross-dock building, dock doors on both long faces,
  ~70 doors estimated.
- **dropArea / dropYard = true, 50+.** Rows of unhitched trailers on both the
  east and west truck lanes.

## Yard zones & counts
- Perimeter: whole property, ≈36 acres.
- truckGate: none.
- dropYards: two — west lane and east lane.
- dockAprons: two — west face and east face.
- dockDoorCount ≈ 70; trailersVisible ≈ 60; trailerParkingCapacity ≈ 55;
  truckGateCount 0; buildingCount 1; rail not served.

## Web findings
IDS Fulfillment ("Powered by DHL Supply Chain") HQ DC, 9431 Allpoints Pkwy,
Plainfield IN; ~780,000 sq ft; e-commerce fulfillment, ~50,000 packages/day.
Acquired by DHL Supply Chain May 2025 (Indianapolis Business Journal).

## Confidence
**high** — facility positively identified, open-access layout clearly
confirmed by satellite and Street View. Dock count and trailer capacity are
honest overhead estimates (flagged in uncertainFields).
