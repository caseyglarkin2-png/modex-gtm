# Deep-Audit Dossier — Burke Corp. (Nevada, IA) — idx 06

**Account:** Hormel Foods
**Facility type:** Production Facility (fully-cooked meats / pizza toppings / pepperoni)
**Resolved location:** 1516 S D Avenue, Nevada, IA 50201
**Locked center:** 42.0085, -93.4392
**Confidence:** medium

## Step 0 — Location resolution
The roster coordinates (42.026791, -93.448181) placed the pin in a residential
neighborhood in central Nevada, IA — confirmed by satellite probes showing
single-family homes, a school, and small light-industrial sheds near the rail
line. Burke is a large fully-cooked-meat plant, none of which matched.

Web research surfaced the real address: **1516 S D Avenue, Nevada, IA 50201**
(Burke Marketing Corporation), corroborated by the Ames Chamber of Commerce
member listing, Panjiva supplier report, and USDA FSIS inspected-establishment
records. Satellite probe at 42.0078, -93.4389 immediately revealed a large
industrial plant with loading docks and parked trailers on the south edge of
town beside the US-30 divided highway. Roster pin was ~2.3 km off.

## Key views
- **Wide z15/z17:** Burke campus sits on the south edge of Nevada, bounded by
  perimeter roads on the north and west and the US-30 frontage on the south.
  Open farmland to the southwest. Multiple buildings: a large main plant, a
  secondary building cluster to the west, plus process/utility structures.
- **z18 west side:** Clear multi-building campus. A through-road runs between
  the west buildings and the main plant. Trailer rows visible north and south.
- **z19 east face:** Long row of ~20+ parked trailers along the east property
  edge (drop yard); additional staged trailers in the south-center yard.
- **z20 SW dock bank:** A diagonal dock face with ~12-14 trailers backed in —
  a substantial active dock bank.
- **Street View:** All available panos (captured 2024-08) are inside Burke's
  own employee parking lots — no Street View coverage on the bounding public
  roads. No gate or booth seen in any pano.

## Gate / guard-shack / dock determinations
- **Truck gate: FALSE.** No barrier arm, sliding/swing gate, or checkpoint
  pinch-point at any perimeter road junction. The truck driveways run open
  from the public roads into the campus yard. Two truck driveway connections
  exist (NW and toward the east), hence `truckGateCount: 2` as entrance count,
  but neither is a *controlled* gate.
- **Guard shack: FALSE.** No small 1-3-vehicle-footprint booth beside a
  controlled lane. Two small structures near the NW driveway are
  office/maintenance-scale buildings, not gate booths.
- **Remote GS: FALSE** — no gate, so not applicable.
- **Docks:** Diagonal SW dock bank (~12-14 trailers backed in) plus additional
  dock doors on the north and east building faces. Total estimated **25-50**
  band (~35 doors). Roof imagery is heavily overexposed so the count is a
  best-effort estimate — flagged low confidence.
- **Drop yard: TRUE.** Dedicated trailer storage — east-edge row of 20+
  trailers and additional drop rows along the north. `dropArea` 25-50 band.
- **Ship/Rcv separate: TRUE (inferred)** — two distinct dock clusters on
  different building faces.

## Yard zones and counts
- **Perimeter:** ~378 m (N-S) × ~438 m (E-W) ≈ **41 acres**.
- **Truck gate zone:** NW driveway entrance off the perimeter road.
- **Drop yards:** east-edge trailer row; north drop rows.
- **Dock apron:** diagonal SW dock bank.
- **dockDoorCount ≈ 35, trailersVisible ≈ 45, trailerParkingCapacity ≈ 70.**
- **buildingCount 4** (main plant + west building + 2 process/utility blocks).
- **railServed FALSE** — no spur into the property.

## Web findings
Burke Corporation (a Hormel Foods company since 2007) manufactures fully-cooked
meats and pizza toppings/pepperoni in Nevada, IA. Family-founded 1974. The
Nevada plant is the company headquarters and primary manufacturing site.

## Final confidence: medium
Facility positively re-identified and the layout is clear. Confidence held at
medium because the gate/guard-shack call relies on satellite only (no Street
View on the public perimeter roads) and the dock-door count is an estimate
from overexposed roof imagery.
