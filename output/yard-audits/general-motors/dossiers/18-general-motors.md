# GM - Lansing Regional Stamping, Delta Township MI (idx 18)

**Type:** Stamping Plant
**Resolved coords:** 42.6875, -84.6800 (LRS stamping-building center)
**Address:** 8400 Millett Hwy, Lansing, MI 48917 (Delta Township)
**Confidence:** High

## Step 0 — Identity confirmation

Lansing Regional Stamping (LRS) is the large stamping building that forms the
southern half of GM's Lansing Delta Township (LDT) complex. Aggregator coords
floating around the web (42.7361, -84.5838 from latitude.to) are wrong and land
nowhere near the plant. Satellite probing around Millett Hwy west of the
I-69/I-96 interchange positively located the real complex at ~42.687, -84.680:
two very large connected white-roof buildings totaling ~3.6M sq ft on ~320
developed acres, a divided-boulevard security entrance off Millett Hwy, and
shared truck courts — exactly matching GM's published description of LDT
Assembly + adjacent Lansing Regional Stamping (opened 2006, LEED Gold). LRS is
the southern building; LDT Assembly is the northern building, joined by a body
shop / connector with a cooling tower.

## Key views

- **Wide (z15):** Whole complex centered, surrounded by GM-owned farmland and
  wetland on the ~1,100-acre parcel. Developed/secured core (buildings + truck
  courts + employee parking) is the audited footprint.
- **Complex (z16):** North building = Assembly with large east-side employee
  car lots; south building = LRS stamping. Truck courts run between and west of
  the buildings.
- **NW dock court (z18 @ 42.692,-84.681):** Main shipping/receiving court — white
  trailers backed into dock banks on the building face plus a row of staged
  trailers parked in the open court. Best dock evidence.
- **West LRS court (z19 @ 42.6863,-84.681):** Wide paved truck apron on the
  stamping building's west face with a couple of trailers and the
  conveyor/pedestrian bridge crossing the court.
- **Entrance (z19 @ 42.6835,-84.6815):** Divided-boulevard entrance road off
  Millett Hwy; teal-canopied guard/gate structure beside the secured access
  drive.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Single divided-boulevard main entrance off Millett Hwy.
  Street View up the boulevard (2021-03 pano CAoSF0NJSE0wb2dLRUlDQWdJRGFtYy13NmdF,
  and 2023-05) shows perimeter chain-link fencing along the approach and a low
  gate/security plaza structure spanning the entrance ahead — a controlled
  checkpoint, not an open driveway.
- **guardShack = true.** Teal-canopied booth structure sits beside the secured
  entrance drive (z19 satellite ~42.6837,-84.6810) plus the gate/security plaza
  at the boulevard head; consistent with a staffed guarded entry, standard for a
  GM assembly/stamping campus.
- **remoteGs = false** (guard shack present).
- **dockDoors = "25-50".** Dock banks distributed across the shared truck courts
  — trailers backed into door banks in the north court, additional apron/doors on
  the LRS west court. Overhead estimate ~30 across the stamping faces; combined
  campus is higher. Flagged uncertain.
- **dropYard = true / dropArea = "10-25".** A row of staged/dropped trailers in
  the north shared court and trailers in the west LRS court; est. 10-25 dropped,
  capacity ~50.

## Yard zones & counts

- **perimeter:** 8-vertex ring around the developed/secured core (buildings,
  truck courts, employee lots) ~320 acres; excludes the surrounding undeveloped
  GM wetland/prairie.
- **truckGate:** quad over the divided-boulevard entrance throat off Millett Hwy.
- **dropYards:** (1) north shared shipping/receiving court between Assembly and
  LRS; (2) west LRS truck court.
- **dockAprons:** north-court dock-apron strip where trailers back into the door
  bank.
- **yardMetrics:** dockDoorCount ~30, trailersVisible ~12, trailerParkingCapacity
  ~50, truckGateCount 1, buildingCount 3, siteAreaAcres ~320, railServed false.

## Web findings

- GM: LDT + adjacent Lansing Regional Stamping = 3.6M sq ft; "raw coiled steel
  is stamped at one end of the facility and conveyed through welding, painting
  and assembly … exiting as a finished vehicle at the other end." Opened 2006,
  LEED Gold; ~320 developed acres within a ~1,100-acre parcel (~780 undeveloped
  for environmental preservation).
- Confirms integrated stamping→assembly material flow, so much movement is
  internal/conveyor; external truck activity concentrates at the shared courts.

## Other calls

- **urbanRural = Rural** — edge-of-town Delta Township, surrounded by farmland
  and wetland.
- **shipRcvSeparate = true** — coil receiving vs stamping shipout on distinct
  building faces (north vs west courts).
- **multipleFacilities = true** — LRS stamping + LDT Assembly + connector on one
  secured property.
- **multiStep = false** — boulevard gate is the clear first checkpoint; no
  unambiguous second post-gate checkpoint confirmed.
- **railServed = false (uncertain)** — rail line runs east beyond the parking but
  no spur clearly enters the docks in captured imagery.
- **scale = false (uncertain)** — no weigh pad identified.

## Final confidence: High

Facility unambiguously identified and re-pinned; gate, guard shack, long
boulevard approach, campus layout, and dock/drop courts all backed by satellite
+ Street View. Dock count, rail, scale, and exact lane counts flagged uncertain.
