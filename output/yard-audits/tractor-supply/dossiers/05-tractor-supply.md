# Deep-Audit Dossier — Tractor Supply Distribution Center, Franklin KY (idx 05)

- **Facility:** Tractor Supply Distribution Center Franklin KY
- **Type:** Distribution Center
- **Address:** 100 Raines Dr, Franklin, KY 42134
- **Resolved center:** 36.70720, -86.51350
- **Maps (satellite):** https://www.google.com/maps/@36.70720,-86.51350,400m/data=!3m1!1e3
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Step 0 — Location confirmation
Supplied approximate coords (36.710524, -86.513061) landed just NE of the
target, on the access-road / gate corridor. A z16 sweep showed a single very
large rectangular distribution building immediately south, with trailer rows
wrapping it — the only DC-scale structure in this Franklin industrial park.
Web search for "100 Raines Dr Franklin KY 42134" confirms the Tractor Supply
Company Franklin Distribution Center at this address (TruckMap, Facebook, Manta,
driver reviews), described as a 24/7 DC with "professional security personnel"
and easy docking — consistent with what the imagery shows. Locked building
center at 36.7072, -86.5135.

## What the key views showed
- **z16/z17 overview:** One massive single-building DC (~1000 ft+ long) running
  NNW–SSE, rotated ~20° off north. Dock doors with trailers backed in line BOTH
  long faces (west and east). Marked trailer-parking lots wrap the west, south,
  and east. Employee parking and a loop drive sit at the north end; the truck
  gate is at the top (north) on a long dedicated drive off the public road.
- **z18 north entry:** A dedicated DC drive runs ~250 m south from the public
  road, through a landscaped median/loop, to a gate checkpoint.
- **z19/z20 gate:** A multi-lane gate canopy spans the truck lanes with trailers
  queued at it. A small square **guard booth** sits on a curbed median island
  splitting inbound/outbound lanes — clear staffed checkpoint, not a kiosk.
- **z19 south/west:** Dedicated drop-trailer lots, many marked stalls full of
  parked trailers (100+), separate from the active dock aprons.
- **Street View (pano Ijlh1UQlta8VZfeXAJj06w, captured 2026-03, @36.71094,
  -86.51195):** Driver arrival frame on the access road — open farmland, big
  sky, the DC building in the distance down the drive, entrance signage and the
  gate structure ahead. Confirms the long approach and the rural setting.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Multi-lane gate canopy across the truck lanes ~250 m in
  from the public road, trailers queued at it (z18/z19).
- **guardShack = true.** Small square booth on the median island between
  inbound/outbound lanes at the canopy (z20). `remoteGs = false` accordingly.
- **dockDoors = "50+".** Trailers backed into dock doors along both ~1000 ft+
  long faces; estimated ~120 doors total (cross-dock layout).
- **dropArea = "50+", dropYard = true.** Marked trailer-storage lots on three
  sides hold 100+ drop trailers, distinct from the dock aprons.
- **shipRcvSeparate = true (medium conf).** Active dock banks on two distinct,
  opposite building faces (west and east) imply separate ship/receive
  operations.
- **postGateStaging = true, drivewayLong = true.** Large paved apron between the
  gate and the building north end holds a 3+ truck queue; the long entry drive
  adds stacking room. `fastLaneOpportunity = true` — wide multi-lane apron and
  median offer room for an express/bypass lane.
- **urbanRural = "Rural".** Edge-of-town Franklin KY industrial park ringed by
  farmland; a few neighboring industrial buildings but the broader setting is
  rural. `connectivityIssue = false` (cell infrastructure visible near entry).
- **scale = false, multiStep = false, multipleFacilities = false,
  railServed = false, backupSensitive = false** (gate set deep inside, ample
  stacking; no queue would reach the public road).

## Yard zones & counts measured
- **perimeter:** 7-vertex ring tracing the fenced property incl. north loop
  drive → **~78.4 acres**.
- **truckGate:** quad over the gate canopy/booth at 36.7105, -86.5130.
- **staging:** post-gate apron between gate and building north end.
- **dropYards (3):** west lot, south lot, east lot (rotated quads on trailer
  rows).
- **dockAprons (2):** thin quads hugging the west and east dock walls at the
  building's ~20° angle.
- **yardMetrics:** dockDoorCount ~120, trailersVisible ~140,
  trailerParkingCapacity ~220, truckGateCount 1, buildingCount 1, rail false.

## Web findings
TruckMap / Facebook / Manta / driver reviews confirm the address and that it is
a 24/7 Tractor Supply DC with professional security at the gate, quick
unload turnaround, and on-site customer truck parking (no overnight) — all
consistent with the guarded entry and large drop yard observed.

## Final confidence: high
Building positively identified and fully imaged; gate and guard shack visually
confirmed. Lower-confidence items (flagged in uncertainFields): exact
entry/exit lane counts and which face is shipping vs receiving.
