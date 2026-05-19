# Deep-Audit Dossier — Caterpillar Athens GA Plant (idx 16)

## Resolved location
- Roster gave 250 Dozer Dr, Athens, GA 30606, lat/lng 33.941507,-83.511385
  (geocode ROOFTOP, movedMeters 7). That point actually sits in **woods at a road
  intersection** ~0.7 km SE of the plant — the geocoder placed it on the access
  road, not the building.
- The plant building is the large white-roofed industrial facility just NW.
  Confirmed via Athens Area Chamber of Commerce and Panjiva listings (Caterpillar
  Inc. BCP Athens, 250 Dozer Drive) and Caterpillar's own description: a 250-acre
  campus with 3 buildings totaling 850,000 sq ft producing Mini Hydraulic
  Excavators and Small Track-Type Tractors.
- **Locked center:** 33.94000, -83.51850 (main plant building).

## Key views
- z16-z17 probes: located the main plant building (large rectangular footprint
  running NW-SE), employee parking on the S side, a retention pond SW, and a very
  large finished-goods yard to the NE holding rows of new Cat equipment.
- z18-z19 NW face: a long dock face with ~15-20 dock doors and trailers/containers
  (blue/orange) backed in, plus a covered dock canopy.
- z19/z21 of the entrance: a guard booth on a paved island in the wide entrance
  road at 33.9412,-83.5154.
- Street View (2025-02, 2026-04): the access road from the public road is a private
  internal road with chain-link perimeter fencing; the guard booth (small white
  structure, canopy roof, vehicle parked beside it) is clearly visible at the gate
  with a stop sign; rows of new Cat mini excavators/dozers fill the finished-goods
  yard.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Controlled entrance: a wide multi-lane internal road from
  the public road leads to a checkpoint with a guard booth and stop sign; the whole
  campus is chain-link fenced.
- **guardShack = true.** A small staffed booth (~1-2 vehicle footprint, canopy roof
  over the lane) is positively imaged at the gate in both z21 satellite and 2025
  Street View — unambiguous guard shack.
- **dockDoors = "10-25".** A long dock face along the NW building wall shows ~15-20
  dock doors with trailers/containers backed in (counted from z18-z19 imagery).
- **postGateStaging / drivewayLong = true.** The entrance road is long and wide with
  a paved island, giving 3+ truck stacking depth inside the gate.
- **fastLaneOpportunity = true.** Wide multi-lane entrance with a paved gate island
  gives physical room for an express/bypass lane.

## Yard zones and counts
- **Perimeter:** developed/fenced campus, ~180 acres (box 33.9368-33.9442 N,
  -83.5220 to -83.5110 W). Full parcel with wooded buffer reported ~250 acres.
- **Drop yards:** (1) NW dock-side trailer/container line; (2) very large NE
  finished-goods/equipment yard with rows of new Cat machines plus parked trailers.
- **Dock apron:** NW building face, ~18 doors.
- **buildingCount = 3** (campus → multipleFacilities = true).
- **railServed = false** — no spur into the property.

## Web findings
- Caterpillar BCP Athens: 250-acre campus, 3 buildings, 850,000 sq ft; produces
  multiple sizes of Mini Hydraulic Excavators and Small Track-Type Tractors;
  robotic welding, CNC machining, powder-coat paint, asynchronous assembly line.
- Address confirmed: 250 Dozer Drive, Athens, GA 30606 (Chamber / Panjiva).

## Final confidence: high
Facility positively identified and located; gate, guard shack, docks, and campus
structure all clearly imaged. Dock-door and trailer-capacity counts are honest
overhead estimates and flagged.
