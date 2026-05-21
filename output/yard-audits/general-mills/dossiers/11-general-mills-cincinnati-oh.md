# Deep-Audit Dossier — General Mills, Cincinnati OH (idx 11)

## Facility
- **Name:** General Mills - Cincinnati OH
- **Type:** Manufacturing Plant (cereal)
- **Address:** 11301 Mosteller Road, Cincinnati (Sharonville), OH 45241
- **Resolved center:** 39.27900, -84.43170

## Step 0 — Location confirmation
Roster coords (39.277811, -84.431052, GEOMETRIC_CENTER, 90 m) landed on the GM
property. Satellite probing (z16-z20) and a 2025-06 Street View pass along
Mosteller Rd positively identified a large multi-story brick manufacturing
plant with extensive process equipment, silos, and tanks — consistent with a
cereal plant. Web search confirmed General Mills operates a cereal plant at
11301 Mosteller Rd, Sharonville/Cincinnati OH 45241 (~100 employees, plant
manager Chad Kerlin). Center re-pinned to the building/yard centroid.

## Key views
- **Wide satellite (z16-17):** GM plant sits in the dense Sharonville
  industrial park, surrounded by other industrial buildings. A rail line runs
  along the southwest edge behind a tree buffer.
- **Tight satellite (z19-20):** Building's full **west face** is lined with a
  continuous row of ~28 trailers backed into dock doors. A wide dark-asphalt
  truck yard wraps the west/northwest. A separate row of parked trailers (drop
  yard) sits further west.
- **Street View (2025-06), Mosteller Rd frontage:** Brick multi-story plant
  set behind an **open employee parking lot fronting the road**. No perimeter
  fence, no barrier arm, no guard booth at any point along the frontage.
- **South:** Rail line marks the south boundary; the lot south of the tracks
  is a separate (non-GM) pipe/material storage yard.

## Determinations
- **Truck gate:** FALSE. No barrier arm, sliding/swing gate, or checkpoint
  pinch-point at the Mosteller Rd frontage in any Street View heading. The
  truck driveway enters uncontrolled at the SE corner. (Listed uncertain — an
  internal gate set back from the road cannot be fully ruled out, but nothing
  visible.)
- **Guard shack:** FALSE. No small staffed booth near the entrance.
- **Remote GS:** FALSE — no gate, so not applicable.
- **Docks:** 25-50 band (~28 doors), single continuous dock bank on the west
  building face; ship/receiving not physically separated.
- **Drop yard:** TRUE — a distinct row of parked trailers in the west yard,
  separate from dock-apron trailers.
- **Campus / multipleFacilities:** TRUE — main warehouse/production block plus
  a dense south process area (silos, tanks, several smaller buildings).
- **Staging:** Post-gate staging TRUE (deep paved yard inside the property
  before docks); no dedicated pre-gate staging apron on the public road.
- **Driveway:** Long — the internal approach to the west docks can hold a 3+
  truck queue.
- **Urban/Rural:** Urban — dense Cincinnati-metro industrial fabric.
- **Rail:** Line runs along the SW edge but no spur enters the property.

## Yard metrics
- dockDoorCount ~28, trailersVisible ~34, trailerParkingCapacity ~45
- truckGateCount 1, buildingCount ~4, siteAreaAcres ~23
- railServed false

## Web findings
General Mills cereal plant, 11301 Mosteller Rd, Sharonville/Cincinnati OH
45241; phone (513) 771-8200; ~100 employees; grain/oilseed milling industry.

## Confidence
**High.** Building unambiguously identified and corroborated. Imagery clear.
`truckGate` and `exitLanes` flagged uncertain — the frontage is open with no
visible control, but an internal/set-back gate is not fully excludable.
