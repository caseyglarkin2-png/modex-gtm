# Deep-Audit Dossier — idx 03

## Facility
DHL Supply Chain - IDS Fulfillment DC - Salt Lake City UT
Multi-Customer E-Commerce Fulfillment Center — 1711 S 4650 West,
Salt Lake City, UT 84104

## Location resolved
Roster coords (40.734188, -112.001148, ROOFTOP) landed on a warehouse in a
dense industrial park west of Salt Lake City. Web search / LoopNet confirm
1711 S 4650 W, SLC UT 84104 — IDS Fulfillment's West Coast fulfillment center,
~220,000 sq ft temperature-controlled, FDA/OTC-grade, acquired by DHL Supply
Chain (IDS Fulfillment "Powered by DHL"). Building runs N-S; west dock face on
4650 West. Locked center ≈ 40.7341, -112.0012.

## Key views
- **z16/z17 context** — Building sits in a dense multi-building industrial
  park, gridded streets, no rural setting.
- **z18** — Building oriented N-S, dock doors on the west face, trailers backed
  in. Large empty building immediately east.
- **West face (Street View 2021-05 & 2025-07)** — Dock doors with trailers
  (including FedEx units) backing directly off the public road. No fence, no
  gate.
- **South end (Street View 2025-07)** — Office frontage, car parking, open
  driveway. No gate.

## Gate / guard-shack / dock determinations
- **truckGate = false.** Open-access multi-tenant industrial building. The west
  dock face fronts directly onto 4650 West; trucks back off the public street.
  No barrier arm, no sliding/swing gate, no perimeter fence — confirmed in two
  Street View captures.
- **guardShack = false.** No booth at any entrance.
- **remoteGs = false.** No gate at all.
- **dockDoors = 25-50.** ~32 dock doors estimated along the west face.
- **dropArea = 0-10 / dropYard = false.** Only a few trailers parked at the
  docks; no dedicated trailer-storage lot.

## Yard zones & counts
- Perimeter: building parcel, ≈13 acres (~220,000 sq ft building).
- truckGate: none.
- dropYards: none.
- dockAprons: one — west face strip on 4650 West.
- dockDoorCount ≈ 32; trailersVisible ≈ 14; trailerParkingCapacity ≈ 10;
  truckGateCount 0; buildingCount 1; rail not served.

## Web findings
IDS Fulfillment Salt Lake City DC, 1711 S 4650 W — ~220,000 sq ft
temperature-controlled, FDA/OTC-grade, AIB-audited; serves western U.S.
IDS Fulfillment acquired by DHL Supply Chain (May 2025).

## Confidence
**high** — facility positively identified, open-access layout confirmed by two
Street View captures and satellite. Dock count is an honest overhead estimate
(flagged in uncertainFields).
