# Deep-Audit Dossier — Ford Dearborn Truck Plant (idx 1)

## Facility
- **Name:** Ford - Dearborn Truck Plant, Dearborn MI
- **Type:** Vehicle Assembly Plant (F-150 / F-150 Lightning)
- **Address:** 3001 Miller Rd, Dearborn, MI 48120
- **Resolved coords:** 42.31280, -83.16400

## Step 0 — Location confirmation
The supplied coordinates (42.313554, -83.164654) land directly on the Dearborn
Truck Plant building, identifiable by its 10.4-acre vegetated **living roof** —
an unmistakable landmark visible at zoom 16-18. The DTP is the central assembly
plant within Ford's Rouge Complex. No relocation needed; coordinates confirmed
ROOFTOP-accurate. Center used for geofencing nudged slightly to building centroid.

## Key views
- **Zoom 15/16 context:** Confirmed the DTP sits inside the sprawling Ford Rouge
  manufacturing campus — dense industrial fabric, multiple large plants, rail
  yards, finished-vehicle marshalling lots in every direction.
- **Zoom 18 building:** The green living roof fills the frame; one very large
  contiguous assembly building.
- **North edge (z19):** Multiple active rail spurs run through the property; a
  rail-served building and a bank of parked box trailers (drop yard) NE of the plant.
- **NW marshalling yards:** Extensive finished-vehicle lots and long covered
  **rail auto-rack loading** structures for outbound F-150s.
- **South/east edges:** Internal roads, employee parking, trailers parked along
  the east building face.

## Gate / guard-shack determination
The Rouge Complex is a **fully fenced, controlled-access industrial campus**.
Street View along Miller Rd shows perimeter fencing, traffic-signal-controlled
entrances, and blue Ford gate signage at the access roads. Ford operates staffed
security gatehouses at Rouge entrances — standard posture for the campus. Truck
gate: **true**. Guard shack: **true**. Because there is a guard shack,
`remoteGs` is false. Given the outer campus gate plus internal plant-specific
checkpoints before the DTP docks, `multiStep` is **true**.

## Yard zones and counts
- **Perimeter:** ~285 acres covering the DTP building plus its immediate truck
  yards, dock aprons, and the adjacent finished-vehicle/rail marshalling lots.
- **Dock aprons:** Two banks captured — a SW parts-receiving apron and a
  north-face rail/truck dock bank. Ship/receive run from separate clusters.
- **Drop yards:** Box trailers parked NE and along the east face — `dropYard: true`.
- **dockDoorCount ~40, trailersVisible ~35, capacity ~80** — honest overhead
  estimates; flagged uncertain.
- **railServed: true** — multiple spurs into the property, rail auto-rack loading.

## Web/contextual findings
The Dearborn Truck Plant is Ford's highest-volume truck assembly site (F-150 and
F-150 Lightning) within the historic River Rouge complex. The living roof is a
well-documented sustainability landmark. The Rouge is a secured multi-plant
campus with controlled gates.

## Confidence
**High.** Facility identity is unambiguous (living-roof landmark). Gate/guard
posture is confident from the campus security model and Street View evidence.
Door/trailer counts and presence of a truck scale are honest estimates and
flagged in `uncertainFields`.

### 3-line summary
- Gate verdict: TRUCK GATE — true (fenced, controlled Rouge campus, guarded entrances)
- Guard-shack verdict: GUARD SHACK — true (staffed Rouge gatehouses)
- Confidence: high
