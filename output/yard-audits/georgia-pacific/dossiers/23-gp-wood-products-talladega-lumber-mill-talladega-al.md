# Deep-Audit Dossier — idx 23

## GP Wood Products — Talladega Lumber Mill — Talladega, AL

**Type:** Lumber Mill
**Resolved coordinates:** 33.44400, -86.06000 (mill complex centroid)
**Confidence:** High

### Location resolution
The roster's geocoded point (33.435942, -86.105805, "APPROXIMATE",
movedMeters 11764) landed in downtown Talladega — ~4.6 km W of the real
mill, badly wrong. Web research identified GP's Talladega lumber facility at
**400 Ironaton Cutoff Rd** (~33.44459, -86.059685). The $100M, 300,000 sq ft
state-of-the-art lumber plant started production in late 2018; it receives
~150 log trucks/day and produces ~230M board feet/year. Satellite confirmed
a sawmill complex with log yard and lumber storage. Mill centroid locked at
33.44400, -86.06000.

### Key views
- **Wide z15/z16:** Sawmill complex — connected mill buildings, kilns, large
  log yard (stacked logs visible) to the SE, lumber storage yard to the W,
  surrounded by woods, a lake, and farmland. Very rural.
- **Entrance (Street View 2025-11):** A continuous chain-link perimeter
  fence rings the property. A single controlled entrance driveway off
  Ironaton Cutoff Rd, with flagpoles and signage. Loaded log trucks queue
  internally.
- **Check-in / scale (z20/z21):** A small red-roofed structure sits beside
  the inbound truck lane; log trucks observed queued single-file along the
  truck path — a scale + check-in setup typical of a high-volume log mill.
- **Lumber load-out / rail (z17/z19):** A rail line runs along the SW edge
  with a spur curving into the mill near the kilns. Flatbed trailers being
  loaded with lumber bundles; ~14 trailers visible across the yards.

### Gate / guard-shack / dock determinations
- **truckGate: true** — Fully fenced perimeter (confirmed all around in
  Street View) with one defined truck entrance driveway; log trucks check in
  internally. A barrier arm was not directly resolved but the
  fenced-perimeter-plus-single-controlled-entrance pattern qualifies.
- **guardShack: true** — A red-roofed booth-sized structure beside the
  inbound truck check-in lane, consistent with a scale house / gate office
  for a mill taking ~150 log trucks/day. Flagged uncertain (function
  inferred).
- **remoteGs: false** — A guard/scale house is present.
- **scale: true** — Log trucks must be weighed in/out; a truck scale sits on
  the inbound truck path by the scale house.
- **multiStep: true** — Entrance gate then a separate scale/check-in stage
  before the log yard. Flagged uncertain.
- **dockDoors: 0-10** — Sawmills load lumber bundles by forklift from open
  sheds rather than truck-height dock doors; banded 0-10, low confidence.
- **dropArea: NONE** — Yards hold logs and stacked lumber, not parked
  trailers.

### Yard zones & counts
- **Perimeter:** ~114.5 acres (712 m x 650 m) enclosing the fenced mill
  complex, log yard, lumber yard, and parking.
- **Truck gate zone:** the fenced entrance driveway off Ironaton Cutoff Rd.
- **Staging:** the internal truck check-in / scale area inside the gate.
- **Drop yard zone:** the SE log yard and W lumber storage / load-out area.
- **Metrics:** ~4 shipping bays, 14 trailers visible, ~30 trailer capacity,
  1 truck entrance, ~6 buildings, rail-served.

### Web findings
GP's Talladega lumber plant: $100M, 300,000 sq ft, started production late
2018, ~130 employees, ~230M board feet/year (plans to grow to 300M).
Receives ~150 log trucks/day — a high truck-volume facility. Building
Products division.

### Final confidence
**High** — facility positively identified, imagery clear, gate and
scale-house calls supported by Street View and the operational profile.
Dock count, trailer capacity, the guard-shack function, multi-step, and
connectivity are flagged uncertain as honest estimates/inferences.

### 3-line summary
- Gate verdict: YES truck gate — fully fenced perimeter, single controlled
  entrance with internal log-truck check-in.
- Guard-shack verdict: YES — red-roofed scale house / gate office beside the
  inbound truck lane.
- Confidence: High.
